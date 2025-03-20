"use client"

import type React from "react"
import type { AggregationFunction, ColumnDefinition, HierarchyLevel, RowGrouping } from "./types"

interface PivotTableToolbarProps {
  selectedAggregation: AggregationFunction
  availableAggregations: AggregationFunction[]
  rowGrouping: RowGrouping[]
  columns: ColumnDefinition[]
  hierarchyLevels: HierarchyLevel[]
  onAggregationChange: (func: AggregationFunction) => void
  onRowGroupingChange: (grouping: RowGrouping[]) => void
  onColumnsChange: (columns: ColumnDefinition[]) => void
}

export function PivotTableToolbar({
  selectedAggregation,
  availableAggregations,
  rowGrouping,
  columns,
  hierarchyLevels,
  onAggregationChange,
  onRowGroupingChange,
  onColumnsChange,
}: PivotTableToolbarProps) {
  // Format text for display
  const formatText = (text: string) => {
    return text
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  // Handle aggregation function change
  const handleAggregationChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onAggregationChange(event.target.value as AggregationFunction)
  }

  // Handle adding a field to row grouping
  const handleAddRowGrouping = (field: HierarchyLevel) => {
    // Don't add if already exists
    if (rowGrouping.some((group) => group.field === field)) return

    const newGrouping = [...rowGrouping, { field, direction: "asc" }]
    onRowGroupingChange(newGrouping)
  }

  // Handle removing a field from row grouping
  const handleRemoveRowGrouping = (field: HierarchyLevel) => {
    const newGrouping = rowGrouping.filter((group) => group.field !== field)
    onRowGroupingChange(newGrouping)
  }

  // Handle reordering row grouping
  const handleMoveRowGrouping = (field: HierarchyLevel, direction: "up" | "down") => {
    const index = rowGrouping.findIndex((group) => group.field === field)
    if (index === -1) return

    const newIndex = direction === "up" ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= rowGrouping.length) return

    const newGrouping = [...rowGrouping]
    ;[newGrouping[index], newGrouping[newIndex]] = [newGrouping[newIndex], newGrouping[index]]

    onRowGroupingChange(newGrouping)
  }

  // Handle adding a column
  const handleAddColumn = (field: string) => {
    // Don't add if already exists
    if (columns.some((col) => col.field === field)) return

    const newColumns = [...columns, { field, title: formatText(field) }]
    onColumnsChange(newColumns)
  }

  // Handle removing a column
  const handleRemoveColumn = (field: string) => {
    const newColumns = columns.filter((col) => col.field !== field)
    onColumnsChange(newColumns)
  }

  return (
    <div className="pivot-table-toolbar">
      <div className="toolbar-section row-groups">
        <div className="toolbar-label">Row Grouping:</div>
        <div className="row-groups-list">
          {rowGrouping.length > 0 ? (
            rowGrouping.map((group, index) => (
              <div key={group.field} className="row-group-item">
                <span className="row-group-name">{formatText(group.field)}</span>
                <div className="row-group-actions">
                  {index > 0 && (
                    <button
                      className="move-up-button"
                      onClick={() => handleMoveRowGrouping(group.field, "up")}
                      aria-label="Move up"
                    >
                      <span className="visually-hidden">Move up</span>
                    </button>
                  )}
                  {index < rowGrouping.length - 1 && (
                    <button
                      className="move-down-button"
                      onClick={() => handleMoveRowGrouping(group.field, "down")}
                      aria-label="Move down"
                    >
                      <span className="visually-hidden">Move down</span>
                    </button>
                  )}
                  <button
                    className="remove-button"
                    onClick={() => handleRemoveRowGrouping(group.field)}
                    aria-label="Remove"
                  >
                    <span className="visually-hidden">Remove</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-groups">No grouping defined</div>
          )}
        </div>
        <div className="add-group-dropdown">
          <button className="add-group-button">Add Group</button>
          <div className="add-group-menu">
            {hierarchyLevels
              .filter((level) => !rowGrouping.some((group) => group.field === level))
              .map((level) => (
                <button key={level} className="add-group-option" onClick={() => handleAddRowGrouping(level)}>
                  {formatText(level)}
                </button>
              ))}
          </div>
        </div>
      </div>

      <div className="toolbar-section columns">
        <div className="toolbar-label">Columns:</div>
        <div className="columns-list">
          {columns.length > 0 ? (
            columns.map((column) => (
              <div key={column.field} className="column-item">
                <span className="column-name">{column.title || formatText(column.field)}</span>
                <button
                  className="remove-button"
                  onClick={() => handleRemoveColumn(column.field)}
                  aria-label="Remove column"
                >
                  <span className="visually-hidden">Remove</span>
                </button>
              </div>
            ))
          ) : (
            <div className="no-columns">No columns defined</div>
          )}
        </div>
        <div className="add-column-dropdown">
          <button className="add-column-button">Add Column</button>
          <div className="add-column-menu">
            {hierarchyLevels
              .filter((level) => !columns.some((col) => col.field === level))
              .map((level) => (
                <button key={level} className="add-column-option" onClick={() => handleAddColumn(level)}>
                  {formatText(level)}
                </button>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}

