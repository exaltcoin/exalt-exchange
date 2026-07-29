import BlogLayout from "./BlogLayout";
import { getBlogPostBySlug } from "./blogData";
import "./Blog.css";

function BlogArticle({
  slug,
  onBack,
}) {
  const post = getBlogPostBySlug(slug);

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
      <article className="blog-article">

        <img
          src={post.image}
          alt={post.imageAlt}
          className="blog-article-image"
        />

        <div className="blog-meta">
          <span>{post.category}</span>

          <span>•</span>

          <span>{post.author}</span>

          <span>•</span>

          <span>{post.publishedAt}</span>

          <span>•</span>

          <span>{post.readTime}</span>
        </div>

        <h1 className="blog-article-title">
          {post.title}
        </h1>

        {post.content.map((block, index) => {
          if (block.type === "heading") {
            return (
              <h2
                key={index}
                className="blog-section-title"
              >
                {block.text}
              </h2>
            );
          }

          return (
            <p
              key={index}
              className="blog-paragraph"
            >
              {block.text}
            </p>
          );
        })}

      </article>
    </BlogLayout>
  );
}

export default BlogArticle;