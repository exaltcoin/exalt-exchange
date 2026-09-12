import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Browser } from "@capacitor/browser";

import PageShell from "./PageShell";
import { useI18n } from "../i18n";
import LanguageSwitcher from "./LanguageSwitcher";

import "./Settings.css";

/* =========================================================
   API CONFIGURATION
========================================================= */

const RAW_API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://exalt-real-backend-6b6v.onrender.com";

const API = RAW_API_BASE
  .trim()
  .replace(/\/+$/, "")
  .replace(/\/api$/, "");

/* =========================================================
   HELPERS
========================================================= */

const readStoredUser = () => {
  try {
    return JSON.parse(
      localStorage.getItem("user") ||
        "{}"
    );
  } catch (error) {
    console.error(
      "Unable to read stored user:",
      error
    );

    return {};
  }
};

const normalizeUser = (user = {}) => {
  const role =
    String(user.role || "user")
      .trim()
      .toLowerCase();

  return {
    ...user,

    id:
      user.id ||
      user._id ||
      "",

    uid:
      user.uid
        ? String(user.uid)
        : "",

    role,

    isOwner:
      user.isOwner === true ||
      role === "owner",

    isAdmin:
      user.isAdmin === true ||
      [
        "admin",
        "super_admin",
        "owner",
      ].includes(role),

    isActive:
      user.isActive !== false,

    isBlocked:
      user.isBlocked === true,

    accountStatus:
      user.accountStatus ||
      "Active",

    isEmailVerified:
      user.isEmailVerified === true,

    twoFactorEnabled:
      user.twoFactorEnabled ===
      true,

    adminTwoFactorRequired:
      user.adminTwoFactorRequired ===
      true,

    withdrawalTwoFactorRequired:
      user
        .withdrawalTwoFactorRequired ===
      true,
  };
};

const parseApiResponse = async (
  response
) => {
  const contentType =
    response.headers.get(
      "content-type"
    ) || "";

  if (
    contentType.includes(
      "application/json"
    )
  ) {
    return response.json();
  }

  const text =
    await response.text();

  throw new Error(
    text ||
      `Server returned ${response.status}`
  );
};

/* =========================================================
   COMPONENT
========================================================= */

