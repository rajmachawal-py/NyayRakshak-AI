import fs from 'fs';

let content = fs.readFileSync('src/translations.ts', 'utf8');

// New keys to add to every language
const newKeys = {
  English: {
    analyzing: "Analyzing Your Contract...",
    analyzing_desc: "Our AI is scanning clauses and assessing risks. This usually takes 10-20 seconds.",
    processing: "Processing...",
    speaking_in: "Speaking in",
    advanced: "Advanced",
    error_response: "I'm sorry, I couldn't generate a response.",
    error_retry: "I'm sorry, I encountered an error. Please try again.",
    no_file: "No Analysis Yet",
    upload_cta: "Upload a contract in the Upload tab to see the AI analysis here."
  },
  Hindi: {
    analyzing: "आपके अनुबंध का विश्लेषण हो रहा है...",
    analyzing_desc: "हमारा AI धाराओं को स्कैन कर जोखिमों का मूल्यांकन कर रहा है। इसमें 10-20 सेकंड लगते हैं।",
    processing: "प्रक्रिया हो रही है...",
    speaking_in: "बोल रहा है",
    advanced: "उन्नत",
    error_response: "क्षमा करें, प्रतिक्रिया उत्पन्न नहीं हो सकी।",
    error_retry: "क्षमा करें, एक त्रुटि हुई। कृपया पुनः प्रयास करें।",
    no_file: "अभी तक कोई विश्लेषण नहीं",
    upload_cta: "AI विश्लेषण देखने के लिए अपलोड टैब में अनुबंध अपलोड करें।"
  },
  Marathi: {
    analyzing: "तुमच्या कराराचे विश्लेषण होत आहे...",
    analyzing_desc: "आमचे AI कलमे स्कॅन करून धोके मूल्यांकन करत आहे। यास १०-२० सेकंद लागतात।",
    processing: "प्रक्रिया होत आहे...",
    speaking_in: "बोलत आहे",
    advanced: "प्रगत",
    error_response: "माफ करा, प्रतिसाद निर्माण करता आला नाही.",
    error_retry: "माफ करा, त्रुटी आली. कृपया पुन्हा प्रयत्न करा.",
    no_file: "अद्याप विश्लेषण नाही",
    upload_cta: "AI विश्लेषण पाहण्यासाठी अपलोड टॅबमध्ये करार अपलोड करा."
  },
  Tamil: {
    analyzing: "உங்கள் ஒப்பந்தம் பகுப்பாய்வு செய்யப்படுகிறது...",
    analyzing_desc: "எங்கள் AI பிரிவுகளை ஸ்கேன் செய்து ஆபத்துகளை மதிப்பிடுகிறது. இது 10-20 வினாடிகள் ஆகலாம்.",
    processing: "செயல்படுத்துகிறது...",
    speaking_in: "பேசுகிறது",
    advanced: "மேம்பட்ட",
    error_response: "மன்னிக்கவும், பதிலை உருவாக்க முடியவில்லை.",
    error_retry: "மன்னிக்கவும், பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.",
    no_file: "இன்னும் பகுப்பாய்வு இல்லை",
    upload_cta: "AI பகுப்பாய்வைக் காண அப்லோட் தாவலில் ஒப்பந்தத்தைப் பதிவேற்றவும்."
  },
  Telugu: {
    analyzing: "మీ ఒప్పందం విశ్లేషిస్తోంది...",
    analyzing_desc: "మా AI నిబంధనలు స్కాన్ చేసి ప్రమాదాలు మదింపు చేస్తోంది. ఇది 10-20 సెకన్లు పట్టవచ్చు.",
    processing: "ప్రాసెస్ అవుతోంది...",
    speaking_in: "మాట్లాడుతోంది",
    advanced: "అధునాతన",
    error_response: "క్షమించండి, ప్రతిస్పందన సృష్టించడం సాధ్యపడలేదు.",
    error_retry: "క్షమించండి, లోపం ఏర్పడింది. దయచేసి మళ్ళీ ప్రయత్నించండి.",
    no_file: "ఇంకా విశ్లేషణ లేదు",
    upload_cta: "AI విశ్లేషణ చూడటానికి అప్‌లోడ్ ట్యాబ్‌లో ఒప్పందాన్ని అప్‌లోడ్ చేయండి."
  },
  Bengali: {
    analyzing: "আপনার চুক্তি বিশ্লেষণ হচ্ছে...",
    analyzing_desc: "আমাদের AI ধারাগুলি স্ক্যান করে ঝুঁকি মূল্যায়ন করছে। এটি ১০-২০ সেকেন্ড সময় নেয়।",
    processing: "প্রক্রিয়া হচ্ছে...",
    speaking_in: "বলছে",
    advanced: "উন্নত",
    error_response: "দুঃখিত, প্রতিক্রিয়া তৈরি করা সম্ভব হয়নি।",
    error_retry: "দুঃখিত, একটি ত্রুটি হয়েছে। আবার চেষ্টা করুন।",
    no_file: "এখনো কোনো বিশ্লেষণ নেই",
    upload_cta: "AI বিশ্লেষণ দেখতে আপলোড ট্যাবে চুক্তি আপলোড করুন।"
  },
  Gujarati: {
    analyzing: "તમારા કરારનું વિશ્લેષણ થઈ રહ્યું છે...",
    analyzing_desc: "અમારું AI કલમો સ્કૅન કરીને જોખમો મૂલ્યાંકન કરી રહ્યું છે. આ ૧૦-૨૦ સેકન્ડ લઈ શકે છે.",
    processing: "પ્રક્રિયા થઈ રહી છે...",
    speaking_in: "બોલી રહ્યું છે",
    advanced: "અદ્યતન",
    error_response: "માફ કરો, જવાબ ઉત્પન્ન કરી શકાયો નહીં.",
    error_retry: "માફ કરો, ભૂલ આવી. કૃપા કરીને ફરી પ્રયત્ન કરો.",
    no_file: "હજી કોઈ વિશ્લેષણ નહીં",
    upload_cta: "AI વિશ્લેષણ જોવા અપલોડ ટૅબમાં કરાર અપલોડ કરો."
  },
  Kannada: {
    analyzing: "ನಿಮ್ಮ ಒಪ್ಪಂದ ವಿಶ್ಲೇಷಣೆ ಆಗುತ್ತಿದೆ...",
    analyzing_desc: "ನಮ್ಮ AI ಷರತ್ತುಗಳನ್ನು ಸ್ಕ್ಯಾನ್ ಮಾಡಿ ಅಪಾಯಗಳನ್ನು ಮೌಲ್ಯಮಾಪನ ಮಾಡುತ್ತಿದೆ. ಇದಕ್ಕೆ 10-20 ಸೆಕೆಂಡ್ ಬೇಕಾಗುತ್ತದೆ.",
    processing: "ಪ್ರಕ್ರಿಯೆ ಆಗುತ್ತಿದೆ...",
    speaking_in: "ಮಾತಾಡುತ್ತಿದೆ",
    advanced: "ಸುಧಾರಿತ",
    error_response: "ಕ್ಷಮಿಸಿ, ಪ್ರತಿಕ್ರಿಯೆ ರಚಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.",
    error_retry: "ಕ್ಷಮಿಸಿ, ದೋಷ ಸಂಭವಿಸಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    no_file: "ಇನ್ನೂ ವಿಶ್ಲೇಷಣೆ ಇಲ್ಲ",
    upload_cta: "AI ವಿಶ್ಲೇಷಣೆ ನೋಡಲು ಅಪ್‌ಲೋಡ್ ಟ್ಯಾಬ್‌ನಲ್ಲಿ ಒಪ್ಪಂದ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ."
  }
};

