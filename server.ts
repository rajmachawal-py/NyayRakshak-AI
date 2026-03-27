import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import fs from "fs";
import net from "net";
import * as diff from "diff";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { GoogleGenAI, Type } from "@google/genai";

// Override is important during dev: if the shell already has empty vars set,
// dotenv would otherwise keep the empty value and ignore .env updates.
dotenv.config({ override: true });

console.log(
  "[ENV] SARVAM_API_KEY loaded:",
  process.env.SARVAM_API_KEY ? `yes (len=${process.env.SARVAM_API_KEY.length})` : "no"
);

function getSarvamApiKey(): string {
  if (process.env.SARVAM_API_KEY && process.env.SARVAM_API_KEY.trim()) {
    return process.env.SARVAM_API_KEY.trim();
  }
  // Fallback for environments where dotenv misses this var due to shell quirks.
  try {
    const envPath = path.join(process.cwd(), ".env");
    if (!fs.existsSync(envPath)) return "";
    const buf = fs.readFileSync(envPath);
    const hasManyNulls = buf.includes(0x00);
    const candidates = hasManyNulls
      ? [buf.toString("utf16le"), buf.toString("utf8")]
      : [buf.toString("utf8"), buf.toString("utf16le")];

    for (const raw of candidates) {
      const match = raw.match(/^\s*SARVAM_API_KEY\s*=\s*(.+)\s*$/m);
      if (!match) continue;
      let value = match[1].trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (value) return value.trim();
    }
    return "";
  } catch {
    return "";
  }
}

function getGroqApiKey(): string {
  return process.env.GROQ_API_KEY?.trim() || "";
}

function parseGroqResponseText(json: any): string {
  if (!json) return "";
  if (typeof json.output === "string") return json.output;
  if (Array.isArray(json.output)) {
    const first = json.output[0];
    if (typeof first === "string") return first;
    if (Array.isArray(first) && first.length > 0) return first[0];
  }
  if (Array.isArray(json.outputs) && json.outputs.length > 0) {
    const first = json.outputs[0];
    if (typeof first === "string") return first;
    if (Array.isArray(first) && first.length > 0) return first[0];
  }
  if (typeof json.data === "string") return json.data;
  return JSON.stringify(json);
}

async function runGroqAnalysis(prompt: string): Promise<any> {
  const groqKey = getGroqApiKey();
  if (!groqKey) {
    throw new Error("GROQ_API_KEY is not configured.");
  }

  const groqModel = process.env.GROQ_MODEL?.trim() || "groq-1.5-mini";
  const groqResponse = await fetch("https://api.groq.com/v1/outputs", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${groqKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: groqModel,
      input: prompt,
      max_output_tokens: 1200,
      temperature: 0.2,
    }),
  });

  const groqJson = await groqResponse.json();
  if (!groqResponse.ok) {
    const message = groqJson?.error?.message || JSON.stringify(groqJson);
    throw new Error(`Groq analysis failed: ${message}`);
  }

  const groqText = parseGroqResponseText(groqJson);
  return JSON.parse(groqText || "{}");
}

async function runGroqChat(prompt: string): Promise<string> {
  const groqKey = getGroqApiKey();
  if (!groqKey) {
    throw new Error("GROQ_API_KEY is not configured.");
  }

  const groqModel = process.env.GROQ_MODEL?.trim() || "groq-1.5-mini";
  const groqResponse = await fetch("https://api.groq.com/v1/outputs", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${groqKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: groqModel,
      input: prompt,
      max_output_tokens: 1200,
      temperature: 0.2,
    }),
  });

  const groqJson = await groqResponse.json();
  if (!groqResponse.ok) {
    const message = groqJson?.error?.message || JSON.stringify(groqJson);
    throw new Error(`Groq chat failed: ${message}`);
  }

  return parseGroqResponseText(groqJson) || "";
}