function Settings({
  setPage,
}) {
  const {
    t,
    lang,
    languages,
  } = useI18n();

  const [user, setUser] =
    useState(() =>
      normalizeUser(
        readStoredUser()
      )
    );

  const [qrCode, setQrCode] =
    useState("");

  const [manualSecret, setManualSecret] =
    useState("");

  const [
    twoFaToken,
    setTwoFaToken,
  ] = useState("");

  const [
    twoFaEnabled,
    setTwoFaEnabled,
  ] = useState(
    user.twoFactorEnabled === true
  );

  const [
    backupCodes,
    setBackupCodes,
  ] = useState([]);

  const [
    loading2FA,
    setLoading2FA,
  ] = useState(false);

  const [
    refreshingUser,
    setRefreshingUser,
  ] = useState(false);

  const token =
    localStorage.getItem(
      "token"
    );

  const hasAdminAccess =
    user.isAdmin === true ||
    user.isOwner === true ||
    [
      "admin",
      "super_admin",
      "owner",
    ].includes(user.role);

  const isProtectedOwner =
    user.isOwner === true ||
    user.role === "owner";

  const owner2FAMandatory =
    isProtectedOwner ||
    user.adminTwoFactorRequired ===
      true;

  /* =========================================================
     SAVE USER
  ========================================================= */

  const saveUser = useCallback(
    (nextUser) => {
      const normalized =
        normalizeUser(
          nextUser
        );

      setUser(normalized);

      setTwoFaEnabled(
        normalized
          .twoFactorEnabled ===
          true
      );

      localStorage.setItem(
        "user",
        JSON.stringify(
          normalized
        )
      );

      return normalized;
    },
    []
  );

  /* =========================================================
     AUTHENTICATED FETCH
  ========================================================= */

  const authenticatedFetch =
    useCallback(
      async (
        path,
        options = {}
      ) => {
        const activeToken =
          localStorage.getItem(
            "token"
          );

        if (!activeToken) {
          throw new Error(
            "Please login first"
          );
        }

        const response =
          await fetch(
            `${API}${path}`,
            {
              ...options,

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${activeToken}`,

                ...options.headers,
              },
            }
          );

        const data =
          await parseApiResponse(
            response
          );

        if (
          response.status === 401
        ) {
          localStorage.removeItem(
            "token"
          );

          localStorage.removeItem(
            "user"
          );

          throw new Error(
            data.message ||
              "Session expired. Please login again."
          );
        }

        return {
          response,
          data,
        };
      },
      []
    );

  /* =========================================================
     REFRESH CURRENT USER
  ========================================================= */

  const refreshCurrentUser =
    useCallback(
      async ({
        silent = false,
      } = {}) => {
        if (!token) {
          return;
        }

        try {
          if (!silent) {
            setRefreshingUser(
              true
            );
          }

          const {
            response,
            data,
          } =
            await authenticatedFetch(
              "/api/auth/me",
              {
                method: "GET",
              }
            );

          if (
            response.ok &&
            data.success &&
            data.user
          ) {
            saveUser(
              data.user
            );
          }
        } catch (error) {
          console.error(
            "Unable to refresh user:",
            error
          );

          if (!silent) {
            alert(
              error.message ||
                t("serverError")
            );
          }
        } finally {
          if (!silent) {
            setRefreshingUser(
              false
            );
          }
        }
      },
      [
        authenticatedFetch,
        saveUser,
        t,
        token,
      ]
    );

  useEffect(() => {
    refreshCurrentUser({
      silent: true,
    });
  }, [refreshCurrentUser]);

  /* =========================================================
     NAVIGATION
  ========================================================= */

  const goToKyc = () => {
    if (
      typeof setPage ===
      "function"
    ) {
      setPage("kyc");
      return;
    }

    window.location.hash =
      "kyc";
  };

  const goToAdminPanel =
    () => {
      if (
        !hasAdminAccess
      ) {
        alert(
          "Admin access required"
        );
        return;
      }

      if (
        typeof setPage ===
        "function"
      ) {
        setPage("admin");
        return;
      }

      window.location.hash =
        "admin";
    };

  const goToProfile = () => {
    if (
      typeof setPage ===
      "function"
    ) {
      setPage("profile");
      return;
    }

    window.location.hash =
      "profile";
  };

  /* =========================================================
     2FA SETUP
  ========================================================= */

  const setup2FA = async () => {
    try {
      if (!token) {
        alert(
          t(
            "pleaseLoginFirst"
          )
        );
        return;
      }

      setLoading2FA(true);
      setQrCode("");
      setManualSecret("");
      setTwoFaToken("");
      setBackupCodes([]);

      const {
        response,
        data,
      } =
        await authenticatedFetch(
          "/api/auth/2fa/setup",
          {
            method: "POST",
          }
        );

      if (
        response.ok &&
        data.success
      ) {
        setQrCode(
          data.qrCode || ""
        );

        setManualSecret(
          data.secret || ""
        );

        alert(
          t(
            "scanQrCodeAuthenticator"
          )
        );

        return;
      }

      alert(
        data.message ||
          t(
            "twoFaSetupFailed"
          )
      );
    } catch (error) {
      console.error(
        "2FA setup error:",
        error
      );

      alert(
        error.message ||
          t("serverError")
      );
    } finally {
      setLoading2FA(false);
    }
  };

  /* =========================================================
     VERIFY AND ENABLE 2FA
  ========================================================= */

  const verify2FA = async () => {
    try {
      const cleanCode =
        twoFaToken
          .replace(/\D/g, "")
          .slice(0, 6);

      if (
        cleanCode.length !== 6
      ) {
        alert(
          t(
            "enterAuthenticatorCode"
          )
        );
        return;
      }

      setLoading2FA(true);

      const {
        response,
        data,
      } =
        await authenticatedFetch(
          "/api/auth/2fa/verify",
          {
            method: "POST",

            body:
              JSON.stringify({
                token:
                  cleanCode,
              }),
          }
        );

      if (
        response.ok &&
        data.success
      ) {
        const updatedUser =
          saveUser({
            ...user,
            twoFactorEnabled:
              true,
          });

        setTwoFaEnabled(true);
        await refreshCurrentUser();
        setQrCode("");
        setManualSecret("");
        setTwoFaToken("");

        setBackupCodes(
          Array.isArray(
            data.backupCodes
          )
            ? data.backupCodes
            : []
        );

        localStorage.removeItem(
          "require2FASetup"
        );

        console.log(
          "2FA enabled for:",
          updatedUser.email
        );

        alert(
          t(
            "googleAuthenticatorEnabled"
          )
        );

        return;
      }

      alert(
        data.message ||
          t("invalidCode")
      );
    } catch (error) {
      console.error(
        "2FA verify error:",
        error
      );

      alert(
        error.message ||
          t("serverError")
      );
    } finally {
      setLoading2FA(false);
    }
  };

  /* =========================================================
     REGENERATE BACKUP CODES
  ========================================================= */

  const regenerateBackupCodes =
    async () => {
      try {
        const cleanCode =
          twoFaToken
            .replace(/\D/g, "")
            .slice(0, 6);

        if (
          cleanCode.length !== 6
        ) {
          alert(
            t(
              "enterAuthenticatorCodeFirst"
            )
          );
          return;
        }

        setLoading2FA(true);

        const {
          response,
          data,
        } =
          await authenticatedFetch(
            "/api/auth/2fa/regenerate-backup-codes",
            {
              method: "POST",

              body:
                JSON.stringify({
                  token:
                    cleanCode,
                }),
            }
          );

        if (
          response.ok &&
          data.success
        ) {
          setBackupCodes(
            Array.isArray(
              data.backupCodes
            )
              ? data.backupCodes
              : []
          );

          setTwoFaToken("");

          alert(
            t(
              "newBackupCodesGenerated"
            )
          );

          return;
        }

        alert(
          data.message ||
            t(
              "backupCodeFailed"
            )
        );
      } catch (error) {
        console.error(
          "Backup-code regeneration error:",
          error
        );

        alert(
          error.message ||
            t("serverError")
        );
      } finally {
        setLoading2FA(false);
      }
    };

  /* =========================================================
     DISABLE 2FA
  ========================================================= */

  const disable2FA = async () => {
    try {
      if (
        owner2FAMandatory
      ) {
        alert(
          "Google 2FA is mandatory for Owner and protected Admin accounts and cannot be disabled."
        );
        return;
      }

      const cleanCode =
        twoFaToken
          .replace(/\D/g, "")
          .slice(0, 6);

      if (
        cleanCode.length !== 6
      ) {
        alert(
          t(
            "enterAuthenticatorCode"
          )
        );
        return;
      }

      const confirmed =
        window.confirm(
          "Are you sure you want to disable Google Authenticator?"
        );

      if (!confirmed) {
        return;
      }

      setLoading2FA(true);

      const {
        response,
        data,
      } =
        await authenticatedFetch(
          "/api/auth/2fa/disable",
          {
            method: "POST",

            body:
              JSON.stringify({
                token:
                  cleanCode,
              }),
          }
        );

      if (
        response.ok &&
        data.success
      ) {
        saveUser({
          ...user,
          twoFactorEnabled:
            false,
        });

        setTwoFaEnabled(false);
        await refreshCurrentUser();
        setQrCode("");
        setManualSecret("");
        setTwoFaToken("");
        setBackupCodes([]);

        alert(
          t(
            "googleAuthenticatorDisabled"
          )
        );

        return;
      }

      alert(
        data.message ||
          t("invalidCode")
      );
    } catch (error) {
      console.error(
        "2FA disable error:",
        error
      );

      alert(
        error.message ||
          t("serverError")
      );
    } finally {
      setLoading2FA(false);
    }
  };

  /* =========================================================
     BACKUP CODE ACTIONS
  ========================================================= */

  const copyBackupCodes =
    async () => {
      if (
        backupCodes.length === 0
      ) {
        return;
      }

      const text =
        [
          "EXALT EXCHANGE 2FA BACKUP CODES",
          "",
          ...backupCodes,
          "",
          "Each code can only be used once.",
        ].join("\n");

      try {
        await navigator.clipboard.writeText(
          text
        );

        alert(
          "Backup codes copied."
        );
      } catch (error) {
        console.error(
          "Unable to copy backup codes:",
          error
        );

        alert(
          "Unable to copy backup codes."
        );
      }
    };

  const downloadBackupCodes =
    () => {
      if (
        backupCodes.length === 0
      ) {
        return;
      }

      const text =
        [
          "EXALT EXCHANGE",
          "GOOGLE AUTHENTICATOR BACKUP CODES",
          "",
          `Account: ${
            user.email || "N/A"
          }`,
          `Created: ${new Date().toISOString()}`,
          "",
          ...backupCodes,
          "",
          "IMPORTANT:",
          "Each backup code may only be used once.",
          "Store this file offline and never share it.",
        ].join("\n");

      const blob =
        new Blob(
          [text],
          {
            type:
              "text/plain;charset=utf-8",
          }
        );

      const url =
        URL.createObjectURL(
          blob
        );

      const anchor =
        document.createElement(
          "a"
        );

      anchor.href = url;

      anchor.download =
        "exalt-exchange-2fa-backup-codes.txt";

      document.body.appendChild(
        anchor
      );

      anchor.click();
      anchor.remove();

      URL.revokeObjectURL(
        url
      );
    };

  const copyManualSecret =
    async () => {
      if (!manualSecret) {
        return;
      }

      try {
        await navigator.clipboard.writeText(
          manualSecret
        );

        alert(
          "Authenticator secret copied."
        );
      } catch (error) {
        console.error(
          "Unable to copy secret:",
          error
        );
      }
    };

  /* =========================================================
     LEGAL LINKS
  ========================================================= */

  const legalLinks =
    useMemo(
      () => [
        [
          "📄",
          "Legal Center",
          "https://exaltexchange.io/legal",
        ],
        [
          "🔒",
          "Privacy Policy",
          "https://exaltexchange.io/privacy",
        ],
        [
          "📜",
          "Terms of Service",
          "https://exaltexchange.io/terms",
        ],
        [
          "🗑️",
          "Delete Account",
          "https://exaltexchange.io/delete-account",
        ],
        [
          "🛡️",
          "AML Policy",
          "https://exaltexchange.io/aml",
        ],
        [
          "🪪",
          "KYC Policy",
          "https://exaltexchange.io/kyc-policy",
        ],
        [
          "⚠️",
          "Risk Disclosure",
          "https://exaltexchange.io/risk",
        ],
        [
          "🍪",
          "Cookie Policy",
          "https://exaltexchange.io/cookies",
        ],
        [
          "💰",
          "Refund Policy",
          "https://exaltexchange.io/refund",
        ],
        [
          "✅",
          "Compliance Statement",
          "https://exaltexchange.io/compliance",
        ],
      ],
      []
    );

  const openLegalPage =
    async (url) => {
      try {
        await Browser.open({
          url,

          presentationStyle:
            "fullscreen",
        });
      } catch (error) {
        console.error(
          "Unable to open legal page:",
          error
        );

        window.open(
          url,
          "_blank",
          "noopener,noreferrer"
        );
      }
    };

  const activeLanguage =
    languages.find(
      (item) =>
        item.code === lang
    )?.native || "English";

  /* =========================================================
     UI
  ========================================================= */

  return (
    <PageShell
      titleKey="settingsSecurity"
      subtitleKey="settingsSecuritySubtitle"
    >
      <div className="settings-page">
        {/* ==================================================
            ACCOUNT STATUS
        ================================================== */}

        <div className="settings-overview-grid">
          <div
            className={`settings-status-card ${
              user.isActive &&
              !user.isBlocked
                ? "secure"
                : "danger"
            }`}
          >
            <span>
              {t(
                "accountStatus"
              )}
            </span>

            <h2>
              {user.accountStatus ||
                t("active")}
            </h2>

            <p>
              {t(
                "accountStatusText"
              )}
            </p>

            <button
              type="button"
              onClick={() =>
                refreshCurrentUser()
              }
              disabled={
                refreshingUser
              }
            >
              {refreshingUser
                ? t("loading")
                : "Refresh Status"}
            </button>
          </div>

          <div className="settings-status-card">
            <span>
              {t("kycStatus")}
            </span>

            <h2>
              {user.kycStatus ||
                t(
                  "notVerified"
                )}
            </h2>

            <p>
              {t(
                "kycStatusText"
              )}
            </p>

            <button
              type="button"
              onClick={goToKyc}
            >
              {t(
                "goToKycVerification"
              )}
            </button>
          </div>

          <div
            className={`settings-status-card ${
              twoFaEnabled
                ? "secure"
                : "danger"
            }`}
          >
            <span>
              {t(
                "twoFactorSecurity"
              )}
            </span>

            <h2>
              {twoFaEnabled
                ? t("enabled")
                : t("disabled")}
            </h2>

            <p>
              {owner2FAMandatory
                ? "Google 2FA is mandatory for this Owner/Admin account."
                : t(
                    "twoFactorSecurityText"
                  )}
            </p>
          </div>
        </div>

        {/* ==================================================
            ADMIN / OWNER ACCESS
        ================================================== */}

        {hasAdminAccess && (
          <div className="settings-card">
            <div className="settings-card-head">
              <div>
                <h2>
                  {isProtectedOwner
                    ? "Owner Control Center"
                    : "Admin Control Center"}
                </h2>

                <p>
                  Access protected
                  administration,
                  compliance and
                  operational tools.
                </p>
              </div>

              <span
                className="status-pill enabled"
              >
                {isProtectedOwner
                  ? "OWNER"
                  : "ADMIN"}
              </span>
            </div>

            <div className="settings-action-row">
              <button
                type="button"
                className="settings-primary-btn"
                onClick={
                  goToAdminPanel
                }
              >
                Open Admin Panel
              </button>

              <button
                type="button"
                onClick={
                  goToProfile
                }
              >
                Open Profile
              </button>
            </div>
          </div>
        )}

        {/* ==================================================
            LANGUAGE AND ACCOUNT INFORMATION
        ================================================== */}

        <div className="settings-grid">
          <div className="settings-card">
            <div className="settings-card-head">
              <div>
                <h2>
                  {t(
                    "languagePreferences"
                  )}
                </h2>

                <p>
                  {t(
                    "languagePreferencesText"
                  )}
                </p>
              </div>

              <span>
                {activeLanguage}
              </span>
            </div>

            <LanguageSwitcher />
          </div>

          <div className="settings-card">
            <div className="settings-card-head">
              <div>
                <h2>
                  {t(
                    "accountInformation"
                  )}
                </h2>

                <p>
                  {t(
                    "accountInformationText"
                  )}
                </p>
              </div>
            </div>

            <div className="settings-info-list">
              <div>
                <span>
                  {t("name")}
                </span>

                <strong>
                  {user.name ||
                    user.fullName ||
                    "N/A"}
                </strong>
              </div>

              <div>
                <span>
                  {t(
                    "emailAddress"
                  )}
                </span>

                <strong>
                  {user.email ||
                    "N/A"}
                </strong>
              </div>

              <div>
                <span>
                  {t("role")}
                </span>

                <strong>
                  {user.role ||
                    "user"}
                </strong>
              </div>

              <div>
                <span>
                  {t("userId")}
                </span>

                <strong className="settings-user-uid">
                  {user.uid ||
                    "N/A"}
                </strong>
              </div>

              <div>
                <span>
                  Email Verified
                </span>

                <strong>
                  {user.isEmailVerified
                    ? "Yes"
                    : "No"}
                </strong>
              </div>

              <div>
                <span>
                  Admin Access
                </span>

                <strong>
                  {hasAdminAccess
                    ? "Enabled"
                    : "Disabled"}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================
            GOOGLE AUTHENTICATOR
        ================================================== */}

        <div className="settings-card twofa-card">
          <div className="settings-card-head">
            <div>
              <h2>
                {t(
                  "googleAuthenticator2fa"
                )}
              </h2>

              <p>
                {owner2FAMandatory
                  ? "Google Authenticator is mandatory for the Exchange Owner account."
                  : t(
                      "googleAuthenticator2faText"
                    )}
              </p>
            </div>

            <span
              className={
                twoFaEnabled
                  ? "status-pill enabled"
                  : "status-pill disabled"
              }
            >
              {twoFaEnabled
                ? t("enabled")
                : t("disabled")}
            </span>
          </div>

          {!twoFaEnabled ? (
            <div className="twofa-setup-box">
              <button
                type="button"
                className="settings-primary-btn"
                onClick={
                  setup2FA
                }
                disabled={
                  loading2FA
                }
              >
                {loading2FA
                  ? t("loading")
                  : t(
                      "setupGoogleAuthenticator"
                    )}
              </button>

              {qrCode && (
                <div className="twofa-qr-section">
                  <img
                    src={
                      qrCode
                    }
                    alt="Google Authenticator QR Code"
                  />

                  {manualSecret && (
                    <div className="settings-info-list">
                      <div>
                        <span>
                          Manual Setup
                          Key
                        </span>

                        <strong className="settings-user-uid">
                          {
                            manualSecret
                          }
                        </strong>
                      </div>

                      <button
                        type="button"
                        onClick={
                          copyManualSecret
                        }
                      >
                        Copy Setup Key
                      </button>
                    </div>
                  )}

                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    autoComplete="one-time-code"
                    placeholder={t(
                      "enterSixDigitCode"
                    )}
                    value={
                      twoFaToken
                    }
                    onChange={(
                      event
                    ) =>
                      setTwoFaToken(
                        event.target.value
                          .replace(
                            /\D/g,
                            ""
                          )
                          .slice(
                            0,
                            6
                          )
                      )
                    }
                    disabled={
                      loading2FA
                    }
                  />

                  <button
                    type="button"
                    className="settings-primary-btn"
                    onClick={
                      verify2FA
                    }
                    disabled={
                      loading2FA
                    }
                  >
                    {loading2FA
                      ? t(
                          "loading"
                        )
                      : t(
                          "verifyAndEnable"
                        )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="twofa-enabled-box">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                autoComplete="one-time-code"
                placeholder={t(
                  "enterAuthenticatorCode"
                )}
                value={
                  twoFaToken
                }
                onChange={(
                  event
                ) =>
                  setTwoFaToken(
                    event.target.value
                      .replace(
                        /\D/g,
                        ""
                      )
                      .slice(
                        0,
                        6
                      )
                  )
                }
                disabled={
                  loading2FA
                }
              />

              <div className="settings-action-row">
                <button
                  type="button"
                  className="settings-primary-btn"
                  onClick={
                    regenerateBackupCodes
                  }
                  disabled={
                    loading2FA
                  }
                >
                  {t(
                    "regenerateBackupCodes"
                  )}
                </button>

                {!owner2FAMandatory && (
                  <button
                    type="button"
                    className="settings-danger-btn"
                    onClick={
                      disable2FA
                    }
                    disabled={
                      loading2FA
                    }
                  >
                    {t(
                      "disable2fa"
                    )}
                  </button>
                )}
              </div>

              {owner2FAMandatory && (
                <p
                  style={{
                    marginTop:
                      "12px",

                    color:
                      "#f0c419",

                    fontWeight:
                      "700",
                  }}
                >
                  Owner 2FA cannot be
                  disabled from this
                  account.
                </p>
              )}
            </div>
          )}

          {backupCodes.length >
            0 && (
            <div className="backup-codes-box">
              <h3>
                {t(
                  "saveBackupCodes"
                )}
              </h3>

              <p>
                {t(
                  "backupCodesWarning"
                )}
              </p>

              <div className="backup-codes-grid">
                {backupCodes.map(
                  (
                    code,
                    index
                  ) => (
                    <div
                      key={`${code}-${index}`}
                    >
                      {code}
                    </div>
                  )
                )}
              </div>

              <div className="settings-action-row">
                <button
                  type="button"
                  onClick={
                    copyBackupCodes
                  }
                >
                  Copy Codes
                </button>

                <button
                  type="button"
                  className="settings-primary-btn"
                  onClick={
                    downloadBackupCodes
                  }
                >
                  Download Codes
                </button>
              </div>

              <p
                style={{
                  marginTop:
                    "12px",

                  color:
                    "#ef4444",

                  fontWeight:
                    "700",
                }}
              >
                These codes will not be
                displayed again. Store
                them offline.
              </p>
            </div>
          )}
        </div>

        {/* ==================================================
            NOTIFICATIONS AND SECURITY RULES
        ================================================== */}

        <div className="settings-grid">
          <div className="settings-card">
            <h2>
              {t(
                "notificationPreferences"
              )}
            </h2>

            <p>
              {t(
                "notificationPreferencesText"
              )}
            </p>

            <div className="settings-toggle-list">
              <div>
                <span>
                  {t(
                    "securityAlerts"
                  )}
                </span>

                <b>
                  {t(
                    "enabled"
                  )}
                </b>
              </div>

              <div>
                <span>
                  {t(
                    "depositWithdrawalAlerts"
                  )}
                </span>

                <b>
                  {t(
                    "enabled"
                  )}
                </b>
              </div>

              <div>
                <span>
                  {t(
                    "p2pOrderAlerts"
                  )}
                </span>

                <b>
                  {t(
                    "enabled"
                  )}
                </b>
              </div>
            </div>
          </div>

          <div className="settings-card">
            <h2>
              {t(
                "securityRules"
              )}
            </h2>

            <div className="settings-rule-list">
              <p>
                ✅{" "}
                {t(
                  "settingRuleKyc"
                )}
              </p>

              <p>
                ✅{" "}
                {t(
                  "settingRuleManualReview"
                )}
              </p>

              <p>
                ✅{" "}
                {t(
                  "settingRuleWalletMatch"
                )}
              </p>

              <p>
                ✅{" "}
                {t(
                  "settingRuleBotProtection"
                )}
              </p>

              <p>
                ✅{" "}
                {t(
                  "settingRuleDepositReview"
                )}
              </p>
            </div>
          </div>
        </div>

        {/* ==================================================
            LEGAL
        ================================================== */}

        <div className="settings-card">
          <div className="settings-card-head">
            <div>
              <h2>
                Legal & Compliance
              </h2>

              <p>
                Review Exalt Exchange
                policies, user protection
                terms, compliance
                documents and risk
                disclosures.
              </p>
            </div>
          </div>

          <div className="settings-info-list">
            {legalLinks.map(
              ([
                icon,
                label,
                href,
              ]) => (
                <div key={href}>
                  <span>
                    {icon} {label}
                  </span>

                  <button
                    type="button"
                    className="settings-legal-link"
                    onClick={() =>
                      openLegalPage(
                        href
                      )
                    }
                  >
                    Open
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}

export default Settings;