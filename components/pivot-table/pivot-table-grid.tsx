"use client"
import type { ColumnDefinition, PivotTableData } from "./types"

interface PivotTableGridProps {
  data: PivotTableData[]
  columns: ColumnDefinition[]
  expandedRows: Record<string, boolean>
  sortConfig: { column: string; direction: "asc" | "desc" } | null
  onRowExpand: (rowId: string) => void
  onSort: (column: string) => void
}

export function PivotTableGrid({ data, columns, expandedRows, sortConfig, onRowExpand, onSort }: PivotTableGridProps) {
  // Recursively render rows
  const renderRows = (rows: PivotTableData[], depth = 0) => {
    return rows.flatMap((row) => {
      const isExpanded = expandedRows[row.id] || false
      const hasChildren = row.children && row.children.length > 0

      // Create the current row
      const currentRow = (
        <tr key={row.id} className={`pivot-row ${row.isGroup ? "group-row" : "leaf-row"} depth-${depth}`}>
          {/* Group cell with indent and expand/collapse control */}
          <td className="group-cell">
            <div className="group-cell-content" style={{ paddingLeft: `${depth * 16}px` }}>
              {hasChildren && (
                <span
                  className={`expand-icon ${isExpanded ? "expanded" : "collapsed"}`}
                  onClick={() => onRowExpand(row.id)}
                  role="button"
                  tabIndex={0}
                  aria-label={isExpanded ? "Collapse" : "Expand"}
                />
              )}
              <span className="group-value">{row.isGroup ? row.groupValue : row[row.field]}</span>
            </div>
          </td>

          {/* Data cells for each column */}
          {columns.map((column) => (
            <td key={`${row.id}-${column.field}`} className="data-cell">
              {row[column.field] !== undefined ? formatValue(row[column.field], column.format) : ""}
            </td>
          ))}
        </tr>
      )

      // If expanded and has children, also render child rows
      if (isExpanded && hasChildren && row.children) {
        return [currentRow, ...renderRows(row.children, depth + 1)]
      }

      return currentRow
    })
  }

  // Format cell values based on column definition
  const formatValue = (value: any, format?: string) => {
    if (value === null || value === undefined) return ""

    if (typeof value === "number") {
      if (format === "currency") {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(value)
      } else if (format === "percent") {
        return new Intl.NumberFormat("en-US", {
          style: "percent",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(value / 100)
      } else if (format === "decimal") {
        return new Intl.NumberFormat("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(value)
      }
      return value.toString()
    }

    return value.toString()
  }

  // Get sort indicator for column
  const getSortIndicator = (column: string) => {
    if (!sortConfig || sortConfig.column !== column) {
      return "none"
    }
    return sortConfig.direction
  }

  // Determine if the hierarchy column is sorted
  const isHierarchySorted = sortConfig && columns.every((col) => col.field !== sortConfig.column)

  return (
    <div className="pivot-table-grid">
      <table>
        <thead>
          <tr>
            {/* Hierarchy column header */}
            <th
              className={`hierarchy-header ${isHierarchySorted ? "sorted" : ""}`}
              onClick={() => onSort("groupValue")}
            >
              <div className="header-content">
                <span>Hierarchy</span>
                {isHierarchySorted && <span className={`sort-icon ${sortConfig?.direction}`} />}
              </div>
            </th>

            {/* Data column headers */}
            {columns.map((column) => (
              <th
                key={column.field}
                className={`data-header ${getSortIndicator(column.field) !== "none" ? "sorted" : ""}`}
                onClick={() => onSort(column.field)}
              >
                <div className="header-content">
                  <span>{column.title || column.field}</span>
                  <span className={`sort-icon ${getSortIndicator(column.field)}`} />
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            renderRows(data)
          ) : (
            <tr>
              <td colSpan={columns.length + 1} className="no-data">
                No data to display
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

