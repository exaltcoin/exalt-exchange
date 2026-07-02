import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export const LANGUAGES = [
  { code: "en", name: "English", native: "English", flag: "🇺🇸", dir: "ltr" },
  { code: "ar", name: "Arabic", native: "العربية", flag: "🇸🇦", dir: "rtl" },
  { code: "ur", name: "Urdu", native: "اردو", flag: "🇵🇰", dir: "rtl" },
  { code: "hi", name: "Hindi", native: "हिन्दी", flag: "🇮🇳", dir: "ltr" },
  { code: "tr", name: "Turkish", native: "Türkçe", flag: "🇹🇷", dir: "ltr" },
  { code: "fr", name: "French", native: "Français", flag: "🇫🇷", dir: "ltr" },
  { code: "es", name: "Spanish", native: "Español", flag: "🇪🇸", dir: "ltr" },
  { code: "ru", name: "Russian", native: "Русский", flag: "🇷🇺", dir: "ltr" },
  { code: "zh", name: "Chinese", native: "中文", flag: "🇨🇳", dir: "ltr" },
  { code: "ja", name: "Japanese", native: "日本語", flag: "🇯🇵", dir: "ltr" },
  { code: "ko", name: "Korean", native: "한국어", flag: "🇰🇷", dir: "ltr" },
  { code: "de", name: "German", native: "Deutsch", flag: "🇩🇪", dir: "ltr" },
  { code: "it", name: "Italian", native: "Italiano", flag: "🇮🇹", dir: "ltr" },
  { code: "pt", name: "Portuguese", native: "Português", flag: "🇵🇹", dir: "ltr" },
  { code: "id", name: "Indonesian", native: "Indonesia", flag: "🇮🇩", dir: "ltr" },
  { code: "bn", name: "Bengali", native: "বাংলা", flag: "🇧🇩", dir: "ltr" },
  { code: "fa", name: "Persian", native: "فارسی", flag: "🇮🇷", dir: "rtl" },
];

export const translations = {
  en: {
    appName: "Exalt Exchange",
    login: "Login",
    signup: "Signup",
    logout: "Logout",
    dashboard: "Dashboard",
    profile: "Profile",
    markets: "Markets",
    spotTrading: "Spot Trading",
    futures: "Futures",
    buyCrypto: "Buy Crypto",
    p2p: "P2P",
    staking: "Staking",
    support: "Support",
    settings: "Settings",
    wallets: "Wallets",
    orders: "Orders",
    listings: "Listings",
    referral: "Referral",
    transactions: "Transactions",
    rewards: "Rewards",
    kyc: "KYC Requests",
    admin: "Admin",
    connectWallet: "Connect Wallet",
    walletNotConnected: "Wallet not connected",
    liveMarkets: "Live Markets",
    searchCoin: "Search coin...",
    noMarketData: "No market data found",
    loadingMarkets: "Loading markets...",
    spotOrder: "Spot Order",
    buy: "Buy",
    sell: "Sell",
    marketOrder: "Market Order",
    limitOrder: "Limit Order",
    amount: "Amount",
    price: "Price",
    liquidity: "Liquidity",
    contract: "Contract",
    coinInfo: "Coin Info",
    submitTicket: "Submit Ticket",
    supportCenter: "Support Center",
    aiSupport: "AI Support",
    securityCenter: "Security Center",
    language: "Language",
  },

  ar: {
    appName: "منصة إكسالت",
    login: "تسجيل الدخول",
    signup: "إنشاء حساب",
    logout: "تسجيل الخروج",
    dashboard: "لوحة التحكم",
    profile: "الملف الشخصي",
    markets: "الأسواق",
    spotTrading: "التداول الفوري",
    futures: "العقود المستقبلية",
    buyCrypto: "شراء العملات",
    p2p: "تداول P2P",
    staking: "الستاكينغ",
    support: "الدعم",
    settings: "الإعدادات",
    wallets: "المحافظ",
    orders: "الأوامر",
    listings: "الإدراجات",
    referral: "الإحالات",
    transactions: "المعاملات",
    rewards: "المكافآت",
    kyc: "طلبات التحقق",
    admin: "الإدارة",
    connectWallet: "ربط المحفظة",
    walletNotConnected: "المحفظة غير متصلة",
    liveMarkets: "الأسواق المباشرة",
    searchCoin: "ابحث عن عملة...",
    noMarketData: "لا توجد بيانات سوق",
    loadingMarkets: "جاري تحميل الأسواق...",
    spotOrder: "أمر فوري",
    buy: "شراء",
    sell: "بيع",
    marketOrder: "أمر سوق",
    limitOrder: "أمر محدد",
    amount: "المبلغ",
    price: "السعر",
    liquidity: "السيولة",
    contract: "العقد",
    coinInfo: "معلومات العملة",
    submitTicket: "إرسال تذكرة",
    supportCenter: "مركز الدعم",
    aiSupport: "دعم الذكاء الاصطناعي",
    securityCenter: "مركز الأمان",
    language: "اللغة",
  },

  ur: {
    appName: "ایگزالٹ ایکسچینج",
    login: "لاگ اِن",
    signup: "سائن اَپ",
    logout: "لاگ آؤٹ",
    dashboard: "ڈیش بورڈ",
    profile: "پروفائل",
    markets: "مارکیٹس",
    spotTrading: "اسپاٹ ٹریڈنگ",
    futures: "فیوچرز",
    buyCrypto: "کرپٹو خریدیں",
    p2p: "پی ٹو پی",
    staking: "اسٹیکنگ",
    support: "سپورٹ",
    settings: "سیٹنگز",
    wallets: "والیٹس",
    orders: "آرڈرز",
    listings: "لسٹنگز",
    referral: "ریفرل",
    transactions: "ٹرانزیکشنز",
    rewards: "ریوارڈز",
    kyc: "کے وائی سی درخواستیں",
    admin: "ایڈمن",
    connectWallet: "والیٹ کنیکٹ کریں",
    walletNotConnected: "والیٹ کنیکٹ نہیں",
    liveMarkets: "لائیو مارکیٹس",
    searchCoin: "کوائن تلاش کریں...",
    noMarketData: "مارکیٹ ڈیٹا موجود نہیں",
    loadingMarkets: "مارکیٹس لوڈ ہو رہی ہیں...",
    spotOrder: "اسپاٹ آرڈر",
    buy: "خریدیں",
    sell: "بیچیں",
    marketOrder: "مارکیٹ آرڈر",
    limitOrder: "لمٹ آرڈر",
    amount: "رقم",
    price: "قیمت",
    liquidity: "لیکویڈیٹی",
    contract: "کنٹریکٹ",
    coinInfo: "کوائن معلومات",
    submitTicket: "ٹکٹ جمع کریں",
    supportCenter: "سپورٹ سینٹر",
    aiSupport: "اے آئی سپورٹ",
    securityCenter: "سیکیورٹی سینٹر",
    language: "زبان",
  },

  hi: {
    appName: "Exalt Exchange",
    login: "लॉगिन",
    signup: "साइन अप",
    logout: "लॉगआउट",
    dashboard: "डैशबोर्ड",
    profile: "प्रोफाइल",
    markets: "मार्केट्स",
    spotTrading: "स्पॉट ट्रेडिंग",
    futures: "फ्यूचर्स",
    buyCrypto: "क्रिप्टो खरीदें",
    p2p: "पी2पी",
    staking: "स्टेकिंग",
    support: "सपोर्ट",
    settings: "सेटिंग्स",
    wallets: "वॉलेट्स",
    orders: "ऑर्डर्स",
    listings: "लिस्टिंग्स",
    referral: "रेफरल",
    transactions: "ट्रांजैक्शन्स",
    rewards: "रिवॉर्ड्स",
    kyc: "KYC रिक्वेस्ट",
    admin: "एडमिन",
    connectWallet: "वॉलेट कनेक्ट करें",
    walletNotConnected: "वॉलेट कनेक्ट नहीं",
    liveMarkets: "लाइव मार्केट्स",
    searchCoin: "कॉइन खोजें...",
    noMarketData: "मार्केट डेटा नहीं मिला",
    loadingMarkets: "मार्केट्स लोड हो रहे हैं...",
    spotOrder: "स्पॉट ऑर्डर",
    buy: "खरीदें",
    sell: "बेचें",
    marketOrder: "मार्केट ऑर्डर",
    limitOrder: "लिमिट ऑर्डर",
    amount: "अमाउंट",
    price: "कीमत",
    liquidity: "लिक्विडिटी",
    contract: "कॉन्ट्रैक्ट",
    coinInfo: "कॉइन जानकारी",
    submitTicket: "टिकट सबमिट करें",
    supportCenter: "सपोर्ट सेंटर",
    aiSupport: "AI सपोर्ट",
    securityCenter: "सिक्योरिटी सेंटर",
    language: "भाषा",
  },
};

