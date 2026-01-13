import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config';
import logger from '../config/logger';
import { redactPII, rehydratePII } from '../utils/piiRedaction';

const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

interface AIRequestOptions {
  prompt: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

class GeminiService {
  private rateLimitMap: Map<string, number[]> = new Map();
  private readonly MAX_REQUESTS_PER_MINUTE = 60;

  private checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const userRequests = this.rateLimitMap.get(userId) || [];

    // Filter requests from the last minute
    const recentRequests = userRequests.filter(time => now - time < 60000);

    if (recentRequests.length >= this.MAX_REQUESTS_PER_MINUTE) {
      return false;
    }

    recentRequests.push(now);
    this.rateLimitMap.set(userId, recentRequests);
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
      if (!this.checkRateLimit(userId)) {
        throw new Error('Rate limit exceeded. Maximum 60 requests per minute. Please try again later.');
      }

      // Malicious prompt injection detection and neutralization
      const neutralizedPrompt = this.neutralizePrompt(options.prompt);

      // PII Redaction (AI Air Gap)
      const { redactedText, map } = redactPII(neutralizedPrompt);
      logger.info(`[AI Request] User: ${userId}, Redacted PII tokens: ${map.size}`);

      // Use available model - gemini-2.0-flash is stable and available
      const model = genAI.getGenerativeModel({
        model: options.model || 'gemini-2.0-flash',
      });

      // Set timeout: 60 seconds
      const timeoutMs = 60000;
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('AI service request timed out after 60 seconds. Please try again with a simpler request.'));
        }, timeoutMs);
      });

      const generatePromise = model.generateContent({
        contents: [{ role: 'user', parts: [{ text: redactedText }] }],
        generationConfig: {
          temperature: options.temperature || 0.7,
          maxOutputTokens: options.maxOutputTokens || 2048,
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
        throw new Error('AI service request timed out after 60 seconds. Please try again with a simpler request.');
      }

      // Handle service unavailability
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
        throw new Error('AI service temporarily unavailable. Please check your internet connection and try again later.');
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
        throw new Error('AI service quota exceeded. Please check your Google AI Studio quota (https://makersuite.google.com/app/apikey) or enable billing in Google Cloud Console for higher limits.');
      }

      // Handle model not found
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        throw new Error('AI model not available. Please check your API key and model configuration.');
      }

      // Handle authentication errors
      if (error.message?.includes('401') || error.message?.includes('403')) {
        throw new Error('AI API authentication failed. Please check your API key.');
      }

      // Generic error
      throw new Error(`Failed to generate AI response: ${error.message || 'Unknown error'}`);
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
}

export default new GeminiService();
