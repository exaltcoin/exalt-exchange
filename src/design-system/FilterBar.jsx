import "./FilterBar.css";
import { Select } from "./Select.jsx";
import { Badge } from "./Badge.jsx";

/*
  FilterBar is a generic layout + interaction shell for a row of
  filters (dropdowns, active-filter chips, a reset action). It has
  no knowledge of what's being filtered - Markets/Orders/
  Transactions/Deposits/Withdrawals/P2P/Admin pages each define
  their own filter fields (e.g. status, network, date range) and
  pass them in as `filters`. This component never queries an API
  or owns filter state itself - it's controlled end-to-end by the
  caller, same as DataTable.

  filters: [{
    key, label, value, options: [{ value, label }], onChange
  }]
  activeChips: [{ key, label }] - currently-applied filters shown
  as removable chips (e.g. "Status: Filled ×") - the caller decides
  what counts as "active" (usually: any filter whose value isn't
  the default "all").
*/
export const FilterBar = ({
  filters = [],
  activeChips = [],
  onRemoveChip,
  onReset,
  className = "",
}) => {
  const hasActiveFilters = activeChips.length > 0;

  return (
    <div className={`ex2-filter-bar ${className}`.trim()}>
      <div className="ex2-filter-bar__controls">
        {filters.map((filter) => (
          <label key={filter.key} className="ex2-filter-bar__field">
            <span className="ex2-filter-bar__field-label">
              {filter.label}
            </span>
            <Select
              value={filter.value}
              onChange={(event) => filter.onChange(event.target.value)}
              size="sm"
              aria-label={filter.label}
            >
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </label>
        ))}

        {hasActiveFilters && onReset ? (
          <button
            type="button"
            className="ex2-filter-bar__reset"
            onClick={onReset}
          >
            Reset filters
          </button>
        ) : null}
      </div>

      {hasActiveFilters ? (
        <div className="ex2-filter-bar__chips" aria-label="Active filters">
          {activeChips.map((chip) => (
            <Badge key={chip.key} tone="info" className="ex2-filter-bar__chip">
              {chip.label}
              {onRemoveChip ? (
                <button
                  type="button"
                  className="ex2-filter-bar__chip-remove"
                  aria-label={`Remove filter: ${chip.label}`}
                  onClick={() => onRemoveChip(chip.key)}
                >
                  ×
                </button>
              ) : null}
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default FilterBar;
