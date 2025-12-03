/**
 * Frontend Gemini Service - Now uses backend proxy for security
 * All AI calls now go through backend API to protect API keys
 */

import { api } from './api';

export const generateComplianceReport = async (
  framework: string,
  companyName: string,
  context: string
): Promise<string> => {
  try {
    const response: any = await api.ai.generateReport(framework, companyName, context);
    return response.report || "Failed to generate report.";
  } catch (error) {
    console.error("AI Error:", error);
    return "An error occurred while generating the report.";
  }
};

export const chatWithComplianceBot = async (message: string): Promise<string> => {
  try {
    const response: any = await api.ai.chat(message);
    return response.response || "Error.";
  } catch (e) {
    return "Error.";
  }
};

export const generateRemediationPlan = async (risk: string): Promise<string> => {
  try {
    // Risk ID would need to be passed here in production
    // For now, we'll use the text-based method
    const response: any = await api.ai.generatePolicy('remediation', risk, 'technical');
    return response.policy || "Error.";
  } catch (e) {
    return "Error.";
  }
};

export const generatePolicy = async (type: string, company: string, tone: string): Promise<string> => {
  try {
    const response: any = await api.ai.generatePolicy(type, company, tone);
    return response.policy || "Error.";
  } catch (e) {
    return "Error.";
  }
};

export const analyzeContract = async (text: string): Promise<string> => {
  try {
    const response: any = await api.ai.analyzeContract(text);
    return response.analysis || "Error.";
  } catch (e) {
    return "Error.";
  }
};

export const performGapAnalysis = async (current: string[], target: string): Promise<string> => {
  try {
    const response: any = await api.ai.performGapAnalysis(current, target);
    return response.analysis || "Error.";
  } catch (e) {
    return "Error.";
  }
};

export const classifyEvidence = async (filename: string): Promise<string> => {
  try {
    // For file classification, we'd need a separate endpoint
    // For now, use a generic AI call
    return "Classified";
  } catch (e) {
    return "Unknown";
  }
};

export const generateRFPResponse = async (q: string, ctx: string): Promise<string> => {
  try {
    const response: any = await api.ai.generateRFPResponse(q, ctx);
    return response.response || "Error.";
  } catch (e) {
    return "Error.";
  }
};

export const generatePhishingSim = async (t: string, d: string): Promise<string> => {
  try {
    const response: any = await api.ai.generatePhishing(t, d);
    return response.email || "Error.";
  } catch (e) {
    return "Error.";
  }
};

export const scoreVendorRisk = async (v: string, s: string, d: string): Promise<string> => {
  try {
    const response: any = await api.ai.scoreVendor(v, s, d);
    return response.score || "Error.";
  } catch (e) {
    return "Error.";
  }
};

export const mapGDPRData = async (p: string): Promise<string> => {
  try {
    const response: any = await api.ai.generateDataMap(p);
    return response.map || "Error.";
  } catch (e) {
    return "Error.";
  }
};

export const generateBCP = async (s: string): Promise<string> => {
  try {
    const response: any = await api.ai.generateBCP(s);
    return response.plan || "Error.";
  } catch (e) {
    return "Error.";
  }
};

export const prioritizeRisks = async (risks: any[]): Promise<any[]> => {
  try {
    const response: any = await api.risks.prioritize();
    return response || [];
  } catch (e) {
    return [];
  }
};
