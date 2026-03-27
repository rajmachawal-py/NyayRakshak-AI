import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');
const before = code;
let changed = 0;

function rep(oldStr, newStr, name) {
  if (code.includes(oldStr)) {
    code = code.split(oldStr).join(newStr);
    changed++;
    console.log(`✓ ${name}`);
  } else {
    console.log(`✗ NOT FOUND: ${name}`);
  }
}

// ─── 1. Fix Sidebar getLabel to be strict (no English fallback) ─────────────
rep(
  `const getLabel = (keyA: string, keyB: string) => {
    return translations[selectedLanguage]?.[keyA] || 
           translations[selectedLanguage]?.[keyB] || 
           translations["English"][keyA] || keyA;
  };

  const navItems = [
    { id: "upload", label: getLabel("upload_contract", "upload"), icon: Upload },
    { id: "analysis", label: getLabel("analysis_tab", "analyze"), icon: FileSearch },
    { id: "chat", label: getLabel("chatbot_tab", "chat"), icon: MessageSquare },
    { id: "promises", label: getLabel("verbal_promises_tab", "promises"), icon: Mic },
    { id: "history", label: getLabel("history_tab", "history"), icon: History },
    { id: "settings", label: getLabel("settings_tab", "settings"), icon: Shield },
  ];`,
  `const t = (key: string) => translations[selectedLanguage]?.[key] || translations["English"]?.[key] || key;

  const navItems = [
    { id: "upload", label: t("upload_contract"), icon: Upload },
    { id: "analysis", label: t("analysis_tab"), icon: FileSearch },
    { id: "chat", label: t("chatbot_tab"), icon: MessageSquare },
    { id: "promises", label: t("verbal_promises_tab"), icon: Mic },
    { id: "history", label: t("history_tab"), icon: History },
    { id: "settings", label: t("settings_tab"), icon: Shield },
  ];`,
  'Sidebar getLabel → strict t()'
);

// ─── 2. Remove || fallback from Justice Guardian ─────────────────────────────
rep(
  `{translations[selectedLanguage]?.justice_guardian || "Justice Guardian"}`,
  `{translations[selectedLanguage]?.justice_guardian ?? "Justice Guardian"}`,
  'Justice Guardian fallback neutralized'
);

// ─── 3. Fix uiTranslations fallback in renderTabContent ──────────────────────
rep(
  `const ui = uiTranslations[selectedLanguage] || uiTranslations["English"];`,
  `const ui = uiTranslations[selectedLanguage] ?? uiTranslations["English"];
    const tr = translations[selectedLanguage] ?? translations["English"];`,
  'ui + tr definitions'
);

// ─── 4. Fix risk filter dropdown - hardcoded English options ─────────────────
rep(
  `<option value="All">All Risks</option>
                    <option value="Safe">Safe</option>
                    <option value="Moderate">Moderate</option>
                    <option value="High">High</option>`,
  `<option value="All">{tr.all_risks}</option>
                    <option value="Safe">{tr.safe}</option>
                    <option value="Moderate">{tr.moderate}</option>
                    <option value="High">{tr.high}</option>`,
  'Risk filter dropdown options'
);

// ─── 5. Clause card: "Plain Language Explanation" ────────────────────────────
rep(
  `<h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Plain Language Explanation</h4>`,
  `<h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{tr.explain_plain}</h4>`,
  'Plain Language Explanation'
);

// ─── 6. Clause card: "Suggested Improvement" ──────────────────────────────────
rep(
  `<h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Suggested Improvement</h4>`,
  `<h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{tr.suggestion}</h4>`,
  'Suggested Improvement'
);

// ─── 7. Clause card: "{clause.risk_level} Risk" ────────────────────────────────
rep(
  `{clause.risk_level} Risk`,
  `{tr[clause.risk_level?.toLowerCase() as keyof typeof tr] || clause.risk_level}`,
  'Clause risk level badge'
);

// ─── 8. Clause card: "{clause.category} Clause" ──────────────────────────────
rep(
  `<p className="text-sm font-bold dark:text-white">{clause.category} Clause</p>`,
  `<p className="text-sm font-bold dark:text-white">{clause.category}</p>`,
  'Clause category title (removed " Clause" suffix)'
);

// ─── 9. Loading state: hardcoded English "Analyzing Your Contract..." ──────────
rep(
  `<h3 className="text-2xl font-bold mb-2 dark:text-white">Analyzing Your Contract...</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md">Our AI is scanning clauses and assessing risks for a {role}. This usually takes 10-20 seconds.</p>`,
  `<h3 className="text-2xl font-bold mb-2 dark:text-white">{tr.analyzing ?? "Analyzing..."}</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md">{tr.analyzing_desc ?? \`Our AI is scanning clauses and assessing risks. This usually takes 10-20 seconds.\`}</p>`,
  'Analyzing loading message'
);

