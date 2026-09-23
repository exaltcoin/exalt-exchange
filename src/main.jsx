import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

/*
  Design tokens load first, at the true root, before any legacy
  stylesheet - see design-system/index.js's architecture-rules
  header comment for the full rationale and the style.css/
  ExaltTheme.css retirement plan.
*/
import "./design-system/tokens.css";

import App from "./app.jsx";
import { I18nProvider } from "./i18n/index.js";
import { ThemeProvider } from "./design-system/ThemeProvider.jsx";
import { applyThemeToDocument, readThemeFromStorage } from "./design-system/theme.js";

import "./styles/ExaltTheme.css";

/*
  Apply the persisted/system theme to <html> SYNCHRONOUSLY, before
  React ever renders - not inside a useEffect (which only runs
  after the first paint). ThemeProvider's own effect will run once
  React mounts and re-apply the same value, which is a harmless
  no-op in the common case; without this line, a user with a saved
  "light" preference would see one frame of the default dark theme
  before ThemeProvider's effect corrected it - a real flash of the
  wrong mode, not merely a theoretical one, since tokens.css's
  unscoped :root block intentionally matches the dark values so
  the app has *a* theme even before ThemeProvider mounts at all.
*/
applyThemeToDocument(readThemeFromStorage());

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error(
    'Application root element with id "root" was not found.'
  );
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <I18nProvider>
          <App />
        </I18nProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);