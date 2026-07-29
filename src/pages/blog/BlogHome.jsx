import { useMemo, useState } from "react";
import BlogLayout from "./BlogLayout";
import BlogCard from "./BlogCard";
import {
  BLOG_CATEGORIES,
  getBlogPostsByCategory,
} from "./blogData";
import "./Blog.css";

function BlogHome({ onOpenArticle }) {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const posts = useMemo(() => {
    return getBlogPostsByCategory(selectedCategory);
  }, [selectedCategory]);

  return (
    <BlogLayout
      title="Exalt Exchange Blog"
      description="News, exchange updates, crypto education, Web3 wallet guides, security tips, and Exalt ecosystem articles."
    >
      <div className="blog-category-list">
        {BLOG_CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            className={`blog-category-btn ${
              selectedCategory === category ? "active" : ""
            }`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="blog-grid">
        {posts.length > 0 ? (
          posts.map((post) => (
            <BlogCard
              key={post.id}
              post={post}
              onOpen={onOpenArticle}
            />
          ))
        ) : (
          <div className="blog-empty-state">
            <h2>No articles found</h2>
            <p>
              There are currently no articles in this category.
            </p>
          </div>
        )}
      </div>
    </BlogLayout>
  );
}

export default BlogHome;