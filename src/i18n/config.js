import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import resourcesToBackend from "i18next-resources-to-backend";

import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  SUPPORTED_LANGUAGE_CODES,
  normalizeLanguageCode,
} from "./languages.js";

import {
  applyLanguageDirection,
} from "./direction.js";

import {
  AVAILABLE_NAMESPACES,
  resolveNamespaceResource,
} from "./resourceResolver.js";

export { AVAILABLE_NAMESPACES };

/*
 * Vite automatically discovers all locale JSON files.
 *
 * Required structure:
 *
 * src/i18n/locales/en/common.json
 * src/i18n/locales/ar/common.json
 * src/i18n/locales/ur/common.json
 * src/i18n/locales/hi/common.json
 *
 * The same structure applies to every namespace.
 *
 * Discovery is Vite-specific (import.meta.glob) and stays here;
 * the actual "which file for this language+namespace, falling
 * back to English" decision lives in the plain, test-importable
 * resourceResolver.js so regression tests can exercise the real
 * resolution logic without a Vite runtime.
 */
const localeModules = import.meta.glob(
  "./locales/*/*.json",
  {
    eager: true,
    import: "default",
  }
);

const loadNamespaceFile = async (
  languageCode,
  namespace
) =>
  resolveNamespaceResource(
    languageCode,
    namespace,
    localeModules
  );

const getDetectedLanguage = () => {
  if (typeof window === "undefined") {
    return DEFAULT_LANGUAGE;
  }

  let storedLanguage = "";

  try {
    storedLanguage =
      window.localStorage.getItem(
        LANGUAGE_STORAGE_KEY
      ) || "";
  } catch (error) {
    console.error(
      "Failed to read stored language:",
      error
    );
  }

  return normalizeLanguageCode(
    storedLanguage ||
      window.navigator.languages?.[0] ||
      window.navigator.language ||
      DEFAULT_LANGUAGE
  );
};

const detectedLanguage =
  getDetectedLanguage();

applyLanguageDirection(
  detectedLanguage
);

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)

    .use(
      resourcesToBackend(
        async (
          languageCode,
          namespace
        ) =>
          loadNamespaceFile(
            languageCode,
            namespace
          )
      )
    )

    .use(initReactI18next)

    .init({
      lng: detectedLanguage,

      fallbackLng: DEFAULT_LANGUAGE,

      supportedLngs:
        SUPPORTED_LANGUAGE_CODES,

      nonExplicitSupportedLngs: true,

      load: "languageOnly",

      ns: AVAILABLE_NAMESPACES,

      defaultNS: "common",

      fallbackNS: [
        "common",
        "navigation",
      ],

      preload: [],

      cleanCode: true,

      lowerCaseLng: true,

      interpolation: {
        escapeValue: false,
      },

      detection: {
        order: [
          "localStorage",
          "navigator",
        ],

        lookupLocalStorage:
          LANGUAGE_STORAGE_KEY,

        caches: [
          "localStorage",
        ],

        convertDetectedLanguage: (
          languageCode
        ) =>
          normalizeLanguageCode(
            languageCode
          ),
      },

      react: {
        useSuspense: false,

        bindI18n:
          "languageChanged loaded",

        bindI18nStore:
          "added removed",

        transSupportBasicHtmlNodes:
          true,
      },

      returnNull: false,

      returnEmptyString: false,

      saveMissing: false,

      debug: Boolean(
        import.meta.env.DEV
      ),

      initImmediate: true,
    })

    .catch((error) => {
      console.error(
        "Failed to initialize translation system:",
        error
      );
    });
}

i18n.on(
  "languageChanged",
  (languageCode) => {
    const normalizedLanguage =
      normalizeLanguageCode(
        languageCode
      );

    try {
      window.localStorage.setItem(
        LANGUAGE_STORAGE_KEY,
        normalizedLanguage
      );
    } catch (error) {
      console.error(
        "Failed to save selected language:",
        error
      );
    }

    applyLanguageDirection(
      normalizedLanguage
    );
  }
);

export const changeGlobalLanguage = async (
  languageCode
) => {
  const normalizedLanguage =
    normalizeLanguageCode(
      languageCode
    );

  await i18n.changeLanguage(
    normalizedLanguage
  );

  applyLanguageDirection(
    normalizedLanguage
  );

  return normalizedLanguage;
};

export default i18n;