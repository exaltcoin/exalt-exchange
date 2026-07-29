import { useEffect, useState } from "react";
import BlogLayout from "./BlogLayout";
import {
  getBlogPostBySlug,
  getRelatedBlogPosts,
} from "./blogData";
import "./Blog.css";

const SITE_URL = "https://exaltexchange.io";
const SITE_NAME = "Exalt Exchange";

function setMetaTag(attribute, value, content) {
  let element = document.head.querySelector(
    `meta[${attribute}="${value}"]`
  );

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, value);
    document.head.appendChild(element);
  }

  element.setAttribute("content", content);

  return element;
}

function setCanonicalLink(url) {
  let canonical = document.head.querySelector(
    'link[rel="canonical"]'
  );

  if (!canonical) {
    canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    document.head.appendChild(canonical);
  }

  canonical.setAttribute("href", url);

  return canonical;
}

function BlogArticle({
  slug,
  onBack,
}) {
  const post = getBlogPostBySlug(slug);
const [readingProgress, setReadingProgress] = useState(0);
const relatedPosts = post
  ? getRelatedBlogPosts(post.slug, post.category, 3)
  : [];
  useEffect(() => {
    if (!post) {
      return undefined;
    }
useEffect(() => {
  const updateReadingProgress = () => {
    const scrollTop =
      document.documentElement.scrollTop ||
      document.body.scrollTop;

    const scrollHeight =
      document.documentElement.scrollHeight -
      document.documentElement.clientHeight;

    if (scrollHeight <= 0) {
      setReadingProgress(0);
      return;
    }

    setReadingProgress(
      Math.min(
        100,
        (scrollTop / scrollHeight) * 100
      )
    );
  };

  window.addEventListener(
    "scroll",
    updateReadingProgress
  );

  updateReadingProgress();

  return () =>
    window.removeEventListener(
      "scroll",
      updateReadingProgress
    );
}, []);
    const articleUrl = `${SITE_URL}/blog/${post.slug}`;

    const articleImage = post.image.startsWith("http")
      ? post.image
      : `${window.location.origin}${post.image}`;

    const previousTitle = document.title;

    document.title = post.seoTitle || post.title;

    const managedMetaTags = [
      setMetaTag(
        "name",
        "description",
        post.seoDescription || post.excerpt
      ),
      setMetaTag(
        "property",
        "og:type",
        "article"
      ),
      setMetaTag(
        "property",
        "og:site_name",
        SITE_NAME
      ),
      setMetaTag(
        "property",
        "og:title",
        post.seoTitle || post.title
      ),
      setMetaTag(
        "property",
        "og:description",
        post.seoDescription || post.excerpt
      ),
      setMetaTag(
        "property",
        "og:url",
        articleUrl
      ),
      setMetaTag(
        "property",
        "og:image",
        articleImage
      ),
      setMetaTag(
        "property",
        "og:image:alt",
        post.imageAlt
      ),
      setMetaTag(
        "property",
        "article:published_time",
        post.publishedAt
      ),
      setMetaTag(
        "property",
        "article:modified_time",
        post.updatedAt
      ),
      setMetaTag(
        "property",
        "article:author",
        post.author
      ),
      setMetaTag(
        "property",
        "article:section",
        post.category
      ),
      setMetaTag(
        "name",
        "twitter:card",
        "summary_large_image"
      ),
      setMetaTag(
        "name",
        "twitter:title",
        post.seoTitle || post.title
      ),
      setMetaTag(
        "name",
        "twitter:description",
        post.seoDescription || post.excerpt
      ),
      setMetaTag(
        "name",
        "twitter:image",
        articleImage
      ),
      setMetaTag(
        "name",
        "twitter:image:alt",
        post.imageAlt
      ),
    ];

    const canonicalLink = setCanonicalLink(articleUrl);

    const articleSchema = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.seoDescription || post.excerpt,
      image: [articleImage],
      datePublished: post.publishedAt,
      dateModified: post.updatedAt,
      author: {
        "@type": "Organization",
        name: post.author,
        url: SITE_URL,
      },
      publisher: {
        "@type": "Organization",
        name: SITE_NAME,
        url: SITE_URL,
        logo: {
          "@type": "ImageObject",
          url: `${SITE_URL}/exalt-exchange-logo.png`,
        },
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": articleUrl,
      },
      articleSection: post.category,
      keywords: post.tags.join(", "),
      url: articleUrl,
    };

    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: SITE_URL,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Blog",
          item: `${SITE_URL}/blog`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: post.title,
          item: articleUrl,
        },
      ],
    };

    const articleSchemaScript =
      document.createElement("script");

    articleSchemaScript.type = "application/ld+json";
    articleSchemaScript.dataset.blogArticleSchema = "true";
    articleSchemaScript.textContent =
      JSON.stringify(articleSchema);

    const breadcrumbSchemaScript =
      document.createElement("script");

    breadcrumbSchemaScript.type = "application/ld+json";
    breadcrumbSchemaScript.dataset.blogBreadcrumbSchema = "true";
    breadcrumbSchemaScript.textContent =
      JSON.stringify(breadcrumbSchema);

    document.head.appendChild(articleSchemaScript);
    document.head.appendChild(breadcrumbSchemaScript);

    return () => {
      document.title = previousTitle;

      managedMetaTags.forEach((tag) => {
        tag.remove();
      });

      canonicalLink.remove();
      articleSchemaScript.remove();
      breadcrumbSchemaScript.remove();
    };
  }, [post]);

  if (!post) {
    return (
      <BlogLayout
        title="Article Not Found"
        description="The requested article could not be found."
        showBackButton
        onBack={onBack}
      >
        <div className="blog-empty-state">
          <h2>Article Not Found</h2>

          <p>
            The article you are looking for does not exist or may have been
            removed.
          </p>
        </div>
      </BlogLayout>
    );
  }

  return (
    <BlogLayout
      title={post.title}
      description={post.excerpt}
      showBackButton
      onBack={onBack}
    >
      <div
  className="blog-reading-progress"
  style={{
    width: `${readingProgress}%`,
  }}
/>
      <article className="blog-article">
        <nav
          className="blog-breadcrumb"
          aria-label="Breadcrumb"
        >
          <button
            type="button"
            onClick={onBack}
            className="blog-breadcrumb-link"
          >
            Blog
          </button>

          <span aria-hidden="true">/</span>

          <span aria-current="page">
            {post.title}
          </span>
        </nav>

        <img
          src={post.image}
          alt={post.imageAlt}
          className="blog-article-image"
          width="1200"
          height="630"
          loading="eager"
          fetchPriority="high"
        />

        <div className="blog-meta">
          <span>{post.category}</span>

          <span>•</span>

          <span>{post.author}</span>

          <span>•</span>

          <time dateTime={post.publishedAt}>
            {post.publishedAt}
          </time>

          <span>•</span>

          <span>{post.readTime}</span>
        </div>

        <h1 className="blog-article-title">
          {post.title}
        </h1>

        {post.content.map((block, index) => {
          const blockKey =
            `${block.type}-${index}-${block.text.slice(0, 20)}`;

          if (block.type === "heading") {
            return (
              <h2
                key={blockKey}
                className="blog-section-title"
              >
                {block.text}
              </h2>
            );
          }

          return (
            <p
              key={blockKey}
              className="blog-paragraph"
            >
              {block.text}
            </p>
          );
        })}
        {relatedPosts.length > 0 && (
  <section className="blog-related">
    <h2 className="blog-related-title">
      Related Articles
    </h2>

    <div className="blog-grid">
      {relatedPosts.map((article) => (
        <article
          key={article.slug}
          className="blog-card"
        >
          <div className="blog-card-image">
            <img
              src={article.image}
              alt={article.imageAlt}
              loading="lazy"
            />
          </div>

          <div className="blog-card-content">
            <span className="blog-category">
              {article.category}
            </span>

            <h3 className="blog-title">
              {article.title}
            </h3>

            <p className="blog-excerpt">
              {article.excerpt}
            </p>

            <div className="blog-meta">
              <span>{article.readTime}</span>
            </div>

            <button
              type="button"
              className="blog-read-btn"
              onClick={() => {
                window.location.hash = `/blog/${article.slug}`;
                window.scrollTo({
                  top: 0,
                  behavior: "smooth",
                });
              }}
            >
              Read Article
            </button>
          </div>
        </article>
      ))}
    </div>
  </section>
)}
      </article>
    </BlogLayout>
  );
}

export default BlogArticle;