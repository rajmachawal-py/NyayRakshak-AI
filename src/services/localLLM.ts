import { AnalysisResult, Role, Clause } from "../types";

/**
 * Simulates a local LLM (like Llama 3 or Mistral) processing a contract entirely on-device.
 * It attempts to call a local Ollama instance if available, otherwise falls back to 
 * the application's local analysis endpoint.
 */
export async function localAnalyzeContract(text: string, role: Role, language: string = "English"): Promise<AnalysisResult> {
  const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000") as string;

  // 1. Fallback to Application's Local Analysis Endpoint
  try {
    const response = await fetch(`${BACKEND_URL}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contract_text: text,
        role,
        language,
        privacy_mode: true
      })
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    console.error("Local API failed, using client-side fallback.");
  }

  // 3. Final Client-Side Fallback (Rule-based)
  const lines = text.split(/\n+/).filter(line => line.trim().length > 20);
  const clauses: Clause[] = [];
  
  const categories = [
    { name: "Termination", keywords: ["terminate", "termination", "notice period", "end the agreement"] },
    { name: "Payment", keywords: ["payment", "invoice", "fees", "compensation", "salary", "bonus"] },
    { name: "Liability", keywords: ["liability", "limitation", "responsible", "damages", "cap"] },
    { name: "IP Ownership", keywords: ["intellectual property", "ownership", "copyright", "patent", "work product"] },
    { name: "Non-compete", keywords: ["non-compete", "competition", "solicit", "restrictive covenant"] },
    { name: "Confidentiality", keywords: ["confidential", "disclosure", "secret", "privacy"] },
    { name: "Indemnification", keywords: ["indemnify", "indemnification", "hold harmless", "defend"] },
    { name: "Dispute Resolution", keywords: ["dispute", "arbitration", "jurisdiction", "governing law", "court"] },
    { name: "Force Majeure", keywords: ["force majeure", "act of god", "unforeseeable", "beyond control"] }
  ];

  lines.forEach((line) => {
    let category = "Other";
    let riskLevel: "Safe" | "Moderate" | "High" = "Safe";
    
    for (const cat of categories) {
      if (cat.keywords.some(k => line.toLowerCase().includes(k))) {
        category = cat.name;
        break;
      }
    }

    const lowerLine = line.toLowerCase();
    if (lowerLine.includes("immediately") || lowerLine.includes("without notice") || lowerLine.includes("sole discretion") || lowerLine.includes("unlimited")) {
      riskLevel = "High";
    } else if (lowerLine.includes("may") || lowerLine.includes("subject to") || lowerLine.includes("reasonable")) {
      riskLevel = "Moderate";
    }

    clauses.push({
      clause_text: line.trim(),
      category: category as any,
      risk_level: riskLevel,
      risk_reason: "Keyword-based detection.",
      role_impact: `Important for a ${role}.`,
      explanation: `Simplified ${category} terms.`,
      industry_comparison: "Standard terms.",
      benchmark_status: "Standard",
      suggestion: "Review carefully."
    });
  });

  let totalRisk = 0;
  clauses.forEach(c => {
    if (c.risk_level === "High") totalRisk += 25;
    if (c.risk_level === "Moderate") totalRisk += 10;
  });
  
  const risk_score = Math.min(100, Math.max(10, totalRisk));
  const risk_level = risk_score <= 30 ? "Safe" : risk_score <= 60 ? "Moderate" : "High";

  return {
    risk_score,
    risk_level,
    summary: `[CLIENT-SIDE ANALYSIS] Processed locally. Results may be less detailed than cloud AI.`,
    clauses: clauses.slice(0, 10)
  };
}
