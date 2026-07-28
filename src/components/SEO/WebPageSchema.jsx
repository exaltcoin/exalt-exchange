import { useEffect } from "react";

const SITE_URL = "https://exaltexchange.io";
const SITE_NAME = "Exalt Exchange";

function normalizePath(path) {
  const rawPath = String(path || "/")
    .split("?")[0]
    .split("#")[0]
    .trim();

  if (!rawPath || rawPath === "/") {
    return "/";
  }

  const pathWithLeadingSlash = rawPath.startsWith("/")
    ? rawPath
    : `/${rawPath}`;

  return pathWithLeadingSlash.replace(/\/+$/, "");
}

function createPageUrl(path) {
  const normalizedPath = normalizePath(path);

  return normalizedPath === "/"
    ? `${SITE_URL}/`
    : `${SITE_URL}${normalizedPath}`;
}

function WebPageSchema({
  title,
  description,
  path = "/",
  image = `${SITE_URL}/exalt-exchange-logo.png`,
  language = "en",
}) {
  useEffect(() => {
    if (!title || !description) {
      return undefined;
    }

    const pageUrl = createPageUrl(path);

    const schema = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${pageUrl}#webpage`,
      url: pageUrl,
      name: title,
      description,
      isPartOf: {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: `${SITE_URL}/`,
        name: SITE_NAME,
      },
      about: {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: `${SITE_URL}/`,
      },
      primaryImageOfPage: {
        "@type": "ImageObject",
        url: image,
      },
      inLanguage: language,
    };

    const scriptId = "exalt-webpage-schema";

    let script = document.head.querySelector(
      `script#${scriptId}`
    );

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }

    script.textContent = JSON.stringify(schema);

    return () => {
      const activeScript = document.head.querySelector(
        `script#${scriptId}`
      );

      if (activeScript) {
        activeScript.remove();
      }
    };
  }, [description, image, language, path, title]);

  return null;
}

export default WebPageSchema;