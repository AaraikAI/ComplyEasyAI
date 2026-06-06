import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config';
import logger from '../config/logger';
import { redactPII, rehydratePII } from '../utils/piiRedaction';
import { AppError } from '../middleware/errorHandler';
import cacheService from './cache/redisCacheService';

const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

interface AIRequestOptions {
  prompt: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

class GeminiService {
  private readonly MAX_REQUESTS_PER_MINUTE = 60;
  private readonly RATE_WINDOW_MS = 60000;
  private readonly RATE_NAMESPACE = 'gemini-ratelimit';

  /**
   * Sliding-window per-user rate limit backed by the shared cache (Redis with
   * in-memory fallback) so the cap holds across all server instances and
   * survives restarts, rather than a per-process Map that load-balancing bypasses.
   */
  private async checkRateLimit(userId: string): Promise<boolean> {
    const now = Date.now();
    let recentRequests: number[];
    try {
      const stored = await cacheService.get<number[]>(userId, { namespace: this.RATE_NAMESPACE });
      recentRequests = (stored || []).filter(time => now - time < this.RATE_WINDOW_MS);
    } catch (error) {
      // If the shared store is unreachable, fail closed on quota rather than
      // letting unlimited requests through.
      logger.error('[AI Rate Limit] Cache read failed, denying request', error);
      return false;
    }

    if (recentRequests.length >= this.MAX_REQUESTS_PER_MINUTE) {
      return false;
    }

    recentRequests.push(now);
    try {
      // TTL slightly above the window so stale buckets self-expire.
      await cacheService.set(userId, recentRequests, {
        namespace: this.RATE_NAMESPACE,
        ttl: Math.ceil(this.RATE_WINDOW_MS / 1000) + 5,
      });
    } catch (error) {
      logger.warn('[AI Rate Limit] Cache write failed', error);
    }
    return true;
  }

  /**
   * Detect and neutralize malicious prompt injection attempts
   */
  private neutralizePrompt(prompt: string): string {
    // Common prompt injection patterns
    const injectionPatterns = [
      /ignore\s+(previous|above|all)\s+(instructions?|prompts?)/gi,
      /forget\s+(everything|all|previous)/gi,
      /system\s*:\s*override/gi,
      /\[INST\]|\[\/INST\]/gi, // Llama format
      /<\|im_start\|>|<\|im_end\|>/gi, // ChatML format
      /###\s*(system|assistant|user)\s*:/gi,
      /you\s+are\s+now\s+(a|an)\s+/gi,
      /act\s+as\s+if/gi,
      /pretend\s+to\s+be/gi,
      /roleplay\s+as/gi,
    ];

    let neutralized = prompt;
    let detected = false;

    injectionPatterns.forEach(pattern => {
      if (pattern.test(neutralized)) {
        detected = true;
        // Remove or neutralize the injection attempt
        neutralized = neutralized.replace(pattern, '');
      }
    });

    // Additional check: excessive repetition of special characters (potential obfuscation)
    if (/(.)\1{20,}/.test(neutralized)) {
      detected = true;
      neutralized = neutralized.replace(/(.)\1{20,}/g, '');
    }

    if (detected) {
      logger.warn(`[Prompt Injection Detected] User prompt contained potential injection patterns, neutralized`);
    }

    return neutralized.trim();
  }

