/**
 * Frontend Gemini Service - Now uses backend proxy for security
 * All AI calls now go through backend API to protect API keys
 */

import { api } from './api';
import { logger } from '../utils/logger';

export const generateComplianceReport = async (
  framework: string,
  companyName: string,
  context: string
): Promise<string> => {
  try {
    // Auth is handled via httpOnly cookies; 401 errors caught below
    const response: any = await api.ai.generateReport(framework, companyName, context);
    return response.report || "Failed to generate report.";
  } catch (error: any) {
    logger.error("AI Error:", error);
    const errorMessage = error?.message || 'Unknown error';
    
    if (errorMessage.includes('401') || errorMessage.includes('Authentication required') || errorMessage.includes('Invalid token')) {
      return "Please log in to generate reports. Your session may have expired.";
    }
    if (errorMessage.includes('quota') || errorMessage.includes('429')) {
      return "AI service quota exceeded. Please check your Google AI Studio quota (https://makersuite.google.com/app/apikey) or enable billing in Google Cloud Console for higher limits. The quota usually resets daily for free tier accounts.";
    }
    if (errorMessage.includes('Cannot connect') || errorMessage.includes('Network error') || errorMessage.includes('fetch')) {
      return "Cannot connect to the backend server. Please ensure the server is running on port 3001.";
    }
    
    return errorMessage || "An error occurred while generating the report.";
  }
};

export const chatWithComplianceBot = async (message: string): Promise<string> => {
  try {
    // Auth is handled via httpOnly cookies; 401 errors caught below
    const response: any = await api.ai.chat(message);
    // Response now includes: { response, sources, encrypted }
    return response.response || "Error.";
  } catch (e: any) {
    logger.error('Chat error:', e);
    const errorMessage = e?.message || 'Unknown error';
    
    // Log full error details in development
    if ((import.meta as ImportMeta & { env: { DEV: boolean } }).env.DEV) {
      logger.error('Full error details:', {
        message: errorMessage,
        error: e,
        auth: 'httpOnly cookie',
      });
    }
    
    if (errorMessage.includes('401') || errorMessage.includes('Authentication required') || errorMessage.includes('Invalid token') || errorMessage.includes('No token')) {
      return "Please log in to use the AI assistant. Your session may have expired.";
    }
    if (errorMessage.includes('quota') || errorMessage.includes('429')) {
      return "AI service quota exceeded. Please check your Google AI Studio quota (https://makersuite.google.com/app/apikey) or enable billing in Google Cloud Console for higher limits. The quota usually resets daily for free tier accounts.";
    }
    if (errorMessage.includes('Cannot connect') || errorMessage.includes('Network error') || errorMessage.includes('fetch')) {
      return "Cannot connect to the backend server. Please ensure the server is running on port 3001.";
    }
    if (errorMessage.includes('Failed to get chat response')) {
      return `The AI service encountered an error: ${errorMessage}. Please check your API configuration or try again.`;
    }
    
    // Return the actual error message instead of generic "Error"
    return errorMessage || "Error. Please try again.";
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
    // Auth is handled via httpOnly cookies; 401 errors caught below
    const response: any = await api.ai.generatePolicy(type, company, tone);
    return response.policy || "Error.";
  } catch (e: any) {
    logger.error('Policy generation error:', e);
    const errorMessage = e?.message || 'Unknown error';
    
    if (errorMessage.includes('401') || errorMessage.includes('Authentication required') || errorMessage.includes('Invalid token')) {
      return "Please log in to generate policies. Your session may have expired.";
    }
    if (errorMessage.includes('quota') || errorMessage.includes('429')) {
      return "AI service quota exceeded. Please check your Google AI Studio quota (https://makersuite.google.com/app/apikey) or enable billing in Google Cloud Console for higher limits. The quota usually resets daily for free tier accounts.";
    }
    if (errorMessage.includes('Cannot connect') || errorMessage.includes('Network error') || errorMessage.includes('fetch')) {
      return "Cannot connect to the backend server. Please ensure the server is running on port 3001.";
    }
    
    return errorMessage || "Error generating policy. Please try again.";
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

export const performGapAnalysis = async (current: string[], target: string | string[]): Promise<string> => {
  try {
    // Handle both single target and multiple targets
    const targetStr = Array.isArray(target) ? target.join(', ') : target;
    const response: any = await api.ai.performGapAnalysis(current, targetStr);
    return response.analysis || "Error.";
  } catch (e: any) {
    const errorMessage = e?.message || 'Gap analysis failed';
    if (errorMessage.includes('timeout')) {
      return 'Analysis timeout. The gap analysis is taking too long. Please try with fewer frameworks.';
    }
    return errorMessage || "Error.";
  }
};

export const classifyEvidence = async (filename: string): Promise<string> => {
  try {
    const prompt = `Classify the following compliance evidence file based on its filename. Return ONLY the category name (one of: Policy, Procedure, Audit Report, Risk Assessment, Training Record, Certification, SOC Report, Vendor Agreement, Incident Report, Access Review, Configuration, Screenshot, Log File, Other).\n\nFilename: ${filename}`;
    const result: any = await api.ai.chat(prompt);
    const classification = (result.response || result.message || '').trim();
    return classification || 'Other';
  } catch {
    // Fallback: classify by file extension pattern matching
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const name = filename.toLowerCase();
    if (name.includes('policy') || name.includes('pol-')) return 'Policy';
    if (name.includes('procedure') || name.includes('proc-')) return 'Procedure';
    if (name.includes('audit') || name.includes('report')) return 'Audit Report';
    if (name.includes('risk') || name.includes('assessment')) return 'Risk Assessment';
    if (name.includes('training') || name.includes('cert')) return 'Training Record';
    if (name.includes('soc') || name.includes('soc2')) return 'SOC Report';
    if (name.includes('vendor') || name.includes('agreement') || name.includes('contract')) return 'Vendor Agreement';
    if (name.includes('incident')) return 'Incident Report';
    if (ext === 'log' || ext === 'csv') return 'Log File';
    if (ext === 'png' || ext === 'jpg' || ext === 'jpeg') return 'Screenshot';
    if (ext === 'pdf') return 'Audit Report';
    return 'Other';
  }
};

export const generateRFPResponse = async (q: string, ctx: string): Promise<{response: string; confidence: number}> => {
  try {
    const result: any = await api.ai.generateRFPResponse(q, ctx);
    return {
      response: result.response || "Error.",
      confidence: result.confidence || 0.75
    };
  } catch (e: any) {
    return {
      response: e?.message || "Error.",
      confidence: 0
    };
  }
};

export const generatePhishingSim = async (t: string, d: string): Promise<string> => {
  try {
    const response: any = await api.ai.generatePhishing(t, d, 'General', 'Medium');
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
