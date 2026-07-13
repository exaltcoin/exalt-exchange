import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  normalizeLanguageCode,
} from "./languages";

const LEGACY_LANGUAGE_KEYS = Object.freeze([
  "language",
  "lang",
  "selectedLanguage",
  "preferredLanguage",
]);

const canUseStorage = () =>
  typeof window !== "undefined" &&
  typeof window.localStorage !== "undefined";

export const readLanguageFromStorage = () => {
  if (!canUseStorage()) {
    return DEFAULT_LANGUAGE;
  }

  try {
    const currentValue = window.localStorage.getItem(
      LANGUAGE_STORAGE_KEY
    );

    if (currentValue) {
      return normalizeLanguageCode(currentValue);
    }

    for (const legacyKey of LEGACY_LANGUAGE_KEYS) {
      const legacyValue =
        window.localStorage.getItem(legacyKey);

      if (legacyValue) {
        const normalizedLanguage =
          normalizeLanguageCode(legacyValue);

        window.localStorage.setItem(
          LANGUAGE_STORAGE_KEY,
          normalizedLanguage
        );

        return normalizedLanguage;
      }
    }

    const browserLanguage =
      window.navigator.languages?.[0] ||
      window.navigator.language ||
      DEFAULT_LANGUAGE;

    return normalizeLanguageCode(browserLanguage);
  } catch (error) {
    console.error(
      "Unable to read language preference:",
      error
    );

    return DEFAULT_LANGUAGE;
  }
};

export const saveLanguageToStorage = (languageCode) => {
  const normalizedLanguage =
    normalizeLanguageCode(languageCode);

  if (!canUseStorage()) {
    return normalizedLanguage;
  }

  try {
    window.localStorage.setItem(
      LANGUAGE_STORAGE_KEY,
      normalizedLanguage
    );

    for (const legacyKey of LEGACY_LANGUAGE_KEYS) {
      window.localStorage.removeItem(legacyKey);
    }
  } catch (error) {
    console.error(
      "Unable to save language preference:",
      error
    );
  }

  return normalizedLanguage;
};

export const removeLanguageFromStorage = () => {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.removeItem(
      LANGUAGE_STORAGE_KEY
    );

    for (const legacyKey of LEGACY_LANGUAGE_KEYS) {
      window.localStorage.removeItem(legacyKey);
    }
  } catch (error) {
    console.error(
      "Unable to remove language preference:",
      error
    );
  }
};

export const migrateLegacyLanguageStorage = () =>
  readLanguageFromStorage();