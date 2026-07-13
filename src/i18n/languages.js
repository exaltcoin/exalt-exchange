export const LANGUAGE_STORAGE_KEY = "exalt_exchange_language";

export const DEFAULT_LANGUAGE = "en";

export const RTL_LANGUAGES = Object.freeze([
  "ar",
  "ur",
  "fa",
]);

export const LANGUAGES = Object.freeze([
  {
    code: "en",
    name: "English",
    nativeName: "English",
    flag: "🇺🇸",
    direction: "ltr",
  },
  {
    code: "ar",
    name: "Arabic",
    nativeName: "العربية",
    flag: "🇸🇦",
    direction: "rtl",
  },
  {
    code: "ur",
    name: "Urdu",
    nativeName: "اردو",
    flag: "🇵🇰",
    direction: "rtl",
  },
  {
    code: "hi",
    name: "Hindi",
    nativeName: "हिन्दी",
    flag: "🇮🇳",
    direction: "ltr",
  },
  {
    code: "tr",
    name: "Turkish",
    nativeName: "Türkçe",
    flag: "🇹🇷",
    direction: "ltr",
  },
  {
    code: "fr",
    name: "French",
    nativeName: "Français",
    flag: "🇫🇷",
    direction: "ltr",
  },
  {
    code: "es",
    name: "Spanish",
    nativeName: "Español",
    flag: "🇪🇸",
    direction: "ltr",
  },
  {
    code: "ru",
    name: "Russian",
    nativeName: "Русский",
    flag: "🇷🇺",
    direction: "ltr",
  },
  {
    code: "zh",
    name: "Chinese",
    nativeName: "中文",
    flag: "🇨🇳",
    direction: "ltr",
  },
  {
    code: "ja",
    name: "Japanese",
    nativeName: "日本語",
    flag: "🇯🇵",
    direction: "ltr",
  },
  {
    code: "ko",
    name: "Korean",
    nativeName: "한국어",
    flag: "🇰🇷",
    direction: "ltr",
  },
  {
    code: "de",
    name: "German",
    nativeName: "Deutsch",
    flag: "🇩🇪",
    direction: "ltr",
  },
  {
    code: "it",
    name: "Italian",
    nativeName: "Italiano",
    flag: "🇮🇹",
    direction: "ltr",
  },
  {
    code: "pt",
    name: "Portuguese",
    nativeName: "Português",
    flag: "🇵🇹",
    direction: "ltr",
  },
  {
    code: "id",
    name: "Indonesian",
    nativeName: "Bahasa Indonesia",
    flag: "🇮🇩",
    direction: "ltr",
  },
  {
    code: "bn",
    name: "Bengali",
    nativeName: "বাংলা",
    flag: "🇧🇩",
    direction: "ltr",
  },
  {
    code: "fa",
    name: "Persian",
    nativeName: "فارسی",
    flag: "🇮🇷",
    direction: "rtl",
  },
]);

export const SUPPORTED_LANGUAGE_CODES = Object.freeze(
  LANGUAGES.map((language) => language.code)
);

export const isSupportedLanguage = (languageCode) =>
  SUPPORTED_LANGUAGE_CODES.includes(languageCode);

export const getLanguageConfig = (languageCode) =>
  LANGUAGES.find((language) => language.code === languageCode) ||
  LANGUAGES[0];

export const getLanguageDirection = (languageCode) =>
  RTL_LANGUAGES.includes(languageCode) ? "rtl" : "ltr";

export const normalizeLanguageCode = (languageCode) => {
  if (!languageCode || typeof languageCode !== "string") {
    return DEFAULT_LANGUAGE;
  }

  const normalizedCode = languageCode
    .trim()
    .toLowerCase()
    .split("-")[0];

  return isSupportedLanguage(normalizedCode)
    ? normalizedCode
    : DEFAULT_LANGUAGE;
};

export const getStoredLanguage = () => {
  try {
    const storedLanguage = localStorage.getItem(
      LANGUAGE_STORAGE_KEY
    );

    if (storedLanguage) {
      return normalizeLanguageCode(storedLanguage);
    }

    const browserLanguage =
      navigator.languages?.[0] ||
      navigator.language ||
      DEFAULT_LANGUAGE;

    return normalizeLanguageCode(browserLanguage);
  } catch (error) {
    console.error("Failed to read stored language:", error);
    return DEFAULT_LANGUAGE;
  }
};

export const storeLanguage = (languageCode) => {
  const normalizedCode = normalizeLanguageCode(languageCode);

  try {
    localStorage.setItem(
      LANGUAGE_STORAGE_KEY,
      normalizedCode
    );
  } catch (error) {
    console.error("Failed to store language:", error);
  }

  return normalizedCode;
};

export const applyDocumentLanguage = (languageCode) => {
  const normalizedCode = normalizeLanguageCode(languageCode);
  const direction = getLanguageDirection(normalizedCode);

  if (typeof document !== "undefined") {
    document.documentElement.lang = normalizedCode;
    document.documentElement.dir = direction;

    document.body?.setAttribute("dir", direction);
    document.body?.setAttribute(
      "data-language",
      normalizedCode
    );
  }

  return {
    language: normalizedCode,
    direction,
  };
};