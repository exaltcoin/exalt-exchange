import React, { useEffect, useState } from "react";
import PageShell from "./PageShell";
import { useI18n } from "../i18n";
import LanguageSwitcher from "./LanguageSwitcher";
import "./Settings.css";

function Settings({ setPage }) {
  const { t, lang, languages } = useI18n();

  const API_BASE =
    import.meta.env.VITE_API_URL ||
    "https://exalt-real-backend-6b6v.onrender.com";

  const API = API_BASE.endsWith("/api")
    ? API_BASE.replace("/api", "")
    : API_BASE;

  const [qrCode, setQrCode] = useState("");
  const [twoFaToken, setTwoFaToken] = useState("");
  const [twoFaEnabled, setTwoFaEnabled] = useState(false);
  const [backupCodes, setBackupCodes] = useState([]);
  const [loading2FA, setLoading2FA] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    setTwoFaEnabled(!!user.twoFactorEnabled);
  }, []);

  const getToken = () => localStorage.getItem("token");

  const goToKyc = () => {
    if (typeof setPage === "function") {
      setPage("kyc");
      return;
    }

    window.location.hash = "kyc";
  };

  const setup2FA = async () => {
    try {
      const token = getToken();

      if (!token) {
        alert(t("pleaseLoginFirst"));
        return;
      }

      setLoading2FA(true);

      const response = await fetch(`${API}/api/auth/2fa/setup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setQrCode(data.qrCode);
        setBackupCodes([]);
        alert(t("scanQrCodeAuthenticator"));
      } else {
        alert(data.message || t("twoFaSetupFailed"));
      }
    } catch (error) {
      console.log(error);
      alert(t("serverError"));
    } finally {
      setLoading2FA(false);
    }
  };

  const verify2FA = async () => {
    try {
      const token = getToken();

      if (!twoFaToken) {
        alert(t("enterAuthenticatorCode"));
        return;
      }

      setLoading2FA(true);

      const response = await fetch(`${API}/api/auth/2fa/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
        body: JSON.stringify({ token: twoFaToken }),
      });

      const data = await response.json();

      if (data.success) {
        const updatedUser = { ...user, twoFactorEnabled: true };
        localStorage.setItem("user", JSON.stringify(updatedUser));

        setTwoFaEnabled(true);
        setQrCode("");
        setTwoFaToken("");
        setBackupCodes(data.backupCodes || []);

        alert(t("googleAuthenticatorEnabled"));
      } else {
        alert(data.message || t("invalidCode"));
      }
    } catch (error) {
      console.log(error);
      alert(t("serverError"));
    } finally {
      setLoading2FA(false);
    }
  };

  const regenerateBackupCodes = async () => {
    try {
      const token = getToken();

      if (!twoFaToken) {
        alert(t("enterAuthenticatorCodeFirst"));
        return;
      }

      setLoading2FA(true);

      const response = await fetch(
        `${API}/api/auth/2fa/regenerate-backup-codes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token || ""}`,
          },
          body: JSON.stringify({ token: twoFaToken }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setBackupCodes(data.backupCodes || []);
        setTwoFaToken("");
        alert(t("newBackupCodesGenerated"));
      } else {
        alert(data.message || t("backupCodeFailed"));
      }
    } catch (error) {
      console.log(error);
      alert(t("serverError"));
    } finally {
      setLoading2FA(false);
    }
  };

  const disable2FA = async () => {
    try {
      const token = getToken();

      if (!twoFaToken) {
        alert(t("enterAuthenticatorCode"));
        return;
      }

      setLoading2FA(true);

      const response = await fetch(`${API}/api/auth/2fa/disable`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
        body: JSON.stringify({ token: twoFaToken }),
      });

      const data = await response.json();

      if (data.success) {
        const updatedUser = { ...user, twoFactorEnabled: false };
        localStorage.setItem("user", JSON.stringify(updatedUser));

        setTwoFaEnabled(false);
        setTwoFaToken("");
        setBackupCodes([]);
        alert(t("googleAuthenticatorDisabled"));
      } else {
        alert(data.message || t("invalidCode"));
      }
    } catch (error) {
      console.log(error);
      alert(t("serverError"));
    } finally {
      setLoading2FA(false);
    }
  };

  const activeLanguage =
    languages.find((item) => item.code === lang)?.native || "English";
