import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

import i18n from "./config";
import {
  DEFAULT_LANGUAGE,
  LANGUAGES,
  getLanguageConfig,
  normalizeLanguageCode,
} from "./languages";
import {
  readLanguageFromStorage,
  saveLanguageToStorage,
} from "./storage";
import {
  applyLanguageDirection,
  resolveLanguageDirection,
} from "./direction";

/*
 * Temporary compatibility source.
 * Keep the legacy i18n.jsx file until all translations
 * have been migrated to namespace-based JSON resources.
 */
import { translations as legacyTranslations } from "../i18n.jsx";

export const ACTIVE_NAMESPACES = Object.freeze([
  "common",
  "navigation",
  "auth",
  "dashboard",
  "markets",
  "trading",
  "futures",
  "wallets",
  "web3",
  "p2p",
  "staking",
  "learnEarn",
  "social",
  "ai",
  "profile",
  "settings",
]);

const I18nCompatibilityContext = createContext(null);

const isUsableTranslation = (value) =>
  value !== undefined &&
  value !== null &&
  String(value).trim() !== "";

const normalizeTranslationOptions = (options) => {
  if (typeof options === "string") {
    return {
      defaultValue: options,
    };
  }

  if (!options || typeof options !== "object") {
    return {};
  }

  return options;
};

const getLegacyTranslation = (
  languageCode,
  key,
  fallbackValue = null
) => {
  if (!key || typeof key !== "string") {
    return fallbackValue;
  }

  const normalizedLanguage =
    normalizeLanguageCode(languageCode);

  const selectedLanguageValue =
    legacyTranslations?.[normalizedLanguage]?.[key];

  if (isUsableTranslation(selectedLanguageValue)) {
    return selectedLanguageValue;
  }

  const englishValue = legacyTranslations?.en?.[key];

  if (isUsableTranslation(englishValue)) {
    return englishValue;
  }

  return fallbackValue;
};

const resolveInitialLanguage = () => {
  const storedLanguage = readLanguageFromStorage();

  return normalizeLanguageCode(
    storedLanguage ||
      i18n.resolvedLanguage ||
      i18n.language ||
      DEFAULT_LANGUAGE
  );
};

export function I18nProvider({ children }) {
  const { t: i18nextTranslate } =
    useTranslation(ACTIVE_NAMESPACES);

  const [currentLanguage, setCurrentLanguage] = useState(
    resolveInitialLanguage
  );

  useEffect(() => {
    let isMounted = true;

    const initializeLanguage = async () => {
      const preferredLanguage = resolveInitialLanguage();

      saveLanguageToStorage(preferredLanguage);
      applyLanguageDirection(preferredLanguage);

      const activeLanguage = normalizeLanguageCode(
        i18n.resolvedLanguage || i18n.language
      );

      if (activeLanguage !== preferredLanguage) {
        await i18n.changeLanguage(preferredLanguage);
      }

      if (isMounted) {
        setCurrentLanguage(preferredLanguage);
      }
    };

    initializeLanguage().catch((error) => {
      console.error(
        "Failed to initialize the global language:",
        error
      );

      if (isMounted) {
        setCurrentLanguage(DEFAULT_LANGUAGE);
        applyLanguageDirection(DEFAULT_LANGUAGE);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handleLanguageChanged = (languageCode) => {
      const normalizedLanguage =
        normalizeLanguageCode(languageCode);

      saveLanguageToStorage(normalizedLanguage);
      applyLanguageDirection(normalizedLanguage);
      setCurrentLanguage(normalizedLanguage);
    };

    i18n.on("languageChanged", handleLanguageChanged);

    return () => {
      i18n.off(
        "languageChanged",
        handleLanguageChanged
      );
    };
  }, []);

  const changeLanguage = useCallback(
    async (languageCode) => {
      const normalizedLanguage =
        normalizeLanguageCode(languageCode);

      saveLanguageToStorage(normalizedLanguage);
      applyLanguageDirection(normalizedLanguage);

      if (
        normalizeLanguageCode(
          i18n.resolvedLanguage || i18n.language
        ) !== normalizedLanguage
      ) {
        await i18n.changeLanguage(normalizedLanguage);
      } else {
        setCurrentLanguage(normalizedLanguage);
      }

      return normalizedLanguage;
    },
    []
  );

  const translate = useCallback(
    (key, rawOptions = {}) => {
      if (!key || typeof key !== "string") {
        return "";
      }

      const options =
        normalizeTranslationOptions(rawOptions);

      const requestedNamespaces = options.ns
        ? Array.isArray(options.ns)
          ? options.ns
          : [options.ns]
        : ACTIVE_NAMESPACES;

      const legacyFallback = getLegacyTranslation(
        currentLanguage,
        key,
        null
      );

      const englishLegacyFallback =
        getLegacyTranslation(
          DEFAULT_LANGUAGE,
          key,
          key
        );

      const fallbackValue =
        options.defaultValue ??
        legacyFallback ??
        englishLegacyFallback ??
        key;

      /*
       * Preserve existing non-English translations while
       * namespace resources are migrated incrementally.
       */
      if (currentLanguage !== DEFAULT_LANGUAGE) {
        const selectedLegacyValue =
          legacyTranslations?.[currentLanguage]?.[key];

        if (isUsableTranslation(selectedLegacyValue)) {
          return selectedLegacyValue;
        }
      }

      try {
        const translationExists = requestedNamespaces.some(
          (namespace) =>
            i18n.exists(key, {
              lng: currentLanguage,
              ns: namespace,
            })
        );

        if (!translationExists) {
          return fallbackValue;
        }

        const translatedValue = i18nextTranslate(key, {
          ...options,
          ns: requestedNamespaces,
          defaultValue: fallbackValue,
        });

        return isUsableTranslation(translatedValue)
          ? translatedValue
          : fallbackValue;
      } catch (error) {
        console.error(
          `Translation failed for key "${key}":`,
          error
        );

        return fallbackValue;
      }
    },
    [currentLanguage, i18nextTranslate]
  );

  const languageConfig = useMemo(
    () => getLanguageConfig(currentLanguage),
    [currentLanguage]
  );

  const direction = useMemo(
    () => resolveLanguageDirection(currentLanguage),
    [currentLanguage]
  );

  const contextValue = useMemo(
    () => ({
      t: translate,

      language: currentLanguage,
      currentLanguage,
      lang: currentLanguage,

      languages: LANGUAGES,
      languageConfig,

      direction,
      dir: direction,
      isRTL: direction === "rtl",
      isRtl: direction === "rtl",

      changeLanguage,
      setLanguage: changeLanguage,
      setLang: changeLanguage,

      i18n,
    }),
    [
      changeLanguage,
      currentLanguage,
      direction,
      languageConfig,
      translate,
    ]
  );

  return React.createElement(
    I18nCompatibilityContext.Provider,
    {
      value: contextValue,
    },
    children
  );
}

export function useI18n() {
  const context = useContext(
    I18nCompatibilityContext
  );

  if (!context) {
    throw new Error(
      "useI18n must be used inside I18nProvider."
    );
  }

  return context;
}

export {
  LANGUAGES,
  i18n,
};

export default i18n;