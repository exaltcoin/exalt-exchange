import { useI18n } from "../i18n";
import LanguageSwitcher from "./LanguageSwitcher";
import "./PageShell.css";

export default function PageShell({ titleKey, subtitleKey, children }) {
  const { t, dir } = useI18n();

  return (
    <div className={`page-shell ${dir === "rtl" ? "rtl-page" : ""}`}>
      <div className="page-shell-header">
        <div>
          <h1>{t(titleKey)}</h1>
          {subtitleKey && <p>{t(subtitleKey)}</p>}
        </div>

        <div className="page-shell-lang">
          <LanguageSwitcher />
        </div>
      </div>

      <div className="page-shell-content">
        {children}
      </div>
    </div>
  );
}