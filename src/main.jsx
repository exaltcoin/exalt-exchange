import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./app.jsx";
import { I18nProvider } from "./i18n/index.js";

import "./styles/ExaltTheme.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error(
    'Application root element with id "root" was not found.'
  );
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <I18nProvider>
        <App />
      </I18nProvider>
    </BrowserRouter>
  </React.StrictMode>
);