// For each language, find the last key in that language's block and append new keys before the closing }
for (const [lang, keys] of Object.entries(newKeys)) {
  const newEntries = Object.entries(keys)
    .map(([k, v]) => `    "${k}": "${v}"`)
    .join(',\n');
  
  // Find the section for this language - look for the sign_out key which we know exists as the last key
  const signOutPattern = new RegExp(
    `("${lang}"[\\s\\S]*?"sign_out":[\\s\\S]*?")([^"]*")([\\s\\S]*?\\n)(\\s+\\})`
  );
  
  const match = content.match(signOutPattern);
  if (match) {
    // Insert after sign_out line
    content = content.replace(
      signOutPattern,
      `$1$2$3${newEntries}\n$4`
    );
    console.log(`✓ Added ${Object.keys(keys).length} keys to ${lang}`);
  } else {
    // Try simpler approach: find the language section and its closing brace
    const langIdx = content.indexOf(`"${lang}": {`);
    if (langIdx === -1) {
      console.log(`✗ Language section not found: ${lang}`);
      continue;
    }
    
    // Find the next language definition after this one
    const nextLangMatch = content.indexOf(`},\n  "`, langIdx + 10);
    if (nextLangMatch === -1) {
      console.log(`✗ Cannot find section boundary for ${lang}`);
      continue;
    }
    
    // Insert at nextLangMatch
    content = content.substring(0, nextLangMatch) + `,\n${newEntries}\n` + content.substring(nextLangMatch);
    console.log(`✓ Added ${Object.keys(keys).length} keys to ${lang} (fallback method)`);
  }
}

fs.writeFileSync('src/translations.ts', content);
console.log('\n✅ translations.ts updated!');
