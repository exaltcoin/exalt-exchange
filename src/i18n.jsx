/*
 * Compatibility bridge for extensionless imports such as "../i18n".
 *
 * The application mounts the canonical provider from "./i18n/index.js".
 * This bridge makes all existing components use that same provider.
 *
 * The previous implementation is preserved in "./i18n.legacy.jsx"
 * for translation-reference migration only and is not mounted at runtime.
 */
export {
  I18nProvider,
  LANGUAGES,
  i18n,
  useI18n,
} from "./i18n/index.js";

export { default } from "./i18n/index.js";