const JWT_SECRET = process.env.JWT_SECRET || "nyayrakshak-fallback-secret-2026";

// OTP in-memory store: email -> { otp, expiresAt }
const otpStore: Map<string, { otp: string; expiresAt: number }> = new Map();

function createEmailTransporter() {
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim();
  const smtpService = process.env.SMTP_SERVICE?.trim()?.toLowerCase() || "gmail";

  if (!smtpUser || !smtpPass) {
    console.warn("[OTP] SMTP_EMAIL not configured. Email sending will be disabled.");
    return null;
  }

  const transportConfig: any = {
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    logger: true,
    debug: true,
  };

  if (smtpService === "gmail") {
    transportConfig.host = "smtp.gmail.com";
    transportConfig.port = 587;
    transportConfig.secure = false;
  } else {
    transportConfig.service = smtpService;
  }

  console.log(`[OTP] SMTP transporter configured for ${smtpService}.`);
  return nodemailer.createTransport(transportConfig);
}

const transporter = createEmailTransporter();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock database for versions
interface ContractVersion {
  id: string;
  version_id: string;
  timestamp: number;
  filename: string;
  text: string;
  risk_score: number;
  risk_level: string;
  summary: string;
  clauses: any[];
}

let contractVersions: ContractVersion[] = [];

// In-memory user database
interface User {
  id: string;
  email: string;
  password: string; // bcrypt hashed
}

