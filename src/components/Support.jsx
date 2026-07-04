import { useMemo, useState } from "react";
import PageShell from "./PageShell";
import { useI18n } from "../i18n";
import "./Support.css";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://api.exaltexchange.io";

const API = API_BASE.endsWith("/api")
  ? API_BASE.replace("/api", "")
  : API_BASE;

function Support() {
  const { t } = useI18n();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  const [category, setCategory] = useState("Wallet / Deposit");
  const [priority, setPriority] = useState("Medium");
  const [wallet, setWallet] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [userName, setUserName] = useState(
    user.name || user.fullName || user.email || ""
  );
  const [userEmail, setUserEmail] = useState(user.email || "");
  const [loading, setLoading] = useState(false);
  const [aiReply, setAiReply] = useState("");

  const aiSuggestion = useMemo(() => {
    const text = `${category} ${subject} ${message}`.toLowerCase();

    if (text.includes("withdraw")) return t("aiWithdrawHelp");
    if (text.includes("deposit")) return t("aiDepositHelp");
    if (text.includes("kyc")) return t("aiKycHelp");
    if (text.includes("login") || text.includes("password")) return t("aiLoginHelp");
    if (text.includes("p2p")) return t("aiP2pHelp");

    return t("aiDefaultHelp");
  }, [category, subject, message, t]);

  const submitTicket = async () => {
    if (!userEmail || !subject || !message) {
      alert(t("supportRequiredFields"));
      return;
    }

    try {
      setLoading(true);

      const payload = {
        userName,
        userEmail,
        email: userEmail,
        wallet,
        category,
        priority,
        subject,
        message,
        aiSuggestion,
        status: "open",
      };

      const endpoints = [
        `${API}/api/support-ticket`,
        `${API}/api/support/tickets`,
      ];

      let data = null;
      let ok = false;

      for (const url of endpoints) {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token || ""}`,
          },
          body: JSON.stringify(payload),
        });

        data = await res.json().catch(() => ({}));

        if (res.ok && (data.success || data.message)) {
          ok = true;
          break;
        }
      }

      if (!ok) {
        alert(data?.message || t("failedSubmitTicket"));
        return;
      }

      alert(data?.message || t("ticketSubmittedSuccessfully"));

      setWallet("");
      setSubject("");
      setMessage("");
      setAiReply("");
    } catch (error) {
      console.log(error);
      alert(t("serverError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell titleKey="supportCenter" subtitleKey="supportCenterSubtitle">
      <div className="support-center-page">
        <div className="support-top-badge">
          {t("supportBadge")}
        </div>

        <div className="support-grid">
          <div className="support-card ai-card">
            <h2>{t("aiSupportAssistant")}</h2>
            <p>{t("aiSupportAssistantText")}</p>

            <button
              className="support-btn green"
              onClick={() => setAiReply(aiSuggestion)}
            >
              {t("askAiSupport")}
            </button>

            {aiReply && <div className="ai-answer">{aiReply}</div>}

            <div className="official-links">
              <a href="https://t.me/ExaltExchangeOfficial" target="_blank" rel="noreferrer">
                Telegram Community
              </a>
              <a href="https://t.me/Exaltexchange" target="_blank" rel="noreferrer">
                Support Admin
              </a>
              <a href="https://x.com/ExaltExchange" target="_blank" rel="noreferrer">
                X Official
              </a>
            </div>
          </div>

          <div className="support-card">
            <h2>{t("createSupportTicket")}</h2>

            <div className="support-row">
              <input
                placeholder={t("fullName")}
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />

              <input
                placeholder={t("emailAddress")}
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
              />
            </div>

            <div className="support-row">
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option>Wallet / Deposit</option>
                <option>Withdrawal</option>
                <option>KYC Verification</option>
                <option>P2P Order</option>
                <option>Trading Issue</option>
                <option>Account Security</option>
                <option>Listing / Partnership</option>
                <option>Other</option>
              </select>

              <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Urgent</option>
              </select>
            </div>

            <input
              placeholder={t("walletOrderTxOptional")}
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
            />

            <input
              placeholder={t("subject")}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />

            <textarea
              placeholder={t("describeIssue")}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />

            <button className="support-btn" onClick={submitTicket} disabled={loading}>
              {loading ? t("submitting") : t("submitTicket")}
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

export default Support;