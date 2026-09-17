import "./Pagination.css";

/*
  Fully controlled - the caller supplies real currentPage/totalPages
  (typically from a real API response's pagination metadata) and
  receives onPageChange. This component invents no page counts.
*/
export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  className = "",
}) => {
  if (!totalPages || totalPages <= 1) return null;

  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <nav
      className={`ex2-pagination ${className}`.trim()}
      aria-label="Pagination"
    >
      <button
        type="button"
        className="ex2-pagination__btn"
        onClick={() => canGoPrev && onPageChange(currentPage - 1)}
        disabled={!canGoPrev}
        aria-label="Previous page"
      >
        ‹
      </button>

      <span className="ex2-pagination__status">
        Page {currentPage} of {totalPages}
      </span>

      <button
        type="button"
        className="ex2-pagination__btn"
        onClick={() => canGoNext && onPageChange(currentPage + 1)}
        disabled={!canGoNext}
        aria-label="Next page"
      >
        ›
      </button>
    </nav>
  );
};

export default Pagination;
