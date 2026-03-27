import React, { useState, useEffect, useRef } from "react";
import { 
  Upload, 
  FileText, 
  ShieldAlert, 
  MessageSquare, 
  Mic, 
  Volume2, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  ChevronRight,
  Loader2,
  History,
  Download,
  Scale,
  Trash2,
  Edit2,
  Eye,
  FileSearch,
  Copy,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  ShieldCheck,
  Lock,
  Shield,
  Menu,
  Sun,
  Moon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Tesseract from "tesseract.js";
import * as pdfjsLib from "pdfjs-dist";
import { cn } from "./lib/utils";
import { AnalysisResult, Clause, ChatMessage, Role, ContractVersion, ComparisonResult } from "./types";
import { analyzeContract, comparePromises, explainInPlainLanguage } from "./services/gemini";
import { localAnalyzeContract } from "./services/localLLM";
import { translations } from "./translations";

interface UserSession {
  id: string | number;
  email: string;
}

interface SavedContract {
  id: number;
  user_id: number;
  contract_text: string;
  analysis_result: string;
  created_at: string;
}
import { fallbackData } from "./mockFallback";
import { uiTranslations } from "./uiTranslations";
import { chatTranslations } from "./chatTranslations";
import AuthScreen from "./components/AuthScreen";
import { exportAnalysisPDF } from "./utils/exportPdf";
import { LogOut, User } from "lucide-react";

const GEMINI_API_KEY =
  ((import.meta as any)?.env?.VITE_GEMINI_API_KEY ??
    (import.meta as any)?.env?.GEMINI_API_KEY ??
    "") as string;
const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000") as string;

// Set worker for PDF.js
try {
  const workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).href;
  (pdfjsLib as any)?.GlobalWorkerOptions &&
    (((pdfjsLib as any).GlobalWorkerOptions.workerSrc as string) = workerSrc);
} catch {
  // If PDF.js worker wiring fails, keep the app usable.
}

// Speech Recognition Setup
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;
let currentAudio: HTMLAudioElement | null = null;

const languageMap: Record<string, string> = {
  "English": "en-IN",
  "Hindi": "hi-IN",
  "Marathi": "mr-IN",
  "Tamil": "ta-IN",
  "Telugu": "te-IN",
  "Bengali": "bn-IN",
  "Gujarati": "gu-IN",
  "Kannada": "kn-IN"
};

const tesseractLangMap: Record<string, string> = {
  "English": "eng",
  "Hindi": "hin",
  "Marathi": "mar",
  "Tamil": "tam",
  "Telugu": "tel",
  "Bengali": "ben",
  "Gujarati": "guj",
  "Kannada": "kan"
};

const uiLanguageKeyMap: Record<string, string> = {
  English: "en",
  Hindi: "hi",
  Marathi: "mr",
  Tamil: "ta",
  Telugu: "te",
  Bengali: "bn",
  Gujarati: "gu",
  Kannada: "kn",
};

function langKey(languageLabel: string): string {
  return uiLanguageKeyMap[languageLabel] ?? "en";
}

function trFor(languageLabel: string) {
  const key = langKey(languageLabel);
  return translations[key] ?? translations["en"];
}

function chatTrFor(languageLabel: string) {
  const key = langKey(languageLabel);
  return chatTranslations[key] ?? chatTranslations["en"];
}

