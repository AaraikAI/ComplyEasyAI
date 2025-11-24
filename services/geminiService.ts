
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const checkApiKey = (): boolean => {
  if (!process.env.API_KEY) {
    console.error("API Key is missing.");
    return false;
  }
  return true;
};

export const generateComplianceReport = async (
  framework: string,
  companyName: string,
  context: string
): Promise<string> => {
  if (!checkApiKey()) return "API Key missing.";

  try {
    const prompt = `
      You are an expert Compliance Officer AI for ComplyEasy.
      Generate a professional executive summary for a ${framework} compliance audit report for a company named "${companyName}".
      
      Context provided: "${context}"

      Structure the response with:
      1. Executive Summary
      2. Key Findings (Successes)
      3. Critical Gaps (Simulated based on context or general common gaps if vague)
      4. Remediation Recommendations
      
      Keep it concise, professional, and formatted in Markdown.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Failed to generate report.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "An error occurred while generating the report.";
  }
};

export const chatWithComplianceBot = async (
  message: string,
  context?: string
): Promise<string> => {
  if (!checkApiKey()) return "I can't answer right now because the API Key is missing.";

  try {
    const prompt = `
      You are ComplyEasy AI, a helpful assistant for compliance and security.
      Context: ${context || 'General compliance assistance.'}
      User Question: "${message}"
      Answer concisely and helpfully.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "I couldn't process that request.";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "Sorry, I encountered a temporary error.";
  }
};

// 1. AI Remediation Plan
export const generateRemediationPlan = async (riskDescription: string): Promise<string> => {
  if (!checkApiKey()) return "API Key missing.";
  try {
    const prompt = `
      Provide a step-by-step technical remediation plan for the following security risk:
      "${riskDescription}"
      
      Include:
      1. Immediate containment steps.
      2. Technical fix (CLI commands, config changes, or code snippets if applicable for AWS/Azure/GCP).
      3. Verification steps.
      Format in Markdown.
    `;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text || "No remediation plan generated.";
  } catch (e) { return "Error generating plan."; }
};

// 2. AI Policy Generator
export const generatePolicy = async (type: string, company: string, tone: string): Promise<string> => {
  if (!checkApiKey()) return "API Key missing.";
  try {
    const prompt = `
      Write a comprehensive ${type} for ${company}.
      Tone: ${tone}.
      Include standard sections: Purpose, Scope, Policy Details, Roles & Responsibilities, Enforcement.
      Format in Markdown.
    `;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text || "Failed to generate policy.";
  } catch (e) { return "Error generating policy."; }
};

// 3. AI Contract Analyzer
export const analyzeContract = async (text: string): Promise<string> => {
  if (!checkApiKey()) return "API Key missing.";
  try {
    const prompt = `
      Analyze the following contract clause for GDPR and Data Privacy compliance.
      Highlight red flags, missing DPA clauses, or liability issues.
      
      Contract Text: "${text.substring(0, 5000)}"
      
      Output Format:
      - **Compliance Score**: (0-100)
      - **Key Risks**: (List)
      - **Missing Clauses**: (List)
      - **Recommendations**: (Text)
    `;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text || "Failed to analyze contract.";
  } catch (e) { return "Error analyzing contract."; }
};

// 4. AI Gap Analysis
export const performGapAnalysis = async (current: string[], target: string): Promise<string> => {
  if (!checkApiKey()) return "API Key missing.";
  try {
    const prompt = `
      I currently have compliance with: ${current.join(', ')}.
      I want to achieve compliance with: ${target}.
      
      Perform a gap analysis.
      List the specific controls or policies I likely lack given my current standing.
      Be specific to the frameworks.
    `;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text || "Failed to perform gap analysis.";
  } catch (e) { return "Error performing gap analysis."; }
};

// 5. AI Evidence Classification
export const classifyEvidence = async (filename: string): Promise<string> => {
  if (!checkApiKey()) return "API Key missing.";
  try {
    const prompt = `
      I am uploading a file named "${filename}" as evidence for a compliance audit.
      Which standard security control (ISO 27001 / SOC 2) does this likely satisfy?
      Return just the Control Name and ID (e.g., "Access Control (CC6.1)").
    `;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text || "Unclassified";
  } catch (e) { return "Unclassified"; }
};

