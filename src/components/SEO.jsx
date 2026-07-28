import { useEffect } from "react";

const SITE_NAME = "Exalt Exchange";
const SITE_URL = "https://exaltexchange.io";

const DEFAULT_TITLE =
  "Exalt Exchange | Secure Crypto Trading, Web3 Wallet & P2P";

const DEFAULT_DESCRIPTION =
  "Exalt Exchange is a secure global digital asset platform offering spot trading, futures trading, P2P services, Web3 wallet access, staking, KYC, and cryptocurrency management.";

const DEFAULT_IMAGE =
  `${SITE_URL}/exalt-exchange-logo.png`;

const DEFAULT_IMAGE_ALT =
  "Exalt Exchange official logo";

const ROBOTS_INDEX =
  "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

const ROBOTS_NOINDEX =
  "noindex, nofollow";

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
  const rawPath = String(path || "/")
    .split("?")[0]
    .split("#")[0]
    .trim();

  if (!rawPath || rawPath === "/") {
    return "/";
  }

  const withLeadingSlash = rawPath.startsWith("/")
    ? rawPath
    : `/${rawPath}`;

  return withLeadingSlash.replace(/\/+$/, "");
}

function createCanonicalUrl(path) {
  const normalizedPath = normalizePath(path);

  return normalizedPath === "/"
    ? `${SITE_URL}/`
    : `${SITE_URL}${normalizedPath}`;
}

function SEO({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  path = "/",
  image = DEFAULT_IMAGE,
  imageAlt = DEFAULT_IMAGE_ALT,
  type = "website",
  noIndex = false,
}) {
  useEffect(() => {
    const canonicalUrl = createCanonicalUrl(path);

    const robotsContent = noIndex
      ? ROBOTS_NOINDEX
      : ROBOTS_INDEX;

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
      content: robotsContent,
    });

    setMetaContent({
      selector: 'meta[name="googlebot"]',
      attribute: "name",
      attributeValue: "googlebot",
      content: robotsContent,
    });

    updateCanonical(canonicalUrl);

    setMetaContent({
      selector: 'meta[property="og:type"]',
      attribute: "property",
      attributeValue: "og:type",
      content: type,
    });

    setMetaContent({
      selector: 'meta[property="og:site_name"]',
      attribute: "property",
      attributeValue: "og:site_name",
      content: SITE_NAME,
    });

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
      selector: 'meta[property="og:image:alt"]',
      attribute: "property",
      attributeValue: "og:image:alt",
      content: imageAlt,
    });

    setMetaContent({
      selector: 'meta[name="twitter:card"]',
      attribute: "name",
      attributeValue: "twitter:card",
      content: "summary_large_image",
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

    setMetaContent({
      selector: 'meta[name="twitter:image:alt"]',
      attribute: "name",
      attributeValue: "twitter:image:alt",
      content: imageAlt,
    });
  }, [
    description,
    image,
    imageAlt,
    noIndex,
    path,
    title,
    type,
  ]);

  return null;
}

export default SEO;