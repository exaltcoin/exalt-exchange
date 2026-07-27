import { useEffect } from "react";

const DEFAULT_TITLE =
  "Exalt Exchange | Global Cryptocurrency Exchange";

const DEFAULT_DESCRIPTION =
  "Exalt Exchange is a secure global digital asset platform offering spot trading, futures trading, P2P services, Web3 wallet access, staking, KYC, and cryptocurrency management.";

const DEFAULT_IMAGE =
  "https://exaltexchange.io/exalt-exchange-logo.png";

const SITE_URL = "https://exaltexchange.io";

const ROBOTS_INDEX =
  "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

const ROBOTS_NOINDEX = "noindex, nofollow";

function getOrCreateMetaTag({
  selector,
  attribute,
  attributeValue,
}) {
  let element = document.head.querySelector(selector);

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, attributeValue);
    document.head.appendChild(element);
  }

  return element;
}

function setMetaContent({
  selector,
  attribute,
  attributeValue,
  content,
}) {
  const element = getOrCreateMetaTag({
    selector,
    attribute,
    attributeValue,
  });

  element.setAttribute("content", content);
}

function updateCanonical(url) {
  let canonical = document.head.querySelector(
    'link[rel="canonical"]'
  );

  if (!canonical) {
    canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    document.head.appendChild(canonical);
  }

  canonical.setAttribute("href", url);
}

function normalizePath(path) {
  if (!path || path === "/") {
    return "/";
  }

  return path.startsWith("/") ? path : `/${path}`;
}

function SEO({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  path = "/",
  image = DEFAULT_IMAGE,
  noIndex = false,
}) {
  useEffect(() => {
    const normalizedPath = normalizePath(path);

    const canonicalUrl =
      normalizedPath === "/"
        ? `${SITE_URL}/`
        : `${SITE_URL}${normalizedPath}`;

    document.title = title;

    setMetaContent({
      selector: 'meta[name="description"]',
      attribute: "name",
      attributeValue: "description",
      content: description,
    });

    setMetaContent({
      selector: 'meta[name="robots"]',
      attribute: "name",
      attributeValue: "robots",
      content: noIndex
        ? ROBOTS_NOINDEX
        : ROBOTS_INDEX,
    });

    updateCanonical(canonicalUrl);

    setMetaContent({
      selector: 'meta[property="og:title"]',
      attribute: "property",
      attributeValue: "og:title",
      content: title,
    });

    setMetaContent({
      selector: 'meta[property="og:description"]',
      attribute: "property",
      attributeValue: "og:description",
      content: description,
    });

    setMetaContent({
      selector: 'meta[property="og:url"]',
      attribute: "property",
      attributeValue: "og:url",
      content: canonicalUrl,
    });

    setMetaContent({
      selector: 'meta[property="og:image"]',
      attribute: "property",
      attributeValue: "og:image",
      content: image,
    });

    setMetaContent({
      selector: 'meta[name="twitter:title"]',
      attribute: "name",
      attributeValue: "twitter:title",
      content: title,
    });

    setMetaContent({
      selector: 'meta[name="twitter:description"]',
      attribute: "name",
      attributeValue: "twitter:description",
      content: description,
    });

    setMetaContent({
      selector: 'meta[name="twitter:image"]',
      attribute: "name",
      attributeValue: "twitter:image",
      content: image,
    });
  }, [description, image, noIndex, path, title]);

  return null;
}

export default SEO;