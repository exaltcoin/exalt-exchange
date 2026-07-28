import { useEffect } from "react";

const SITE_URL = "https://exaltexchange.io";

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

function createUrl(path) {
  const normalizedPath = normalizePath(path);

  return normalizedPath === "/"
    ? `${SITE_URL}/`
    : `${SITE_URL}${normalizedPath}`;
}

function BreadcrumbSchema({ items = [] }) {
  useEffect(() => {
    const validItems = items.filter(
      (item) => item?.name && item?.path
    );

    if (validItems.length < 2) {
      return undefined;
    }

    const schema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: validItems.map(
        (item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: createUrl(item.path),
        })
      ),
    };

    const scriptId = "exalt-breadcrumb-schema";

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
  }, [items]);

  return null;
}

export default BreadcrumbSchema;