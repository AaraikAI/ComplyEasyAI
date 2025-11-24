import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateComplianceReport = async (
  framework: string,
  companyName: string,
  context: string
): Promise<string> => {
  if (!process.env.API_KEY) {
    return "API Key is missing. Please configure your environment to use AI features.";
  }

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
    return "An error occurred while generating the report. Please try again. Ensure your API key is valid.";
  }
};

export const chatWithComplianceBot = async (
  message: string
): Promise<string> => {
  if (!process.env.API_KEY) {
    return "I can't answer right now because the API Key is missing.";
  }

  try {
    const prompt = `
      You are ComplyEasy AI, a helpful assistant for compliance and security.
      Answer the following user question concisely. 
      User Question: "${message}"
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
