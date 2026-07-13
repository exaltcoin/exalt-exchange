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
import { applyLanguageDirection } from "./direction";

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

const englishNamespaceLoaders = Object.freeze({
  common: () => import("./locales/en/common.json"),
  navigation: () => import("./locales/en/navigation.json"),
  auth: () => import("./locales/en/auth.json"),
  dashboard: () => import("./locales/en/dashboard.json"),
  markets: () => import("./locales/en/markets.json"),
  trading: () => import("./locales/en/trading.json"),
  futures: () => import("./locales/en/futures.json"),
  wallets: () => import("./locales/en/wallets.json"),
  web3: () => import("./locales/en/web3.json"),
  p2p: () => import("./locales/en/p2p.json"),
  staking: () => import("./locales/en/staking.json"),
  learnEarn: () => import("./locales/en/learnEarn.json"),
  social: () => import("./locales/en/social.json"),
  ai: () => import("./locales/en/ai.json"),
  profile: () => import("./locales/en/profile.json"),
  settings: () => import("./locales/en/settings.json"),
});

const normalizeImportedResource = (module) => {
  const resource = module?.default ?? module;

  if (!resource || typeof resource !== "object") {
    return {};
  }

  return resource;
};

const loadLocalNamespace = async (
  languageCode,
  namespace
) => {
  const language = normalizeLanguageCode(languageCode);

  if (!AVAILABLE_NAMESPACES.includes(namespace)) {
    console.warn(
      `Unsupported translation namespace requested: "${namespace}"`
    );

    return {};
  }

  /*
   * English namespace files are the permanent fallback source.
   * Other languages continue using the legacy translation object
   * through the compatibility provider until their JSON resources
   * are migrated.
   */
  if (language !== DEFAULT_LANGUAGE) {
    const englishLoader =
      englishNamespaceLoaders[namespace];

    if (!englishLoader) {
      return {};
    }

    const englishModule = await englishLoader();

    return normalizeImportedResource(englishModule);
  }

  const loader = englishNamespaceLoaders[namespace];

  if (!loader) {
    return {};
  }

  const module = await loader();

  return normalizeImportedResource(module);
};

const detectedLanguage = normalizeLanguageCode(
  typeof window !== "undefined"
    ? window.localStorage.getItem(LANGUAGE_STORAGE_KEY) ||
        window.navigator.languages?.[0] ||
        window.navigator.language ||
        DEFAULT_LANGUAGE
    : DEFAULT_LANGUAGE
);

applyLanguageDirection(detectedLanguage);

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(
      resourcesToBackend(
        async (language, namespace) =>
          loadLocalNamespace(language, namespace)
      )
    )
    .use(initReactI18next)
    .init({
      fallbackLng: DEFAULT_LANGUAGE,

      supportedLngs: SUPPORTED_LANGUAGE_CODES,

      nonExplicitSupportedLngs: true,

      load: "languageOnly",

      ns: AVAILABLE_NAMESPACES,

      defaultNS: "common",

      fallbackNS: [
        "common",
        "navigation",
      ],

      preload: [],

      partialBundledLanguages: true,

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

        lookupLocalStorage: LANGUAGE_STORAGE_KEY,

        caches: [
          "localStorage",
        ],

        convertDetectedLanguage: (languageCode) =>
          normalizeLanguageCode(languageCode),
      },

      react: {
        useSuspense: false,
        bindI18n: "languageChanged loaded",
        bindI18nStore: "added removed",
        transSupportBasicHtmlNodes: true,
      },

      returnNull: false,

      returnEmptyString: false,

      saveMissing: false,

      debug: import.meta.env.DEV,

      initImmediate: true,
    })
    .catch((error) => {
      console.error(
        "Failed to initialize the global translation system:",
        error
      );
    });
}

i18n.on("languageChanged", (languageCode) => {
  const normalizedLanguage =
    normalizeLanguageCode(languageCode);

  try {
    window.localStorage.setItem(
      LANGUAGE_STORAGE_KEY,
      normalizedLanguage
    );
  } catch (error) {
    console.error(
      "Failed to persist the selected language:",
      error
    );
  }

  applyLanguageDirection(normalizedLanguage);
});

export const changeGlobalLanguage = async (
  languageCode
) => {
  const normalizedLanguage =
    normalizeLanguageCode(languageCode);

  await i18n.changeLanguage(normalizedLanguage);

  return normalizedLanguage;
};

export default i18n;