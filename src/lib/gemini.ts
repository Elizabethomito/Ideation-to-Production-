import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface AnalysisResult {
  riskScore: number;
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  summary: string;
  redFlags: string[];
  authenticationCheck: string;
  suggestedAction: string;
  isScam: boolean;
}

export async function analyzeMessage(message: string): Promise<AnalysisResult> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the following message for potential financial scams, fraud, or phishing attempts. 
    The message claims to have financial needs or requests money/information.
    
    Message: "${message}"`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          riskScore: {
            type: Type.NUMBER,
            description: "A score from 0 to 100 indicating the likelihood of a scam.",
          },
          riskLevel: {
            type: Type.STRING,
            enum: ["Low", "Medium", "High", "Critical"],
            description: "The severity of the risk.",
          },
          summary: {
            type: Type.STRING,
            description: "A brief summary of the analysis.",
          },
          redFlags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of specific indicators that suggest a scam.",
          },
          authenticationCheck: {
            type: Type.STRING,
            description: "Specific steps the user can take to verify the sender's identity.",
          },
          suggestedAction: {
            type: Type.STRING,
            description: "The recommended next step for the user.",
          },
          isScam: {
            type: Type.BOOLEAN,
            description: "Whether the message is likely a scam.",
          },
        },
        required: ["riskScore", "riskLevel", "summary", "redFlags", "authenticationCheck", "suggestedAction", "isScam"],
      },
      systemInstruction: "You are an expert fraud investigator and cybersecurity analyst. Your goal is to protect users from financial scams by identifying red flags in messages (SMS, Email, Social Media). Be thorough and cautious. If a message is suspicious, flag it clearly.",
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Failed to get analysis from AI.");
  }

  return JSON.parse(text) as AnalysisResult;
}
