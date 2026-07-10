function LegalLayout({ title, children }) {
  const legalLinks = [
    ["📄", "Legal Home", "/legal"],
    ["🔒", "Privacy Policy", "/privacy"],
    ["📜", "Terms of Service", "/terms"],
    ["🛡️", "AML Policy", "/aml"],
    ["🪪", "KYC Policy", "/kyc-policy"],
    ["⚠️", "Risk Disclosure", "/risk"],
    ["🍪", "Cookie Policy", "/cookies"],
    ["💰", "Refund Policy", "/refund"],
    ["✅", "Compliance", "/compliance"],
  ];

  const currentPath = window.location.pathname;

  return (
    <div className="legal-page">
      <div className="legal-shell">
        <aside className="legal-sidebar">
          <h2>Exalt Legal Center</h2>

          {legalLinks.map(([icon, label, href]) => (
            <a
              key={href}
              href={href}
              className={currentPath === href ? "active" : ""}
            >
              <span>{icon}</span>
              {label}
            </a>
          ))}
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