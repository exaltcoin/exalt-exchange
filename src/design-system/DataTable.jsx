import "./DataTable.css";
import { SkeletonText } from "./Skeleton.jsx";
import { EmptyState, ErrorState } from "./RequestStates.jsx";

/*
  Generic table shell suitable for markets, open orders, order
  history, trade history, transactions, deposits, withdrawals, P2P,
  and admin lists. It has NO knowledge of any specific domain - it
  never computes totals, formats currency, or invents rows. All of
  that stays in the calling page, which owns the real data.

  columns: [{ key, header, align?, width?, sortable? }]
  rows: array of plain objects - one entry per row
  getRowKey: (row) => string - required, must be a stable real id
  renderCell: (row, column) => ReactNode - required

  state (mutually exclusive, in priority order): loading > error >
  empty > data. The caller must pass real request state - this
  component performs no requests itself and fabricates no rows for
  any state.
*/
export const DataTable = ({
  columns,
  rows,
  getRowKey,
  renderCell,
  loading = false,
  error = null,
  onRetry,
  emptyTitle = "No data",
  emptyDescription,
  sortKey,
  sortDirection,
  onSortChange,
  onRowClick,
  rowActions,
  className = "",
  ariaLabel = "Data table",
}) => {
  const handleSort = (column) => {
    if (!column.sortable || !onSortChange) return;

    const nextDirection =
      sortKey === column.key && sortDirection === "asc" ? "desc" : "asc";

    onSortChange(column.key, nextDirection);
  };

  return (
    <div className={`ex2-table-container ${className}`.trim()}>
      <div className="ex2-table-scroll">
        <table className="ex2-table" aria-label={ariaLabel}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  style={{ width: column.width }}
                  className={`ex2-table__th ex2-table__th--${column.align || "start"}`}
                  aria-sort={
                    column.sortable
                      ? sortKey === column.key
                        ? sortDirection === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                      : undefined
                  }
                >
                  {column.sortable ? (
                    <button
                      type="button"
                      className="ex2-table__sort-btn"
                      onClick={() => handleSort(column)}
                    >
                      {column.header}
                      {sortKey === column.key ? (
                        <span aria-hidden="true">
                          {sortDirection === "asc" ? " ▲" : " ▼"}
                        </span>
                      ) : null}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
              {rowActions ? (
                <th scope="col" className="ex2-table__th ex2-table__th--end">
                  <span className="ex2-visually-hidden">Actions</span>
                </th>
              ) : null}
            </tr>
          </thead>

          {!loading && !error && rows.length > 0 ? (
            <tbody>
              {rows.map((row) => {
                const key = getRowKey(row);
                return (
                  <tr
                    key={key}
                    className={onRowClick ? "ex2-table__row--clickable" : ""}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`ex2-table__td ex2-table__td--${column.align || "start"}`}
                      >
                        {renderCell(row, column)}
                      </td>
                    ))}
                    {rowActions ? (
                      <td className="ex2-table__td ex2-table__td--end">
                        {rowActions(row)}
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          ) : null}
        </table>
      </div>

      {loading ? (
        <div className="ex2-table__state">
          <SkeletonText lines={4} />
        </div>
      ) : null}

      {!loading && error ? (
        <div className="ex2-table__state">
          <ErrorState
            title="Couldn't load this data"
            description={typeof error === "string" ? error : undefined}
            onRetry={onRetry}
          />
        </div>
      ) : null}

      {!loading && !error && rows.length === 0 ? (
        <div className="ex2-table__state">
          <EmptyState title={emptyTitle} description={emptyDescription} />
        </div>
      ) : null}
    </div>
  );
};

export default DataTable;
