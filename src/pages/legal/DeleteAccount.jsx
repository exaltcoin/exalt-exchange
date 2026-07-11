import { useEffect, useMemo, useState } from "react";

const SUPPORT_EMAIL = "support@exaltexchange.io";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://exalt-real-backend-6b6v.onrender.com";

const API = API_BASE.endsWith("/api")
  ? API_BASE.replace(/\/api$/, "")
  : API_BASE.replace(/\/+$/, "");

function DeleteAccount() {
  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const [form, setForm] = useState({
    email: storedUser?.email || "",
    userId: storedUser?._id || storedUser?.id || "",
    reason: "",
    details: "",
    confirmation: "",
    acknowledge: false,
  });

  const [submitted, setSubmitted] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const reasons = useMemo(
    () => [
      "I no longer use Exalt Exchange",
      "I created a duplicate account",
      "Privacy or security concerns",
      "I want to start again with a new account",
      "I am not satisfied with the service",
      "Other",
    ],
    []
  );

  useEffect(() => {
    const loadExistingRequest = async () => {
      const token = localStorage.getItem("token");

      if (!token) return;

      try {
        const response = await fetch(
          `${API}/api/account-deletion/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (response.ok && data.success && data.request) {
          setSubmittedRequest(data.request);

          if (
            ["pending", "under_review", "approved"].includes(
              data.request.status
            )
          ) {
            setSubmitted(true);
            setSuccessMessage(
              "You already have an active account deletion request."
            );
          }
        }
      } catch (requestError) {
        console.error(
          "Unable to load existing deletion request:",
          requestError
        );
      }
    };

    loadExistingRequest();
  }, []);

  const updateField = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));

    setError("");
    setSuccessMessage("");
  };

  const getRequestSource = () => {
    const userAgent = navigator.userAgent || "";

    if (/Android/i.test(userAgent)) return "android";
    if (/iPhone|iPad|iPod/i.test(userAgent)) return "ios";

    return "web";
  };

  const validateForm = () => {
    const normalizedEmail = form.email.trim().toLowerCase();

    if (!normalizedEmail) {
      return "Please enter the email address registered with your account.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return "Please enter a valid email address.";
    }

    if (!form.reason) {
      return "Please select a reason for deleting your account.";
    }

    if (form.confirmation.trim().toUpperCase() !== "DELETE") {
      return 'Please type "DELETE" to confirm your request.';
    }

    if (!form.acknowledge) {
      return "Please confirm that you understand the deletion consequences.";
    }

    return "";
  };

  const openEmailFallback = () => {
    const normalizedEmail = form.email.trim().toLowerCase();

    const subject = encodeURIComponent(
      `Account Deletion Request — ${normalizedEmail}`
    );

    const body = encodeURIComponent(
      [
        "Hello Exalt Exchange Support,",
        "",
        "I am requesting the permanent deletion of my Exalt Exchange account and associated personal data.",
        "",
        `Registered email: ${normalizedEmail}`,
        `User ID: ${form.userId.trim() || "Not provided"}`,
        `Reason: ${form.reason}`,
        `Additional details: ${form.details.trim() || "None"}`,
        "",
        "I understand that:",
        "- Account deletion may be permanent and irreversible.",
        "- I may lose access to balances, rewards, referrals, transaction history, and other account features.",
        "- I must withdraw or transfer any eligible remaining assets before deletion.",
        "- Certain financial, security, fraud-prevention, AML, KYC, tax, dispute, or regulatory records may be retained where legally required.",
        "",
        "Confirmation: DELETE",
        "",
        "Please contact me if additional identity verification is required.",
      ].join("\n")
    );

    window.location.href =
      `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  };

  const submitDeletionRequest = async (event) => {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    const token = localStorage.getItem("token");

    /*
      Public web fallback:
      The current protected backend route requires the user to be logged in.
      If no token exists, prepare an email request instead.
    */
    if (!token) {
      setSubmitted(true);
      setSuccessMessage(
        "Your email application will open with a prepared deletion request. Send the email to complete your request."
      );

      openEmailFallback();
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");

      const response = await fetch(
        `${API}/api/account-deletion/request`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            reason: form.reason,
            details: form.details.trim(),
            requestSource: getRequestSource(),
          }),
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (response.status === 401) {
        localStorage.removeItem("token");

        throw new Error(
          "Your session has expired. Please sign in again before submitting the request."
        );
      }

      if (response.status === 409) {
        setSubmitted(true);
        setSubmittedRequest(data.request || null);
        setSuccessMessage(
          data.message ||
            "An active account deletion request already exists."
        );
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to submit your account deletion request."
        );
      }

      setSubmitted(true);
      setSubmittedRequest(data.request || null);
      setSuccessMessage(
        data.message ||
          "Your account deletion request has been submitted successfully."
      );

      setForm((current) => ({
        ...current,
        reason: "",
        details: "",
        confirmation: "",
        acknowledge: false,
      }));
    } catch (requestError) {
      console.error("Account deletion request error:", requestError);

      setError(
        requestError.message ||
          "Unable to submit your request. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const cancelDeletionRequest = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Please sign in to cancel your deletion request.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to cancel your account deletion request?"
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");

      const response = await fetch(
        `${API}/api/account-deletion/me/cancel`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to cancel the deletion request."
        );
      }

      setSubmittedRequest(data.request || null);
      setSubmitted(false);
      setSuccessMessage(
        data.message ||
          "Your account deletion request has been cancelled."
      );
    } catch (requestError) {
      console.error("Cancel deletion request error:", requestError);

      setError(
        requestError.message ||
          "Unable to cancel the request. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const formatStatus = (status) => {
    return String(status || "pending")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  return (
    <div className="delete-account-page">
      <style>{`
        * {
          box-sizing: border-box;
        }

        .delete-account-page {
          min-height: 100vh;
          padding: 36px 18px 60px;
          color: #f8fafc;
          background:
            radial-gradient(circle at 15% 0%, rgba(240, 185, 11, 0.16), transparent 32%),
            radial-gradient(circle at 90% 15%, rgba(37, 99, 235, 0.12), transparent 30%),
            linear-gradient(180deg, #050816 0%, #08101f 48%, #020617 100%);
          font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont,
            "Segoe UI", sans-serif;
        }

        .delete-account-container {
          width: 100%;
          max-width: 1180px;
          margin: 0 auto;
        }

        .delete-account-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 22px;
        }

        .delete-account-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .delete-account-brand-mark {
          width: 48px;
          height: 48px;
          display: grid;
          place-items: center;
          border-radius: 15px;
          color: #111827;
          background: linear-gradient(135deg, #f8d34f, #f0a500);
          box-shadow: 0 12px 32px rgba(240, 185, 11, 0.25);
          font-size: 22px;
          font-weight: 900;
        }

        .delete-account-brand h2 {
          margin: 0;
          color: #f0b90b;
          font-size: 20px;
        }

        .delete-account-brand p {
          margin: 3px 0 0;
          color: #94a3b8;
          font-size: 12px;
        }

        .delete-account-back-link {
          padding: 10px 14px;
          border: 1px solid rgba(240, 185, 11, 0.3);
          border-radius: 12px;
          color: #f0b90b;
          background: rgba(240, 185, 11, 0.08);
          text-decoration: none;
          font-size: 13px;
          font-weight: 800;
          transition: 0.2s ease;
        }

        .delete-account-back-link:hover {
          background: #f0b90b;
          color: #111827;
          transform: translateY(-1px);
        }

        .delete-account-hero {
          position: relative;
          overflow: hidden;
          padding: 34px;
          margin-bottom: 22px;
          border: 1px solid rgba(240, 185, 11, 0.24);
          border-radius: 28px;
          background: linear-gradient(
            135deg,
            rgba(15, 23, 42, 0.98),
            rgba(17, 24, 39, 0.92)
          );
          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.35);
        }

        .delete-account-hero::after {
          content: "";
          position: absolute;
          width: 260px;
          height: 260px;
          right: -90px;
          top: -120px;
          border-radius: 50%;
          background: rgba(240, 185, 11, 0.1);
          filter: blur(8px);
        }

        .delete-account-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 13px;
          margin-bottom: 16px;
          border: 1px solid rgba(239, 68, 68, 0.28);
          border-radius: 999px;
          color: #fca5a5;
          background: rgba(239, 68, 68, 0.1);
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .delete-account-hero h1 {
          position: relative;
          z-index: 1;
          max-width: 760px;
          margin: 0 0 14px;
          color: #ffffff;
          font-size: clamp(34px, 5vw, 54px);
          line-height: 1.08;
        }

        .delete-account-hero h1 span {
          color: #f0b90b;
        }

        .delete-account-hero p {
          position: relative;
          z-index: 1;
          max-width: 820px;
          margin: 0;
          color: #cbd5e1;
          font-size: 16px;
          line-height: 1.8;
        }

        .delete-account-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.25fr) minmax(300px, 0.75fr);
          gap: 22px;
          align-items: start;
        }

        .delete-account-card {
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          background: rgba(15, 23, 42, 0.95);
          box-shadow: 0 20px 55px rgba(0, 0, 0, 0.28);
        }

        .delete-account-form-card {
          padding: 28px;
        }

        .delete-account-section-head {
          margin-bottom: 22px;
        }

        .delete-account-section-head h2 {
          margin: 0 0 8px;
          color: #f0b90b;
          font-size: 26px;
        }

        .delete-account-section-head p {
          margin: 0;
          color: #94a3b8;
          line-height: 1.7;
        }

        .delete-account-form {
          display: grid;
          gap: 17px;
        }

        .delete-account-field {
          display: grid;
          gap: 8px;
        }

        .delete-account-field label {
          color: #e2e8f0;
          font-size: 14px;
          font-weight: 800;
        }

        .delete-account-field label span {
          color: #f87171;
        }

        .delete-account-field input,
        .delete-account-field select,
        .delete-account-field textarea {
          width: 100%;
          min-width: 0;
          padding: 14px 15px;
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 13px;
          outline: none;
          color: #ffffff;
          background: #0b1220;
          font: inherit;
          transition: 0.2s ease;
        }

        .delete-account-field textarea {
          min-height: 115px;
          resize: vertical;
        }

        .delete-account-field input:disabled,
        .delete-account-field select:disabled,
        .delete-account-field textarea:disabled {
          cursor: not-allowed;
          opacity: 0.65;
        }

        .delete-account-field input::placeholder,
        .delete-account-field textarea::placeholder {
          color: #64748b;
        }

        .delete-account-field input:focus,
        .delete-account-field select:focus,
        .delete-account-field textarea:focus {
          border-color: #f0b90b;
          box-shadow: 0 0 0 3px rgba(240, 185, 11, 0.11);
        }

        .delete-account-field select option {
          background: #0f172a;
          color: #ffffff;
        }

        .delete-account-confirm-box {
          padding: 16px;
          border: 1px solid rgba(239, 68, 68, 0.24);
          border-radius: 15px;
          background: rgba(239, 68, 68, 0.07);
        }

        .delete-account-checkbox {
          display: flex;
          align-items: flex-start;
          gap: 11px;
          color: #cbd5e1;
          font-size: 13px;
          line-height: 1.65;
          cursor: pointer;
        }

        .delete-account-checkbox input {
          width: 18px;
          height: 18px;
          margin-top: 2px;
          accent-color: #f0b90b;
          flex-shrink: 0;
        }

        .delete-account-error {
          padding: 13px 15px;
          border: 1px solid rgba(239, 68, 68, 0.35);
          border-radius: 12px;
          color: #fecaca;
          background: rgba(239, 68, 68, 0.1);
          font-size: 13px;
          font-weight: 700;
          line-height: 1.6;
        }

        .delete-account-success {
          padding: 15px;
          border: 1px solid rgba(34, 197, 94, 0.35);
          border-radius: 13px;
          color: #86efac;
          background: rgba(34, 197, 94, 0.1);
          font-size: 13px;
          line-height: 1.65;
        }

        .delete-account-request-status {
          display: grid;
          gap: 8px;
          padding: 15px;
          border: 1px solid rgba(96, 165, 250, 0.32);
          border-radius: 13px;
          background: rgba(37, 99, 235, 0.09);
        }

        .delete-account-request-status span {
          color: #94a3b8;
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .delete-account-request-status strong {
          color: #93c5fd;
          font-size: 17px;
        }

        .delete-account-request-status small {
          color: #cbd5e1;
          line-height: 1.6;
        }

        .delete-account-submit,
        .delete-account-cancel-request {
          width: 100%;
          padding: 15px 18px;
          border: 0;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 900;
          cursor: pointer;
          transition: 0.22s ease;
        }

        .delete-account-submit {
          color: #111827;
          background: linear-gradient(135deg, #f8d34f, #f0a500);
          box-shadow: 0 12px 28px rgba(240, 185, 11, 0.2);
        }

        .delete-account-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          filter: brightness(1.05);
          box-shadow: 0 16px 35px rgba(240, 185, 11, 0.28);
        }

        .delete-account-submit:disabled,
        .delete-account-cancel-request:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .delete-account-cancel-request {
          color: #fecaca;
          border: 1px solid rgba(239, 68, 68, 0.35);
          background: rgba(239, 68, 68, 0.1);
        }

        .delete-account-cancel-request:hover:not(:disabled) {
          color: #ffffff;
          background: #dc2626;
        }

        .delete-account-side {
          display: grid;
          gap: 18px;
        }

        .delete-account-info-card {
          padding: 22px;
        }

        .delete-account-info-card h3 {
          margin: 0 0 15px;
          color: #ffffff;
          font-size: 18px;
        }

        .delete-account-list {
          display: grid;
          gap: 12px;
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .delete-account-list li {
          display: flex;
          gap: 10px;
          color: #cbd5e1;
          font-size: 13px;
          line-height: 1.6;
        }

        .delete-account-list-icon {
          width: 25px;
          height: 25px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          border-radius: 8px;
          color: #f0b90b;
          background: rgba(240, 185, 11, 0.1);
          font-size: 12px;
          font-weight: 900;
        }

        .delete-account-warning-card {
          border-color: rgba(239, 68, 68, 0.22);
        }

        .delete-account-warning-card h3 {
          color: #fca5a5;
        }

        .delete-account-timeline {
          display: grid;
          gap: 13px;
        }

        .delete-account-timeline-item {
          display: grid;
          grid-template-columns: 34px 1fr;
          gap: 11px;
          align-items: start;
        }

        .delete-account-timeline-number {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border-radius: 11px;
          color: #111827;
          background: #f0b90b;
          font-size: 13px;
          font-weight: 900;
        }

        .delete-account-timeline-item strong {
          display: block;
          color: #ffffff;
          margin-bottom: 4px;
          font-size: 14px;
        }

        .delete-account-timeline-item p {
          margin: 0;
          color: #94a3b8;
          font-size: 12px;
          line-height: 1.55;
        }

        .delete-account-footer {
          margin-top: 22px;
          padding: 20px;
          text-align: center;
          border: 1px solid rgba(240, 185, 11, 0.18);
          border-radius: 20px;
          color: #94a3b8;
          background: rgba(15, 23, 42, 0.8);
          font-size: 13px;
          line-height: 1.7;
        }

        .delete-account-footer a {
          color: #f0b90b;
          font-weight: 800;
          text-decoration: none;
        }

        @media (max-width: 900px) {
          .delete-account-layout {
            grid-template-columns: 1fr;
          }

          .delete-account-side {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 650px) {
          .delete-account-page {
            padding: 20px 12px 40px;
          }

          .delete-account-topbar {
            align-items: flex-start;
          }

          .delete-account-brand p {
            display: none;
          }

          .delete-account-hero,
          .delete-account-form-card,
          .delete-account-info-card {
            padding: 20px;
            border-radius: 19px;
          }

          .delete-account-side {
            grid-template-columns: 1fr;
          }

          .delete-account-back-link {
            padding: 9px 11px;
            font-size: 12px;
          }
        }
      `}</style>

      <div className="delete-account-container">
        <header className="delete-account-topbar">
          <div className="delete-account-brand">
            <div className="delete-account-brand-mark">E</div>

            <div>
              <h2>Exalt Exchange</h2>
              <p>Secure • Fast • Global Digital Asset Exchange</p>
            </div>
          </div>

          <a className="delete-account-back-link" href="/legal">
            ← Legal Center
          </a>
        </header>

        <section className="delete-account-hero">
          <div className="delete-account-badge">
            ⚠ Permanent account action
          </div>

          <h1>
            Account &amp; Data <span>Deletion Center</span>
          </h1>

          <p>
            Use this page to request permanent deletion of your Exalt
            Exchange account and associated personal data. Please review
            the information below carefully before submitting your
            request.
          </p>
        </section>

        <div className="delete-account-layout">
          <section className="delete-account-card delete-account-form-card">
            <div className="delete-account-section-head">
              <h2>Submit a deletion request</h2>

              <p>
                Enter information that matches your registered Exalt
                Exchange account. We may contact you to verify account
                ownership.
              </p>
            </div>

            <form
              className="delete-account-form"
              onSubmit={submitDeletionRequest}
            >
              <div className="delete-account-field">
                <label htmlFor="delete-email">
                  Registered email address <span>*</span>
                </label>

                <input
                  id="delete-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your registered email"
                  value={form.email}
                  onChange={updateField}
                  disabled={loading}
                />
              </div>

              <div className="delete-account-field">
                <label htmlFor="delete-user-id">
                  Exalt Exchange User ID (optional)
                </label>

                <input
                  id="delete-user-id"
                  name="userId"
                  type="text"
                  placeholder="Enter your user ID if available"
                  value={form.userId}
                  onChange={updateField}
                  disabled={loading}
                />
              </div>

              <div className="delete-account-field">
                <label htmlFor="delete-reason">
                  Reason for deletion <span>*</span>
                </label>

                <select
                  id="delete-reason"
                  name="reason"
                  value={form.reason}
                  onChange={updateField}
                  disabled={loading || submitted}
                >
                  <option value="">Select a reason</option>

                  {reasons.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </div>

              <div className="delete-account-field">
                <label htmlFor="delete-details">
                  Additional information (optional)
                </label>

                <textarea
                  id="delete-details"
                  name="details"
                  placeholder="Add any information that may help us identify and process your request."
                  value={form.details}
                  onChange={updateField}
                  disabled={loading || submitted}
                />
              </div>

              <div className="delete-account-field">
                <label htmlFor="delete-confirmation">
                  Type DELETE to confirm <span>*</span>
                </label>

                <input
                  id="delete-confirmation"
                  name="confirmation"
                  type="text"
                  autoComplete="off"
                  placeholder="DELETE"
                  value={form.confirmation}
                  onChange={updateField}
                  disabled={loading || submitted}
                />
              </div>

              <div className="delete-account-confirm-box">
                <label className="delete-account-checkbox">
                  <input
                    name="acknowledge"
                    type="checkbox"
                    checked={form.acknowledge}
                    onChange={updateField}
                    disabled={loading || submitted}
                  />

                  <span>
                    I understand that account deletion may be permanent
                    and irreversible. I confirm that I have withdrawn or
                    transferred any eligible remaining assets and
                    understand that access to my account, rewards,
                    referrals, transaction history, and other services
                    may be permanently removed.
                  </span>
                </label>
              </div>

              {error && (
                <div className="delete-account-error">{error}</div>
              )}

              {successMessage && (
                <div className="delete-account-success">
                  {successMessage}
                </div>
              )}

              {submittedRequest && (
                <div className="delete-account-request-status">
                  <span>Current request status</span>

                  <strong>
                    {formatStatus(submittedRequest.status)}
                  </strong>

                  <small>
                    Request ID:{" "}
                    {submittedRequest._id || "Processing"}
                  </small>
                </div>
              )}

              {!submitted ? (
                <button
                  className="delete-account-submit"
                  type="submit"
                  disabled={loading}
                >
                  {loading
                    ? "Submitting Request..."
                    : "Submit Account Deletion Request"}
                </button>
              ) : (
                ["pending", "under_review"].includes(
                  submittedRequest?.status
                ) &&
                localStorage.getItem("token") && (
                  <button
                    className="delete-account-cancel-request"
                    type="button"
                    onClick={cancelDeletionRequest}
                    disabled={loading}
                  >
                    {loading
                      ? "Processing..."
                      : "Cancel Deletion Request"}
                  </button>
                )
              )}
            </form>
          </section>

          <aside className="delete-account-side">
            <section className="delete-account-card delete-account-info-card">
              <h3>Data scheduled for deletion</h3>

              <ul className="delete-account-list">
                <li>
                  <span className="delete-account-list-icon">✓</span>
                  <span>
                    Account profile details, preferences, and
                    non-required personal information.
                  </span>
                </li>

                <li>
                  <span className="delete-account-list-icon">✓</span>
                  <span>
                    Authentication access, active sessions, saved
                    settings, and eligible security information.
                  </span>
                </li>

                <li>
                  <span className="delete-account-list-icon">✓</span>
                  <span>
                    Eligible support, referral, reward, notification,
                    and platform activity information.
                  </span>
                </li>

                <li>
                  <span className="delete-account-list-icon">✓</span>
                  <span>
                    Other associated data not required to be retained
                    by law or legitimate compliance obligations.
                  </span>
                </li>
              </ul>
            </section>

            <section className="delete-account-card delete-account-info-card delete-account-warning-card">
              <h3>Information that may be retained</h3>

              <ul className="delete-account-list">
                <li>
                  <span className="delete-account-list-icon">!</span>
                  <span>
                    Transaction, deposit, withdrawal, trade, wallet,
                    and financial records required for audit or legal
                    obligations.
                  </span>
                </li>

                <li>
                  <span className="delete-account-list-icon">!</span>
                  <span>
                    KYC, AML, fraud-prevention, sanctions, security,
                    dispute, tax, or regulatory records where retention
                    is required.
                  </span>
                </li>

                <li>
                  <span className="delete-account-list-icon">!</span>
                  <span>
                    Records connected to pending investigations,
                    disputes, chargebacks, court orders, or enforcement
                    requests.
                  </span>
                </li>
              </ul>
            </section>

            <section className="delete-account-card delete-account-info-card">
              <h3>How the process works</h3>

              <div className="delete-account-timeline">
                <div className="delete-account-timeline-item">
                  <span className="delete-account-timeline-number">
                    1
                  </span>

                  <div>
                    <strong>Submit your request</strong>

                    <p>
                      Submit the secure form while logged in or send the
                      prepared request from your registered email.
                    </p>
                  </div>
                </div>

                <div className="delete-account-timeline-item">
                  <span className="delete-account-timeline-number">
                    2
                  </span>

                  <div>
                    <strong>Ownership verification</strong>

                    <p>
                      We may request additional information to protect
                      your account from unauthorized deletion.
                    </p>
                  </div>
                </div>

                <div className="delete-account-timeline-item">
                  <span className="delete-account-timeline-number">
                    3
                  </span>

                  <div>
                    <strong>Security and balance review</strong>

                    <p>
                      Pending balances, open orders, disputes,
                      restrictions, or compliance reviews must be
                      resolved first.
                    </p>
                  </div>
                </div>

                <div className="delete-account-timeline-item">
                  <span className="delete-account-timeline-number">
                    4
                  </span>

                  <div>
                    <strong>Deletion confirmation</strong>

                    <p>
                      Most eligible requests are processed within 30
                      days following successful verification.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </aside>
        </div>

        <footer className="delete-account-footer">
          Need assistance? Contact{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`}>
            {SUPPORT_EMAIL}
          </a>
          .
          <br />
          Exalt Exchange may refuse or delay a deletion request where
          necessary to protect users, prevent fraud, resolve
          liabilities, comply with applicable laws, or meet regulatory
          and record-retention obligations.
        </footer>
      </div>
    </div>
  );
}

export default DeleteAccount;