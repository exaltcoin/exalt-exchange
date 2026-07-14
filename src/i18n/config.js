import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import resourcesToBackend from "i18next-resources-to-backend";

import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  SUPPORTED_LANGUAGE_CODES,
  normalizeLanguageCode,
} from "./languages";

import {
  applyLanguageDirection,
} from "./direction";

export const AVAILABLE_NAMESPACES = Object.freeze([
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
 */
const localeModules = import.meta.glob(
  "./locales/*/*.json"
);

const normalizeImportedResource = (
  importedModule
) => {
  const resource =
    importedModule?.default ??
    importedModule;

  if (
    !resource ||
    typeof resource !== "object" ||
    Array.isArray(resource)
  ) {
    return {};
  }

  return resource;
};

const loadNamespaceFile = async (
  languageCode,
  namespace
) => {
  const language =
    normalizeLanguageCode(languageCode);

  if (
    !AVAILABLE_NAMESPACES.includes(namespace)
  ) {
    console.warn(
      `Unsupported translation namespace: "${namespace}"`
    );

    return {};
  }

  const requestedPath =
    `./locales/${language}/${namespace}.json`;

  const englishFallbackPath =
    `./locales/${DEFAULT_LANGUAGE}/${namespace}.json`;

  /*
   * First load the selected language.
   */
  const requestedLoader =
    localeModules[requestedPath];

  if (requestedLoader) {
    try {
      const requestedModule =
        await requestedLoader();

      return normalizeImportedResource(
        requestedModule
      );
    } catch (error) {
      console.error(
        `Failed to load ${language}/${namespace}.json:`,
        error
      );
    }
  }

  /*
   * If the selected language file does not exist,
   * safely fall back to English.
   */
  const englishLoader =
    localeModules[englishFallbackPath];

  if (englishLoader) {
    try {
      const englishModule =
        await englishLoader();

      return normalizeImportedResource(
        englishModule
      );
    } catch (error) {
      console.error(
        `Failed to load English fallback ${namespace}.json:`,
        error
      );
    }
  }

  console.warn(
    `No translation resource found for ${language}/${namespace}`
  );

  return {};
};

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