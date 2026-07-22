import { useEffect, useState } from "react";

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
   AUTH PANEL
========================================================= */

export default function AuthPanel({
  setPage,
}) {
  const [mode, setMode] =
    useState("login");

  const [form, setForm] =
    useState({
      name: "",
      email: "",
      password: "",
      wallet: "",
      referralCode: "",
    });

  const [show2FA, setShow2FA] =
    useState(false);

  const [twoFaCode, setTwoFaCode] =
    useState("");

  const [backupCode, setBackupCode] =
    useState("");

  const [
    useBackupCode,
    setUseBackupCode,
  ] = useState(false);

  const [tempUserId, setTempUserId] =
    useState("");

  const [
    emailNotVerified,
    setEmailNotVerified,
  ] = useState(false);

  const [message, setMessage] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  /* =========================================================
     RESPONSE HELPER
  ========================================================= */

  const parseResponse = async (
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
     SAVE AUTHENTICATED SESSION
  ========================================================= */

  const saveAuthenticatedSession = (
    data
  ) => {
    if (
      !data?.token ||
      !data?.user
    ) {
      throw new Error(
        "Invalid authentication response"
      );
    }

    const authenticatedUser = {
      ...data.user,

      id:
        data.user.id ||
        data.user._id ||
        "",

      uid:
        data.user.uid
          ? String(data.user.uid)
          : "",

      role:
        data.user.role ||
        "user",

      isOwner:
        data.user.isOwner === true ||
        data.user.role === "owner",

      isAdmin:
        data.user.isAdmin === true ||
        [
          "admin",
          "super_admin",
          "owner",
        ].includes(
          data.user.role
        ),

      isActive:
        data.user.isActive !== false,

      isBlocked:
        data.user.isBlocked === true,

      accountStatus:
        data.user.accountStatus ||
        "Active",

      isEmailVerified:
        data.user
          .isEmailVerified === true,

      twoFactorEnabled:
        data.user
          .twoFactorEnabled === true,

      adminTwoFactorRequired:
        data.user
          .adminTwoFactorRequired ===
        true,

      withdrawalTwoFactorRequired:
        data.user
          .withdrawalTwoFactorRequired ===
        true,
    };

    localStorage.setItem(
      "token",
      data.token
    );

    localStorage.setItem(
      "user",
      JSON.stringify(
        authenticatedUser
      )
    );

    if (
      data.require2FASetup === true
    ) {
      localStorage.setItem(
        "require2FASetup",
        "true"
      );
    } else {
      localStorage.removeItem(
        "require2FASetup"
      );
    }

    return authenticatedUser;
  };

  /* =========================================================
     CLEAR SESSION
  ========================================================= */

  const clearSession = () => {
    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "user"
    );

    localStorage.removeItem(
      "require2FASetup"
    );

    localStorage.removeItem(
      "twk_token"
    );
  };

  /* =========================================================
     VERIFY EXISTING SESSION
  ========================================================= */

  const verifyExistingSession =
    async () => {
      const token =
        localStorage.getItem(
          "token"
        );

      if (!token) {
        return;
      }

      try {
        const response =
          await fetch(
            `${API}/api/auth/me`,
            {
              method: "GET",

              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const data =
          await parseResponse(
            response
          );

        if (
          !response.ok ||
          !data.success ||
          !data.user
        ) {
          clearSession();
          return;
        }

        const currentUser = {
          ...data.user,

          id:
            data.user.id ||
            data.user._id ||
            "",

          uid:
            data.user.uid
              ? String(
                  data.user.uid
                )
              : "",

          isOwner:
            data.user.isOwner ===
              true ||
            data.user.role ===
              "owner",

          isAdmin:
            data.user.isAdmin ===
              true ||
            [
              "admin",
              "super_admin",
              "owner",
            ].includes(
              data.user.role
            ),

          isActive:
            data.user.isActive !==
            false,

          isBlocked:
            data.user.isBlocked ===
            true,
        };

        localStorage.setItem(
          "user",
          JSON.stringify(
            currentUser
          )
        );

        if (setPage) {
          setPage("dashboard");
        }
      } catch (error) {
        console.error(
          "Session verification failed:",
          error
        );

        clearSession();
      }
    };

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    const pendingReferralCode =
      localStorage.getItem(
        "pendingReferralCode"
      );

    if (
      pendingReferralCode
    ) {
      setMode("signup");

      setForm((previous) => ({
        ...previous,

        referralCode:
          pendingReferralCode,
      }));
    }

    verifyExistingSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =========================================================
     FORM CHANGE
  ========================================================= */

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /* =========================================================
     SIGNUP
  ========================================================= */

  const signup = async () => {
    try {
      setLoading(true);
      setMessage("");
      setEmailNotVerified(false);

      const response =
        await fetch(
          `${API}/api/auth/register`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                name:
                  form.name.trim(),

                email:
                  form.email
                    .trim()
                    .toLowerCase(),

                password:
                  form.password,

                wallet:
                  form.wallet.trim(),

                referralCode:
                  form.referralCode
                    .trim()
                    .toUpperCase(),
              }),
          }
        );

      const data =
        await parseResponse(
          response
        );

      if (
        response.ok &&
        data.success
      ) {
        clearSession();

        localStorage.removeItem(
          "pendingReferralCode"
        );

        setMode("login");

        setForm((previous) => ({
          ...previous,
          name: "",
          password: "",
          wallet: "",
          referralCode: "",
        }));

        setMessage(
          "✅ Account created. Please verify your email before login."
        );

        alert(
          "Account created. Please verify your email."
        );

        return;
      }

      alert(
        data.message ||
          "Signup failed"
      );
    } catch (error) {
      console.error(
        "SIGNUP ERROR:",
        error
      );

      if (
        error instanceof TypeError
      ) {
        alert(
          "Cannot connect to server"
        );
      } else {
        alert(
          error.message ||
            "Server error"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     LOGIN
  ========================================================= */

  const login = async () => {
    try {
      setLoading(true);
      setMessage("");
      setEmailNotVerified(false);

      clearSession();

      const response =
        await fetch(
          `${API}/api/auth/login`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                email:
                  form.email
                    .trim()
                    .toLowerCase(),

                password:
                  form.password,
              }),
          }
        );

      const data =
        await parseResponse(
          response
        );

      if (
        response.ok &&
        data.success
      ) {
        if (
          data.require2FA ===
          true
        ) {
          setTempUserId(
            data.userId
          );

          setShow2FA(true);
          setTwoFaCode("");
          setBackupCode("");
          setUseBackupCode(
            false
          );

          alert(
            "Enter your Google Authenticator code"
          );

          return;
        }

        const authenticatedUser =
          saveAuthenticatedSession(
            data
          );

        console.log(
          "Authenticated user:",
          authenticatedUser
        );

        if (
          data.require2FASetup ===
          true
        ) {
          alert(
            "Login successful. Google 2FA setup is required for this Owner/Admin account."
          );
        } else {
          alert(
            "Login successful"
          );
        }

        if (setPage) {
          setPage("dashboard");
        }

        window.location.reload();

        return;
      }

      if (
        data.emailNotVerified
      ) {
        setEmailNotVerified(
          true
        );

        setMessage(
          "⚠️ Please verify your email before login."
        );

        return;
      }

      alert(
        data.message ||
          "Login failed"
      );
    } catch (error) {
      console.error(
        "LOGIN ERROR:",
        error
      );

      if (
        error instanceof TypeError
      ) {
        alert(
          "Cannot connect to server"
        );
      } else {
        alert(
          error.message ||
            "Server error"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     RESEND VERIFICATION
  ========================================================= */

  const resendVerification =
    async () => {
      try {
        if (!form.email.trim()) {
          alert(
            "Enter your email first"
          );

          return;
        }

        setLoading(true);

        const response =
          await fetch(
            `${API}/api/auth/resend-verification`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  email:
                    form.email
                      .trim()
                      .toLowerCase(),
                }),
            }
          );

        const data =
          await parseResponse(
            response
          );

        if (
          response.ok &&
          data.success
        ) {
          setMessage(
            "✅ Verification email sent again. Check your inbox."
          );

          alert(
            data.message ||
              "Verification email sent."
          );

          return;
        }

        alert(
          data.message ||
            "Failed to resend verification email"
        );
      } catch (error) {
        console.error(
          "RESEND VERIFICATION ERROR:",
          error
        );

        alert(
          error.message ||
            "Failed to resend verification email"
        );
      } finally {
        setLoading(false);
      }
    };

  /* =========================================================
     VERIFY LOGIN 2FA
  ========================================================= */

  const verifyLogin2FA =
    async () => {
      try {
        if (
          !tempUserId
        ) {
          alert(
            "Login session expired. Please login again."
          );

          setShow2FA(false);
          return;
        }

        if (
          !useBackupCode &&
          !twoFaCode.trim()
        ) {
          alert(
            "Enter Google Authenticator code"
          );

          return;
        }

        if (
          useBackupCode &&
          !backupCode.trim()
        ) {
          alert(
            "Enter backup recovery code"
          );

          return;
        }

        setLoading(true);

        const payload =
          useBackupCode
            ? {
                userId:
                  tempUserId,

                backupCode:
                  backupCode
                    .trim()
                    .toUpperCase(),
              }
            : {
                userId:
                  tempUserId,

                token:
                  twoFaCode.trim(),
              };

        const response =
          await fetch(
            `${API}/api/auth/2fa/login-verify`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify(
                  payload
                ),
            }
          );

        const data =
          await parseResponse(
            response
          );

        if (
          response.ok &&
          data.success
        ) {
          const authenticatedUser =
            saveAuthenticatedSession(
              data
            );

          console.log(
            "2FA authenticated user:",
            authenticatedUser
          );

          alert(
            "Login successful"
          );

          if (setPage) {
            setPage(
              "dashboard"
            );
          }

          window.location.reload();

          return;
        }

        alert(
          data.message ||
            "Invalid 2FA or backup code"
        );
      } catch (error) {
        console.error(
          "2FA VERIFICATION ERROR:",
          error
        );

        alert(
          error.message ||
            "2FA verification failed"
        );
      } finally {
        setLoading(false);
      }
    };

  /* =========================================================
     ENTER KEY
  ========================================================= */

  const handleKeyDown = (
    event
  ) => {
    if (
      event.key !== "Enter" ||
      loading
    ) {
      return;
    }

    if (show2FA) {
      verifyLogin2FA();
      return;
    }

    if (mode === "signup") {
      signup();
    } else {
      login();
    }
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div
      className="auth-page"
      onKeyDown={
        handleKeyDown
      }
    >
      <div className="auth-card">
        <div className="auth-left">
          <h1>
            EXALT EXCHANGE
          </h1>

          <p>
            Secure crypto market
            board with wallet
            login, trading
            dashboard, referral
            rewards and admin
            approval system.
          </p>

          <div className="qr-box">
            <img
              src={`https://quickchart.io/qr?text=${encodeURIComponent(
                "https://exaltexchange.io"
              )}&size=160`}
              alt="Exalt Exchange QR"
            />

            <span>
              Scan QR To Open
              Exalt Exchange
            </span>
          </div>
        </div>

        <div className="auth-right">
          <h2>
            {mode === "login"
              ? "Welcome Back"
              : "Create Account"}
          </h2>

          <p className="auth-subtitle">
            {mode === "login"
              ? "Login to continue"
              : "Create your secure account"}
          </p>

          <div className="auth-tabs">
            <button
              type="button"
              className={
                mode ===
                "login"
                  ? "active"
                  : ""
              }
              onClick={() => {
                setMode("login");
                setShow2FA(
                  false
                );
                setMessage("");
              }}
              disabled={loading}
            >
              Login
            </button>

            <button
              type="button"
              className={
                mode ===
                "signup"
                  ? "active"
                  : ""
              }
              onClick={() => {
                setMode("signup");
                setShow2FA(
                  false
                );
                setMessage("");
              }}
              disabled={loading}
            >
              Signup
            </button>
          </div>

          {message && (
            <p
              style={{
                color:
                  "#f0c419",

                textAlign:
                  "center",

                fontSize:
                  "14px",
              }}
            >
              {message}
            </p>
          )}

          {mode ===
            "signup" && (
            <>
              <input
                name="name"
                placeholder="Full Name"
                value={
                  form.name
                }
                onChange={
                  handleChange
                }
                autoComplete="name"
                disabled={
                  loading
                }
              />

              <input
                name="wallet"
                placeholder="Wallet Address (Optional)"
                value={
                  form.wallet
                }
                onChange={
                  handleChange
                }
                autoComplete="off"
                disabled={
                  loading
                }
              />

              <input
                name="referralCode"
                placeholder="Referral Code (Optional)"
                value={
                  form.referralCode
                }
                onChange={
                  handleChange
                }
                autoComplete="off"
                disabled={
                  loading
                }
              />
            </>
          )}

          <input
            name="email"
            type="email"
            placeholder="Email Address"
            value={
              form.email
            }
            onChange={
              handleChange
            }
            autoComplete="email"
            disabled={
              loading ||
              show2FA
            }
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            value={
              form.password
            }
            onChange={
              handleChange
            }
            autoComplete={
              mode === "login"
                ? "current-password"
                : "new-password"
            }
            disabled={
              loading ||
              show2FA
            }
          />

          {emailNotVerified && (
            <button
              type="button"
              onClick={
                resendVerification
              }
              disabled={
                loading
              }
              style={{
                marginBottom:
                  "12px",

                background:
                  "#f0c419",

                color:
                  "#111",

                fontWeight:
                  "700",
              }}
            >
              Resend Verification
              Email
            </button>
          )}

          {show2FA && (
            <>
              {!useBackupCode ? (
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter Google Authenticator Code"
                  value={
                    twoFaCode
                  }
                  onChange={(
                    event
                  ) =>
                    setTwoFaCode(
                      event.target.value.replace(
                        /\D/g,
                        ""
                      )
                    )
                  }
                  autoComplete="one-time-code"
                  disabled={
                    loading
                  }
                />
              ) : (
                <input
                  type="text"
                  placeholder="Enter Backup Recovery Code"
                  value={
                    backupCode
                  }
                  onChange={(
                    event
                  ) =>
                    setBackupCode(
                      event.target.value
                    )
                  }
                  autoComplete="off"
                  disabled={
                    loading
                  }
                />
              )}

              <button
                type="button"
                onClick={
                  verifyLogin2FA
                }
                disabled={
                  loading
                }
              >
                {loading
                  ? "Verifying..."
                  : useBackupCode
                    ? "Login With Backup Code"
                    : "Verify 2FA"}
              </button>

              <p
                onClick={() => {
                  if (loading) {
                    return;
                  }

                  setUseBackupCode(
                    !useBackupCode
                  );

                  setTwoFaCode("");
                  setBackupCode("");
                }}
                style={{
                  marginTop:
                    "12px",

                  color:
                    "#f0c419",

                  cursor:
                    loading
                      ? "not-allowed"
                      : "pointer",

                  fontSize:
                    "14px",

                  textAlign:
                    "center",
                }}
              >
                {useBackupCode
                  ? "Use Google Authenticator Code"
                  : "Use Backup Recovery Code"}
              </p>
            </>
          )}

          <button
            type="button"
          className="exalt-auth-primary"
            onClick={
              mode === "signup"
                ? signup
                : login
            }
            disabled={
              loading ||
              show2FA
            }
            style={{
              opacity:
                loading ||
                show2FA
                  ? 0.5
                  : 1,

              cursor:
                loading ||
                show2FA
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {loading
              ? "Please wait..."
              : mode ===
                  "signup"
                ? "Create Account"
                : "Login"}
          </button>

          {mode ===
            "login" && (
            <button
              type="button"
           className="exalt-auth-secondary"
              onClick={() => {
                if (
                  setPage
                ) {
                  setPage(
                    "forgot-password"
                  );
                }
              }}
              disabled={
                loading
              }
              style={{
                marginTop:
                  "14px",

                background:
                  "transparent",

                border:
                  "none",

                color:
                  "#f0c419",

                cursor:
                  "pointer",

                fontSize:
                  "15px",

                textAlign:
                  "center",

                width:
                  "100%",

                padding:
                  "14px 0",

                fontWeight:
                  "700",
              }}
            >
              Forgot Password?
            </button>
          )}

          <p className="security-text">
            🛡️ Exalt Exchange •
            Advanced Security •
            Google 2FA • Global
            Trading
          </p>
        </div>
      </div>
    </div>
  );
}