  async generateContent(
    options: AIRequestOptions,
    userId: string
  ): Promise<string> {
    try {
      // Rate limiting
      if (!(await this.checkRateLimit(userId))) {
        throw new AppError('Rate limit exceeded. Maximum 60 requests per minute. Please try again later.', 429);
      }

      // Malicious prompt injection detection and neutralization
      const neutralizedPrompt = this.neutralizePrompt(options.prompt);

      // PII Redaction (AI Air Gap)
      const { redactedText, map } = redactPII(neutralizedPrompt);
      logger.info(`[AI Request] User: ${userId}, Redacted PII tokens: ${map.size}`);

      // Use Gemini 3.5 by default; overridable per-request and via config
      const model = genAI.getGenerativeModel({
        model: options.model || config.gemini.model,
      });

      // Set timeout: 60 seconds
      const timeoutMs = 60000;
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new AppError('AI service request timed out after 60 seconds. Please try again with a simpler request.', 500));
        }, timeoutMs);
      });

      const generatePromise = model.generateContent({
        contents: [{ role: 'user', parts: [{ text: redactedText }] }],
        generationConfig: {
          temperature: options.temperature ?? 0.7,
          maxOutputTokens: options.maxOutputTokens ?? 2048,
        },
      });

      const result = await Promise.race([generatePromise, timeoutPromise]);
      const response = result.response;
      const text = response.text();

      // Rehydrate PII in response
      const finalText = rehydratePII(text, map);

      logger.info(`[AI Response] User: ${userId}, Tokens: ${response.usageMetadata?.totalTokenCount || 'N/A'}`);

      return finalText;
    } catch (error: any) {
      logger.error('[Gemini API Error]', error);

      // Handle timeout
      if (error.message?.includes('timeout') || error.message?.includes('timed out')) {
        throw new AppError('AI service request timed out after 60 seconds. Please try again with a simpler request.', 500);
      }

      // Handle service unavailability
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
        throw new AppError('AI service temporarily unavailable. Please check your internet connection and try again later.', 500);
      }

      // Handle quota exceeded
      if (error.message?.includes('quota') || error.message?.includes('429') || error.code === 429) {
        const quotaError = error.message || 'Quota exceeded';
        logger.error('[Gemini Quota Error]', {
          error: quotaError,
          code: error.code,
          status: error.status,
          userId,
        });
        throw new AppError('AI service quota exceeded. Please check your Google AI Studio quota (https://makersuite.google.com/app/apikey) or enable billing in Google Cloud Console for higher limits.', 429);
      }

      // Handle model not found
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        throw new AppError('AI model not available. Please check your API key and model configuration.', 404);
      }

      // Handle authentication errors
      if (error.message?.includes('401') || error.message?.includes('403')) {
        throw new AppError('AI API authentication failed. Please check your API key.', 403);
      }

      // Generic error
      throw new AppError(`Failed to generate AI response: ${error.message || 'Unknown error'}`, 500);
    }
  }

  async generateComplianceReport(
    framework: string,
    companyName: string,
    context: string,
    userId: string
  ): Promise<string> {
    const prompt = `You are an expert Compliance Officer AI.
Generate a professional executive summary for a ${framework} compliance audit report for "${companyName}".

Context: "${context}"

Structure the report with:
1. Executive Summary
2. Key Findings
3. Critical Gaps
4. Recommendations

Format: Markdown`;

    return this.generateContent({ prompt, temperature: 0.5 }, userId);
  }

  async prioritizeRisks(risks: any[], userId: string): Promise<any[]> {
    const summary = risks.map(r => ({
      id: r.id,
      description: r.description,
      severity: r.severity,
      category: r.category,
    }));

    const prompt = `You are a cybersecurity risk analyst.
Analyze and prioritize these compliance risks on a scale of 0-100 (100 = most critical).

Risks:
${JSON.stringify(summary, null, 2)}

Return a JSON array with format: [{"id": "...", "score": 85, "rationale": "..."}]`;

    const response = await this.generateContent({ prompt, temperature: 0.3 }, userId);

    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return [];
    } catch (error) {
      logger.error('Failed to parse risk prioritization', error);
      return [];
    }
  }

  async generateRemediationPlan(riskDescription: string, userId: string): Promise<string> {
    const prompt = `Provide technical remediation steps for this security risk:
"${riskDescription}"

Format as markdown with:
1. Immediate Actions
2. Technical Steps
3. Verification
4. Prevention`;

    return this.generateContent({ prompt, temperature: 0.5 }, userId);
  }

  async generatePolicy(type: string, company: string, tone: string, userId: string): Promise<string> {
    const prompt = `Write a ${tone} ${type} policy for ${company}.
Include sections for:
- Purpose
- Scope
- Policy Statement
- Procedures
- Compliance

Format: Markdown`;

    return this.generateContent({ prompt, temperature: 0.6 }, userId);
  }

  async analyzeContract(text: string, userId: string): Promise<string> {
    const prompt = `Analyze this contract for GDPR/Security risks and compliance issues:

"${text.substring(0, 3000)}"

Identify:
1. Data Processing clauses
2. Security obligations
3. Liability limitations
4. GDPR compliance gaps
5. Red flags

Format: Markdown`;

    return this.generateContent({ prompt, temperature: 0.4 }, userId);
  }

  async performGapAnalysis(current: string[], target: string[], userId: string): Promise<{
    analysis: string;
    gaps: Array<{
      control: string;
      criticality: 'Critical' | 'High' | 'Medium' | 'Low';
      effort: string;
      remediation: string;
    }>;
    prioritized: Array<{
      control: string;
      priority: number;
      rationale: string;
    }>;
  }> {
    const isSOC2 = target.some(t => t.toLowerCase().includes('soc2') || t.toLowerCase().includes('soc 2'));
    const isGDPR = target.some(t => t.toLowerCase().includes('gdpr') || t.toLowerCase().includes('general data protection'));

    let frameworkSpecificContext = '';
    if (isSOC2) {
      frameworkSpecificContext = `Focus on SOC2 Type 2 requirements:
- Trust Service Criteria (TSC): Security, Availability, Processing Integrity, Confidentiality, Privacy
- Common Criteria (CC) series controls
- Control activities and evidence requirements
- Audit readiness and continuous monitoring`;
    } else if (isGDPR) {
      frameworkSpecificContext = `Focus on GDPR requirements:
- Article 30: Records of Processing Activities (RoPA)
- Data subject rights (Articles 15-22)
- Data Protection Impact Assessments (DPIA)
- Breach notification requirements (Articles 33-34)
- Privacy by Design and Default (Article 25)
- Data Protection Officer (DPO) requirements`;
    }

    const prompt = `Perform a comprehensive compliance gap analysis.
Current frameworks: ${current.join(', ')}
Target framework(s): ${target.join(', ')}

${frameworkSpecificContext}

For each gap identified, provide:
1. Control/Requirement name
2. Criticality level (Critical, High, Medium, Low)
3. Implementation effort estimate
4. Specific remediation steps

Return a JSON object with this structure:
{
  "analysis": "Executive summary in markdown format",
  "gaps": [
    {
      "control": "Control name",
      "criticality": "Critical|High|Medium|Low",
      "effort": "Low|Medium|High",
      "remediation": "Step-by-step remediation plan"
    }
  ],
  "prioritized": [
    {
      "control": "Control name",
      "priority": 1-100,
      "rationale": "Why this is prioritized"
    }
  ]
}

Format the analysis as markdown.`;

    try {
      const response = await this.generateContent({ prompt, temperature: 0.5, maxOutputTokens: 4096 }, userId);
      
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            analysis: parsed.analysis || response,
            gaps: parsed.gaps || [],
            prioritized: parsed.prioritized || [],
          };
        } catch (e) {
          // If JSON parsing fails, return structured response
        }
      }

      // Fallback: return analysis as-is with empty gaps/prioritized
      return {
        analysis: response,
        gaps: [],
        prioritized: [],
      };
    } catch (error) {
      logger.error('Gap analysis error', error);
      throw error;
    }
  }

  async classifyEvidence(filename: string, userId: string): Promise<{ classification: string; confidence: number; description?: string }> {
    const prompt = `Classify this compliance evidence file and suggest which control it maps to:
Filename: "${filename}"

Return ONLY a valid JSON object (no markdown, no code blocks, no additional text) with:
- "classification": a short, concise control name (e.g., "Access Control Policy", "Encryption at Rest", "Physical Security", etc.) - maximum 50 characters
- "confidence": a number between 0 and 1 representing your confidence (e.g., 0.85 for 85% confidence)
- "description": a brief explanation of why this file maps to this control (1-2 sentences)

Example response: {"classification": "Access Control Policy", "confidence": 0.87, "description": "This file appears to document access control policies and procedures."}`;

    try {
      const response = await this.generateContent({ prompt, temperature: 0.3 }, userId);
      
      // Clean the response - remove markdown code blocks if present
      let cleanedResponse = response.trim();
      cleanedResponse = cleanedResponse.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
      
      // Try to extract JSON from the response
      let jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedResponse = jsonMatch[0];
      }
      
      // Try to parse JSON response
      try {
        const parsed = JSON.parse(cleanedResponse);
        const classification = (parsed.classification || '').trim();
        const description = (parsed.description || '').trim();
        
        // Ensure classification is clean and not too long
        const cleanClassification = classification.length > 50 
          ? classification.substring(0, 47) + '...' 
          : classification;
        
        return {
          classification: cleanClassification || 'Unclassified Control',
          confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.75,
          description: description || undefined,
        };
      } catch (parseError) {
        // If JSON parsing fails, try to extract just the classification from text
        const classificationMatch = cleanedResponse.match(/"classification"\s*:\s*"([^"]+)"/i) || 
                                   cleanedResponse.match(/classification["\s:]+([^",\n}]+)/i);
        const confidenceMatch = cleanedResponse.match(/"confidence"\s*:\s*([0-9.]+)/i);
        
        const extractedClassification = classificationMatch ? classificationMatch[1].trim() : null;
        const extractedConfidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.75;
        
        if (extractedClassification && extractedClassification.length <= 50) {
          return {
            classification: extractedClassification,
            confidence: extractedConfidence,
          };
        }
        
        // Last resort: use first line or first 50 chars
        const firstLine = cleanedResponse.split('\n')[0].trim();
        const fallbackClassification = firstLine.length > 50 ? firstLine.substring(0, 47) + '...' : firstLine;
        
        return {
          classification: fallbackClassification || 'Unclassified Control',
          confidence: 0.75,
        };
      }
    } catch (error) {
      logger.error('Failed to classify evidence', error);
      // Fallback: extract control name from filename
      const fallbackName = filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      const cleanFallback = fallbackName.length > 50 ? fallbackName.substring(0, 47) + '...' : fallbackName;
      return {
        classification: cleanFallback || 'Unclassified Control',
        confidence: 0.5, // Low confidence for fallback
      };
    }
  }

  async generateRFPResponse(question: string, context: string, userId: string): Promise<{
    response: string;
    confidence: number;
  }> {
    const prompt = `Answer this RFP security questionnaire item:
Question: "${question}"
Company context: "${context}"

Provide a professional, compliant response.

Return a JSON object with:
{
  "response": "Your detailed answer here",
  "confidence": 0.0-1.0 (confidence score based on how well the context supports the answer)
}`;

    try {
      const result = await this.generateContent({ prompt, temperature: 0.6 }, userId);
      
      // Try to extract JSON from response
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            response: parsed.response || result,
            confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.75,
          };
        } catch (e) {
          // If JSON parsing fails, return response as-is with default confidence
        }
      }

      // Fallback: return response with default confidence
      return {
        response: result,
        confidence: 0.75,
      };
    } catch (error) {
      logger.error('RFP response generation error', error);
      throw error;
    }
  }

  async generatePhishingSimulation(
    type: 'Email' | 'Spear' | 'Smishing',
    theme: string,
    department: string,
    difficulty: 'Easy' | 'Medium' | 'Hard',
    userId: string
  ): Promise<{
    scenario: string;
    questions: Array<{question: string; answer: string; explanation: string}>;
  }> {
    const difficultyInstructions = {
      Easy: 'Use obvious red flags, poor grammar, suspicious links, and generic greetings. Make it easy to identify as phishing.',
      Medium: 'Use moderate sophistication with some red flags but also some legitimate-looking elements. Requires basic security awareness.',
      Hard: 'Use advanced techniques: professional language, legitimate-looking sender, minimal red flags. Requires expert-level awareness to detect.',
    };

    const typeInstructions = {
      Email: 'Generate a phishing email with subject line and body.',
      Spear: 'Generate a personalized spear-phishing email targeting the specific department with insider knowledge and context.',
      Smishing: 'Generate a SMS/text message phishing scenario (smishing) with appropriate mobile messaging format.',
    };

    const prompt = `Generate a realistic ${type.toLowerCase()} phishing simulation for security training.
Department: ${department}
Theme: ${theme}
Difficulty: ${difficulty}

${typeInstructions[type]}
${difficultyInstructions[difficulty]}

Return a JSON object with this structure:
{
  "scenario": "The full phishing ${type === 'Smishing' ? 'SMS/text message' : 'email'} including ${type === 'Email' ? 'subject line and ' : ''}body",
  "questions": [
    {
      "question": "Training question to test awareness",
      "answer": "Correct answer",
      "explanation": "Why this is the correct answer"
    }
  ]
}

Generate 3-5 training questions that test the user's ability to identify phishing indicators.`;

    try {
      const response = await this.generateContent({ prompt, temperature: 0.7, maxOutputTokens: 2048 }, userId);
      
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            scenario: parsed.scenario || response,
            questions: parsed.questions || [],
          };
        } catch (e) {
          // If JSON parsing fails, return scenario as-is
        }
      }

      // Fallback: return scenario with empty questions
      return {
        scenario: response,
        questions: [],
      };
    } catch (error) {
      logger.error('Phishing simulation generation error', error);
      throw error;
    }
  }

  async scoreVendorRisk(vendor: string, service: string, dataAccess: string, userId: string): Promise<string> {
    const prompt = `Assess vendor risk:
Vendor: ${vendor}
Service: ${service}
Data Access: ${dataAccess}

Provide:
1. Risk Score (0-100)
2. Key Concerns
3. Due Diligence Items
4. Recommendations

Format: Markdown`;

    return this.generateContent({ prompt, temperature: 0.5 }, userId);
  }

  async generateDataMap(processName: string, userId: string): Promise<{
    map: string;
    piiIdentified: Array<{type: string; location: string; sensitivity: 'High' | 'Medium' | 'Low'}>;
    crossBorderTransfers: Array<{destination: string; legalBasis: string; safeguards: string}>;
    retentionPeriods: Array<{dataType: string; period: string; reason: string}>;
  }> {
    const prompt = `Generate a comprehensive GDPR Article 30 Record of Processing Activities (RoPA) for:
Process: "${processName}"

Analyze the data flow and identify:
1. All PII (Personally Identifiable Information) types and their locations
2. Cross-border data transfers (data moving outside EU/EEA)
3. Data retention periods for each data type

Return a JSON object with this structure:
{
  "map": "Full RoPA document in markdown format including: Processing purpose, Data categories, Data subjects, Recipients, Retention periods, Security measures, Data flow diagram description",
  "piiIdentified": [
    {
      "type": "Type of PII (e.g., Email, Name, SSN, Credit Card)",
      "location": "Where this PII is stored/processed",
      "sensitivity": "High|Medium|Low"
    }
  ],
  "crossBorderTransfers": [
    {
      "destination": "Country/Region where data is transferred",
      "legalBasis": "Legal basis for transfer (e.g., Standard Contractual Clauses, Adequacy Decision)",
      "safeguards": "Safeguards in place"
    }
  ],
  "retentionPeriods": [
    {
      "dataType": "Type of data",
      "period": "Retention period (e.g., 7 years, 90 days)",
      "reason": "Reason for retention period"
    }
  ]
}

Format the map as markdown.`;

    try {
      const response = await this.generateContent({ prompt, temperature: 0.5, maxOutputTokens: 4096 }, userId);
      
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            map: parsed.map || response,
            piiIdentified: parsed.piiIdentified || [],
            crossBorderTransfers: parsed.crossBorderTransfers || [],
            retentionPeriods: parsed.retentionPeriods || [],
          };
        } catch (e) {
          // If JSON parsing fails, return map as-is
        }
      }

      // Fallback: return map with empty arrays
      return {
        map: response,
        piiIdentified: [],
        crossBorderTransfers: [],
        retentionPeriods: [],
      };
    } catch (error) {
      logger.error('Data map generation error', error);
      throw error;
    }
  }

  async generateBCP(
    scenario: string,
    rto: string,
    rpo: string,
    userId: string
  ): Promise<{
    plan: string;
    contactTree: Array<{role: string; name: string; contact: string; priority: number}>;
  }> {
    const prompt = `Generate a comprehensive Business Continuity Plan for this disaster scenario:
"${scenario}"

Recovery Objectives:
- RTO (Recovery Time Objective): ${rto}
- RPO (Recovery Point Objective): ${rpo}

The plan must align with these recovery objectives.

Include:
1. Immediate Response Steps (within first hour)
2. Communication Plan with contact tree
3. Recovery Procedures aligned to RTO/RPO
4. Restoration Timeline with milestones
5. Testing Plan
6. Contact Tree (hierarchical list of key personnel with roles, names, contact info, and priority level)

Return a JSON object with this structure:
{
  "plan": "Full BCP document in markdown format",
  "contactTree": [
    {
      "role": "Role/Title (e.g., Incident Commander, IT Director)",
      "name": "Name or 'TBD'",
      "contact": "Phone/Email",
      "priority": 1-10 (1 = highest priority, contact first)
    }
  ]
}

Format the plan as markdown.`;

    try {
      const response = await this.generateContent({ prompt, temperature: 0.6, maxOutputTokens: 4096 }, userId);
      
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            plan: parsed.plan || response,
            contactTree: parsed.contactTree || [],
          };
        } catch (e) {
          // If JSON parsing fails, return plan as-is
        }
      }

      // Fallback: return plan with empty contact tree
      return {
        plan: response,
        contactTree: [],
      };
    } catch (error) {
      logger.error('BCP generation error', error);
      throw error;
    }
  }

  async chatWithBot(message: string, userId: string): Promise<string> {
    const prompt = `You are a helpful compliance assistant for ComplyEasy AI.
User question: "${message}"

Provide a helpful, accurate response about compliance, security, or the platform.`;

    return this.generateContent({ prompt, temperature: 0.7, maxOutputTokens: 500 }, userId);
  }

  /* ================================================================== */
  /*  TIER AI FEATURES — Real Gemini-powered compliance intelligence     */
  /* ================================================================== */

  /**
   * Cross-Framework Mapper: AI-powered control mapping between frameworks
   */
  async crossFrameworkMapping(
    sourceFramework: string,
    targetFramework: string,
    sourceControls: Array<{ controlId: string; title: string; description: string; domain: string }>,
    targetControls: Array<{ controlId: string; title: string; description: string; domain: string }>,
    userId: string
  ): Promise<{
    mappings: Array<{
      sourceControlId: string;
      targetControlId: string;
      confidence: number;
      rationale: string;
      mappingType: 'Full' | 'Partial' | 'Semantic';
    }>;
    summary: string;
    unmappedSource: string[];
    unmappedTarget: string[];
  }> {
    const prompt = `You are an expert compliance framework analyst. Map controls between two regulatory frameworks.

SOURCE FRAMEWORK: ${sourceFramework}
TARGET FRAMEWORK: ${targetFramework}

SOURCE CONTROLS:
${sourceControls.map(c => `- ${c.controlId}: ${c.title} — ${c.description} [Domain: ${c.domain}]`).join('\n')}

TARGET CONTROLS:
${targetControls.map(c => `- ${c.controlId}: ${c.title} — ${c.description} [Domain: ${c.domain}]`).join('\n')}

For each source control, find the best matching target control(s). Determine:
- confidence (0-100): how closely the controls align
- mappingType: "Full" (exact match), "Partial" (overlapping scope), or "Semantic" (similar intent, different scope)
- rationale: 1-2 sentence explanation of why they map

Return ONLY valid JSON:
{
  "mappings": [
    {
      "sourceControlId": "source control ID",
      "targetControlId": "target control ID",
      "confidence": 85,
      "rationale": "Both controls address access management...",
      "mappingType": "Full"
    }
  ],
  "summary": "Executive summary of mapping analysis in markdown",
  "unmappedSource": ["IDs of source controls with no good match"],
  "unmappedTarget": ["IDs of target controls not matched by any source"]
}`;

    try {
      const response = await this.generateContent({ prompt, temperature: 0.3, maxOutputTokens: 8192 }, userId);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          mappings: parsed.mappings || [],
          summary: parsed.summary || '',
          unmappedSource: parsed.unmappedSource || [],
          unmappedTarget: parsed.unmappedTarget || [],
        };
      }
      return { mappings: [], summary: response, unmappedSource: [], unmappedTarget: [] };
    } catch (error) {
      logger.error('Cross-framework mapping error', error);
      throw error;
    }
  }

  /**
   * Regulatory Auto-Remediation: AI generates remediation plans for regulatory gaps
   */
  async regulatoryAutoRemediation(
    framework: string,
    gaps: Array<{ controlId: string; title: string; currentStatus: string; requirement: string }>,
    organizationContext: string,
    userId: string
  ): Promise<{
    remediationPlans: Array<{
      controlId: string;
      priority: 'Critical' | 'High' | 'Medium' | 'Low';
      effort: string;
      timeline: string;
      steps: string[];
      resources: string[];
      automatable: boolean;
      estimatedCost: string;
    }>;
    summary: string;
    quickWins: string[];
    totalEstimatedTimeline: string;
  }> {
    const prompt = `You are an expert compliance remediation consultant. Generate actionable remediation plans.

FRAMEWORK: ${framework}
ORGANIZATION CONTEXT: ${organizationContext}

COMPLIANCE GAPS TO REMEDIATE:
${gaps.map(g => `- ${g.controlId}: ${g.title}
  Current Status: ${g.currentStatus}
  Requirement: ${g.requirement}`).join('\n\n')}

For each gap, generate a detailed remediation plan with:
- priority: Critical/High/Medium/Low based on regulatory risk
- effort: estimated person-hours
- timeline: realistic implementation timeline
- steps: specific actionable steps (5-10 per gap)
- resources: tools, personnel, budget needed
- automatable: whether this can be automated
- estimatedCost: rough cost estimate

Return ONLY valid JSON:
{
  "remediationPlans": [...],
  "summary": "Executive summary in markdown",
  "quickWins": ["List of items achievable in under 1 week"],
  "totalEstimatedTimeline": "Overall timeline estimate"
}`;

    try {
      const response = await this.generateContent({ prompt, temperature: 0.4, maxOutputTokens: 8192 }, userId);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          remediationPlans: parsed.remediationPlans || [],
          summary: parsed.summary || '',
          quickWins: parsed.quickWins || [],
          totalEstimatedTimeline: parsed.totalEstimatedTimeline || 'Unknown',
        };
      }
      return { remediationPlans: [], summary: response, quickWins: [], totalEstimatedTimeline: 'Unknown' };
    } catch (error) {
      logger.error('Regulatory auto-remediation error', error);
      throw error;
    }
  }

  /**
   * Evidence Completeness Checker: AI analyzes evidence against control requirements
   */
  async checkEvidenceCompleteness(
    framework: string,
    controls: Array<{ controlId: string; title: string; requirement: string; currentEvidence: string[] }>,
    userId: string
  ): Promise<{
    results: Array<{
      controlId: string;
      completeness: number;
      status: 'Complete' | 'Partial' | 'Missing' | 'Stale';
      missingEvidence: string[];
      recommendations: string[];
      auditRisk: 'High' | 'Medium' | 'Low';
    }>;
    overallCompleteness: number;
    criticalGaps: string[];
    summary: string;
  }> {
    const prompt = `You are a compliance auditor reviewing evidence completeness for regulatory controls.

FRAMEWORK: ${framework}

CONTROLS AND CURRENT EVIDENCE:
${controls.map(c => `- ${c.controlId}: ${c.title}
  Requirement: ${c.requirement}
  Current Evidence: ${c.currentEvidence.length > 0 ? c.currentEvidence.join(', ') : 'NONE'}`).join('\n\n')}

For each control, assess:
- completeness (0-100): percentage of requirement covered by existing evidence
- status: Complete (90%+), Partial (40-89%), Missing (0-39%), or Stale (evidence older than policy period)
- missingEvidence: specific documents/artifacts still needed
- recommendations: actionable steps to achieve full evidence coverage
- auditRisk: likelihood of audit finding if evidence remains as-is

Return ONLY valid JSON:
{
  "results": [...],
  "overallCompleteness": 65,
  "criticalGaps": ["List of controls with High audit risk"],
  "summary": "Executive summary in markdown"
}`;

    try {
      const response = await this.generateContent({ prompt, temperature: 0.3, maxOutputTokens: 8192 }, userId);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          results: parsed.results || [],
          overallCompleteness: parsed.overallCompleteness || 0,
          criticalGaps: parsed.criticalGaps || [],
          summary: parsed.summary || '',
        };
      }
      return { results: [], overallCompleteness: 0, criticalGaps: [], summary: response };
    } catch (error) {
      logger.error('Evidence completeness check error', error);
      throw error;
    }
  }

  /**
   * Agentic Vendor Risk: Multi-agent AI vendor risk assessment
   */
  async agenticVendorRisk(
    vendor: {
      name: string;
      service: string;
      dataAccess: string;
      contractTerms?: string;
      certifications?: string[];
      subProcessors?: string[];
    },
    assessmentScope: string[],
    userId: string
  ): Promise<{
    overallScore: number;
    riskLevel: 'Critical' | 'High' | 'Medium' | 'Low';
    agentResults: Array<{
      agentName: string;
      category: string;
      score: number;
      findings: string[];
      recommendations: string[];
    }>;
    dueDiligenceItems: string[];
    contractRedFlags: string[];
    summary: string;
  }> {
    const prompt = `You are a multi-agent vendor risk assessment system. Simulate 5 specialized risk assessment agents analyzing a vendor.

VENDOR DETAILS:
- Name: ${vendor.name}
- Service: ${vendor.service}
- Data Access Level: ${vendor.dataAccess}
${vendor.contractTerms ? `- Contract Terms: ${vendor.contractTerms}` : ''}
${vendor.certifications ? `- Certifications: ${vendor.certifications.join(', ')}` : ''}
${vendor.subProcessors ? `- Sub-processors: ${vendor.subProcessors.join(', ')}` : ''}

ASSESSMENT SCOPE: ${assessmentScope.join(', ')}

Run these 5 assessment agents:
1. Security Posture Agent - Assess cybersecurity controls, encryption, access management
2. Privacy Compliance Agent - Evaluate data handling, GDPR/privacy law compliance, data residency
3. Business Continuity Agent - Assess resilience, SLAs, disaster recovery, financial stability
4. Regulatory Compliance Agent - Check certifications, audit reports, regulatory adherence
5. Fourth-Party Risk Agent - Evaluate sub-processor risks, supply chain dependencies

Return ONLY valid JSON:
{
  "overallScore": 0-100,
  "riskLevel": "Critical|High|Medium|Low",
  "agentResults": [
    {
      "agentName": "Security Posture Agent",
      "category": "Security",
      "score": 0-100,
      "findings": ["specific findings..."],
      "recommendations": ["specific recommendations..."]
    }
  ],
  "dueDiligenceItems": ["items requiring further investigation"],
  "contractRedFlags": ["contractual concerns identified"],
  "summary": "Executive summary in markdown"
}`;

    try {
      const response = await this.generateContent({ prompt, temperature: 0.4, maxOutputTokens: 8192 }, userId);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          overallScore: parsed.overallScore || 0,
          riskLevel: parsed.riskLevel || 'Medium',
          agentResults: parsed.agentResults || [],
          dueDiligenceItems: parsed.dueDiligenceItems || [],
          contractRedFlags: parsed.contractRedFlags || [],
          summary: parsed.summary || '',
        };
      }
      return { overallScore: 0, riskLevel: 'Medium', agentResults: [], dueDiligenceItems: [], contractRedFlags: [], summary: response };
    } catch (error) {
      logger.error('Agentic vendor risk error', error);
      throw error;
    }
  }

  /**
   * Audit Simulator: AI simulates real audit interviews and scoring
   */
  async simulateAudit(
    framework: string,
    controlDomain: string,
    controlsToAudit: Array<{ controlId: string; title: string; description: string }>,
    previousAnswers?: Array<{ questionId: string; answer: string }>,
    userId?: string
  ): Promise<{
    questions: Array<{
      id: string;
      question: string;
      controlRef: string;
      difficulty: 'Basic' | 'Intermediate' | 'Advanced';
      expectedEvidence: string[];
      scoringCriteria: string;
    }>;
    scoring?: {
      overall: number;
      byControl: Array<{ controlId: string; score: number; feedback: string }>;
      strengths: string[];
      weaknesses: string[];
      auditorNotes: string;
    };
    nextSteps: string[];
  }> {
    const isScoring = previousAnswers && previousAnswers.length > 0;

    const prompt = isScoring
      ? `You are a certified ${framework} auditor reviewing audit responses.

FRAMEWORK: ${framework}
DOMAIN: ${controlDomain}

CONTROLS AUDITED:
${controlsToAudit.map(c => `- ${c.controlId}: ${c.title}`).join('\n')}

AUDIT RESPONSES:
${previousAnswers!.map(a => `Q: ${a.questionId}\nA: ${a.answer}`).join('\n\n')}

Score each response and provide detailed feedback. Score 0-100 per control.

Return ONLY valid JSON:
{
  "questions": [],
  "scoring": {
    "overall": 0-100,
    "byControl": [{ "controlId": "...", "score": 0-100, "feedback": "..." }],
    "strengths": ["..."],
    "weaknesses": ["..."],
    "auditorNotes": "Overall assessment in markdown"
  },
  "nextSteps": ["recommended follow-up actions"]
}`
      : `You are a certified ${framework} auditor conducting a mock audit.

FRAMEWORK: ${framework}
DOMAIN: ${controlDomain}

CONTROLS TO AUDIT:
${controlsToAudit.map(c => `- ${c.controlId}: ${c.title} — ${c.description}`).join('\n')}

Generate realistic audit interview questions that a real auditor would ask. Include:
- Mix of Basic, Intermediate, and Advanced difficulty
- Specific evidence the auditor would expect to see
- Clear scoring criteria

Return ONLY valid JSON:
{
  "questions": [
    {
      "id": "q1",
      "question": "Can you walk me through your access review process?",
      "controlRef": "CC6.1",
      "difficulty": "Intermediate",
      "expectedEvidence": ["Access review logs", "Quarterly review reports"],
      "scoringCriteria": "Must demonstrate regular cadence, management approval, and remediation tracking"
    }
  ],
  "nextSteps": ["preparation recommendations"]
}`;

    try {
      const response = await this.generateContent({ prompt, temperature: 0.5, maxOutputTokens: 8192 }, userId || 'system');
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          questions: parsed.questions || [],
          scoring: parsed.scoring,
          nextSteps: parsed.nextSteps || [],
        };
      }
      return { questions: [], nextSteps: [response] };
    } catch (error) {
      logger.error('Audit simulation error', error);
      throw error;
    }
  }

  /**
   * Natural Language Query: AI answers compliance questions using org context
   */
  async naturalLanguageQuery(
    query: string,
    context: {
      frameworks: string[];
      recentAuditFindings?: string[];
      riskProfile?: string;
      complianceScore?: number;
    },
    userId: string
  ): Promise<{
    answer: string;
    sources: Array<{ type: string; reference: string; relevance: number }>;
    relatedQuestions: string[];
    confidence: number;
    actionItems?: string[];
  }> {
    const prompt = `You are an expert compliance intelligence assistant with deep knowledge of all regulatory frameworks.

USER QUERY: "${query}"

ORGANIZATIONAL CONTEXT:
- Active Frameworks: ${context.frameworks.join(', ')}
${context.recentAuditFindings ? `- Recent Audit Findings: ${context.recentAuditFindings.join('; ')}` : ''}
${context.riskProfile ? `- Risk Profile: ${context.riskProfile}` : ''}
${context.complianceScore !== undefined ? `- Current Compliance Score: ${context.complianceScore}%` : ''}

Provide a comprehensive, actionable answer. Reference specific regulation articles, control IDs, or industry standards where applicable.

Return ONLY valid JSON:
{
  "answer": "Detailed answer in markdown format with specific regulatory references",
  "sources": [
    { "type": "regulation", "reference": "GDPR Article 25", "relevance": 95 }
  ],
  "relatedQuestions": ["3-5 follow-up questions the user might want to ask"],
  "confidence": 0-100,
  "actionItems": ["specific actions the user should take based on this query"]
}`;

    try {
      const response = await this.generateContent({ prompt, temperature: 0.5, maxOutputTokens: 4096 }, userId);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          answer: parsed.answer || response,
          sources: parsed.sources || [],
          relatedQuestions: parsed.relatedQuestions || [],
          confidence: parsed.confidence || 75,
          actionItems: parsed.actionItems,
        };
      }
      return { answer: response, sources: [], relatedQuestions: [], confidence: 75 };
    } catch (error) {
      logger.error('Natural language query error', error);
      throw error;
    }
  }

  /**
   * AI Compliance Copilot: Context-aware compliance assistant
   */
  async complianceCopilot(
    message: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
    context: {
      currentView?: string;
      activeFramework?: string;
      selectedControl?: string;
      complianceData?: Record<string, any>;
    },
    userId: string
  ): Promise<{
    response: string;
    suggestions: string[];
    actions: Array<{ label: string; action: string; params?: Record<string, any> }>;
    relatedControls?: string[];
  }> {
    const historyText = conversationHistory.slice(-10).map(h => `${h.role === 'user' ? 'User' : 'Copilot'}: ${h.content}`).join('\n');

    const prompt = `You are the ComplyEasy AI Compliance Copilot — a proactive, context-aware compliance assistant embedded in a GRC platform.

CURRENT CONTEXT:
${context.currentView ? `- Current View: ${context.currentView}` : ''}
${context.activeFramework ? `- Active Framework: ${context.activeFramework}` : ''}
${context.selectedControl ? `- Selected Control: ${context.selectedControl}` : ''}
${context.complianceData ? `- Compliance Data: ${JSON.stringify(context.complianceData).substring(0, 2000)}` : ''}

CONVERSATION HISTORY:
${historyText}

USER MESSAGE: "${message}"

Be proactive: suggest next steps, flag potential issues, and recommend automation opportunities. Reference specific articles/controls when possible.

Return ONLY valid JSON:
{
  "response": "Your response in markdown",
  "suggestions": ["3-5 proactive suggestions based on context"],
  "actions": [
    { "label": "Run Gap Analysis", "action": "navigate", "params": { "view": "ai-gap" } }
  ],
  "relatedControls": ["relevant control IDs if applicable"]
}`;

    try {
      const response = await this.generateContent({ prompt, temperature: 0.6, maxOutputTokens: 4096 }, userId);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          response: parsed.response || response,
          suggestions: parsed.suggestions || [],
          actions: parsed.actions || [],
          relatedControls: parsed.relatedControls,
        };
      }
      return { response, suggestions: [], actions: [] };
    } catch (error) {
      logger.error('Compliance copilot error', error);
      throw error;
    }
  }

  /**
   * Compliance Score Forecasting: AI predicts future compliance trajectory
   */
  async forecastComplianceScore(
    currentScores: Array<{ framework: string; score: number; trend: 'up' | 'down' | 'stable' }>,
    upcomingChanges: string[],
    historicalData: Array<{ date: string; framework: string; score: number }>,
    userId: string
  ): Promise<{
    forecasts: Array<{
      framework: string;
      currentScore: number;
      predictedScore30d: number;
      predictedScore90d: number;
      predictedScore180d: number;
      riskFactors: string[];
      opportunities: string[];
      confidence: number;
    }>;
    overallTrend: 'Improving' | 'Declining' | 'Stable' | 'At Risk';
    keyInsights: string[];
    recommendedActions: Array<{ action: string; impact: string; urgency: 'Immediate' | 'Short-term' | 'Long-term' }>;
    summary: string;
  }> {
    const prompt = `You are a compliance analytics AI that forecasts compliance score trajectories.

CURRENT COMPLIANCE SCORES:
${currentScores.map(s => `- ${s.framework}: ${s.score}% (Trend: ${s.trend})`).join('\n')}

UPCOMING REGULATORY CHANGES:
${upcomingChanges.map(c => `- ${c}`).join('\n')}

HISTORICAL DATA (last 12 months):
${historicalData.slice(-50).map(h => `${h.date}: ${h.framework} = ${h.score}%`).join('\n')}

Analyze trends, predict future scores, and identify risk factors. Consider:
- Regulatory changes and their impact
- Historical improvement/decline rates
- Industry benchmarks
- Seasonal patterns (audit cycles, regulatory deadlines)

Return ONLY valid JSON:
{
  "forecasts": [
    {
      "framework": "SOC 2",
      "currentScore": 82,
      "predictedScore30d": 84,
      "predictedScore90d": 88,
      "predictedScore180d": 91,
      "riskFactors": ["Upcoming audit in 60 days", "New vendor onboarded"],
      "opportunities": ["Automating evidence collection could add 5 points"],
      "confidence": 78
    }
  ],
  "overallTrend": "Improving|Declining|Stable|At Risk",
  "keyInsights": ["top 5 insights"],
  "recommendedActions": [
    { "action": "Complete evidence gap for CC6.1", "impact": "+3 points on SOC 2", "urgency": "Immediate" }
  ],
  "summary": "Executive summary in markdown"
}`;

    try {
      const response = await this.generateContent({ prompt, temperature: 0.4, maxOutputTokens: 8192 }, userId);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          forecasts: parsed.forecasts || [],
          overallTrend: parsed.overallTrend || 'Stable',
          keyInsights: parsed.keyInsights || [],
          recommendedActions: parsed.recommendedActions || [],
          summary: parsed.summary || '',
        };
      }
      return { forecasts: [], overallTrend: 'Stable', keyInsights: [], recommendedActions: [], summary: response };
    } catch (error) {
      logger.error('Compliance score forecasting error', error);
      throw error;
    }
  }

  /**
   * Process Mapper AI: AI-powered process discovery and analysis
   */
  async analyzeProcess(
    processDescription: string,
    category: string,
    complianceFrameworks: string[],
    userId: string
  ): Promise<{
    nodes: Array<{
      id: string;
      kind: string;
      label: string;
      description: string;
      riskLevel: string;
      complianceTags: string[];
      controls: string[];
      owner: string;
      x: number;
      y: number;
    }>;
    edges: Array<{ id: string; from: string; to: string; label: string; condition?: string }>;
    risks: Array<{ nodeId: string; risk: string; severity: string; mitigation: string }>;
    complianceGaps: Array<{ framework: string; gap: string; affectedNodes: string[] }>;
    raciMatrix: Array<{ activity: string; responsible: string; accountable: string; consulted: string; informed: string }>;
    summary: string;
  }> {
    const prompt = `You are a business process analysis AI. Analyze the following process and generate a complete BPMN-compatible process map.

PROCESS: ${processDescription}
CATEGORY: ${category}
COMPLIANCE FRAMEWORKS: ${complianceFrameworks.join(', ')}

Generate a complete process map with:
1. Process nodes (start, activities, decisions, subprocesses, end, data stores, documents)
2. Edges connecting nodes with conditions for decision branches
3. Risk assessment per node
4. Compliance gap analysis against the specified frameworks
5. RACI matrix for key activities

Position nodes in a logical flow (x: 50-1200, y: 50-600).

Return ONLY valid JSON:
{
  "nodes": [
    {
      "id": "node-1",
      "kind": "start|activity|decision|subprocess|end|dataStore|document",
      "label": "Node label",
      "description": "What happens at this step",
      "riskLevel": "critical|high|medium|low|none",
      "complianceTags": ["GDPR", "SOC2"],
      "controls": ["CC6.1", "Article 25"],
      "owner": "Role responsible",
      "x": 100,
      "y": 200
    }
  ],
  "edges": [
    { "id": "edge-1", "from": "node-1", "to": "node-2", "label": "flow label", "condition": "if applicable" }
  ],
  "risks": [
    { "nodeId": "node-3", "risk": "Unauthorized access possible", "severity": "high", "mitigation": "Implement MFA" }
  ],
  "complianceGaps": [
    { "framework": "GDPR", "gap": "No DPO review step", "affectedNodes": ["node-4", "node-5"] }
  ],
  "raciMatrix": [
    { "activity": "Data Collection", "responsible": "Data Team", "accountable": "DPO", "consulted": "Legal", "informed": "CISO" }
  ],
  "summary": "Process analysis summary in markdown"
}`;

    try {
      const response = await this.generateContent({ prompt, temperature: 0.5, maxOutputTokens: 8192 }, userId);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          nodes: parsed.nodes || [],
          edges: parsed.edges || [],
          risks: parsed.risks || [],
          complianceGaps: parsed.complianceGaps || [],
          raciMatrix: parsed.raciMatrix || [],
          summary: parsed.summary || '',
        };
      }
      return { nodes: [], edges: [], risks: [], complianceGaps: [], raciMatrix: [], summary: response };
    } catch (error) {
      logger.error('Process analysis error', error);
      throw error;
    }
  }
}

export default new GeminiService();
