import "./Blog.css";

function BlogLayout({
  title,
  description,
  children,
  onBack,
  showBackButton = false,
}) {
  return (
    <main className="blog-page">
      <section className="blog-hero">
        <div className="blog-container">
          {showBackButton && (
            <button
              type="button"
              className="blog-back-btn"
              onClick={onBack}
            >
              ← Back to Blog
            </button>
          )}

          <span className="blog-eyebrow">
            Exalt Exchange Insights
          </span>

          <h1 className="blog-page-title">
            {title}
          </h1>

          {description && (
            <p className="blog-page-description">
              {description}
            </p>
          )}
        </div>
      </section>

      <section className="blog-main-section">
        <div className="blog-container">
          {children}
        </div>
      </section>
    </main>
  );
}

export default BlogLayout;