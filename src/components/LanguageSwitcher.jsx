import { useI18n } from "../i18n";
import "./LanguageSwitcher.css";

export default function LanguageSwitcher() {
  const { lang, setLang, languages } = useI18n();
  const active = languages.find((item) => item.code === lang);

  return (
    <div className="language-box">
      <label>🌍 Language</label>

      <select
        value={lang}
        onChange={(e) => setLang(e.target.value)}
        className="language-select"
        title="Select language"
      >
        {languages.map((item) => (
          <option key={item.code} value={item.code}>
            {item.flag} {item.native} — {item.name}
          </option>
        ))}
      </select>

      <small className="language-active">
        Active: {active?.flag} {active?.native}
      </small>
    </div>
  );
}