const fallbackKeys = translations.en;

["tr","fr","es","ru","zh","ja","ko","de","it","pt","id","bn","fa"].forEach((code) => {
  translations[code] = {
    ...fallbackKeys,
    language: LANGUAGES.find((l) => l.code === code)?.native || "Language",
  };
});

const countryLanguageMap = {
  KW: "ar", SA: "ar", AE: "ar", QA: "ar", BH: "ar", OM: "ar", IQ: "ar", JO: "ar", EG: "ar", MA: "ar",
  PK: "ur",
  IN: "hi",
  TR: "tr",
  FR: "fr",
  ES: "es",
  RU: "ru",
  CN: "zh",
  JP: "ja",
  KR: "ko",
  DE: "de",
  IT: "it",
  PT: "pt",
  BR: "pt",
  ID: "id",
  BD: "bn",
  IR: "fa",
};

export function detectBrowserLanguage() {
  const saved = localStorage.getItem("exalt_language");
  if (saved && translations[saved]) return saved;

  const browserLang = navigator.language?.split("-")[0];

  if (browserLang && translations[browserLang]) return browserLang;

  return "en";
}

export function setDocumentLanguage(lang) {
  const selected = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  document.documentElement.lang = selected.code;
  document.documentElement.dir = selected.dir;

  if (selected.dir === "rtl") {
    document.body.classList.add("rtl");
  } else {
    document.body.classList.remove("rtl");
  }
}

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(detectBrowserLanguage);

  useEffect(() => {
    setDocumentLanguage(lang);
    localStorage.setItem("exalt_language", lang);
  }, [lang]);

  const value = useMemo(() => {
    const t = (key) => translations[lang]?.[key] || translations.en[key] || key;

    return {
      lang,
      setLang: setLangState,
      t,
      languages: LANGUAGES,
      dir: LANGUAGES.find((l) => l.code === lang)?.dir || "ltr",
    };
  }, [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return {
      lang: "en",
      setLang: () => {},
      t: (key) => translations.en[key] || key,
      languages: LANGUAGES,
      dir: "ltr",
    };
  }
  return ctx;
}

export function LanguageSwitcher() {
  const { lang, setLang, languages } = useI18n();

  return (
    <select
      value={lang}
      onChange={(e) => setLang(e.target.value)}
      className="language-switcher"
    >
      {languages.map((item) => (
        <option key={item.code} value={item.code}>
          {item.flag} {item.native}
        </option>
      ))}
    </select>
  );
}