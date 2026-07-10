

function LegalLayout({ title, children }) {
  return (
    <div className="legal-page">
      <div className="legal-shell">
        <aside className="legal-sidebar">
          <h2>Exalt Legal Center</h2>

          <a href="/legal">Legal Home</a>
          <a href="/privacy">Privacy Policy</a>
          <a href="/terms">Terms of Service</a>
          <a href="/aml">AML Policy</a>
          <a href="/kyc-policy">KYC Policy</a>
          <a href="/risk">Risk Disclosure</a>
          <a href="/cookies">Cookie Policy</a>
          <a href="/refund">Refund Policy</a>
          <a href="/compliance">Compliance</a>
        </aside>

        <main className="legal-content">
          <span className="legal-badge">Exalt Exchange Legal Center</span>
          <h1>{title}</h1>

          {children}

          <div className="legal-footer-note">
            Exalt Exchange — Secure • Fast • Global Digital Asset Exchange
          </div>
        </main>
      </div>
    </div>
  );
}

export default LegalLayout;