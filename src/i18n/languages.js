export const LANGUAGE_STORAGE_KEY =
  "exalt_exchange_language";

export const DEFAULT_LANGUAGE = "en";

export const RTL_LANGUAGES = Object.freeze([
  "ar",
  "ur",
]);

export const LANGUAGES = Object.freeze([
  {
    code: "en",
    name: "English",
    native: "English",
    nativeName: "English",
    flag: "🇺🇸",
    direction: "ltr",
  },
  {
    code: "ur",
    name: "Urdu",
    native: "اردو",
    nativeName: "اردو",
    flag: "🇵🇰",
    direction: "rtl",
  },
  {
    code: "ar",
    name: "Arabic",
    native: "العربية",
    nativeName: "العربية",
    flag: "🇸🇦",
    direction: "rtl",
  },
  {
    code: "hi",
    name: "Hindi",
    native: "हिन्दी",
    nativeName: "हिन्दी",
    flag: "🇮🇳",
    direction: "ltr",
  },
]);

export const SUPPORTED_LANGUAGE_CODES =
  Object.freeze(
    LANGUAGES.map(
      (language) => language.code
    )
  );

export const isSupportedLanguage = (
  languageCode
) =>
  SUPPORTED_LANGUAGE_CODES.includes(
    String(languageCode || "")
      .trim()
      .toLowerCase()
  );

export const normalizeLanguageCode = (
  languageCode
) => {
  if (
    !languageCode ||
    typeof languageCode !== "string"
  ) {
    return DEFAULT_LANGUAGE;
  }

  const normalizedCode = languageCode
    .trim()
    .toLowerCase()
    .replace("_", "-")
    .split("-")[0];

  return SUPPORTED_LANGUAGE_CODES.includes(
    normalizedCode
  )
    ? normalizedCode
    : DEFAULT_LANGUAGE;
};

export const getLanguageConfig = (
  languageCode
) => {
  const normalizedCode =
    normalizeLanguageCode(languageCode);

  return (
    LANGUAGES.find(
      (language) =>
        language.code === normalizedCode
    ) || LANGUAGES[0]
  );
};

export const getLanguageDirection = (
  languageCode
) => {
  const normalizedCode =
    normalizeLanguageCode(languageCode);

  return RTL_LANGUAGES.includes(
    normalizedCode
  )
    ? "rtl"
    : "ltr";
};

export const getStoredLanguage = () => {
  if (typeof window === "undefined") {
    return DEFAULT_LANGUAGE;
  }

  try {
    const storedLanguage =
      window.localStorage.getItem(
        LANGUAGE_STORAGE_KEY
      );

    if (storedLanguage) {
      return normalizeLanguageCode(
        storedLanguage
      );
    }

    const browserLanguage =
      window.navigator.languages?.[0] ||
      window.navigator.language ||
      DEFAULT_LANGUAGE;

    return normalizeLanguageCode(
      browserLanguage
    );
  } catch (error) {
    console.error(
      "Failed to read stored language:",
      error
    );

    return DEFAULT_LANGUAGE;
  }
};

export const storeLanguage = (
  languageCode
) => {
  const normalizedCode =
    normalizeLanguageCode(languageCode);

  if (typeof window === "undefined") {
    return normalizedCode;
  }

  try {
    window.localStorage.setItem(
      LANGUAGE_STORAGE_KEY,
      normalizedCode
    );
  } catch (error) {
    console.error(
      "Failed to store language:",
      error
    );
  }

  return normalizedCode;
};

export const applyDocumentLanguage = (
  languageCode
) => {
  const normalizedCode =
    normalizeLanguageCode(languageCode);

  const direction =
    getLanguageDirection(
      normalizedCode
    );

  if (typeof document !== "undefined") {
    document.documentElement.lang =
      normalizedCode;

    document.documentElement.dir =
      direction;

    document.body?.setAttribute(
      "dir",
      direction
    );

    document.body?.setAttribute(
      "data-language",
      normalizedCode
    );

    document.body?.classList.toggle(
      "rtl",
      direction === "rtl"
    );

    document.body?.classList.toggle(
      "ltr",
      direction === "ltr"
    );
  }

  return {
    language: normalizedCode,
    direction,
  };
};