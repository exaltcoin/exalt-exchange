import { useI18n } from "../i18n";
import "./LanguageSwitcher.css";

export default function LanguageSwitcher() {
  const { lang, setLang, languages } = useI18n();

  return (
    <div className="language-box">
      <label>🌍 Language</label>

      <select
        value={lang}
        onChange={(e) => setLang(e.target.value)}
        className="language-select"
      >
        {languages.map((item) => (
          <option key={item.code} value={item.code}>
            {item.flag} {item.native} — {item.name}
          </option>
        ))}
      </select>
    </div>
  );
}