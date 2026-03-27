import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, Role } from "../types";

function getGeminiApiKey(): string {
  // Vite only exposes env vars prefixed with VITE_ to the browser.
  // We also defensively check the non-prefixed name in case the project
  // injects it via custom Vite define, but most setups won’t.
  const env = (import.meta as any)?.env ?? {};
  return (env.VITE_GEMINI_API_KEY ?? env.GEMINI_API_KEY ?? "") as string;
}

function getClient() {
  return new GoogleGenAI({ apiKey: getGeminiApiKey() });
}

export async function analyzeContract(text: string, role: Role, language: string = "English"): Promise<AnalysisResult> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Analyze the following legal contract from the perspective of a ${role}.
    
    1. Clause Detection: Split the contract text into individual, meaningful clauses based on numbered sections, paragraph breaks, or sentence grouping.
    2. Clause Analysis: For each clause, categorize it and evaluate its risk level (Safe, Moderate, High).
    3. Risk Evaluation: Identify one-sided terms, missing protections, excessive restrictions, and financial risks.
    4. Plain-Language Explanation: Convert legal jargon into simple, easy-to-understand ${language} for each clause. Target an 8th-grade reading level. Avoid legal jargon and use short, direct sentences.
    5. Role-Specific Impact: Explain why this clause is particularly important or risky for a ${role}.
    6. Industry Benchmark Comparison: Compare each clause with general industry standards and geographic norms (e.g., "Standard in Indian IT", "Below standard for UK freelancers"). Be specific about how much it deviates (e.g., "3 months notice is standard, this is 6 months").
    7. Benchmark Status: Categorize the clause as "Standard", "Above Standard" (better for the user), or "Below Standard" (worse for the user).
    8. Counter-Clause Suggestion: For every Moderate or High risk clause, generate a fairer alternative. This counter-clause MUST be:
       - Written in proper, formal legal language suitable for direct insertion into a contract.
       - Balanced and fair to both parties (not maximally in the user's favor).
       - Contextually appropriate for a ${role}.
       - Ready to be copy-pasted into a revision request.
    
    Categories: Termination, Payment, Liability, IP Ownership, Non-compete, Confidentiality, Indemnification, Dispute Resolution, Force Majeure, Other.
    
    Generate a numeric risk_score (0-100) where:
    - 0-30: Safe (Fair, balanced, standard terms).
    - 31-60: Moderate Risk (Some one-sided terms, needs negotiation).
    - 61-100: High Risk (Very one-sided, predatory, or missing critical protections).
    
    Provide a risk_level ("Safe", "Moderate", or "High"), a concise summary explaining the score in ${language}, and a breakdown of all detected clauses.
    
    IMPORTANT: All text fields in the JSON response (summary, risk_reason, role_impact, explanation, industry_comparison, suggestion) MUST be written in ${language}.
    
    Contract Text:
    ${text}
  `;

  const response = await getClient().models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          risk_score: { type: Type.NUMBER },
          risk_level: { type: Type.STRING, enum: ["Safe", "Moderate", "High"] },
          summary: { type: Type.STRING },
          clauses: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                clause_text: { type: Type.STRING },
                category: { 
                  type: Type.STRING, 
                  enum: ["Termination", "Payment", "Liability", "IP Ownership", "Non-compete", "Confidentiality", "Indemnification", "Dispute Resolution", "Force Majeure", "Other"] 
                },
                risk_level: { type: Type.STRING, enum: ["Safe", "Moderate", "High"] },
                risk_reason: { type: Type.STRING },
                role_impact: { type: Type.STRING },
                explanation: { type: Type.STRING },
                industry_comparison: { type: Type.STRING },
                benchmark_status: { type: Type.STRING, enum: ["Standard", "Above Standard", "Below Standard"] },
                suggestion: { type: Type.STRING }
              },
              required: ["clause_text", "category", "risk_level", "risk_reason", "role_impact", "explanation", "industry_comparison", "benchmark_status", "suggestion"]
            }
          }
        },
        required: ["risk_score", "risk_level", "summary", "clauses"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}

export async function comparePromises(contractText: string, promisesText: string, language: string = "English"): Promise<any[]> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Compare the following verbal promises with the provided contract text.
    
    Verbal Promises:
    ${promisesText}
    
    Contract Text:
    ${contractText}
    
    For each verbal promise, determine if it is:
    1. Confirmed: Clearly exists in the contract.
    2. Partially Confirmed: Mentioned but incomplete or weaker than promised.
    3. Not Found: No mention in the contract.
    4. Contradicted: The contract says the opposite of the promise.
    
    Provide a detailed explanation and identify the related clause if applicable.
    Compare the intent and meaning, not just exact words.
    
    IMPORTANT: The explanation field in the JSON response MUST be written in ${language}.
  `;

  const response = await getClient().models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            promise: { type: Type.STRING },
            status: { type: Type.STRING, enum: ["Confirmed", "Partially Confirmed", "Not Found", "Contradicted"] },
            explanation: { type: Type.STRING },
            related_clause: { type: Type.STRING }
          },
          required: ["promise", "status", "explanation", "related_clause"]
        }
      }
    }
  });

  return JSON.parse(response.text || "[]");
}

export async function explainInPlainLanguage(text: string, language: string = "English") {
  const model = "gemini-3-flash-preview";
  const prompt = `
    Convert the following legal text into simple, easy-to-understand ${language} for a non-lawyer.
    Target an 8th-grade reading level. Avoid legal jargon and use short, direct sentences.
    
    Legal Text:
    ${text}
  `;

  const response = await getClient().models.generateContent({
    model,
    contents: prompt,
  });

  return response.text;
}
