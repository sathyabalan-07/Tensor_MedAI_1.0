import { GoogleGenAI, Type } from "@google/genai";
import { ReportSummary } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const SYSTEM_PROMPT = `You are a medical AI assistant helping clinicians and patients understand medical reports.
Your task is to:
1. Extract key findings from the provided medical report (image or PDF).
2. Generate a plain-language summary (avoid jargon, use simple English).
3. Identify and flag abnormal values with severity (Low/Medium/High).
4. Provide actionable recommendations.
5. Always include a medical disclaimer.

Severity Guidelines:
- High: Immediately actionable, potentially life-threatening (e.g., critical lab values, urgent findings).
- Medium: Requires timely follow-up within days/weeks.
- Low: Monitor, routine follow-up.

Return ONLY valid JSON.`;

export async function analyzeMedicalReport(
  fileBase64: string,
  mimeType: string,
  metadata?: { age?: number; gender?: string }
): Promise<ReportSummary> {
  const model = "gemini-2.0-flash"; // Using the latest flash model

  const prompt = `Please analyze this medical report. 
  ${metadata?.age ? `Patient Age: ${metadata.age}` : ""}
  ${metadata?.gender ? `Patient Gender: ${metadata.gender}` : ""}
  
  Return the analysis in the following JSON format:
  {
    "report_type": "string",
    "key_findings": ["string"],
    "plain_summary": "string",
    "abnormal_flags": [
      {
        "parameter": "string",
        "value": "string",
        "normal_range": "string",
        "severity": "Low|Medium|High",
        "explanation": "string"
      }
    ],
    "recommendations": ["string"],
    "disclaimer": "string"
  }`;

  const response = await ai.models.generateContent({
    model: model,
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              data: fileBase64,
              mimeType: mimeType,
            },
          },
        ],
      },
    ],
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
    },
  });

  const result = JSON.parse(response.text || "{}");
  
  return {
    ...result,
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    patient_age: metadata?.age,
    patient_gender: metadata?.gender,
  };
}