// 6. RFP Auto-Responder
export const generateRFPResponse = async (question: string, context: string): Promise<string> => {
  if (!checkApiKey()) return "API Key missing.";
  try {
    const prompt = `
      You are a Security Compliance Officer filling out an RFP/Security Questionnaire.
      Context about our security: ${context}
      
      Question: "${question}"
      
      Provide a professional, affirmative (where possible), and concise answer.
    `;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text || "Failed to generate response.";
  } catch (e) { return "Error generating response."; }
};

// 7. Phishing Simulation Generator
export const generatePhishingSim = async (theme: string, department: string): Promise<string> => {
  if (!checkApiKey()) return "API Key missing.";
  try {
    const prompt = `
      Create a phishing simulation email template for the "${department}" department.
      Theme: "${theme}".
      
      Include:
      1. Email Subject Line (make it urgent/clickable)
      2. Sender Name (fake but realistic)
      3. Email Body (HTML formatted text)
      4. The "Red Flags" users should have spotted.
    `;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text || "Failed to generate simulation.";
  } catch (e) { return "Error generating simulation."; }
};

// 8. Vendor Risk Scorer
export const scoreVendorRisk = async (vendorName: string, serviceType: string, dataAccess: string): Promise<string> => {
  if (!checkApiKey()) return "API Key missing.";
  try {
    const prompt = `
      Assess the inherent security risk of the following vendor:
      Vendor: ${vendorName}
      Service Type: ${serviceType}
      Data Access: ${dataAccess}
      
      Output in Markdown:
      - **Risk Score**: (High / Medium / Low)
      - **Justification**: (Why?)
      - **Recommended Controls**: (e.g., SOC2 report, DPA, SSO)
    `;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text || "Failed to score vendor.";
  } catch (e) { return "Error scoring vendor."; }
};

// 9. GDPR Data Mapper
export const mapGDPRData = async (process: string): Promise<string> => {
  if (!checkApiKey()) return "API Key missing.";
  try {
    const prompt = `
      For the business process "${process}", generate a GDPR Record of Processing Activities (RoPA) entry.
      
      Include:
      - Data Categories involved (e.g., Name, IP, Financial)
      - Data Subjects (e.g., Employees, Customers)
      - Lawful Basis (e.g., Consent, Contract)
      - Retention Period (suggested)
      Format as a Markdown table.
    `;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text || "Failed to map data.";
  } catch (e) { return "Error mapping data."; }
};

// 10. BCP Generator
export const generateBCP = async (scenario: string): Promise<string> => {
  if (!checkApiKey()) return "API Key missing.";
  try {
    const prompt = `
      Generate a Business Continuity Plan (BCP) checklist for the scenario: "${scenario}".
      
      Include:
      1. Immediate Response Team
      2. Communication Plan (Internal & External)
      3. Recovery Steps
      4. RTO/RPO estimates (generic)
      Format in Markdown.
    `;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text || "Failed to generate BCP.";
  } catch (e) { return "Error generating BCP."; }
};

// 11. AI Risk Prioritization
export const prioritizeRisks = async (risks: any[]): Promise<any[]> => {
  if (!checkApiKey()) return [];
  try {
    // We only send ID, description, and severity to save tokens
    const riskSummary = risks.map(r => ({ id: r.id, description: r.description, severity: r.severity }));
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        Analyze the following security risks. 
        Assign a 'criticality score' (0-100) to each based on potential business impact and likelihood of exploitation.
        Provide a short 1-sentence rationale for the score.
        
        Risks: ${JSON.stringify(riskSummary)}
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              score: { type: Type.INTEGER },
              rationale: { type: Type.STRING }
            }
          }
        }
      }
    });
    
    const jsonStr = response.text || "[]";
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Prioritization error", e);
    return [];
  }
};
