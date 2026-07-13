import {
  DEFAULT_LANGUAGE,
  normalizeLanguageCode,
} from "./languages";

import {
  DEFAULT_NAMESPACE,
  normalizeNamespace,
} from "./namespaces";

const translationLoaders = {
  en: {
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
    admin: () => import("./locales/en/admin.json"),
    security: () => import("./locales/en/security.json"),
    notifications: () =>
      import("./locales/en/notifications.json"),
    support: () => import("./locales/en/support.json"),
    legal: () => import("./locales/en/legal.json"),
  },
};

const translationCache = new Map();

const getCacheKey = (languageCode, namespace) =>
  `${languageCode}:${namespace}`;

const normalizeModuleData = (module) => {
  if (!module) {
    return {};
  }

  const data = module.default ?? module;

  return data && typeof data === "object" ? data : {};
};

export const hasTranslationLoader = (
  languageCode,
  namespace
) => {
  const language =
    normalizeLanguageCode(languageCode);

  const normalizedNamespace =
    normalizeNamespace(namespace);

  return Boolean(
    translationLoaders[language]?.[normalizedNamespace]
  );
};

export const loadTranslationNamespace = async (
  languageCode,
  namespace = DEFAULT_NAMESPACE
) => {
  const language =
    normalizeLanguageCode(languageCode);

  const normalizedNamespace =
    normalizeNamespace(namespace);

  const cacheKey = getCacheKey(
    language,
    normalizedNamespace
  );

  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  const loader =
    translationLoaders[language]?.[normalizedNamespace];

  if (!loader) {
    if (language !== DEFAULT_LANGUAGE) {
      return loadTranslationNamespace(
        DEFAULT_LANGUAGE,
        normalizedNamespace
      );
    }

    return {};
  }

  const loadingPromise = loader()
    .then(normalizeModuleData)
    .catch((error) => {
      console.error(
        `Failed to load translation namespace "${normalizedNamespace}" for "${language}":`,
        error
      );

      translationCache.delete(cacheKey);

      if (language !== DEFAULT_LANGUAGE) {
        return loadTranslationNamespace(
          DEFAULT_LANGUAGE,
          normalizedNamespace
        );
      }

      return {};
    });

  translationCache.set(cacheKey, loadingPromise);

  return loadingPromise;
};

export const loadTranslationNamespaces = async (
  languageCode,
  namespaces = [DEFAULT_NAMESPACE]
) => {
  const language =
    normalizeLanguageCode(languageCode);

  const normalizedNamespaces = [
    ...new Set(
      namespaces.map((namespace) =>
        normalizeNamespace(namespace)
      )
    ),
  ];

  const entries = await Promise.all(
    normalizedNamespaces.map(async (namespace) => {
      const translations =
        await loadTranslationNamespace(
          language,
          namespace
        );

      return [namespace, translations];
    })
  );

  return Object.fromEntries(entries);
};

export const clearTranslationCache = () => {
  translationCache.clear();
};

export const clearLanguageTranslationCache = (
  languageCode
) => {
  const language =
    normalizeLanguageCode(languageCode);

  for (const key of translationCache.keys()) {
    if (key.startsWith(`${language}:`)) {
      translationCache.delete(key);
    }
  }
};

export default {
  hasTranslationLoader,
  loadTranslationNamespace,
  loadTranslationNamespaces,
  clearTranslationCache,
  clearLanguageTranslationCache,
};