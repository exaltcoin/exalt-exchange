import {
  DEFAULT_LANGUAGE,
  getLanguageDirection,
  normalizeLanguageCode,
} from "./languages";

const SAFE_DIRECTION_VALUES = new Set(["ltr", "rtl"]);

export const normalizeDirection = (direction) =>
  SAFE_DIRECTION_VALUES.has(direction) ? direction : "ltr";

export const resolveLanguageDirection = (languageCode) => {
  const normalizedLanguage =
    normalizeLanguageCode(languageCode || DEFAULT_LANGUAGE);

  return normalizeDirection(
    getLanguageDirection(normalizedLanguage)
  );
};

export const applyLanguageDirection = (languageCode) => {
  const normalizedLanguage =
    normalizeLanguageCode(languageCode || DEFAULT_LANGUAGE);

  const direction =
    resolveLanguageDirection(normalizedLanguage);

  if (typeof document === "undefined") {
    return {
      language: normalizedLanguage,
      direction,
    };
  }

  const htmlElement = document.documentElement;
  const bodyElement = document.body;

  htmlElement.setAttribute("lang", normalizedLanguage);
  htmlElement.setAttribute("dir", direction);
  htmlElement.dataset.language = normalizedLanguage;
  htmlElement.dataset.direction = direction;

  if (bodyElement) {
    bodyElement.setAttribute("dir", direction);
    bodyElement.dataset.language = normalizedLanguage;
    bodyElement.dataset.direction = direction;
  }

  return {
    language: normalizedLanguage,
    direction,
  };
};

export const isRtlLanguage = (languageCode) =>
  resolveLanguageDirection(languageCode) === "rtl";

export const isLtrLanguage = (languageCode) =>
  resolveLanguageDirection(languageCode) === "ltr";

export const getDirectionalClassName = (languageCode) =>
  isRtlLanguage(languageCode) ? "is-rtl" : "is-ltr";

export const getDirectionalTextAlign = (languageCode) =>
  isRtlLanguage(languageCode) ? "right" : "left";

export default {
  normalizeDirection,
  resolveLanguageDirection,
  applyLanguageDirection,
  isRtlLanguage,
  isLtrLanguage,
  getDirectionalClassName,
  getDirectionalTextAlign,
};