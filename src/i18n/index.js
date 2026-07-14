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

const I18nContext = createContext(null);

const normalizeOptions = (options) => {
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

const resolveInitialLanguage = () => {
  const storedLanguage =
    readLanguageFromStorage();

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

  const [currentLanguage, setCurrentLanguage] =
    useState(resolveInitialLanguage);

  useEffect(() => {
    let mounted = true;

    const initializeLanguage = async () => {
      const language =
        resolveInitialLanguage();

      saveLanguageToStorage(language);
      applyLanguageDirection(language);

      const activeLanguage =
        normalizeLanguageCode(
          i18n.resolvedLanguage ||
            i18n.language
        );

      if (activeLanguage !== language) {
        await i18n.changeLanguage(language);
      }

      if (mounted) {
        setCurrentLanguage(language);
      }
    };

    initializeLanguage().catch((error) => {
      console.error(
        "Language initialization failed:",
        error
      );

      if (mounted) {
        saveLanguageToStorage(
          DEFAULT_LANGUAGE
        );

        applyLanguageDirection(
          DEFAULT_LANGUAGE
        );

        setCurrentLanguage(
          DEFAULT_LANGUAGE
        );
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const handleLanguageChange = (
      languageCode
    ) => {
      const normalizedLanguage =
        normalizeLanguageCode(
          languageCode
        );

      saveLanguageToStorage(
        normalizedLanguage
      );

      applyLanguageDirection(
        normalizedLanguage
      );

      setCurrentLanguage(
        normalizedLanguage
      );
    };

    i18n.on(
      "languageChanged",
      handleLanguageChange
    );

    return () => {
      i18n.off(
        "languageChanged",
        handleLanguageChange
      );
    };
  }, []);

  const changeLanguage = useCallback(
    async (languageCode) => {
      const normalizedLanguage =
        normalizeLanguageCode(
          languageCode
        );

      saveLanguageToStorage(
        normalizedLanguage
      );

      applyLanguageDirection(
        normalizedLanguage
      );

      await i18n.changeLanguage(
        normalizedLanguage
      );

      setCurrentLanguage(
        normalizedLanguage
      );

      return normalizedLanguage;
    },
    []
  );

  const translate = useCallback(
    (key, rawOptions = {}) => {
      if (
        !key ||
        typeof key !== "string"
      ) {
        return "";
      }

      const options =
        normalizeOptions(rawOptions);

      const namespaces = options.ns
        ? Array.isArray(options.ns)
          ? options.ns
          : [options.ns]
        : ACTIVE_NAMESPACES;

      const fallbackValue =
        options.defaultValue ?? key;

      try {
        for (const namespace of namespaces) {
          const exists = i18n.exists(key, {
            lng: currentLanguage,
            ns: namespace,
          });

          if (!exists) {
            continue;
          }

          const translatedValue =
            i18nextTranslate(key, {
              ...options,
              lng: currentLanguage,
              ns: namespace,
              defaultValue:
                fallbackValue,
            });

          if (
            translatedValue !== undefined &&
            translatedValue !== null &&
            String(
              translatedValue
            ).trim() !== "" &&
            translatedValue !== key
          ) {
            return translatedValue;
          }
        }

        /*
         * English fallback when the selected
         * language does not contain a key.
         */
        for (const namespace of namespaces) {
          const englishExists =
            i18n.exists(key, {
              lng: DEFAULT_LANGUAGE,
              ns: namespace,
            });

          if (!englishExists) {
            continue;
          }

          const englishValue =
            i18n.getFixedT(
              DEFAULT_LANGUAGE,
              namespace
            )(key, {
              ...options,
              defaultValue:
                fallbackValue,
            });

          if (
            englishValue !== undefined &&
            englishValue !== null &&
            String(
              englishValue
            ).trim() !== ""
          ) {
            return englishValue;
          }
        }

        return fallbackValue;
      } catch (error) {
        console.error(
          `Translation failed for "${key}":`,
          error
        );

        return fallbackValue;
      }
    },
    [
      currentLanguage,
      i18nextTranslate,
    ]
  );

  const languageConfig = useMemo(
    () =>
      getLanguageConfig(
        currentLanguage
      ),
    [currentLanguage]
  );

  const direction = useMemo(
    () =>
      resolveLanguageDirection(
        currentLanguage
      ),
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
  I18nContext.Provider,
  {
    value: contextValue,
  },
  children
);
}

export function useI18n() {
  const context =
    useContext(I18nContext);

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