const RiskCard = ({ 
  score, 
  level, 
  summary, 
  onSpeak,
  selectedLanguage,
  onCompareWithAI,
  isComparing,
  isVoiceActive
}: { 
  score: number, 
  level: string, 
  summary: string, 
  onSpeak: (text: string) => void,
  selectedLanguage: string,
  onCompareWithAI?: () => void,
  isComparing?: boolean,
  isVoiceActive?: boolean,
}) => {
  const getLevelColor = (l: string) => {
    switch (l) {
      case "Safe": return "text-green-600 bg-green-50 border-green-200";
      case "Moderate": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "High": return "text-red-600 bg-red-50 border-red-200";
      default: return "text-slate-600 bg-slate-50 border-slate-200";
    }
  };

  const getMeterColor = (l: string) => {
    switch (l) {
      case "Safe": return "bg-green-500";
      case "Moderate": return "bg-yellow-500";
      case "High": return "bg-red-500";
      default: return "bg-slate-400";
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl p-6 border shadow-sm flex flex-col md:flex-row gap-8 items-center transition-all duration-300", 
        getLevelColor(level),
        "dark:bg-slate-900/50 dark:border-slate-800"
      )}
    >
      <div className="relative w-32 h-32 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r="58"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="opacity-10"
          />
          <motion.circle
            cx="64"
            cy="64"
            r="58"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={364.4}
            initial={{ strokeDashoffset: 364.4 }}
            animate={{ strokeDashoffset: 364.4 - (364.4 * score) / 100 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className={getMeterColor(level)}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black dark:text-white">{score}</span>
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-70 dark:text-slate-400">{trFor(selectedLanguage).risk}</span>
        </div>
      </div>

      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <ShieldAlert size={20} className="dark:text-slate-300" />
          <h3 className="text-xl font-bold dark:text-white">{trFor(selectedLanguage).risk_assessment}: {level}</h3>
          {(summary.includes("[LOCAL ANALYSIS]") || summary.includes("[CLIENT-SIDE ANALYSIS]")) && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full text-[10px] font-bold uppercase tracking-wider">
                <ShieldCheck size={10} />
                {trFor(selectedLanguage).privacy_mode}
              </div>
              {onCompareWithAI && (
                <button 
                  onClick={onCompareWithAI}
                  disabled={isComparing}
                  className={cn(
                    "text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1",
                    isComparing && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isComparing ? <Loader2 size={10} className="animate-spin" /> : null}
                  {isComparing ? trFor(selectedLanguage).analyzing : trFor(selectedLanguage).compare_ai}
                </button>
              )}
            </div>
          )}
          <button 
            onClick={() => onSpeak(`${trFor(selectedLanguage).risk_assessment}: ${level}. ${summary}`)}
            disabled={isVoiceActive}
            className={cn(
              "p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all",
              isVoiceActive && "opacity-50 cursor-not-allowed"
            )}
            title={trFor(selectedLanguage).listen_summary}
          >
            <Volume2 size={16} />
          </button>
          <div className="group relative">
            <div className="cursor-help text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              <AlertTriangle size={16} />
            </div>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              {trFor(selectedLanguage).risk_score_explanation}
            </div>
          </div>
        </div>
        <p className="text-sm leading-relaxed opacity-90 dark:text-slate-300">{summary}</p>
        <div className="flex gap-4 pt-2">
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider opacity-70 dark:text-slate-400">
            <div className="w-2 h-2 rounded-full bg-green-500" /> {trFor(selectedLanguage).safe} (0-30)
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider opacity-70 dark:text-slate-400">
            <div className="w-2 h-2 rounded-full bg-yellow-500" /> {trFor(selectedLanguage).moderate} (31-60)
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider opacity-70 dark:text-slate-400">
            <div className="w-2 h-2 rounded-full bg-red-500" /> {trFor(selectedLanguage).high} (61-100)
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const Sidebar = ({ 
  activeTab, 
  setActiveTab, 
  selectedLanguage,
  isDarkMode,
  setIsDarkMode,
  isOpen,
  setIsOpen
}: { 
  activeTab: string, 
  setActiveTab: (t: any) => void,
  selectedLanguage: string,
  isDarkMode: boolean,
  setIsDarkMode: (v: boolean) => void,
  isOpen: boolean,
  setIsOpen: (v: boolean) => void
}) => {
  const getLabel = (keyA: string, keyB: string) => {
    const t = trFor(selectedLanguage) as any;
    const en = (translations["en"] ?? {}) as any;
    return t?.[keyA] || t?.[keyB] || en?.[keyA] || keyA;
  };

  const navItems = [
    { id: "upload", label: getLabel("upload_contract", "upload"), icon: Upload },
    { id: "analysis", label: getLabel("analysis_tab", "analyze"), icon: FileSearch },
    { id: "chat", label: getLabel("chatbot_tab", "chat"), icon: MessageSquare },
    { id: "promises", label: getLabel("verbal_promises_tab", "promises"), icon: Mic },
    { id: "history", label: getLabel("history_tab", "history"), icon: History },
    { id: "settings", label: getLabel("settings_tab", "settings"), icon: Shield },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className={cn(
        "fixed inset-y-0 left-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col z-50 transition-all duration-300 transform lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <Scale size={24} />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight dark:text-white">NyayRakshak AI</h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">{trFor(selectedLanguage)?.justice_guardian ?? "Justice Guardian"}</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (window.innerWidth < 1024) setIsOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group",
                activeTab === item.id 
                  ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 shadow-sm" 
                  : "text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
              )}
            >
              <item.icon size={20} className={cn(
                "transition-transform group-hover:scale-110",
                activeTab === item.id ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"
              )} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800 transition-all"
          >
            <div className="flex items-center gap-3">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              {isDarkMode ? (trFor(selectedLanguage)?.light_mode || "Light Mode") : (trFor(selectedLanguage)?.dark_mode || "Dark Mode")}
            </div>
            <div className={cn(
              "w-10 h-5 rounded-full relative transition-all",
              isDarkMode ? "bg-indigo-600" : "bg-slate-200"
            )}>
              <div className={cn(
                "absolute top-1 w-3 h-3 rounded-full bg-white transition-all",
                isDarkMode ? "left-6" : "left-1"
              )} />
            </div>
          </button>
        </div>
      </div>
    </>
  );
};

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [contractText, setContractText] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPrivacyMode, setIsPrivacyMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("privacy_mode") === "true";
    }
    return false;
  });
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [role, setRole] = useState<Role>("Tenant");
  const [selectedLanguage, setSelectedLanguage] = useState<string>(() => localStorage.getItem("nr_language") || "English");
  const tr = trFor(selectedLanguage);
  const languages = ["English", "Hindi", "Marathi", "Tamil", "Telugu", "Bengali", "Gujarati", "Kannada"];
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [verbalPromises, setVerbalPromises] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [promiseComparison, setPromiseComparison] = useState<any[] | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [activeTab, setActiveTab] = useState<"upload" | "analysis" | "chat" | "promises" | "history" | "settings">("upload");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isVoiceModeEnabled, setIsVoiceModeEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSpeechLoading, setIsSpeechLoading] = useState(false);
  const [isAdvancedTTSEnabled, setIsAdvancedTTSEnabled] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [savedContracts, setSavedContracts] = useState<SavedContract[]>([]);
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      return JSON.parse(localStorage.getItem("nr_user") || "null");
    } catch {
      return null;
    }
  });
  const [isGuest, setIsGuest] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("nr_guest") === "true";
  });

  const [versions, setVersions] = useState<ContractVersion[]>([]);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [isComparingVersions, setIsComparingVersions] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchVersions = async () => {
    try {
      const response = await fetch("/api/versions");
      const data = await response.json();
      setVersions(data);
    } catch (error) {
      console.error("Failed to fetch versions:", error);
    }
  };

  const fetchMyContracts = async (userId: number) => {
    try {
      const response = await fetch(`${BACKEND_URL}/my-contracts/${userId}`);
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        console.warn("Failed to fetch user contracts:", errorBody);
        return;
      }
      const data = await response.json();
      setSavedContracts(data);
    } catch (error) {
      console.error("Failed to fetch user contracts:", error);
    }
  };

  const saveContractToDb = async (analysisResult: AnalysisResult, text: string) => {
    if (!currentUser) return;
    try {
      const response = await fetch(`${BACKEND_URL}/save-contract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUser.id,
          contract_text: text,
          analysis_result: JSON.stringify(analysisResult),
        }),
      });
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        console.warn("Failed to save contract:", errorBody);
        return;
      }
      const saved = await response.json();
      setSavedContracts((prev) => [saved, ...prev]);
    } catch (error) {
      console.error("Failed to save contract:", error);
    }
  };

  const saveVersion = async (analysisResult: AnalysisResult, text: string, filename: string) => {
    try {
      await fetch("/api/versions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename,
          text,
          risk_score: analysisResult.risk_score,
          risk_level: analysisResult.risk_level,
          summary: analysisResult.summary,
          clauses: analysisResult.clauses
        }),
      });
      fetchVersions();
    } catch (error) {
      console.error("Failed to save version:", error);
    }
  };

  useEffect(() => {
    fetchVersions();
    if (currentUser) {
      fetchMyContracts(currentUser.id);
    }
    // Eagerly load voices
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
  }, [currentUser]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem("nr_language", selectedLanguage);
  }, [selectedLanguage]);

  useEffect(() => {
    localStorage.setItem("privacy_mode", isPrivacyMode ? "true" : "false");
  }, [isPrivacyMode]);



  const handleLogin = (user: UserSession) => {
    setCurrentUser(user);
    setIsGuest(false);
    localStorage.setItem("nr_user", JSON.stringify(user));
    localStorage.removeItem("nr_guest");
  };

  const handleLogout = () => {
    localStorage.removeItem("nr_user");
    localStorage.removeItem("nr_guest");
    setCurrentUser(null);
    setIsGuest(false);
    setSavedContracts([]);
  };

  const handleGuest = () => {
    setCurrentUser(null);
    setIsGuest(true);
    localStorage.setItem("nr_guest", "true");
  };

  const renderTabContent = () => {
    const ui = uiTranslations[langKey(selectedLanguage)] ?? uiTranslations["en"];

    switch (activeTab) {
      case "upload":
        return (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl w-full"
            >
              <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-4">{ui.title}</h2>
              <p className="text-lg text-slate-500 dark:text-slate-400 mb-8">{ui.subtitle}</p>
              
              <div 
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                className={cn(
                  "group relative flex flex-col items-center justify-center w-full h-80 border-2 border-dashed rounded-3xl transition-all cursor-pointer",
                  isDragging ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/10" : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-indigo-400"
                )}
              >
                <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 group-hover:scale-110 transition-transform shadow-sm">
                      <Upload size={40} />
                    </div>
                    <p className="mb-2 text-lg text-slate-700 dark:text-slate-200 font-bold">{tr.drop_file ?? "Drop your contract here"}</p>
                    <p className="text-sm text-slate-400">{ui.drop_sub}</p>
                  </div>
                  <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} accept=".pdf,.jpg,.jpeg,.png,.txt" />
                </label>
              </div>

              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { icon: ShieldCheck, title: ui.card1_t, desc: ui.card1_s },
                  { icon: Scale, title: ui.card2_t, desc: ui.card2_s },
                  { icon: Mic, title: ui.card3_t, desc: ui.card3_s }
                ].map((item, i) => (
                  <div key={i} className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <item.icon className="text-indigo-600 mb-3 mx-auto" size={24} />
                    <h4 className="font-bold text-sm dark:text-white mb-1">{item.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        );
      case "analysis":
        if (isAnalyzing) {
          return (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center shadow-sm">
              <div className="relative mb-8">
                <Loader2 className="w-16 h-16 text-indigo-600 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Scale size={24} className="text-indigo-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-2 dark:text-white">Analyzing Your Contract...</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md">Our AI is scanning clauses and assessing risks for a {role}. This usually takes 10-20 seconds.</p>
              {ocrProgress > 0 && (
                <div className="w-full max-w-xs space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <span>{tr.processing ?? "Processing..."}</span>
                    <span>{Math.round(ocrProgress * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${ocrProgress * 100}%` }}
                      className="bg-indigo-600 h-full rounded-full" 
                    />
                  </div>
                </div>
              )}
            </div>
          );
        }
        if (!analysis) {
          return (
            <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
              <FileSearch size={64} className="mb-4 opacity-20" />
              <h3 className="text-xl font-bold mb-2">No Analysis Yet</h3>
              <p className="max-w-xs mx-auto text-sm">Upload a contract in the Upload tab to see the AI analysis here.</p>
              <button 
                onClick={() => setActiveTab("upload")}
                className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
              >
                Go to Upload
              </button>
            </div>
          );
        }
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Eye className="text-indigo-600" size={20} />
                    <h3 className="font-bold dark:text-white">{trFor(selectedLanguage).file_preview}</h3>
                  </div>
                </div>
                <div className="aspect-[4/3] bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-center overflow-hidden">
                  {filePreview ? (
                    <img src={filePreview} alt="Preview" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="flex flex-col items-center text-slate-300">
                      <FileSearch size={48} />
                      <p className="text-xs mt-2">{trFor(selectedLanguage).no_preview}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="text-indigo-600" size={20} />
                    <h3 className="font-bold dark:text-white">{trFor(selectedLanguage).extracted_text}</h3>
                  </div>
                </div>
                <textarea 
                  value={contractText}
                  onChange={(e) => setContractText(e.target.value)}
                  className="w-full h-[240px] bg-slate-50 dark:bg-slate-950 border-none rounded-xl p-4 text-xs font-mono leading-relaxed focus:ring-0 resize-none scrollbar-thin dark:text-slate-300"
                />
              </div>
            </div>

            <RiskCard 
              score={analysis.risk_score} 
              level={analysis.risk_level} 
              summary={analysis.summary} 
              onSpeak={speak}
              selectedLanguage={selectedLanguage}
              isVoiceActive={isSpeaking || isSpeechLoading}
            />

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="font-bold dark:text-white">{trFor(selectedLanguage).clause_breakdown}</h3>
                <div className="flex items-center gap-4">
                  <select 
                    value={filterRisk} 
                    onChange={(e) => setFilterRisk(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-none dark:text-white"
                  >
                    <option value="All">All Risks</option>
                    <option value="Safe">Safe</option>
                    <option value="Moderate">Moderate</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>
              <div className="p-6 space-y-6">
                {filteredClauses.map((clause, idx) => (
                  <div key={idx} className="group border border-slate-100 dark:border-slate-800 rounded-2xl p-6 hover:border-indigo-200 dark:hover:border-indigo-900 hover:bg-indigo-50/10 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center",
                          clause.risk_level === "Safe" ? "bg-green-100 text-green-600" :
                          clause.risk_level === "Moderate" ? "bg-yellow-100 text-yellow-600" :
                          "bg-red-100 text-red-600"
                        )}>
                          {clause.risk_level === "Safe" ? <CheckCircle2 size={20} /> :
                           clause.risk_level === "Moderate" ? <AlertTriangle size={20} /> :
                           <ShieldAlert size={20} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase", getRiskLevelColor(clause.risk_level))}>
                              {tr[clause.risk_level?.toLowerCase() as keyof typeof tr] || clause.risk_level}
                            </span>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{clause.category}</span>
                          </div>
                          <p className="text-sm font-bold dark:text-white">{clause.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => speak(clause.explanation)} disabled={isSpeaking || isSpeechLoading} className={cn(
                          "p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all",
                          (isSpeaking || isSpeechLoading) && "opacity-50 cursor-not-allowed"
                        )}>
                          <Volume2 size={18} />
                        </button>
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 mb-4 border border-slate-100 dark:border-slate-800">
                      <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed italic">"{clause.clause_text}"</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{tr.explain_plain}</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{clause.explanation}</p>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{tr.suggestion}</h4>
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                          <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium leading-relaxed">{clause.suggestion}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case "chat":
        return (
          <div className="max-w-4xl mx-auto h-[calc(100vh-180px)] flex flex-col">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col h-full shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold dark:text-white">{ui.chat_title}</h3>
                    <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest">{ui.chat_status}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setChatMessages([{ role: "model", text: trFor(selectedLanguage).chatbot_welcome }])}
                  className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={cn("flex items-start gap-4", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      msg.role === "user" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                    )}>
                      {msg.role === "user" ? "U" : "AI"}
                    </div>
                    <div className={cn(
                      "max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm relative group",
                      msg.role === "user" 
                        ? "bg-indigo-600 text-white rounded-tr-none" 
                        : "bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-800"
                    )}>
                      {msg.text}
                      {msg.role === "model" && (
                        <button 
                          onClick={() => speak(msg.text)} 
                          disabled={isSpeaking || isSpeechLoading}
                          className={cn(
                            "absolute -right-10 top-2 p-2 text-slate-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity",
                            (isSpeaking || isSpeechLoading) && "opacity-40 cursor-not-allowed"
                          )}
                          title="Listen to response"
                        >
                          <Volume2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl rounded-tl-none flex items-center gap-3 border border-slate-100 dark:border-slate-800">
                      <Loader2 className="animate-spin text-indigo-600" size={16} />
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium italic">{ui.chat_thinking}</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleChat} className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="relative">
                  <button
                    type="button"
                    onClick={handleVoiceChatInput}
                    className={cn(
                      "absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all",
                      isRecording ? "bg-red-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
                    )}
                    title={isRecording ? "Stop voice input" : "Start voice input"}
                  >
                    <Mic size={18} />
                  </button>
                  <input 
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={ui.chat_placeholder}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 pl-14 pr-16 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm dark:text-white"
                  />
                  <button 
                    type="submit"
                    disabled={!chatInput.trim() || isChatLoading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-30"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      case "promises":
        return (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
                  <Mic size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold dark:text-white">{ui.promises_title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{ui.promises_subtitle}</p>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl p-6 flex gap-4 mb-8">
                <AlertTriangle className="text-amber-500 shrink-0" size={24} />
                <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
                  <span className="font-bold">{ui.promises_tip_title}</span> {ui.promises_tip_text}
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{ui.promises_add}</label>
                  <button 
                    onClick={() => isRecording ? stopRecording() : startRecording((text) => setVerbalPromises(prev => [...prev, text]))}
                    className={cn(
                      "flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all relative",
                      isRecording ? "bg-red-500 text-white shadow-lg shadow-red-500/30" : "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100"
                    )}
                  >
                    <Mic size={18} />
                    {isRecording ? ui.promises_listening : ui.promises_record}
                    {isRecording && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-400 animate-ping" />
                    )}
                  </button>
                </div>
                
                <div className="space-y-3">
                  {verbalPromises.map((p, i) => (
                    <div key={i} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl group">
                      <div className="w-6 h-6 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-400 border border-slate-200 dark:border-slate-700">
                        {i + 1}
                      </div>
                      <input 
                        value={p} 
                        onChange={(e) => {
                          const newP = [...verbalPromises];
                          newP[i] = e.target.value;
                          setVerbalPromises(newP);
                        }}
                        className="flex-1 bg-transparent border-none text-sm focus:ring-0 dark:text-white"
                      />
                      <button onClick={() => setVerbalPromises(prev => prev.filter((_, idx) => idx !== i))} className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  {verbalPromises.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl text-slate-400">
                      <p className="text-sm font-medium">{ui.promises_empty}</p>
                    </div>
                  )}
                </div>

                <button 
                  onClick={handleCompare}
                  disabled={isComparing || verbalPromises.length === 0 || !contractText}
                  className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/20"
                >
                  {isComparing ? <Loader2 className="animate-spin" size={24} /> : <ShieldCheck size={24} />}
                  {ui.promises_verify_btn}
                </button>
              </div>
            </div>

            {promiseComparison && (
              <div className="space-y-4">
                <h4 className="font-bold text-lg dark:text-white ml-2">{ui.promises_results}</h4>
                {promiseComparison.map((item, idx) => (
                  <div key={idx} className="flex gap-6 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="shrink-0">
                      {item.status === "Confirmed" ? <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center"><CheckCircle2 size={24} /></div> : 
                       item.status === "Contradicted" ? <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center"><XCircle size={24} /></div> : 
                       item.status === "Partially Confirmed" ? <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-2xl flex items-center justify-center"><AlertTriangle size={24} /></div> :
                       <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center"><History size={24} /></div>}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-4 mb-2">
                        <h5 className="font-bold dark:text-white">{item.promise}</h5>
                        <span className={cn(
                          "text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest",
                          item.status === "Confirmed" ? "bg-green-100 text-green-700" : 
                          item.status === "Contradicted" ? "bg-red-100 text-red-700" : 
                          item.status === "Partially Confirmed" ? "bg-yellow-100 text-yellow-700" :
                          "bg-slate-100 text-slate-700"
                        )}>
                          {item.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">{item.explanation}</p>
                      {item.related_clause && item.related_clause !== "N/A" && (
                        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{ui.promises_relevant}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 italic leading-relaxed">"{item.related_clause}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case "history":
        return (
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold dark:text-white">{ui.history_title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{ui.history_subtitle}</p>
              </div>
              <button 
                onClick={handleCompareVersions}
                disabled={selectedVersions.length !== 2 || isComparingVersions}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-indigo-500/20"
              >
                {isComparingVersions ? <Loader2 size={18} className="animate-spin" /> : <Scale size={18} />}
                {ui.history_compare_btn}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {versions.map((v) => (
                <div 
                  key={v.id} 
                  className={cn(
                    "p-6 rounded-3xl border transition-all cursor-pointer relative group",
                    selectedVersions.includes(v.id) ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/10 shadow-md" : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300"
                  )}
                  onClick={() => {
                    if (selectedVersions.includes(v.id)) {
                      setSelectedVersions(prev => prev.filter(id => id !== v.id));
                    } else if (selectedVersions.length < 2) {
                      setSelectedVersions(prev => [...prev, v.id]);
                    }
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                      <FileText size={24} />
                    </div>
                    <div className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                      selectedVersions.includes(v.id) ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-200 dark:border-slate-700"
                    )}>
                      {selectedVersions.includes(v.id) && <CheckCircle2 size={14} />}
                    </div>
                  </div>
                  <h4 className="font-bold dark:text-white mb-1 truncate">{v.filename}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">{new Date(v.timestamp).toLocaleDateString()} â€¢ {v.version_id}</p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{ui.history_risk_score}</span>
                      <span className={cn("text-lg font-black", getRiskColor(v.risk_score).split(' ')[0])}>{v.risk_score}</span>
                    </div>
                    <div className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase", getRiskLevelColor(v.risk_level))}>
                      {v.risk_level}
                    </div>
                  </div>
                </div>
              ))}
              {versions.length === 0 && (
                <div className="col-span-full text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                  <History className="mx-auto mb-4 opacity-10" size={64} />
                  <p className="text-slate-400 font-medium">{ui.history_empty}</p>
                </div>
              )}
            </div>

            {comparisonResult && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8 pt-8 border-t border-slate-200 dark:border-slate-800"
              >
                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex items-center gap-12">
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{ui.history_v1}</p>
                      <div className="text-4xl font-black text-slate-800 dark:text-white">{comparisonResult.v1.risk_score}</div>
                    </div>
                    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300">
                      <ArrowRight size={24} />
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{ui.history_v2}</p>
                      <div className="text-4xl font-black text-slate-800 dark:text-white">{comparisonResult.v2.risk_score}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "flex items-center gap-3 px-6 py-3 rounded-2xl font-bold text-sm",
                      comparisonResult.riskTrend === "decreased" ? "bg-green-100 text-green-700" :
                      comparisonResult.riskTrend === "increased" ? "bg-red-100 text-red-700" :
                      "bg-slate-100 text-slate-700"
                    )}>
                      {comparisonResult.riskTrend === "decreased" ? <TrendingDown size={24} /> :
                       comparisonResult.riskTrend === "increased" ? <TrendingUp size={24} /> :
                       <Minus size={24} />}
                      {tr[comparisonResult.riskTrend as keyof typeof tr] ?? comparisonResult.riskTrend}
                    </div>
                    <button 
                      onClick={downloadComparisonReport}
                      className="p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
                    >
                      <Download size={24} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                    <h4 className="font-bold text-lg mb-6 flex items-center gap-3 dark:text-white">
                      <FileSearch size={24} className="text-indigo-600" />
                      {ui.history_text_changes}
                    </h4>
                    <div className="h-[500px] overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl font-mono text-xs leading-relaxed whitespace-pre-wrap border border-slate-100 dark:border-slate-800">
                      {comparisonResult.textDiff.map((part, i) => (
                        <span 
                          key={i} 
                          className={cn(
                            part.added ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : 
                            part.removed ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 line-through" : 
                            "dark:text-slate-400"
                          )}
                        >
                          {part.value}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                    <h4 className="font-bold text-lg mb-6 flex items-center gap-3 dark:text-white">
                      <ShieldAlert size={24} className="text-indigo-600" />
                      {ui.history_clause_analysis}
                    </h4>
                    <div className="space-y-4 h-[500px] overflow-y-auto pr-2 scrollbar-thin">
                      {comparisonResult.changedClauses.map((c, i) => (
                        <div 
                          key={i} 
                          className={cn(
                            "p-5 rounded-2xl border transition-all",
                            c.change_type === "new" ? "border-green-200 bg-green-50 dark:border-green-900/30 dark:bg-green-900/10" :
                            c.change_type === "removed" ? "border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-900/10 opacity-60" :
                            "border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50"
                          )}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-bold uppercase tracking-widest text-[10px] text-slate-400">{c.category}</span>
                            <span className={cn(
                              "px-2 py-1 rounded-full font-bold uppercase text-[8px] tracking-widest",
                              c.change_type === "new" ? "bg-green-200 text-green-800" :
                              c.change_type === "removed" ? "bg-red-200 text-red-800" :
                              "bg-slate-200 text-slate-600"
                            )}>
                              {c.change_type}
                            </span>
                          </div>
                          <p className="text-sm dark:text-white font-medium leading-relaxed">{c.explanation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        );
      case "settings":
        return (
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-xl font-bold mb-8 dark:text-white">{ui.settings_title}</h3>
              
              <div className="space-y-8">
                <div className="bg-slate-50 dark:bg-slate-950 rounded-3xl p-6 border border-slate-200 dark:border-slate-800">
                  <h4 className="text-lg font-bold mb-4 dark:text-white">My Saved Contracts</h4>
                  {currentUser ? (
                    savedContracts.length > 0 ? (
                      <ul className="space-y-3">
                        {savedContracts.map((contract) => (
                          <li key={contract.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                            <div className="flex items-center justify-between mb-2 gap-3">
                              <span className="text-sm font-semibold text-slate-900 dark:text-white">Contract #{contract.id}</span>
                              <span className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{new Date(contract.created_at).toLocaleString()}</span>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">{contract.contract_text}</p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-500 dark:text-slate-400">No saved contracts yet. Your analysis will be saved here when you are signed in.</p>
                    )
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">Sign in to store your contracts in PostgreSQL. Guest mode will not save any contract data.</p>
                  )}
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{ui.settings_lang}</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {languages.map(lang => (
                      <button 
                        key={lang}
                        onClick={() => setSelectedLanguage(lang)}
                        className={cn(
                          "px-4 py-3 rounded-xl text-sm font-bold transition-all border",
                          selectedLanguage === lang 
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/20" 
                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-300"
                        )}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{ui.settings_role}</label>
                  <div className="grid grid-cols-2 gap-3">
                    {["Tenant", "Employee", "Freelancer", "Vendor"].map(r => (
                      <button 
                        key={r}
                        onClick={() => setRole(r as Role)}
                        className={cn(
                          "px-4 py-4 rounded-xl text-sm font-bold transition-all border flex items-center justify-between",
                          role === r 
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/20" 
                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-300"
                        )}
                      >
                        {r}
                        {role === r && <CheckCircle2 size={16} />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-100 dark:border-slate-800 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold dark:text-white">{ui.settings_voice_title}</h4>
                      <p className="text-xs text-slate-500">{ui.settings_voice_desc}</p>
                    </div>
                    <button 
                      onClick={() => setIsVoiceModeEnabled(!isVoiceModeEnabled)}
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                        isVoiceModeEnabled ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-700"
                      )}
                    >
                      <span className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                        isVoiceModeEnabled ? "translate-x-6" : "translate-x-1"
                      )} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold dark:text-white">{ui.settings_privacy_title}</h4>
                      <p className="text-xs text-slate-500">{ui.settings_privacy_desc}</p>
                    </div>
                    <label htmlFor="privacyToggle" className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer",
                        isPrivacyMode ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"
                      )}>
                      <input
                        id="privacyToggle"
                        type="checkbox"
                        className="sr-only"
                        checked={isPrivacyMode}
                        onChange={() => setIsPrivacyMode(!isPrivacyMode)}
                      />
                      <span className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                        isPrivacyMode ? "translate-x-6" : "translate-x-1"
                      )} />
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold dark:text-white">{ui.settings_adv_title}</h4>
                      <p className="text-xs text-slate-500">{ui.settings_adv_desc}</p>
                    </div>
                    <button 
                      onClick={() => setIsAdvancedTTSEnabled(!isAdvancedTTSEnabled)}
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                        isAdvancedTTSEnabled ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-700"
                      )}
                    >
                      <span className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                        isAdvancedTTSEnabled ? "translate-x-6" : "translate-x-1"
                      )} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const handleCompareVersions = async () => {
    if (selectedVersions.length !== 2) return;
    setIsComparingVersions(true);
    try {
      const response = await fetch("/api/compare-versions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          versionId1: selectedVersions[0],
          versionId2: selectedVersions[1]
        }),
      });
      const data = await response.json();
      setComparisonResult(data);
    } catch (error) {
      console.error("Failed to compare versions:", error);
    } finally {
      setIsComparingVersions(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const [filterRisk, setFilterRisk] = useState<string>("All");
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [showCriticalOnly, setShowCriticalOnly] = useState(false);

  const categories = ["Termination", "Payment", "Liability", "IP Ownership", "Non-compete", "Confidentiality", "Indemnification", "Dispute Resolution", "Force Majeure", "Other"];

  const filteredClauses = analysis?.clauses.filter(clause => {
    const riskMatch = filterRisk === "All" || clause.risk_level === filterRisk;
    const categoryMatch = filterCategory === "All" || clause.category === filterCategory;
    const criticalMatch = !showCriticalOnly || clause.risk_level === "High";
    return riskMatch && categoryMatch && criticalMatch;
  }) || [];

  const handleFileUpload = async (uploadedFile: File) => {
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setActiveTab("analysis");
    setIsAnalyzing(true);
    setOcrProgress(0);
    setContractText("Extracting document content...");

    // Create preview
    if (uploadedFile.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target?.result as string);
      reader.readAsDataURL(uploadedFile);
    } else {
      setFilePreview(null);
    }

    let text = "";
    try {
      if (uploadedFile.type === "application/pdf") {
        const arrayBuffer = await uploadedFile.arrayBuffer();
        let standardFontDataUrl = new URL(
          "pdfjs-dist/standard_fonts/",
          import.meta.url
        ).href;
        if (!standardFontDataUrl.endsWith("/")) standardFontDataUrl += "/";
        const pdf = await pdfjsLib.getDocument({
          data: arrayBuffer,
          // Avoid PDF.js warning and improve font extraction fidelity.
          standardFontDataUrl,
        }).promise;
        const pagePromises = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          pagePromises.push(
            pdf.getPage(i).then(page => 
              page.getTextContent().then(content => 
                content.items.map((item: any) => item.str).join(" ")
              )
            )
          );
        }
        const pagesText = await Promise.all(pagePromises);
        text = pagesText.join("\n");
      } else if (uploadedFile.type.startsWith("image/")) {
        const tesseractLang = tesseractLangMap[selectedLanguage] || "eng";
        const { data: { text: ocrText } } = await Tesseract.recognize(uploadedFile, tesseractLang, {
          logger: m => {
            if (m.status === 'recognizing text') setOcrProgress(m.progress);
          }
        });
        text = ocrText;
      } else {
        text = await uploadedFile.text();
      }

      setContractText(text);

      const trimmed = (text || "").trim();
      if (trimmed.length < 20) {
        throw new Error("No readable text found in this document. Try a text-based PDF or use a clearer image scan.");
      }
      
      // Run AI Analysis
      let result: AnalysisResult;
      if (isPrivacyMode) {
        result = await localAnalyzeContract(text, role, selectedLanguage);
      } else {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 30000);
        try {
          const resp = await fetch(`${BACKEND_URL}/api/analyze`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
              contract_text: text,
              role,
              language: selectedLanguage,
              privacy_mode: false,
            }),
          });
          if (!resp.ok) {
            const errBody = await resp.json().catch(() => ({}));
            throw new Error(errBody?.error || `Analysis failed (${resp.status})`);
          }
          result = await resp.json();
        } catch (e) {
          // Cloud analysis can fail/timeout; always fall back to local analysis
          // so the user still gets results.
          console.warn("Cloud analysis failed; falling back to local analysis.", e);
          result = await localAnalyzeContract(text, role, selectedLanguage);
        } finally {
          window.clearTimeout(timeout);
        }
      }
        
      setAnalysis(result);
      if (currentUser) {
        await saveContractToDb(result, text);
      }
      const chatLangObj = chatTrFor(selectedLanguage);
      const welcomeMsg = chatLangObj.welcome.replace("{lang}", selectedLanguage).replace("{role}", role);
      setChatMessages([{ role: "model", text: welcomeMsg }]);
      
      // Save as a version
      await saveVersion(result, text, uploadedFile.name);
    } catch (error: any) {
      console.error("Analysis failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Document analysis failed. Please try again or check your API keys.";
      setContractText(text || `[Extraction Error]: ${errorMessage}`);
      
      const getRoleBasedRisk = (clauseText: string, currentRole: Role) => {
        const t = clauseText.toLowerCase();
        if (currentRole === "Employee") return { impact: "Limits employee rights." };
        if (currentRole === "Tenant") return { impact: "Unfavorable terms for tenant." };
        if (currentRole === "Freelancer") return { impact: "Could delay or reduce payments." };
        return { impact: "Moderate impact on your rights." };
      };

      const fallbackLangData = fallbackData[selectedLanguage] || fallbackData["English"];
      
      const mockClauses: Clause[] = fallbackLangData.clauses.map(c => ({
        ...c,
        role_impact: getRoleBasedRisk(c.clause_text, role).impact as string
      })) as Clause[];

      let score = 0;
      mockClauses.forEach(c => {
        if (c.risk_level === "Safe") score += 5;
        if (c.risk_level === "Moderate") score += 15;
        if (c.risk_level === "High") score += 30;
      });
      
      const risk_score = Math.min(100, score);
      const risk_level = risk_score <= 30 ? "Safe" : risk_score <= 60 ? "Moderate" : "High";

      const fallbackResult: AnalysisResult = {
        risk_score,
        risk_level,
        summary: fallbackLangData.summary,
        clauses: mockClauses
      };

      setAnalysis(fallbackResult);
      
      // Save as a version even in fallback
      await saveVersion(fallbackResult, text, uploadedFile.name);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const uploadedFile = e.dataTransfer.files?.[0];
    if (uploadedFile) handleFileUpload(uploadedFile);
  };

  const startRecording = (onResult: (text: string) => void) => {
    if (!recognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    
    recognition.lang = languageMap[selectedLanguage] || 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    
    setIsRecording(true);
    recognition.start();
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
      setIsRecording(false);
    };
    
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsRecording(false);
    };
    
    recognition.onend = () => {
      setIsRecording(false);
    };
  };

  const stopRecording = () => {
    if (recognition) {
      recognition.stop();
      setIsRecording(false);
    }
  };

  const handleVoiceChatInput = () => {
    if (isRecording) {
      stopRecording();
      return;
    }

    startRecording((transcript) => {
      if (!transcript.trim()) return;
      setChatInput(transcript);
      sendMessage(transcript);
    });
  };

  const sendMessage = async (message: string) => {
    if (!message.trim() || isChatLoading) return;

    const userMsg = message;
    setChatInput("");
    const nextMessages = [...chatMessages, { role: "user", text: userMsg }];
    setChatMessages(nextMessages);
    setIsChatLoading(true);

    try {
      if (isPrivacyMode) {
        const chatLangObj = chatTrFor(selectedLanguage);
        let fallbackResponse = `${chatLangObj.offline_intro} ${analysis?.summary || "Contract details are processed locally. I can answer general questions based on the contract summary."}`;

        const lowerMsg = userMsg.toLowerCase();
        if (lowerMsg.includes("notice")) {
          fallbackResponse += ` ${chatLangObj.offline_notice}`;
        } else if (lowerMsg.includes("termination") || lowerMsg.includes("leave") || lowerMsg.includes("quit")) {
          fallbackResponse += ` ${chatLangObj.offline_term}`;
        } else if (lowerMsg.includes("risk") || lowerMsg.includes("risky")) {
          fallbackResponse += ` ${chatLangObj.offline_risk}`;
        } else {
          fallbackResponse += ` ${chatLangObj.offline_default}`;
        }

        setTimeout(() => {
          setChatMessages(prev => [...prev, { role: "model", text: fallbackResponse }]);
          setIsChatLoading(false);
        }, 600);
        return;
      }

      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_history: nextMessages,
          contract_text: contractText,
          role,
          language: selectedLanguage,
          privacy_mode: isPrivacyMode,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody?.error || `Chat failed (${response.status})`);
      }

      const data = await response.json();
      const botText = (data?.text || data?.message || "I'm sorry, I couldn't generate a response.").toString();
      setChatMessages(prev => [...prev, { role: "model", text: botText }]);
    } catch (error) {
      console.error("Chat Error:", error);
      setChatMessages(prev => [...prev, { role: "model", text: tr.error_retry ?? "I'm sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleChat = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(chatInput);
  };

  const handleCompare = async () => {
    if (verbalPromises.length === 0) return;
    setIsComparing(true);
    try {
      // Use local compare logic when privacy mode is enabled, otherwise try AI when available.
      let result;
      if (isPrivacyMode || !GEMINI_API_KEY) {
        const response = await fetch("/api/compare-promises", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contractText, promises: verbalPromises }),
        });
        result = await response.json();
      } else {
        result = await comparePromises(contractText, verbalPromises.join("\n"));
      }
      setPromiseComparison(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsComparing(false);
    }
  };

  const downloadReport = () => {
    if (!analysis) return;
    exportAnalysisPDF(analysis, role, selectedLanguage, file?.name);
  };

  const handlePlainLanguage = async (text: string) => {
    setIsChatLoading(true);
    try {
      let simplified = "";
      if (isPrivacyMode) {
        simplified = text;
      } else {
        try {
          const resp = await fetch("/api/explain", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, language: selectedLanguage }),
          });
          if (resp.ok) {
            const data = await resp.json();
            simplified = (data?.explanation ?? "").toString();
          } else {
            const errBody = await resp.json().catch(() => ({}));
            throw new Error(errBody?.error || `Explain failed (${resp.status})`);
          }
        } catch (e) {
          console.warn("Explain failed; using fallback explanation.", e);
          simplified = text;
        }
      }

      const responseText = `${tr.simple_explanation ?? "Simplified"} (${selectedLanguage}): ${simplified}`;
      setChatMessages(prev => [...prev, { role: "model", text: responseText }]);
      if (isVoiceModeEnabled) {
        speak(simplified);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsChatLoading(false);
    }
  };

  const downloadComparisonReport = () => {
    if (!comparisonResult) return;
    const report = `NyayRakshak AI - Contract Comparison Report
Generated on: ${new Date().toLocaleString()}

Version 1: ${comparisonResult.v1.version_id} (Score: ${comparisonResult.v1.risk_score}, Level: ${comparisonResult.v1.risk_level})
Version 2: ${comparisonResult.v2.version_id} (Score: ${comparisonResult.v2.risk_score}, Level: ${comparisonResult.v2.risk_level})

Risk Trend: ${comparisonResult.riskTrend.toUpperCase()} (Difference: ${comparisonResult.riskDiff})

CLAUSE CHANGES:
${comparisonResult.changedClauses.map(c => `
[${c.change_type.toUpperCase()}] ${c.category}
Clause: ${c.clause_text}
Explanation: ${c.explanation}
`).join('\n')}

TEXT DIFFERENCES:
${comparisonResult.textDiff.map(d => `${d.added ? '[+] ' : d.removed ? '[-] ' : '    '}${d.value}`).join('')}
`;
    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `comparison_report_${comparisonResult.v1.version_id}_vs_${comparisonResult.v2.version_id}.txt`;
    a.click();
  };

  const getRiskColor = (score: number) => {
    if (score <= 30) return "text-green-500 bg-green-50 border-green-200";
    if (score <= 60) return "text-yellow-500 bg-yellow-50 border-yellow-200";
    return "text-red-500 bg-red-50 border-red-200";
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case "Low": return "text-green-600 bg-green-100";
      case "Medium": return "text-yellow-600 bg-yellow-100";
      case "High": return "text-red-600 bg-red-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const stopVoice = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio.src = "";
      currentAudio = null;
    }
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsSpeechLoading(false);
  };

  const speakBrowserFallback = (text: string) => {
    stopVoice();
    const targetLang = languageMap[selectedLanguage] || "en-IN";
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = targetLang;

    const voices = window.speechSynthesis.getVoices();
    let voice = voices.find(v => v.lang === targetLang);
    if (!voice) voice = voices.find(v => v.lang.startsWith(targetLang.split("-")[0]));
    if (voice) utterance.voice = voice;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsSpeechLoading(false);
    };
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (e) => {
      console.error("SpeechSynthesis Error:", e);
      setIsSpeaking(false);
      setIsSpeechLoading(false);
    };
    window.speechSynthesis.speak(utterance);
  };

  const speak = async (text: string) => {
    stopVoice();

    const targetLang = languageMap[selectedLanguage] || "en-IN";
    if (isPrivacyMode) {
      speakBrowserFallback(text);
      return;
    }

    setIsSpeaking(true);
    setIsSpeechLoading(true);
    try {
      const resp = await fetch(`${BACKEND_URL}/api/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language_code: targetLang }),
      });
      if (!resp.ok) {
        const errText = await resp.text().catch(() => "");
        let errMsg = `TTS failed (${resp.status})`;
        try {
          const errJson = JSON.parse(errText);
          if (typeof errJson?.error === "string") errMsg = errJson.error;
        } catch {
          if (errText) errMsg = errText;
        }
        throw new Error(errMsg);
      }
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      currentAudio = audio;

      audio.onplay = () => {
        setIsSpeechLoading(false);
        setIsSpeaking(true);
      };

      audio.onended = () => {
        URL.revokeObjectURL(url);
        if (currentAudio === audio) currentAudio = null;
        setIsSpeaking(false);
        setIsSpeechLoading(false);
      };

      audio.onerror = () => {
        URL.revokeObjectURL(url);
        if (currentAudio === audio) currentAudio = null;
        setIsSpeaking(false);
        setIsSpeechLoading(false);
      };

      await audio.play();
    } catch (e) {
      console.warn("Sarvam TTS failed; falling back to browser TTS.", e);
      setIsSpeaking(false);
      setIsSpeechLoading(false);
      speakBrowserFallback(text);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(trFor(selectedLanguage)?.copy ?? "Copied to clipboard!");
  };

  // Show AuthScreen if not logged in and not guest
  if (!currentUser && !isGuest) {
    return <AuthScreen onLogin={handleLogin} onGuest={handleGuest} />;
  }

  return (
    <div className={cn(
      "min-h-screen bg-[#F9FAFB] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300",
      isDarkMode && "dark"
    )}>
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        selectedLanguage={selectedLanguage}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 px-4 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500"
            >
              <Menu size={24} />
            </button>
            <h2 className="font-bold text-lg text-slate-800 dark:text-white capitalize">
              {activeTab.replace("_", " ")}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{trFor(selectedLanguage)?.role_label || "Role"}:</span>
              <select 
                value={role} 
                onChange={(e) => setRole(e.target.value as Role)}
                className="bg-transparent dark:bg-slate-800 dark:text-white text-sm font-semibold focus:outline-none"
              >
                <option value="Tenant">Tenant</option>
                <option value="Employee">Employee</option>
                <option value="Freelancer">Freelancer</option>
                <option value="Vendor">Vendor</option>
              </select>
            </div>
            
            <div className="hidden sm:flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{trFor(selectedLanguage)?.lang_label || "Lang"}:</span>
              <select 
                value={selectedLanguage} 
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="bg-transparent dark:bg-slate-800 dark:text-white text-sm font-semibold focus:outline-none"
              >
                {languages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
              </select>
            </div>

            {analysis && (
              <button 
                onClick={downloadReport}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
              >
                <Download size={16} />
                <span className="hidden md:inline">{trFor(selectedLanguage)?.export_report || "Export"}</span>
              </button>
            )}
            {/* User Info & Logout */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5">
              <User size={14} className="text-slate-400" />
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 hidden sm:inline max-w-[120px] truncate">
                {isGuest ? (trFor(selectedLanguage)?.guest || "Guest") : currentUser?.email || "User"}
              </span>
              <button
                onClick={handleLogout}
                className="p-1 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-slate-400 hover:text-red-500 transition-all"
                title="Sign Out"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto relative">
          {isPrivacyMode && (
            <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-900 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200">
              <strong>🔒 Privacy Mode ON</strong> — Your contract is processed locally. No contract data is sent to external AI services.
              <div className="mt-1 text-xs text-emerald-800 dark:text-emerald-300">
                ⚠️ Local analysis may be less detailed than AI-based analysis.
              </div>
            </div>
          )}
          <AnimatePresence>
            {isSpeaking && (
               <motion.div 
                 initial={{ opacity: 0, y: 20 }} 
                 animate={{ opacity: 1, y: 0 }} 
                 exit={{ opacity: 0, y: 20 }} 
                 className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white px-4 py-3 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center gap-3 text-sm font-bold backdrop-blur-md bg-opacity-90 border border-indigo-400/30"
               >
                 <Volume2 size={16} className="animate-pulse" />
                 <span>
                   {tr.speaking_in ?? "Speaking in"} {selectedLanguage}
                   {isAdvancedTTSEnabled && <span className="text-[10px] bg-indigo-500 px-2 py-0.5 rounded-full ml-1 uppercase tracking-wider">{tr.advanced ?? "Advanced"}</span>}
                 </span>
                 <button
                   type="button"
                   onClick={stopVoice}
                   className="ml-2 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/20 transition"
                 >
                   ⛔ Stop
                 </button>
               </motion.div>
            )}
          </AnimatePresence>
          
          <div className="max-w-6xl mx-auto">
            {!recognition && (
              <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 p-3 rounded-xl text-center text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase tracking-widest">
                {tr.voice_not_supported ?? "Voice recognition not supported in this browser. Please use text input."}
              </div>
            )}
            
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderTabContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}

