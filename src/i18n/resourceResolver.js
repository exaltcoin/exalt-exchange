/*
 * Pure translation-resource resolution logic.
 *
 * This module intentionally contains NO Vite-specific APIs
 * (no `import.meta.glob`) so it can be imported directly by
 * plain Node test runners as well as by the Vite-built app.
 *
 * `config.js` is the only caller that discovers files via
 * `import.meta.glob` at build time; it then delegates the actual
 * "which resource for this language+namespace, falling back to
 * English" decision to `resolveNamespaceResource` below. Tests
 * exercise the exact same function against real files read from
 * disk, so this is the real runtime resolution path, not a
 * reimplementation of it.
 */
import { DEFAULT_LANGUAGE, normalizeLanguageCode } from "./languages.js";

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

export const normalizeImportedResource = (importedModule) => {
  const resource = importedModule?.default ?? importedModule;

  if (!resource || typeof resource !== "object" || Array.isArray(resource)) {
    return {};
  }

  return resource;
};

/*
 * localeModules is expected in the same shape `import.meta.glob`
 * produces: a flat object keyed by relative path, e.g.
 *   { "./locales/ur/futures.json": { ...parsed JSON... } }
 */
export const resolveNamespaceResource = (
  languageCode,
  namespace,
  localeModules
) => {
  const language = normalizeLanguageCode(languageCode);

  if (!AVAILABLE_NAMESPACES.includes(namespace)) {
    console.warn(`Unsupported translation namespace: "${namespace}"`);
    return {};
  }

  const requestedPath = `./locales/${language}/${namespace}.json`;
  const englishFallbackPath = `./locales/${DEFAULT_LANGUAGE}/${namespace}.json`;

  /*
   * First load the selected language.
   */
  const requestedResource = localeModules[requestedPath];

  if (requestedResource) {
    try {
      return normalizeImportedResource(requestedResource);
    } catch (error) {
      console.error(
        `Failed to load ${language}/${namespace}.json:`,
        error
      );
    }
  }

  /*
   * If the selected language file does not exist (or the specific
   * key isn't present in it), safely fall back to English.
   */
  const englishResource = localeModules[englishFallbackPath];

  if (englishResource) {
    try {
      return normalizeImportedResource(englishResource);
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
