export const THEME_STORAGE_KEY = "exalt_theme";
export const DEFAULT_THEME = "dark";
export const SUPPORTED_THEMES = Object.freeze(["dark", "light"]);

const canUseStorage = () =>
  typeof window !== "undefined" &&
  typeof window.localStorage !== "undefined";

export const normalizeTheme = (theme) => {
  const normalized = String(theme || "").toLowerCase();
  return SUPPORTED_THEMES.includes(normalized)
    ? normalized
    : DEFAULT_THEME;
};

const detectSystemTheme = () => {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return DEFAULT_THEME;
  }

  try {
    return window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  } catch (error) {
    return DEFAULT_THEME;
  }
};

export const readThemeFromStorage = () => {
  if (!canUseStorage()) {
    return detectSystemTheme();
  }

  try {
    const storedTheme = window.localStorage.getItem(
      THEME_STORAGE_KEY
    );

    if (storedTheme) {
      return normalizeTheme(storedTheme);
    }

    return detectSystemTheme();
  } catch (error) {
    console.error(
      "Unable to read theme preference:",
      error
    );

    return DEFAULT_THEME;
  }
};

export const saveThemeToStorage = (theme) => {
  const normalizedTheme = normalizeTheme(theme);

  if (!canUseStorage()) {
    return normalizedTheme;
  }

  try {
    window.localStorage.setItem(
      THEME_STORAGE_KEY,
      normalizedTheme
    );
  } catch (error) {
    console.error(
      "Unable to save theme preference:",
      error
    );
  }

  return normalizedTheme;
};

export const applyThemeToDocument = (theme) => {
  const normalizedTheme = normalizeTheme(theme);

  if (typeof document !== "undefined" && document.documentElement) {
    document.documentElement.setAttribute(
      "data-theme",
      normalizedTheme
    );
  }

  return normalizedTheme;
};
