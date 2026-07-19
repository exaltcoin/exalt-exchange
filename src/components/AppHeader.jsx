import PropTypes from "prop-types";

import exchangeLogo from "../assets/exalt-exchange-logo.png";
import { useI18n } from "../i18n/index.js";
import LanguageSwitcher from "./LanguageSwitcher";
import NotificationBell from "./NotificationBell";
import "./AppHeader.css";

function AppHeader({
  title = "Exalt Exchange",
  subtitle = "Secure • Fast • Global Digital Asset Exchange",
  setPage,
  onLogout,
  showLogo = true,
  showLanguage = true,
  showNotifications = true,
  showProfile = true,
  showLogout = true,
  compact = false,
  className = "",
}) {
  const { t } = useI18n();

  const translateWithFallback = (
    key,
    fallback,
    namespace = "common"
  ) => {
    try {
      const translatedValue = t(key, {
        ns: namespace,
        defaultValue: fallback,
      });

      if (
        translatedValue === undefined ||
        translatedValue === null ||
        translatedValue === key ||
        String(translatedValue).trim() === ""
      ) {
        return fallback;
      }

      return translatedValue;
    } catch (error) {
      console.error(
        `AppHeader translation failed for "${key}":`,
        error
      );

      return fallback;
    }
  };

  const handleProfile = () => {
    if (typeof setPage === "function") {
      setPage("profile");
    }
  };

  const handleLogout = () => {
    if (typeof onLogout === "function") {
      onLogout();
      return;
    }

    const confirmed = window.confirm(
      translateWithFallback(
        "logoutConfirmation",
        "Are you sure you want to logout?",
        "auth"
      )
    );

    if (!confirmed) {
      return;
    }

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("wallet");
    localStorage.removeItem("walletAddress");

    window.location.href = "/";
  };

  return (
    <header
      className={[
        "app-header",
        compact ? "app-header-compact" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="app-header-main">
        <div className="app-header-brand">
          {showLogo && (
            <img
              src={exchangeLogo}
              alt="Exalt Exchange"
              className="app-header-logo"
            />
          )}

          <div className="app-header-copy">
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
        </div>

        <div className="app-header-actions">
          {showNotifications &&
            typeof setPage === "function" && (
              <NotificationBell setPage={setPage} />
            )}

          {showProfile &&
            typeof setPage === "function" && (
              <button
                type="button"
                className="app-header-icon-btn"
                aria-label={translateWithFallback(
                  "profile",
                  "Profile",
                  "navigation"
                )}
                title={translateWithFallback(
                  "profile",
                  "Profile",
                  "navigation"
                )}
                onClick={handleProfile}
              >
                👤
              </button>
            )}

          {showLogout && (
            <button
              type="button"
              className="app-header-logout-btn"
              onClick={handleLogout}
            >
              {translateWithFallback(
                "logout",
                "Logout",
                "auth"
              )}
            </button>
          )}
        </div>
      </div>

      {showLanguage && (
        <div className="app-header-language-row">
          <LanguageSwitcher
            compact={compact}
            showActiveLanguage={!compact}
          />
        </div>
      )}
    </header>
  );
}

AppHeader.propTypes = {
  title: PropTypes.node,
  subtitle: PropTypes.node,
  setPage: PropTypes.func,
  onLogout: PropTypes.func,
  showLogo: PropTypes.bool,
  showLanguage: PropTypes.bool,
  showNotifications: PropTypes.bool,
  showProfile: PropTypes.bool,
  showLogout: PropTypes.bool,
  compact: PropTypes.bool,
  className: PropTypes.string,
};

export default AppHeader;