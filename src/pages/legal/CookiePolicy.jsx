import LegalLayout from "./LegalLayout";

function CookiePolicy() {
  return (
    <LegalLayout title="Cookie Policy">
      <p><strong>Last Updated:</strong> July 10, 2026</p>

      <p>
        Exalt Exchange may use cookies, local storage, device identifiers, and
        similar technologies to operate the platform, improve security, remember
        preferences, and enhance user experience.
      </p>

      <h2>1. What Cookies Are Used For</h2>
      <ul>
        <li>Authentication and login sessions</li>
        <li>Security and fraud prevention</li>
        <li>User preferences and app settings</li>
        <li>Analytics and performance improvement</li>
      </ul>

      <h2>2. Local Storage</h2>
      <p>
        Our app may store certain settings such as wallet preferences, language,
        security options, and user interface preferences locally on your device.
      </p>

      <h2>3. Third-Party Tools</h2>
      <p>
        Trusted third-party providers may use cookies or similar technologies for
        security, analytics, infrastructure, authentication, and compliance.
      </p>

      <h2>4. Managing Cookies</h2>
      <p>
        You may manage cookies and local storage through your browser or device
        settings. Some features may not work properly if cookies are disabled.
      </p>
    </LegalLayout>
  );
}

export default CookiePolicy;