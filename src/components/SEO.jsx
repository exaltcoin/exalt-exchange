import { useEffect } from "react";

const DEFAULT_TITLE =
  "Exalt Exchange | Global Cryptocurrency Exchange";

const DEFAULT_DESCRIPTION =
  "Exalt Exchange is a secure global digital asset platform offering spot trading, futures trading, P2P services, Web3 wallet access, staking, KYC, and cryptocurrency management.";

const DEFAULT_IMAGE =
  "https://exaltexchange.io/exalt-exchange-logo.png";

const SITE_URL = "https://exaltexchange.io";

const updateMetaTag = (selector, attribute, value) => {
  let element = document.head.querySelector(selector);

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, value);

    if (selector.includes("property=")) {
      const propertyMatch = selector.match(
        /property="([^"]+)"/
      );

      if (propertyMatch?.[1]) {
        element.setAttribute(
          "property",
          propertyMatch[1]
        );
      }
    }

    if (selector.includes("name=")) {
      const nameMatch = selector.match(
        /name="([^"]+)"/
      );

      if (nameMatch?.[1]) {
        element.setAttribute("name", nameMatch[1]);
      }
    }

    document.head.appendChild(element);
  }

  element.setAttribute("content", value);
};

const updateCanonical = (url) => {
  let canonical = document.head.querySelector(
    'link[rel="canonical"]'
  );

  if (!canonical) {
    canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    document.head.appendChild(canonical);
  }

  canonical.setAttribute("href", url);
};

function SEO({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  path = "/",
  image = DEFAULT_IMAGE,
  noIndex = false,
}) {
  useEffect(() => {
    const normalizedPath = path.startsWith("/")
      ? path
      : `/${path}`;

    const canonicalUrl =
      normalizedPath === "/"
        ? `${SITE_URL}/`
        : `${SITE_URL}${normalizedPath}`;

    document.title = title;

    updateMetaTag(
      'meta[name="description"]',
      "name",
      "description"
    );

    const descriptionMeta =
      document.head.querySelector(
        'meta[name="description"]'
      );

    if (descriptionMeta) {
      descriptionMeta.setAttribute(
        "content",
        description
      );
    }

    updateMetaTag(
      'meta[name="robots"]',
      "name",
      "robots"
    );

    const robotsMeta = document.head.querySelector(
      'meta[name="robots"]'
    );

    if (robotsMeta) {
      robotsMeta.setAttribute(
        "content",
        noIndex
          ? "noindex, nofollow"
          : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
      );
    }

    updateCanonical(canonicalUrl);

    updateMetaTag(
      'meta[property="og:title"]',
      "property",
      "og:title"
    );

    updateMetaTag(
      'meta[property="og:description"]',
      "property",
      "og:description"
    );

    updateMetaTag(
      'meta[property="og:url"]',
      "property",
      "og:url"
    );

    updateMetaTag(
      'meta[property="og:image"]',
      "property",
      "og:image"
    );

    updateMetaTag(
      'meta[name="twitter:title"]',
      "name",
      "twitter:title"
    );

    updateMetaTag(
      'meta[name="twitter:description"]',
      "name",
      "twitter:description"
    );

    updateMetaTag(
      'meta[name="twitter:image"]',
      "name",
      "twitter:image"
    );

    const values = {
      'meta[property="og:title"]': title,
      'meta[property="og:description"]': description,
      'meta[property="og:url"]': canonicalUrl,
      'meta[property="og:image"]': image,
      'meta[name="twitter:title"]': title,
      'meta[name="twitter:description"]': description,
      'meta[name="twitter:image"]': image,
    };

    Object.entries(values).forEach(
      ([selector, value]) => {
        const element =
          document.head.querySelector(selector);

        if (element) {
          element.setAttribute("content", value);
        }
      }
    );
  }, [description, image, noIndex, path, title]);

  return null;
}

export default SEO;