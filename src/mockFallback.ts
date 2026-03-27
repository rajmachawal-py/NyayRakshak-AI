import { Clause } from "./types";

export const fallbackData: Record<string, { summary: string, clauses: Omit<Clause, "role_impact">[] }> = {
  English: {
    summary: "This is a standard agreement with some moderate risks regarding termination and liability. (Offline Fallback)",
    clauses: [
      {
        clause_text: "The company may terminate this agreement at any time without notice.",
        category: "Termination",
        risk_level: "High",
        risk_reason: "One-sided termination rights.",
        explanation: "This clause allows the company to end the contract immediately without giving you any warning.",
        industry_comparison: "This is unusually one-sided.",
        benchmark_status: "Below Standard",
        suggestion: "Request a mutual 30-day notice period."
      },
      {
        clause_text: "User agrees to indemnify the company for all losses, including those caused by company negligence.",
        category: "Indemnification",
        risk_level: "High",
        risk_reason: "Extremely broad liability shift.",
        explanation: "You are responsible for paying the company's legal costs even if they made a mistake.",
        industry_comparison: "Stricter than industry standard.",
        benchmark_status: "Below Standard",
        suggestion: "Limit responsibility to losses caused solely by your own breach."
      },
      {
        clause_text: "Any disputes must be settled in the company's home jurisdiction.",
        category: "Dispute Resolution",
        risk_level: "Moderate",
        risk_reason: "Inconvenient legal venue.",
        explanation: "If there's a legal fight, you'll have to go to their location.",
        industry_comparison: "Common in large company contracts.",
        benchmark_status: "Standard",
        suggestion: "Request mutual jurisdiction or neutral arbitration."
      }
    ]
  },
  Hindi: {
    summary: "यह समाप्ति और दायित्व के संबंध में कुछ जोखिमों के साथ एक मानक समझौता है। (ऑफ़लाइन फ़ॉलबैक)",
    clauses: [
      {
        clause_text: "कंपनी बिना किसी पूर्व सूचना के किसी भी समय इस समझौते को समाप्त कर सकती है।",
        category: "Termination",
        risk_level: "High",
        risk_reason: "एकतरफा समाप्ति अधिकार।",
        explanation: "यह कंपनी को बिना किसी चेतावनी के अनुबंध समाप्त करने की अनुमति देता है।",
        industry_comparison: "यह बहुत ही एकतरफा है।",
        benchmark_status: "Below Standard",
        suggestion: "30-दिनों की नोटिस अवधि का अनुरोध करें।"
      },
      {
        clause_text: "उपयोगकर्ता कंपनी की लापरवाही से होने वाले नुकसान के लिए भी कंपनी की क्षतिपूर्ति करने के लिए सहमत है।",
        category: "Indemnification",
        risk_level: "High",
        risk_reason: "अत्यधिक व्यापक दायित्व।",
        explanation: "यदि कंपनी गलती करती है, तब भी कानूनी खर्च आपको ही देना होगा।",
        industry_comparison: "उद्योग मानक से अधिक सख्त।",
        benchmark_status: "Below Standard",
        suggestion: "अपनी जिम्मेदारी केवल अपनी गलतियों तक सीमित करें।"
      },
      {
        clause_text: "किसी भी विवाद का निपटारा कंपनी के गृह क्षेत्र में किया जाएगा।",
        category: "Dispute Resolution",
        risk_level: "Moderate",
        risk_reason: "असुविधाजनक कानूनी स्थान।",
        explanation: "यदि कोई कानूनी लड़ाई है, तो आपको उनके स्थान पर जाना होगा।",
        industry_comparison: "बड़ी कंपनियों में आम है।",
        benchmark_status: "Standard",
        suggestion: "पारस्परिक अधिकार क्षेत्र का अनुरोध करें।"
      }
    ]
  },
  Marathi: {
    summary: "हा समाप्ती आणि दायित्वासंदर्भात काही धोक्यांसह एक मानक करार आहे. (ऑफलाइन फॉलबॅक)",
    clauses: [
      {
        clause_text: "कंपनी कोणत्याही पूर्व सूचनेशिवाय हा करार कधीही संपुष्टात आणू शकते.",
        category: "Termination",
        risk_level: "High",
        risk_reason: "एकतर्फी समाप्ती अधिकार.",
        explanation: "हे कंपनीला कोणत्याही चेतावणीशिवाय करार संपुष्टात आणण्याची परवानगी देते.",
        industry_comparison: "हे खूप एकतर्फी आहे.",
        benchmark_status: "Below Standard",
        suggestion: "३०-दिवसांच्या नोटीस कालावधीची विनंती करा."
      },
      {
        clause_text: "कंपनीच्या निष्काळजीपणामुळे झालेल्या नुकसानीसाठी वापरकर्ता कंपनीला भरपाई देण्यास सहमत आहे.",
        category: "Indemnification",
        risk_level: "High",
        risk_reason: "अत्यंत व्यापक दायित्व.",
        explanation: "जर कंपनीने चूक केली, तरीही कायदेशीर खर्च तुम्हालाच द्यावा लागेल.",
        industry_comparison: "उद्योग मानकापेक्षा कठोर.",
        benchmark_status: "Below Standard",
        suggestion: "तुमची जबाबदारी केवळ तुमच्या स्वतःच्या चुकांपुरती मर्यादित करा."
      },
      {
        clause_text: "कोणताही विवाद कंपनीच्या मूळ कार्यक्षेत्रात सोडवला जाईल.",
        category: "Dispute Resolution",
        risk_level: "Moderate",
        risk_reason: "गैरसोयीचे कायदेशीर ठिकाण.",
        explanation: "कोणतीही कायदेशीर लढाई असल्यास, तुम्हाला त्यांच्या ठिकाणी जावे लागेल.",
        industry_comparison: "मोठ्या कंपन्यांमध्ये हे सामान्य आहे.",
        benchmark_status: "Standard",
        suggestion: "परस्पर अधिकाराची विनंती करा."
      }
    ]
  },
  Tamil: {
    summary: "இது முடிவு மற்றும் பொறுப்பு தொடர்பான சில மிதமான அபாயங்களைக் கொண்ட நிலையான ஒப்பந்தமாகும். (ஆஃப்லைன் வீழ்ச்சி)",
    clauses: [
      {
        clause_text: "எந்தவொரு முன்னறிவிப்புமின்றி நிறுவனம் எந்த நேரத்திலும் இந்த ஒப்பந்தத்தை முடித்துக் கொள்ளலாம்.",
        category: "Termination",
        risk_level: "High",
        risk_reason: "ஒருதலைப்பட்சமான முடிவு உரிமைகள்.",
        explanation: "எந்தவொரு முன்னெச்சரிக்கையும் இல்லாமல் ஒப்பந்தத்தை உடனடியாக முடிக்க இது நிறுவனத்தை அனுமதிக்கிறது.",
        industry_comparison: "இது வழக்கத்திற்கு மாறாக ஒருதலைப்பட்சமானது.",
        benchmark_status: "Below Standard",
        suggestion: "30 நாட்கள் அறிவிப்பு காலத்தைக் கோருங்கள்."
      },
      {
        clause_text: "நிறுவனத்தின் கவனக்குறைவால் ஏற்படும் இழப்புகள் உட்பட நிறுவனத்திற்கு ஏற்படும் இழப்பீடு வழங்க பயனர் ஒப்புக்கொள்கிறார்.",
        category: "Indemnification",
        risk_level: "High",
        risk_reason: "மிகவும் பரந்த பொறுப்பு.",
        explanation: "நிறுவனம் தவறு செய்தாலும் சட்ட செலவுகளை நீங்களே ஏற்க வேண்டும்.",
        industry_comparison: "தொழில்துறை தரத்தை விட கடுமையானது.",
        benchmark_status: "Below Standard",
        suggestion: "உங்கள் பொறுப்பை உங்கள் சொந்த தவறுகளுக்கு மட்டும் வரம்பிடவும்."
      },
      {
        clause_text: "எந்தவொரு தகராறும் நிறுவனத்தின் சொந்த அதிகார வரம்பில் தீர்க்கப்படும்.",
        category: "Dispute Resolution",
        risk_level: "Moderate",
        risk_reason: "சிரமமான சட்ட இடம்.",
        explanation: "சட்ட போராட்டம் இருந்தால், நீங்கள் அவர்களின் இடத்திற்குச் செல்ல வேண்டும்.",
        industry_comparison: "பெரிய நிறுவனங்களில் பொதுவானது.",
        benchmark_status: "Standard",
        suggestion: "பரஸ்பர அதிகார வரம்பைக் கோருங்கள்."
      }
    ]
  },
  Telugu: {
    summary: "ఇది ముగింపు మరియు బాధ్యత గురించి కొన్ని మధ్యస్థ ప్రమాదాలతో కూడిన ప్రామాణిక ఒప్పందం. (ఆఫ్‌లైన్ ఫాల్‌బ్యాక్)",
    clauses: [
      {
        clause_text: "ఎలాంటి నోటీసు లేకుండా కంపెనీ ఈ ఒప్పందాన్ని ఎప్పుడైనా ముగించవచ్చు.",
        category: "Termination",
        risk_level: "High",
        risk_reason: "ఏకపక్ష ముగింపు హక్కులు.",
        explanation: "కంపెనీ ఎలాంటి హెచ్చరిక లేకుండా ఒప్పందాన్ని రద్దు చేయడానికి ఇది అనుమతిస్తుంది.",
        industry_comparison: "ఇది అసాధారణంగా ఏకపక్షంగా ఉంది.",
        benchmark_status: "Below Standard",
        suggestion: "30 రోజుల నోటీసు పీరియడ్‌ను కోరండి."
      },
      {
        clause_text: "కంపెనీ నిర్లక్ష్యం వల్ల కలిగే నష్టాలతో సహా అన్ని నష్టాలకు కంపెనీకి పరిహారం చెల్లించడానికి వినియోగదారు అంగీకరిస్తున్నారు.",
        category: "Indemnification",
        risk_level: "High",
        risk_reason: "బాధ్యత వహించడం.",
        explanation: "కంపెనీ తప్పు చేసినా చట్టపరమైన ఖర్చులు మీరే భరించాల్సి వస్తుంది.",
        industry_comparison: "పరిశ్రమ ప్రమాణం కంటే కఠినమైనది.",
        benchmark_status: "Below Standard",
        suggestion: "మీ బాధ్యతను మీ స్వంత తప్పులకు మాత్రమే పరిమితం చేయండి."
      },
      {
        clause_text: "ఏవైనా వివాదాలు కంపెనీ స్వంత అధికార పరిధిలో పరిష్కరించబడతాయి.",
        category: "Dispute Resolution",
        risk_level: "Moderate",
        risk_reason: "అసౌకర్యమైన చట్టపరమైన వేదిక.",
        explanation: "న్యాయపరమైన పోరాటం జరిగితే, మీరు వారి స్థానానికి వెళ్లాలి.",
        industry_comparison: "పెద్ద కంపెనీలలో సాధారణం.",
        benchmark_status: "Standard",
        suggestion: "పరస్పర న్యాయపరిధిని కోరండి."
      }
    ]
  },
  Bengali: {
    summary: "এটি সমাপ্তি এবং দায়বদ্ধতার বিষয়ে কিছু মাঝারি ঝুঁকি সহ একটি আদর্শ চুক্তি। (অফলাইন ফলব্যাক)",
    clauses: [
      {
        clause_text: "কোম্পানি কোনো নোটিশ ছাড়াই যেকোনো সময় এই চুক্তি বাতিল করতে পারে।",
        category: "Termination",
        risk_level: "High",
        risk_reason: "একতরফা সমাপ্তির অধিকার।",
        explanation: "এটি কোম্পানিকে কোনো সতর্কতা ছাড়াই অবিলম্বে চুক্তি বাতিল করার অনুমতি দেয়।",
        industry_comparison: "এটি অস্বাভাবিকভাবে একতরফা।",
        benchmark_status: "Below Standard",
        suggestion: "৩০ দিনের নোটিশ পিরিয়ডের অনুরোধ করুন।"
      },
      {
        clause_text: "ব্যবহারকারী কোম্পানির অবহেলার কারণে সৃষ্ট ক্ষতি সহ সমস্ত ক্ষতির জন্য কোম্পানিকে ক্ষতিপূরণ দিতে সম্মত হন।",
        category: "Indemnification",
        risk_level: "High",
        risk_reason: "অত্যন্ত বিস্তৃত দায়বদ্ধতা।",
        explanation: "কোম্পানি ভুল করলেও আইনি খরচ আপনাকেই বহন করতে হবে।",
        industry_comparison: "শিল্পের মান থেকে কঠোর।",
        benchmark_status: "Below Standard",
        suggestion: "আপনার দায়িত্ব শুধুমাত্র আপনার নিজের ভুলের মধ্যে সীমাবদ্ধ রাখুন।"
      },
      {
        clause_text: "যেকোনো বিবাদ কোম্পানির নিজস্ব অধিক্ষেত্রে নিষ্পত্তি করা হবে।",
        category: "Dispute Resolution",
        risk_level: "Moderate",
        risk_reason: "অসুবিধাজনক আইনি স্থান।",
        explanation: "আইনি লড়াই হলে আপনাকে তাদের স্থানে যেতে হবে।",
        industry_comparison: "বড় কোম্পানির চুক্তিতে সাধারণ।",
        benchmark_status: "Standard",
        suggestion: "পারস্পরিক অধিক্ষেত্রের অনুরোধ করুন।"
      }
    ]
  },
  Gujarati: {
    summary: "આ સમાપ્તિ અને જવાબદારીને લગતા કેટલાક મધ્યમ જોખમો સાથેનો એક પ્રમાણભૂત કરાર છે. (ઑફલાઇન ફૉલબૅક)",
    clauses: [
      {
        clause_text: "કંપની કોઈપણ સૂચના વિના કોઈપણ સમયે આ કરારને સમાપ્ત કરી શકે છે.",
        category: "Termination",
        risk_level: "High",
        risk_reason: "એકતરફી સમાપ્તિ અધિકારો.",
        explanation: "આ કંપનીને કોઈપણ ચેતવણી વિના કરાર સમાપ્ત કરવાની મંજૂરી આપે છે.",
        industry_comparison: "આ ખૂબ જ એકતરફી છે.",
        benchmark_status: "Below Standard",
        suggestion: "30-દિવસની સૂચના અવધિની વિનંતી કરો."
      },
      {
        clause_text: "વપરાશકર્તા કંપનીની બેદરકારીને કારણે થતા નુકસાન સહિત તમામ નુકસાન માટે કંપનીને વળતર આપવા સંમત થાય છે.",
        category: "Indemnification",
        risk_level: "High",
        risk_reason: "અત્યંત વ્યાપક જવાબદારી.",
        explanation: "જો કંપની ભૂલ કરે તો પણ તમારે કાનૂની ખર્ચ ચૂકવવો પડશે.",
        industry_comparison: "ઉદ્યોગના ધોરણ કરતાં વધુ કડક.",
        benchmark_status: "Below Standard",
        suggestion: "તમારી જવાબદારી ફક્ત તમારી પોતાની ભૂલો પૂરતી મર્યાદિત કરો."
      },
      {
        clause_text: "કોઈપણ વિવાદ કંપનીના અધિકારક્ષેત્રમાં ઉકેલવામાં આવશે.",
        category: "Dispute Resolution",
        risk_level: "Moderate",
        risk_reason: "અસુવિધાજનક કાનૂની સ્થળ.",
        explanation: "જો કોઈ કાનૂની લડાઈ હોય, તો તમારે તેમના સ્થાને જવું પડશે.",
        industry_comparison: "મોટી કંપનીઓમાં સામાન્ય.",
        benchmark_status: "Standard",
        suggestion: "પરસ્પર અધિકારક્ષેત્રની વિનંતી કરો."
      }
    ]
  },
  Kannada: {
    summary: "ಇದು ಮುಕ್ತಾಯ ಮತ್ತು ಹೊಣೆಗಾರಿಕೆಯ ಬಗ್ಗೆ ಕೆಲವು ಸಾಧಾರಣ ಅಪಾಯಗಳನ್ನು ಹೊಂದಿರುವ ಪ್ರಮಾಣಿತ ಒಪ್ಪಂದವಾಗಿದೆ. (ಆಫ್‌ಲೈನ್ ಫಾಲ್‌ಬ್ಯಾಕ್)",
    clauses: [
      {
        clause_text: "ಯಾವುದೇ ಮುನ್ಸೂಚನೆಯಿಲ್ಲದೆ ಕಂಪನಿಯು ಯಾವುದೇ ಸಮಯದಲ್ಲಿ ಈ ಒಪ್ಪಂದವನ್ನು ಕೊನೆಗೊಳಿಸಬಹುದು.",
        category: "Termination",
        risk_level: "High",
        risk_reason: "ಏಕಪಕ್ಷೀಯ ಮುಕ್ತಾಯ ಹಕ್ಕುಗಳು.",
        explanation: "ಯಾವುದೇ ಎಚ್ಚರಿಕೆಯಿಲ್ಲದೆ ಒಪ್ಪಂದವನ್ನು ಕೊನೆಗೊಳಿಸಲು ಇದು ಕಂಪನಿಗೆ ಅನುಮತಿಸುತ್ತದೆ.",
        industry_comparison: "ಇದು ಅಸಾಮಾನ್ಯವಾಗಿ ಏಕಪಕ್ಷೀಯವಾಗಿದೆ.",
        benchmark_status: "Below Standard",
        suggestion: "30 ದಿನಗಳ ಮುನ್ಸೂಚನೆ ಅವಧಿಯನ್ನು ವಿನಂತಿಸಿ."
      },
      {
        clause_text: "ಕಂಪನಿಯ ನಿರ್ಲಕ್ಷ್ಯದಿಂದ ಉಂಟಾಗುವ ನಷ್ಟವೂ ಸೇರಿದಂತೆ ಎಲ್ಲಾ ನಷ್ಟಗಳಿಗೆ ಕಂಪನಿಗೆ ಪರಿಹಾರ ನೀಡಲು ಬಳಕೆದಾರರು ಒಪ್ಪುತ್ತಾರೆ.",
        category: "Indemnification",
        risk_level: "High",
        risk_reason: "ಅತ್ಯಂತ ವ್ಯಾಪಕ ಹೊಣೆಗಾರಿಕೆ.",
        explanation: "ಕಂಪನಿಯು ತಪ್ಪು ಮಾಡಿದರೂ ನೀವೇ ಕಾನೂನು ವೆಚ್ಚಗಳನ್ನು ಭರಿಸಬೇಕಾಗುತ್ತದೆ.",
        industry_comparison: "ಕೈಗಾರಿಕಾ ಗುಣಮಟ್ಟಕ್ಕಿಂತ ಕಟ್ಟುನಿಟ್ಟಾಗಿದೆ.",
        benchmark_status: "Below Standard",
        suggestion: "ನಿಮ್ಮ ಹೊಣೆಗಾರಿಕೆಯನ್ನು ನಿಮ್ಮ ಸ್ವಂತ ತಪ್ಪುಗಳಿಗೆ ಮಾತ್ರ ಸೀಮಿತಗೊಳಿಸಿ."
      },
      {
        clause_text: "ಯಾವುದೇ ವಿವಾದಗಳನ್ನು ಕಂಪನಿಯ ನ್ಯಾಯವ್ಯಾಪ್ತಿಯಲ್ಲಿಯೇ ಇತ್ಯರ್ಥಪಡಿಸಲಾಗುವುದು.",
        category: "Dispute Resolution",
        risk_level: "Moderate",
        risk_reason: "ಅನುಕೂಲಕರವಲ್ಲದ ಕಾನೂನು ಸ್ಥಳ.",
        explanation: "ಕಾನೂನು ಹೋರಾಟವಿದ್ದರೆ, ನೀವು ಅವರ ಸ್ಥಳಕ್ಕೆ ಹೋಗಬೇಕಾಗುತ್ತದೆ.",
        industry_comparison: "ದೊಡ್ಡ ಕಂಪನಿಗಳಲ್ಲಿ ಸಾಮಾನ್ಯ.",
        benchmark_status: "Standard",
        suggestion: "ಪರಸ್ಪರ ನ್ಯಾಯವ್ಯಾಪ್ತಿಯನ್ನು ಕೋರಿರಿ."
      }
    ]
  }
};
