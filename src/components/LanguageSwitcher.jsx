import { useMemo } from "react";
import { useI18n } from "../i18n";
import "./LanguageSwitcher.css";

function LanguageSwitcher({
  compact = false,
  showActiveLanguage = true,
  className = "",
}) {
  const {
    currentLanguage = "en",
    languages = [],
    changeLanguage,
    t,
  } = useI18n();

  const activeLanguage = useMemo(
    () =>
      languages.find(
        (language) =>
          language.code === currentLanguage
      ) || null,
    [languages, currentLanguage]
  );

  const handleLanguageChange = async (event) => {
    const nextLanguage = String(
      event.target.value || ""
    ).trim();

    if (!nextLanguage) {
      return;
    }

    if (typeof changeLanguage !== "function") {
      console.error(
        "LanguageSwitcher: changeLanguage is unavailable."
      );
      return;
    }

    try {
      await changeLanguage(nextLanguage);
    } catch (error) {
      console.error(
        "LanguageSwitcher: failed to change language.",
        error
      );
    }
  };

  const translatedLanguageLabel =
    typeof t === "function"
      ? t("language", {
          defaultValue: "Language",
        })
      : "Language";

  if (!Array.isArray(languages)) {
    console.error(
      "LanguageSwitcher: languages must be an array."
    );
    return null;
  }

  return (
    <div
      className={[
        "language-box",
        compact
          ? "language-box-compact"
          : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <label
        htmlFor="global-language-select"
        className="language-label"
      >
        <span
          className="language-label-icon"
          aria-hidden="true"
        >
          🌍
        </span>

        <span>
          {translatedLanguageLabel}
        </span>
      </label>

      <div className="language-select-wrapper">
        <select
          id="global-language-select"
          className="language-select"
          value={currentLanguage}
          onChange={handleLanguageChange}
          aria-label={translatedLanguageLabel}
          disabled={languages.length === 0}
        >
          {languages.map((language) => {
            const code = String(
              language.code || ""
            ).trim();

            if (!code) {
              return null;
            }

            const nativeName =
              language.native ||
              language.name ||
              code.toUpperCase();

            const englishName =
              language.name &&
              language.name !== nativeName
                ? ` — ${language.name}`
                : "";

            return (
              <option
                key={code}
                value={code}
              >
                {language.flag
                  ? `${language.flag} `
                  : ""}
                {nativeName}
                {englishName}
              </option>
            );
          })}
        </select>

        <span
          className="language-select-arrow"
          aria-hidden="true"
        >
          ▾
        </span>
      </div>

      {showActiveLanguage &&
        activeLanguage && (
          <small className="language-active">
            <span aria-hidden="true">
              {activeLanguage.flag || "🌐"}
            </span>

            <span>
              {activeLanguage.native ||
                activeLanguage.name ||
                activeLanguage.code}
            </span>
          </small>
        )}
    </div>
  );
}

export default LanguageSwitcher;