let users: User[] = [];

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 8000;

  async function ensureHmrPort(preferred: number) {
    // If preferred is occupied, pick an available port instead.
    return await new Promise<number>((resolve) => {
      const tryListen = (port: number) => {
        const srv = net.createServer();
        srv.unref();
        srv.on("error", () => {
          srv.close();
          const anyPortServer = net.createServer();
          anyPortServer.unref();
          anyPortServer.listen(0, "0.0.0.0", () => {
            const addr = anyPortServer.address();
            const p = typeof addr === "object" && addr ? addr.port : 0;
            anyPortServer.close(() => resolve(p || preferred));
          });
        });
        srv.listen(port, "0.0.0.0", () => {
          srv.close(() => resolve(port));
        });
      };

      tryListen(preferred);
    });
  }

  const preferredHmrPort = Number(process.env.VITE_HMR_PORT) || 24678;
  const viteHmrPort = await ensureHmrPort(preferredHmrPort);

  // Ensure uploads directory exists
  const uploadDir = path.join(__dirname, "uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
  }

  // Multer config for file uploads
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  });
  const upload = multer({ storage });

  app.use(express.json({ limit: '10mb' }));

  // Enable CORS for API requests from any origin
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }
    next();
  });

  // Handle browser favicon requests gracefully.
  app.get("/favicon.ico", (_req, res) => res.sendStatus(204));

  // POST /api/signup - Register a new user
  app.post("/api/signup", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters." });
      }

      // Check if user already exists
      const existingUser = users.find(u => u.email === email.toLowerCase());
      if (existingUser) {
        return res.status(409).json({ error: "An account with this email already exists." });
      }

      // Hash password and store user
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser: User = {
        id: Math.random().toString(36).substring(2, 10),
        email: email.toLowerCase(),
        password: hashedPassword,
      };
      users.push(newUser);

      console.log(`[AUTH] New user registered: ${newUser.email}`);
      res.status(201).json({ message: "Account created successfully.", email: newUser.email });
    } catch (err) {
      console.error("[AUTH] Signup error:", err);
      res.status(500).json({ error: "Internal server error." });
    }
  });

  // POST /api/login - Authenticate user and return JWT
  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
      }

      const user = users.find(u => u.email === email.toLowerCase());
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password." });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid email or password." });
      }

      // Generate JWT token (expires in 24h)
      const token = jwt.sign(
        { id: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      console.log(`[AUTH] User logged in: ${user.email}`);
      res.json({ token, email: user.email });
    } catch (err) {
      console.error("[AUTH] Login error:", err);
      res.status(500).json({ error: "Internal server error." });
    }
  });

  // GET /api/me - Verify token and return user info
  app.get("/api/me", (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "No token provided." });
      }

      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };

      const user = users.find(u => u.id === decoded.id);
      if (!user) {
        return res.status(401).json({ error: "User not found." });
      }

      res.json({ email: user.email, id: user.id });
    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired token." });
    }
  });

  // ============ OTP ENDPOINTS ============

  async function handleSendOtp(req, res) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email is required." });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
      otpStore.set(normalizedEmail, { otp, expiresAt });

      console.log(`[OTP] Generated OTP for ${normalizedEmail}: ${otp} (expires in 5 min)`);
      console.log(`[OTP] Sending OTP to: ${normalizedEmail}`);

      if (transporter) {
        try {
          await transporter.sendMail({
            from: `"NyayRakshak AI" <${process.env.SMTP_USER}>`,
            to: normalizedEmail,
            subject: "NyayRakshak AI - OTP Verification",
            html: `
              <div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:20px;">
                <h2 style="color:#4f46e5;">NyayRakshak AI</h2>
                <p>Your verification code is:</p>
                <div style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#1e1b4b;padding:16px;background:#f1f5f9;border-radius:12px;text-align:center;margin:16px 0;">
                  ${otp}
                </div>
                <p style="color:#64748b;font-size:12px;">This code expires in 5 minutes. If you did not request this, please ignore this email.</p>
              </div>
            `,
          });
          console.log(`[OTP] Email sent to ${normalizedEmail}`);
          return res.json({ message: "OTP sent to your email.", demoMode: false });
        } catch (emailErr) {
          console.error("[OTP] Email send failed:", emailErr);
          return res.json({ message: "Email sending failed. OTP displayed for demo.", demoMode: true, otp });
        }
      }

      console.log(`[OTP] Demo mode - OTP shown on screen for ${normalizedEmail}`);
      return res.json({ message: "Demo mode: No email configured.", demoMode: true, otp });
    } catch (err) {
      console.error("[OTP] Error:", err);
      return res.status(500).json({ error: "Internal server error." });
    }
  }

  app.post("/api/send-otp", handleSendOtp);
  app.post("/send-otp", handleSendOtp);

  // POST /api/verify-otp - Verify OTP for email
  app.post("/api/verify-otp", (req, res) => {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) {
        return res.status(400).json({ error: "Email and OTP are required." });
      }

      const stored = otpStore.get(email.toLowerCase());
      if (!stored) {
        return res.status(400).json({ error: "No OTP found. Please request a new one." });
      }

      if (Date.now() > stored.expiresAt) {
        otpStore.delete(email.toLowerCase());
        return res.status(400).json({ error: "OTP has expired. Please request a new one." });
      }

      if (stored.otp !== otp) {
        return res.status(400).json({ error: "Invalid OTP. Please try again." });
      }

      // OTP verified successfully, clean up
      otpStore.delete(email.toLowerCase());
      console.log(`[OTP] Verified for ${email}`);
      res.json({ verified: true, message: "Email verified successfully." });
    } catch (err) {
      console.error("[OTP] Verify error:", err);
      res.status(500).json({ error: "Internal server error." });
    }
  });

  // ============ END AUTH & OTP ============

  // API Routes
  app.post("/api/upload", upload.single("file"), (req: any, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    res.json({
      message: "File uploaded successfully",
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: `/uploads/${req.file.filename}`,
    });
  });

  app.post("/api/ocr", (req, res) => {
    const { text } = req.body;
    res.json({ text, status: "success" });
  });

  // Version Tracking Endpoints
  app.get("/api/versions", (req, res) => {
    res.json(contractVersions);
  });

  app.post("/api/versions", (req, res) => {
    const { version_id, filename, text, risk_score, risk_level, summary, clauses } = req.body;
    
    const newVersion: ContractVersion = {
      id: Math.random().toString(36).substring(7),
      version_id: version_id || `v${contractVersions.length + 1}.0`,
      timestamp: Date.now(),
      filename,
      text,
      risk_score,
      risk_level,
      summary,
      clauses
    };
    
    contractVersions.push(newVersion);
    res.status(201).json(newVersion);
  });

  app.post("/api/compare-versions", (req, res) => {
    const { versionId1, versionId2 } = req.body;
    
    const v1 = contractVersions.find(v => v.id === versionId1);
    const v2 = contractVersions.find(v => v.id === versionId2);
    
    if (!v1 || !v2) {
      return res.status(404).json({ error: "One or both versions not found" });
    }
    
    // Compute text diff
    const textDiff = diff.diffLines(v1.text, v2.text);
    
    // Risk comparison
    const riskDiff = v2.risk_score - v1.risk_score;
    const riskTrend = riskDiff < 0 ? "decreased" : riskDiff > 0 ? "increased" : "unchanged";
    
    // Simple clause change detection (based on text matching)
    const changedClauses = v2.clauses.map(c2 => {
      const matchingClause = v1.clauses.find(c1 => c1.clause_text === c2.clause_text);
      if (!matchingClause) {
        return { ...c2, change_type: "new" };
      }
      return { ...c2, change_type: "unchanged" };
    });

    const removedClauses = v1.clauses.filter(c1 => 
      !v2.clauses.some(c2 => c2.clause_text === c1.clause_text)
    ).map(c => ({ ...c, change_type: "removed" }));

    res.json({
      v1: { id: v1.id, version_id: v1.version_id, risk_score: v1.risk_score, risk_level: v1.risk_level },
      v2: { id: v2.id, version_id: v2.version_id, risk_score: v2.risk_score, risk_level: v2.risk_level },
      textDiff,
      riskDiff,
      riskTrend,
      changedClauses: [...changedClauses, ...removedClauses]
    });
  });

  app.post("/api/compare-promises", (req, res) => {
    const { contractText, promises } = req.body;
    
    // Simple keyword matching logic for "Dummy Mode" or as a fallback
    const results = promises.map((promise: string) => {
      const lowerContract = contractText.toLowerCase();
      const lowerPromise = promise.toLowerCase();
      
      // Basic normalization
      const cleanPromise = lowerPromise.replace(/[^\w\s]/gi, '');
      
      // Check for direct match
      if (lowerContract.includes(cleanPromise)) {
        return { 
          promise, 
          status: "Confirmed", 
          explanation: "This promise was found explicitly in the contract text.",
          related_clause: "Exact match found."
        };
      }
      
      // Check for contradictions (simple keyword based)
      const contradictions = ["not", "never", "no", "prohibited", "forbidden", "cannot"];
      const hasNegation = contradictions.some(word => lowerPromise.includes(word));
      
      // If promise says "no cost" but contract has "cost" or "fee"
      if (lowerPromise.includes("no") || lowerPromise.includes("free") || lowerPromise.includes("without")) {
        const keyTerms = cleanPromise.split(" ").filter(w => w.length > 4);
        const foundTerms = keyTerms.filter(term => lowerContract.includes(term));
        if (foundTerms.length > 0) {
           // Potential contradiction: promise says "no X" but "X" is mentioned
           return {
             promise,
             status: "Contradicted",
             explanation: "The contract mentions these terms but does not seem to support the 'free' or 'no-cost' aspect promised.",
             related_clause: "Potential conflict detected."
           };
        }
      }

      // Check for partial keywords
      const keywords = cleanPromise.split(" ").filter((w: string) => w.length > 4);
      const matches = keywords.filter((k: string) => lowerContract.includes(k));
      
      if (matches.length > keywords.length / 2) {
        return { 
          promise, 
          status: "Partially Confirmed", 
          explanation: "Some key terms were found, but the full promise could not be verified.",
          related_clause: "Partial match found."
        };
      }

      return { 
        promise, 
        status: "Not Found", 
        explanation: "No mention of this promise was found in the contract text.",
        related_clause: "N/A"
      };
    });

    res.json(results);
  });

  function generateLocalAnalysis(contract_text: string, role: string, language: string) {
    const lines = contract_text.split(/\n+/).filter((line: string) => line.trim().length > 20);
    const clauses: any[] = [];

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

    lines.forEach((line: string) => {
      let category = "Other";
      let riskLevel = "Safe";
      let riskReason = "Standard clause structure detected.";
      
      for (const cat of categories) {
        if (cat.keywords.some(k => line.toLowerCase().includes(k))) {
          category = cat.name;
          break;
        }
      }

      const lowerLine = line.toLowerCase();
      if (lowerLine.includes("immediately") || lowerLine.includes("without notice") || lowerLine.includes("sole discretion") || lowerLine.includes("unlimited")) {
        riskLevel = "High";
        riskReason = "One-sided language detected (e.g., 'sole discretion' or 'without notice').";
      } else if (lowerLine.includes("may") || lowerLine.includes("subject to") || lowerLine.includes("reasonable")) {
        riskLevel = "Moderate";
        riskReason = "Conditional language that may require clarification.";
      }

      clauses.push({
        clause_text: line.trim(),
        category,
        risk_level: riskLevel,
        risk_reason: riskReason,
        role_impact: `As a ${role}, this ${category} clause defines your legal obligations in this agreement.`,
        explanation: `This section explains the rules for ${category.toLowerCase()} in plain ${language}.`,
        industry_comparison: "Standard for most commercial agreements.",
        benchmark_status: riskLevel === "Safe" ? "Standard" : "Below Standard",
        suggestion: riskLevel !== "Safe" ? `Consider negotiating for more balanced ${category.toLowerCase()} terms.` : "No changes needed."
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
      summary: `[LOCAL ANALYSIS] This contract has been processed locally. It shows a ${risk_level.toLowerCase()} risk profile. Note: Local analysis may be less detailed than cloud-based analysis.`,
      clauses: clauses.slice(0, 15)
    };
  }

  // Analyze endpoint with Privacy Mode support
  app.post("/api/analyze", async (req, res) => {
    console.log("[ANALYZE] Request received:", req.body);
    const { contract_text, role, language, privacy_mode } = req.body ?? {};

    if (!contract_text || typeof contract_text !== "string") {
      return res.status(400).json({ error: "contract_text is required" });
    }

    if (privacy_mode) {
      const localResult = generateLocalAnalysis(contract_text, role, language);
      return res.json(localResult);
    }

    const geminiKey = process.env.GEMINI_API_KEY?.trim();
    const groqKey = getGroqApiKey();
    const promptRole = typeof role === "string" && role ? role : "Reviewer";
    const promptLanguage = typeof language === "string" && language ? language : "English";

    if (!groqKey && !geminiKey) {
      console.warn("[ANALYZE] No GEMINI_API_KEY or GROQ_API_KEY configured. Falling back to local analysis.");
      const localResult = generateLocalAnalysis(contract_text, promptRole, promptLanguage);
      return res.json({ ...localResult, fallback: true });
    }

    const prompt = `
Analyze the following legal contract from the perspective of a ${promptRole}.

Return ONLY valid JSON matching this shape:
- risk_score: number (0-100)
- risk_level: "Safe" | "Moderate" | "High"
- summary: string (in ${promptLanguage})
- clauses: array of objects with:
  clause_text, category, risk_level, risk_reason, role_impact, explanation, industry_comparison, benchmark_status, suggestion

Guidelines:
- Split the contract into meaningful clauses.
- Explain in simple ${promptLanguage}, 8th-grade level.
- Be specific and practical.

Contract Text:
${contract_text}
    `.trim();

    const runGeminiAnalysis = async () => {
      const ai = new GoogleGenAI({ apiKey: geminiKey as string });
      const model = "gemini-3-flash-preview";
      const response = await ai.models.generateContent({
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
                  required: [
                    "clause_text",
                    "category",
                    "risk_level",
                    "risk_reason",
                    "role_impact",
                    "explanation",
                    "industry_comparison",
                    "benchmark_status",
                    "suggestion"
                  ]
                }
              }
            },
            required: ["risk_score", "risk_level", "summary", "clauses"]
          }
        }
      });
      return JSON.parse(response.text || "{}");
    };

    const providers = [
      {
        name: "groq",
        enabled: Boolean(groqKey),
        run: async () => runGroqAnalysis(prompt)
      },
      {
        name: "gemini",
        enabled: Boolean(geminiKey),
        run: async () => runGeminiAnalysis()
      }
    ];

    for (const provider of providers) {
      if (!provider.enabled) continue;
      try {
        console.log(`[ANALYZE] Using ${provider.name.toUpperCase()} API for analysis.`);
        const result = await provider.run();
        return res.json({ ...result, fallback: provider.name });
      } catch (providerError: any) {
        console.warn(`[ANALYZE] ${provider.name.toUpperCase()} analysis failed:`, providerError);
      }
    }

    const fallbackResult = generateLocalAnalysis(contract_text, promptRole, promptLanguage);
    console.warn("[ANALYZE] Falling back to local analysis due to cloud AI failure.");
    return res.json({ ...fallbackResult, fallback: true });
  });

  // Chat endpoint using server-side Groq/Gemini support
  app.post("/api/chat", async (req, res) => {
    console.log("[CHAT] Request received:", req.body);
    const { chat_history, contract_text, role, language, privacy_mode } = req.body ?? {};

    if (!contract_text || typeof contract_text !== "string") {
      return res.status(400).json({ error: "contract_text is required" });
    }
    if (!Array.isArray(chat_history)) {
      return res.status(400).json({ error: "chat_history is required" });
    }

    if (privacy_mode) {
      return res.json({ text: "🔒 Privacy Mode is enabled. Contract guidance is provided locally without external AI calls." });
    }

    const promptRole = typeof role === "string" && role ? role : "Reviewer";
    const promptLanguage = typeof language === "string" && language ? language : "English";

    const historyText = chat_history
      .map((msg: any) => {
        const roleLabel = msg.role === "user" ? "User" : msg.role === "assistant" || msg.role === "model" ? "Assistant" : msg.role;
        return `${roleLabel}: ${msg.text}`;
      })
      .join("\n");

    const prompt = `
You are NyayRakshak AI, a contract guardian assistant.

CONTEXT:
- User role: ${promptRole}
- Language: ${promptLanguage}
- Contract text: ${contract_text}
- Conversation so far:
${historyText}

Please answer the user's latest question based on the contract text and keep the response simple, clear, and actionable. Use the selected language (${promptLanguage}) for the entire response.

If you cannot answer from the contract, say you need an active AI connection to analyze the contract in detail.
`.trim();

    const geminiKey = process.env.GEMINI_API_KEY?.trim();
    const groqKey = getGroqApiKey();

    const runGeminiChat = async () => {
      const ai = new GoogleGenAI({ apiKey: geminiKey as string });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          temperature: 0.2,
          maxOutputTokens: 1200,
        },
      });
      return response.text || "";
    };

    const providers = [
      { name: "groq", enabled: Boolean(groqKey), run: async () => runGroqChat(prompt) },
      { name: "gemini", enabled: Boolean(geminiKey), run: async () => runGeminiChat() }
    ];

    for (const provider of providers) {
      if (!provider.enabled) continue;
      try {
        console.log(`[CHAT] Using ${provider.name.toUpperCase()} API.`);
        const text = await provider.run();
        return res.json({ text: text || "I'm sorry, I could not generate a response." });
      } catch (providerError: any) {
        console.warn(`[CHAT] ${provider.name.toUpperCase()} chat failed:`, providerError);
      }
    }

    const fallback = `I'm currently offline and unable to access the AI service. I can provide general contract guidance, but I need a live AI connection to answer specific questions.`;
    console.warn("[CHAT] Falling back to offline response due to no AI keys or failure.");
    return res.json({ text: fallback });
  });

  // Explain endpoint (server-side Gemini; safer than browser key)
  app.post("/api/explain", async (req, res) => {
    try {
      const { text, language } = req.body ?? {};
      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "Text is required." });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Server GEMINI_API_KEY is not configured." });
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `
Convert the following legal text into simple, easy-to-understand ${language || "English"} for a non-lawyer.
Target an 8th-grade reading level. Avoid legal jargon and use short, direct sentences.

Legal Text:
${text}
        `.trim(),
      });

      res.json({ explanation: response.text || "" });
    } catch (err) {
      console.error("[EXPLAIN] Error:", err);
      res.status(500).json({ error: "Explain failed." });
    }
  });

  // Text-to-Speech via Sarvam AI (Bulbul)
  app.post("/api/tts", async (req, res) => {
    console.log("[TTS] Request received:", req.body);
    try {
      const { text, language_code, speaker, pace } = req.body ?? {};
      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "Text is required." });
      }

      const apiKey = getSarvamApiKey();
      if (!apiKey) {
        return res.status(500).json({ error: "Server SARVAM_API_KEY is not configured." });
      }

      const allowedLangs = new Set([
        "bn-IN",
        "en-IN",
        "gu-IN",
        "hi-IN",
        "kn-IN",
        "ml-IN",
        "mr-IN",
        "od-IN",
        "pa-IN",
        "ta-IN",
        "te-IN",
      ]);
      const target_language_code =
        typeof language_code === "string" && allowedLangs.has(language_code)
          ? language_code
          : "en-IN";

      const sarvamResp = await fetch("https://api.sarvam.ai/text-to-speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-subscription-key": apiKey,
        },
        body: JSON.stringify({
          model: "bulbul:v3",
          text: text.slice(0, 2500),
          target_language_code,
          speaker: typeof speaker === "string" ? speaker : undefined,
          pace: typeof pace === "number" ? pace : undefined,
          output_audio_codec: "wav",
          speech_sample_rate: "24000",
        }),
      });

      const bodyText = await sarvamResp.text();
      if (!sarvamResp.ok) {
        console.error("[TTS] Sarvam error:", sarvamResp.status, bodyText);
        return res.status(502).json({ error: "Sarvam TTS failed." });
      }

      const parsed = JSON.parse(bodyText) as { audios?: string[] };
      const b64 = parsed?.audios?.[0];
      if (!b64) {
        return res.status(502).json({ error: "Sarvam TTS returned no audio." });
      }

      const audio = Buffer.from(b64, "base64");
      res.setHeader("Content-Type", "audio/wav");
      res.setHeader("Cache-Control", "no-store");
      res.send(audio);
    } catch (err) {
      console.error("[TTS] Error:", err);
      res.status(500).json({ error: "TTS failed." });
    }
  });

  // Serve uploaded files
  app.use("/uploads", express.static(path.join(__dirname, "uploads")));

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: { port: viteHmrPort, clientPort: viteHmrPort },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const httpServer = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
  httpServer.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `\n[ERROR] Port ${PORT} is already in use.\n` +
          `  • Close the other terminal running "npm run dev", or\n` +
          `  • Kill the process: Get-NetTCPConnection -LocalPort ${PORT} | Select OwningProcess\n` +
          `  • Or use another port: $env:PORT=3001; npm run dev\n`
      );
      process.exit(1);
    }
    throw err;
  });
}

startServer();
