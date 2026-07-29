import "./Blog.css";

function BlogCard({ post, onOpen }) {
  return (
    <article className="blog-card">
      <div className="blog-card-image">
        <img
          src={post.image}
          alt={post.imageAlt}
          loading="lazy"
        />
      </div>

      <div className="blog-card-content">
        <span className="blog-category">
          {post.category}
        </span>

        <h2 className="blog-title">
          {post.title}
        </h2>

        <p className="blog-excerpt">
          {post.excerpt}
        </p>

        <div className="blog-meta">
          <span>{post.author}</span>

          <span>•</span>

          <span>{post.publishedAt}</span>

          <span>•</span>

          <span>{post.readTime}</span>
        </div>

        <button
          className="blog-read-btn"
          onClick={() => onOpen(post.slug)}
        >
          Read Article →
        </button>
      </div>
    </article>
  );
}

export default BlogCard;