
import { GoogleGenAI, Type } from "@google/genai";

// In production, this should point to your backend proxy (e.g., /api/ai/proxy)
// to avoid exposing the API Key in the frontend bundle.
// For this demo environment, we fallback to direct calls if no proxy is set.
const BACKEND_PROXY_URL = ''; 

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const checkApiKey = (): boolean => {
  if (!process.env.API_KEY && !BACKEND_PROXY_URL) {
    console.error("API Key is missing and no backend proxy configured.");
    return false;
  }
  return true;
};

// Helper to use Proxy if available, else direct SDK
const executeGenAI = async (model: string, prompt: string, schema?: any) => {
  if (BACKEND_PROXY_URL) {
    // secure proxy call
    const res = await fetch(BACKEND_PROXY_URL, {
        method: 'POST',
        body: JSON.stringify({ model, prompt, schema })
    });
    return await res.json();
  } else {
    // direct SDK call (Demo only)
    return await ai.models.generateContent({
        model,
        contents: prompt,
        config: schema ? { responseMimeType: "application/json", responseSchema: schema } : undefined
    });
  }
};

export const generateComplianceReport = async (
  framework: string,
  companyName: string,
  context: string
): Promise<string> => {
  if (!checkApiKey()) return "Configuration Error.";

  try {
    const prompt = `
      You are an expert Compliance Officer AI.
      Generate a professional executive summary for a ${framework} compliance audit report for "${companyName}".
      Context: "${context}"
      Structure: Executive Summary, Key Findings, Critical Gaps, Recommendations.
      Markdown format.
    `;
    const response = await executeGenAI('gemini-2.5-flash', prompt);
    return response.text || "Failed to generate report.";
  } catch (error) {
    console.error("AI Error:", error);
    return "An error occurred while generating the report.";
  }
};

export const chatWithComplianceBot = async (message: string): Promise<string> => {
    if (!checkApiKey()) return "System offline.";
    try {
        const response = await executeGenAI('gemini-2.5-flash', `You are a compliance assistant. User: ${message}`);
        return response.text || "Error.";
    } catch (e) { return "Error."; }
};

export const generateRemediationPlan = async (risk: string): Promise<string> => {
    try {
        const response = await executeGenAI('gemini-2.5-flash', `Provide technical remediation steps for risk: "${risk}". Markdown format.`);
        return response.text || "Error.";
    } catch (e) { return "Error."; }
};

export const generatePolicy = async (type: string, company: string, tone: string): Promise<string> => {
    try {
        const response = await executeGenAI('gemini-2.5-flash', `Write a ${tone} ${type} policy for ${company}. Markdown.`);
        return response.text || "Error.";
    } catch (e) { return "Error."; }
};

export const analyzeContract = async (text: string): Promise<string> => {
    try {
        const response = await executeGenAI('gemini-2.5-flash', `Analyze for GDPR/Security risks: "${text.substring(0,2000)}..."`);
        return response.text || "Error.";
    } catch (e) { return "Error."; }
};

export const performGapAnalysis = async (current: string[], target: string): Promise<string> => {
    try {
        const response = await executeGenAI('gemini-2.5-flash', `Gap analysis: Current=${current.join(',')}, Target=${target}.`);
        return response.text || "Error.";
    } catch (e) { return "Error."; }
};

export const classifyEvidence = async (filename: string): Promise<string> => {
    try {
        const response = await executeGenAI('gemini-2.5-flash', `Classify compliance evidence file: "${filename}". Return control name only.`);
        return response.text || "Unknown";
    } catch (e) { return "Unknown"; }
};

export const generateRFPResponse = async (q: string, ctx: string) => (await executeGenAI('gemini-2.5-flash', `Answer RFP question: "${q}" given context: "${ctx}"`)).text;
export const generatePhishingSim = async (t: string, d: string) => (await executeGenAI('gemini-2.5-flash', `Phishing email for ${d} dept about ${t}.`)).text;
export const scoreVendorRisk = async (v: string, s: string, d: string) => (await executeGenAI('gemini-2.5-flash', `Risk score vendor ${v}, service ${s}, data ${d}.`)).text;
export const mapGDPRData = async (p: string) => (await executeGenAI('gemini-2.5-flash', `GDPR RoPA for process: ${p}.`)).text;
export const generateBCP = async (s: string) => (await executeGenAI('gemini-2.5-flash', `BCP plan for: ${s}.`)).text;

export const prioritizeRisks = async (risks: any[]): Promise<any[]> => {
  if (!checkApiKey()) return [];
  try {
    const summary = risks.map(r => ({ id: r.id, desc: r.description, sev: r.severity }));
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: { id: {type: Type.STRING}, score: {type: Type.INTEGER}, rationale: {type: Type.STRING} }
        }
    };
    const response = await executeGenAI('gemini-2.5-flash', `Score risks 0-100: ${JSON.stringify(summary)}`, schema);
    return JSON.parse(response.text || "[]");
  } catch (e) { return []; }
};
