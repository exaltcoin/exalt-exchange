import { forwardRef } from "react";
import "./SearchInput.css";

/*
  SearchInput is purely a controlled text-entry primitive with a
  clear button and an optional loading indicator. It performs no
  API calls, no debouncing, and no business logic itself - the
  caller (a page or a service-layer hook) owns fetching/debouncing
  and passes the result down via `loading`. This keeps the
  primitive reusable for markets search, order search, transaction
  search, admin user search, etc. without baking any of their
  specific query logic in here.
*/
export const SearchInput = forwardRef(function SearchInput(
  {
    value,
    onChange,
    onClear,
    loading = false,
    placeholder = "Search",
    ariaLabel = "Search",
    disabled = false,
    className = "",
    ...rest
  },
  ref
) {
  return (
    <div
      className={`ex2-search ${disabled ? "ex2-search--disabled" : ""} ${className}`.trim()}
      role="search"
    >
      <span className="ex2-search__icon" aria-hidden="true">
        ⌕
      </span>
      <input
        ref={ref}
        type="text"
        className="ex2-search__input"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-label={ariaLabel}
        disabled={disabled}
        {...rest}
      />
      {loading ? (
        <span className="ex2-search__spinner" aria-hidden="true" />
      ) : value ? (
        <button
          type="button"
          className="ex2-search__clear"
          aria-label="Clear search"
          onClick={onClear}
          disabled={disabled}
        >
          ×
        </button>
      ) : null}
    </div>
  );
});

export default SearchInput;
