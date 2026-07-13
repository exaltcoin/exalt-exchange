import { useMemo } from "react";
import { useI18n } from "../i18n";
import "./LanguageSwitcher.css";

export default function LanguageSwitcher() {
  const {
    currentLanguage,
    languages,
    changeLanguage,
    t,
  } = useI18n();

  const activeLanguage = useMemo(
    () =>
      languages.find(
        (language) => language.code === currentLanguage
      ),
    [languages, currentLanguage]
  );

  return (
    <div className="language-box">
      <label htmlFor="global-language-select">
        🌍 {t("language")}
      </label>

      <select
        id="global-language-select"
        className="language-select"
        value={currentLanguage}
        onChange={(event) =>
          changeLanguage(event.target.value)
        }
        aria-label={t("language")}
      >
        {languages.map((language) => (
          <option
            key={language.code}
            value={language.code}
          >
            {language.flag} {language.native} — {language.name}
          </option>
        ))}
      </select>

      <small className="language-active">
        {activeLanguage
          ? `${activeLanguage.flag} ${activeLanguage.native}`
          : ""}
      </small>
    </div>
  );
}