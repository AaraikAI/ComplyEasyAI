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

  async generateContent(
    options: AIRequestOptions,
    userId: string
  ): Promise<string> {
    try {
      // Rate limiting
      if (!this.checkRateLimit(userId)) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }

      // PII Redaction (AI Air Gap)
      const { redactedText, map } = redactPII(options.prompt);
      logger.info(`[AI Request] User: ${userId}, Redacted PII tokens: ${map.size}`);

      const model = genAI.getGenerativeModel({
        model: options.model || 'gemini-1.5-flash',
      });

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: redactedText }] }],
        generationConfig: {
          temperature: options.temperature || 0.7,
          maxOutputTokens: options.maxOutputTokens || 2048,
        },
      });

      const response = result.response;
      const text = response.text();

      // Rehydrate PII in response
      const finalText = rehydratePII(text, map);

      logger.info(`[AI Response] User: ${userId}, Tokens: ${response.usageMetadata?.totalTokenCount || 'N/A'}`);

      return finalText;
    } catch (error: any) {
      logger.error('[Gemini API Error]', error);

      if (error.message?.includes('quota')) {
        throw new Error('AI service quota exceeded. Please try again later.');
      }

      throw new Error('Failed to generate AI response');
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

  async performGapAnalysis(current: string[], target: string, userId: string): Promise<string> {
    const prompt = `Perform a compliance gap analysis.
Current frameworks: ${current.join(', ')}
Target framework: ${target}

Identify:
1. Missing controls
2. Additional requirements
3. Implementation effort
4. Recommended steps

Format: Markdown`;

    return this.generateContent({ prompt, temperature: 0.5 }, userId);
  }

  async classifyEvidence(filename: string, userId: string): Promise<string> {
    const prompt = `Classify this compliance evidence file and suggest which control it maps to:
Filename: "${filename}"

Return only the control name (e.g., "Access Control Policy", "Encryption at Rest", etc.)`;

    return this.generateContent({ prompt, temperature: 0.3 }, userId);
  }

  async generateRFPResponse(question: string, context: string, userId: string): Promise<string> {
    const prompt = `Answer this RFP security questionnaire item:
Question: "${question}"
Company context: "${context}"

Provide a professional, compliant response.`;

    return this.generateContent({ prompt, temperature: 0.6 }, userId);
  }

  async generatePhishingSimulation(theme: string, department: string, userId: string): Promise<string> {
    const prompt = `Generate a realistic phishing simulation email for security training.
Department: ${department}
Theme: ${theme}

Include:
- Subject line
- Email body
- Social engineering tactics used

Format: Plain text email format`;

    return this.generateContent({ prompt, temperature: 0.7 }, userId);
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

  async generateDataMap(processName: string, userId: string): Promise<string> {
    const prompt = `Generate a GDPR Article 30 Record of Processing Activities (RoPA) for:
Process: "${processName}"

Include:
1. Processing purpose
2. Data categories
3. Data subjects
4. Recipients
5. Retention period
6. Security measures

Format: Markdown`;

    return this.generateContent({ prompt, temperature: 0.5 }, userId);
  }

  async generateBCP(scenario: string, userId: string): Promise<string> {
    const prompt = `Generate a Business Continuity Plan for this disaster scenario:
"${scenario}"

Include:
1. Immediate Response Steps
2. Communication Plan
3. Recovery Procedures
4. Restoration Timeline
5. Testing Plan

Format: Markdown`;

    return this.generateContent({ prompt, temperature: 0.6 }, userId);
  }

  async chatWithBot(message: string, userId: string): Promise<string> {
    const prompt = `You are a helpful compliance assistant for ComplyEasy AI.
User question: "${message}"

Provide a helpful, accurate response about compliance, security, or the platform.`;

    return this.generateContent({ prompt, temperature: 0.7, maxOutputTokens: 500 }, userId);
  }
}

export default new GeminiService();
