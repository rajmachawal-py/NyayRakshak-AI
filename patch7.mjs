import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');
let changed = 0;

// 1. Replace Sidebar hardcoded "Justice Guardian" with translations
const oldJG = `<p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Justice Guardian</p>`;
const newJG = `<p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">{translations[selectedLanguage]?.justice_guardian || "Justice Guardian"}</p>`;
if (code.includes(oldJG)) { code = code.replace(oldJG, newJG); changed++; console.log("1. Justice Guardian replaced."); }
else console.log("1. WARN: Justice Guardian not found");

// 2. Replace Sidebar hardcoded "Light Mode" / "Dark Mode"
const oldLightDark = `{isDarkMode ? "Light Mode" : "Dark Mode"}`;
const newLightDark = `{isDarkMode ? (translations[selectedLanguage]?.light_mode || "Light Mode") : (translations[selectedLanguage]?.dark_mode || "Dark Mode")}`;
if (code.includes(oldLightDark)) { code = code.replace(oldLightDark, newLightDark); changed++; console.log("2. Light/Dark Mode replaced."); }
else console.log("2. WARN: Light/Dark Mode not found");

// 3. Remove getLabel English fallback - make it strict
const oldGetLabel = `const getLabel = (keyA: string, keyB: string) => {
    return translations[selectedLanguage]?.[keyA] || 
           translations[selectedLanguage]?.[keyB] || 
           translations["English"][keyA] || keyA;
  };`;
const newGetLabel = `const t = (key: string) => translations[selectedLanguage]?.[key] || key;`;
if (code.includes(oldGetLabel)) { code = code.replace(oldGetLabel, newGetLabel); changed++; console.log("3. getLabel replaced with strict t()."); }
else console.log("3. WARN: getLabel not found");

// 4. Update navItems to use t()
const oldNavItems = `const navItems = [
    { id: "upload", label: getLabel("upload_contract", "upload"), icon: Upload },
    { id: "analysis", label: getLabel("analysis_tab", "analyze"), icon: FileSearch },
    { id: "chat", label: getLabel("chatbot_tab", "chat"), icon: MessageSquare },
    { id: "promises", label: getLabel("verbal_promises_tab", "promises"), icon: Mic },
    { id: "history", label: getLabel("history_tab", "history"), icon: History },
    { id: "settings", label: getLabel("settings_tab", "settings"), icon: Shield },
  ];`;
const newNavItems = `const navItems = [
    { id: "upload", label: t("upload_contract"), icon: Upload },
    { id: "analysis", label: t("analysis_tab"), icon: FileSearch },
    { id: "chat", label: t("chatbot_tab"), icon: MessageSquare },
    { id: "promises", label: t("verbal_promises_tab"), icon: Mic },
    { id: "history", label: t("history_tab"), icon: History },
    { id: "settings", label: t("settings_tab"), icon: Shield },
  ];`;
if (code.includes(oldNavItems)) { code = code.replace(oldNavItems, newNavItems); changed++; console.log("4. navItems updated to use t()."); }
else console.log("4. WARN: navItems not found");

// 5. Replace header "Role:" label
const oldRoleLabel = `<span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role:</span>`;
const newRoleLabel = `<span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{translations[selectedLanguage]?.role_label || "Role"}:</span>`;
if (code.includes(oldRoleLabel)) { code = code.replace(oldRoleLabel, newRoleLabel); changed++; console.log("5. Role label replaced."); }
else console.log("5. WARN: Role label not found");

// 6. Replace header "Lang:" label
const oldLangLabel = `<span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lang:</span>`;
const newLangLabel = `<span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{translations[selectedLanguage]?.lang_label || "Lang"}:</span>`;
if (code.includes(oldLangLabel)) { code = code.replace(oldLangLabel, newLangLabel); changed++; console.log("6. Lang label replaced."); }
else console.log("6. WARN: Lang label not found");

// 7. Replace header "Guest" / userEmail display
const oldGuest = `{isGuest ? "Guest" : userEmail || "User"}`;
const newGuest = `{isGuest ? (translations[selectedLanguage]?.guest || "Guest") : userEmail || "User"}`;
if (code.includes(oldGuest)) { code = code.replace(oldGuest, newGuest); changed++; console.log("7. Guest label replaced."); }
else console.log("7. WARN: Guest not found");

// 8. Replace Export button text
const oldExport = `<span className="hidden md:inline">Export</span>`;
const newExport = `<span className="hidden md:inline">{translations[selectedLanguage]?.export_report || "Export"}</span>`;
if (code.includes(oldExport)) { code = code.replace(oldExport, newExport); changed++; console.log("8. Export label replaced."); }
else console.log("8. WARN: Export not found");

// 9. Persist language in localStorage on change
const oldLangState = `const [selectedLanguage, setSelectedLanguage] = useState("English");`;
const newLangState = `const [selectedLanguage, setSelectedLanguage] = useState(() => localStorage.getItem("nr_language") || "English");`;
if (code.includes(oldLangState)) { code = code.replace(oldLangState, newLangState); changed++; console.log("9. Language state persistent."); }
else console.log("9. WARN: language state not found");

// 10. Add useEffect to persist language
const langPersistEffect = `  useEffect(() => {
    localStorage.setItem("nr_language", selectedLanguage);
  }, [selectedLanguage]);

`;
// Insert after the dark mode useEffect
const darkModeEffectEnd = '  }, [isDarkMode]);';
if (code.includes(darkModeEffectEnd) && !code.includes('nr_language')) {
  code = code.replace(darkModeEffectEnd, darkModeEffectEnd + '\n\n' + langPersistEffect);
  changed++;
  console.log("10. Language persist useEffect added.");
} else {
  console.log("10. WARN: Could not insert language persist");
}

fs.writeFileSync('src/App.tsx', code);
console.log(`\nDone. ${changed} replacements made.`);