// ─── 10. Loading: "Processing Text" label ─────────────────────────────────────
rep(
  `<span>Processing Text</span>`,
  `<span>{tr.processing ?? "Processing..."}</span>`,
  'Processing Text label'
);

// ─── 11. No analysis yet state ───────────────────────────────────────────────
rep(
  `<h3 className="text-xl font-bold mb-2">No Analysis Yet</h3>
              <p className="max-w-xs mx-auto text-sm">Upload a contract in the Upload tab to see the AI analysis here.</p>
              <button 
                onClick={() => setActiveTab("upload")}
                className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
              >
                Go to Upload
              </button>`,
  `<h3 className="text-xl font-bold mb-2">{tr.no_file ?? "No Analysis Yet"}</h3>
              <p className="max-w-xs mx-auto text-sm">{tr.upload_cta ?? "Upload a contract in the Upload tab to see the AI analysis here."}</p>
              <button 
                onClick={() => setActiveTab("upload")}
                className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
              >
                {tr.upload_contract ?? "Go to Upload"}
              </button>`,
  'No analysis yet empty state'
);

// ─── 12. Drop zone "Drop your contract here" ─────────────────────────────────
rep(
  `{translations[selectedLanguage]?.drop_file || "Drop your contract here"}`,
  `{tr.drop_file ?? "Drop your contract here"}`,
  'Drop file label'
);

// ─── 13. Risk Trend "Risk {decreased/increased/stable}" ──────────────────────
rep(
  `Risk {comparisonResult.riskTrend}`,
  `{tr[comparisonResult.riskTrend as keyof typeof tr] ?? comparisonResult.riskTrend}`,
  'Risk trend label'
);

// ─── 14. Voice supported warning ─────────────────────────────────────────────
rep(
  `Voice recognition not supported in this browser. Please use text input.`,
  `{tr.voice_not_supported ?? "Voice recognition not supported in this browser. Please use text input."}`,
  'Voice not supported warning'
);

// ─── 15. Speaking indicator "Speaking in {selectedLanguage}" ─────────────────
rep(
  `Speaking in {selectedLanguage} {isAdvancedTTSEnabled && <span className="text-[10px] bg-indigo-500 px-2 py-0.5 rounded-full ml-1 uppercase tracking-wider">Advanced</span>}`,
  `{tr.speaking_in ?? "Speaking in"} {selectedLanguage} {isAdvancedTTSEnabled && <span className="text-[10px] bg-indigo-500 px-2 py-0.5 rounded-full ml-1 uppercase tracking-wider">{tr.advanced ?? "Advanced"}</span>}`,
  'Speaking indicator'
);

// ─── 16. Fix Simplified chat response prefix ──────────────────────────────────
rep(
  "const responseText = `Simplified (${selectedLanguage}): ${simplified}`;",
  "const responseText = `${tr.simple_explanation ?? 'Simplified'} (${selectedLanguage}): ${simplified}`;",
  'Simplified chat prefix'
);

// ─── 17. "Copied to clipboard!" alert ─────────────────────────────────────────
rep(
  `alert("Copied to clipboard!");`,
  `alert(translations[selectedLanguage]?.copy ?? "Copied to clipboard!");`,
  'Copied to clipboard alert'
);

// ─── 18. Error toast messages ─────────────────────────────────────────────────
rep(
  `text: "I'm sorry, I couldn't generate a response." }`,
  `text: tr.error_response ?? "I'm sorry, I couldn't generate a response." }`,
  'Chat error message 1'
);
rep(
  `text: "I'm sorry, I encountered an error. Please try again."`,
  `text: tr.error_retry ?? "I'm sorry, I encountered an error. Please try again."`,
  'Chat error message 2'
);

// ─── 19. Enforce AI to respond ONLY in selected language (stronger instruction) ─
rep(
  `8. IMPORTANT: Respond in \${selectedLanguage}. Use simple, non-legal terms.`,
  `8. CRITICAL: You MUST respond ONLY in \${selectedLanguage}. Every word of your response must be in \${selectedLanguage}. Never use English if the language is not English. Use simple, plain language.`,
  'AI language instruction strengthened'
);

// ─── 20. selectedLanguage state — persist from localStorage ──────────────────
rep(
  `const [selectedLanguage, setSelectedLanguage] = useState<string>("English");`,
  `const [selectedLanguage, setSelectedLanguage] = useState<string>(() => localStorage.getItem("nr_language") || "English");`,
  'Language state persistent from localStorage'
);

// ─── SUMMARY ─────────────────────────────────────────────────────────────────
const saved = code !== before;
if (saved) {
  fs.writeFileSync('src/App.tsx', code);
  console.log(`\n✅ Done! ${changed} replacements made. File saved.`);
} else {
  console.log('\n⚠️ No changes saved — code is identical to before.');
}