const legalLinks = [
  ["📄", "Legal Center", "https://exaltexchange.io/legal"],
  ["🔒", "Privacy Policy", "https://exaltexchange.io/privacy"],
  ["📜", "Terms of Service", "https://exaltexchange.io/terms"],
  ["🗑️", "Delete Account", "https://exaltexchange.io/delete-account"],
  ["🛡️", "AML Policy", "https://exaltexchange.io/aml"],
  ["🪪", "KYC Policy", "https://exaltexchange.io/kyc-policy"],
  ["⚠️", "Risk Disclosure", "https://exaltexchange.io/risk"],
  ["🍪", "Cookie Policy", "https://exaltexchange.io/cookies"],
  ["💰", "Refund Policy", "https://exaltexchange.io/refund"],
  ["✅", "Compliance Statement", "https://exaltexchange.io/compliance"],
];
  return (
    <PageShell titleKey="settingsSecurity" subtitleKey="settingsSecuritySubtitle">
      <div className="settings-page">
        <div className="settings-overview-grid">
          <div className="settings-status-card secure">
            <span>{t("accountStatus")}</span>
            <h2>{t("active")}</h2>
            <p>{t("accountStatusText")}</p>
          </div>

          <div className="settings-status-card">
            <span>{t("kycStatus")}</span>
            <h2>{user.kycStatus || t("notVerified")}</h2>
            <p>{t("kycStatusText")}</p>
            <button onClick={goToKyc}>{t("goToKycVerification")}</button>
          </div>

          <div className={`settings-status-card ${twoFaEnabled ? "secure" : "danger"}`}>
            <span>{t("twoFactorSecurity")}</span>
            <h2>{twoFaEnabled ? t("enabled") : t("disabled")}</h2>
            <p>{t("twoFactorSecurityText")}</p>
          </div>
        </div>

        <div className="settings-grid">
          <div className="settings-card">
            <div className="settings-card-head">
              <div>
                <h2>{t("languagePreferences")}</h2>
                <p>{t("languagePreferencesText")}</p>
              </div>
              <span>{activeLanguage}</span>
            </div>

            <LanguageSwitcher />
          </div>

          <div className="settings-card">
            <div className="settings-card-head">
              <div>
                <h2>{t("accountInformation")}</h2>
                <p>{t("accountInformationText")}</p>
              </div>
            </div>

            <div className="settings-info-list">
              <div>
                <span>{t("name")}</span>
                <strong>{user.name || user.fullName || "N/A"}</strong>
              </div>

              <div>
                <span>{t("emailAddress")}</span>
                <strong>{user.email || "N/A"}</strong>
              </div>

              <div>
                <span>{t("role")}</span>
                <strong>{user.role || "user"}</strong>
              </div>

              <div>
                <span>{t("userId")}</span>
                <strong>{user._id || user.id || "N/A"}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-card twofa-card">
          <div className="settings-card-head">
            <div>
              <h2>{t("googleAuthenticator2fa")}</h2>
              <p>{t("googleAuthenticator2faText")}</p>
            </div>

            <span className={twoFaEnabled ? "status-pill enabled" : "status-pill disabled"}>
              {twoFaEnabled ? t("enabled") : t("disabled")}
            </span>
          </div>

          {!twoFaEnabled ? (
            <div className="twofa-setup-box">
              <button className="settings-primary-btn" onClick={setup2FA} disabled={loading2FA}>
                {loading2FA ? t("loading") : t("setupGoogleAuthenticator")}
              </button>

              {qrCode && (
                <div className="twofa-qr-section">
                  <img src={qrCode} alt="Google Authenticator QR Code" />

                  <input
                    type="text"
                    placeholder={t("enterSixDigitCode")}
                    value={twoFaToken}
                    onChange={(e) => setTwoFaToken(e.target.value)}
                  />

                  <button className="settings-primary-btn" onClick={verify2FA} disabled={loading2FA}>
                    {t("verifyAndEnable")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="twofa-enabled-box">
              <input
                type="text"
                placeholder={t("enterAuthenticatorCode")}
                value={twoFaToken}
                onChange={(e) => setTwoFaToken(e.target.value)}
              />

              <div className="settings-action-row">
                <button
                  className="settings-primary-btn"
                  onClick={regenerateBackupCodes}
                  disabled={loading2FA}
                >
                  {t("regenerateBackupCodes")}
                </button>

                <button
                  className="settings-danger-btn"
                  onClick={disable2FA}
                  disabled={loading2FA}
                >
                  {t("disable2fa")}
                </button>
              </div>
            </div>
          )}

          {backupCodes.length > 0 && (
            <div className="backup-codes-box">
              <h3>{t("saveBackupCodes")}</h3>
              <p>{t("backupCodesWarning")}</p>

              <div className="backup-codes-grid">
                {backupCodes.map((code, index) => (
                  <div key={index}>{code}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="settings-grid">
          <div className="settings-card">
            <h2>{t("notificationPreferences")}</h2>
            <p>{t("notificationPreferencesText")}</p>

            <div className="settings-toggle-list">
              <div>
                <span>{t("securityAlerts")}</span>
                <b>{t("enabled")}</b>
              </div>

              <div>
                <span>{t("depositWithdrawalAlerts")}</span>
                <b>{t("enabled")}</b>
              </div>

              <div>
                <span>{t("p2pOrderAlerts")}</span>
                <b>{t("enabled")}</b>
              </div>
            </div>
          </div>

          <div className="settings-card">
            <h2>{t("securityRules")}</h2>

            <div className="settings-rule-list">
              <p>✅ {t("settingRuleKyc")}</p>
              <p>✅ {t("settingRuleManualReview")}</p>
              <p>✅ {t("settingRuleWalletMatch")}</p>
              <p>✅ {t("settingRuleBotProtection")}</p>
              <p>✅ {t("settingRuleDepositReview")}</p>
            </div>
          </div>
        </div>
        <div className="settings-card">
          <div className="settings-card-head">
            <div>
              <h2>Legal & Compliance</h2>
              <p>
                Review Exalt Exchange policies, user protection terms, compliance
                documents, and risk disclosures.
              </p>
            </div>
          </div>

          <div className="settings-info-list">
            {legalLinks.map(([icon, label, href]) => (
              <div key={href}>
                <span>
                  {icon} {label}
                </span>
                <a href={href} className="settings-legal-link">
                  Open
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}

export default Settings;