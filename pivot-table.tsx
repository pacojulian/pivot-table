"use client"

import { useState, useEffect, useCallback } from "react"
import "./pivot-table.css"
import type React from "react"
import ColumnHeader from "./components/column-header"
import type { DataItem, FlattenedDataRow, AvailableGroup } from "./lib/data-service"
import { flattenData, getUniqueValues } from "./lib/data-service"

// Define the grouped data structure
type GroupedData = {
  [key: string]: GroupNode
}

type GroupNode = {
  _isExpanded: boolean
  _groupField?: string
  _groupValue?: string
  _rows: FlattenedDataRow[]
  [key: string]: GroupNode | FlattenedDataRow[] | boolean | string | undefined
}

// Props for the PivotTable component
type PivotTableProps = {
  data: DataItem[]
  loadingServices: Record<string, boolean>
  loadingAttributes: Record<string, boolean>
  expandedRepos: Set<string>
  expandedServices: Set<string>
  fetchServicesForRepo: (asvId: string, repoName: string) => Promise<void>
  fetchAttributesForService: (asvId: string, repoName: string, serviceName: string) => Promise<void>
  appliedFilters?: Record<string, string[]>
  onUpdateFilters?: (filters: Record<string, string[]>) => void
}

export default function PivotTable({
  data,
  loadingServices,
  loadingAttributes,
  expandedRepos,
  expandedServices,
  fetchServicesForRepo,
  fetchAttributesForService,
  appliedFilters = {},
  onUpdateFilters,
}: PivotTableProps) {
  // Data states
  const [flatData, setFlatData] = useState<FlattenedDataRow[]>([])
  const [filteredData, setFilteredData] = useState<FlattenedDataRow[]>([])

  // Available grouping fields - initially only ASV and Repository
  const [availableGroups, setAvailableGroups] = useState<AvailableGroup[]>([
    { id: "asvName", label: "ASV" },
    { id: "asvId", label: "ASV ID" },
    { id: "asvBA", label: "Business Area" },
    { id: "repoName", label: "Repository Name" },
    { id: "repoUsecase", label: "Repository Usecase" },
    { id: "repoStatus", label: "Repository Status" },
    { id: "serviceName", label: "Service Name" }, // Include Service Name from the start
  ])

  // Grouping state - ordered list of selected groups
  const [activeGroups, setActiveGroups] = useState<Array<keyof FlattenedDataRow>>([
    "asvName",
    "repoName",
    "serviceName", // Include Service Name from the start
  ])

  // Filter states for all columns
  const [columnFilters, setColumnFilters] = useState<Record<keyof FlattenedDataRow, string[]>>({
    asvId: [],
    asvName: [],
    asvBA: [],
    repoName: [],
    repoUsecase: [],
    repoStatus: [],
    serviceName: [],
    attributeName: [],
  })

  // Unique values for each column
  const [uniqueColumnValues, setUniqueColumnValues] = useState<Record<keyof FlattenedDataRow, string[]>>({
    asvId: [],
    asvName: [],
    asvBA: [],
    repoName: [],
    repoUsecase: [],
    repoStatus: [],
    serviceName: [],
    attributeName: [],
  })

  // Initialize data
  useEffect(() => {
    const flattened = flattenData(data)
    setFlatData(flattened)
    setFilteredData(flattened)

    // Extract unique values for filters
    const uniqueValues: Partial<Record<keyof FlattenedDataRow, string[]>> = {}

    Object.keys(flattened[0] || {}).forEach((field) => {
      const fieldKey = field as keyof FlattenedDataRow
      uniqueValues[fieldKey] = getUniqueValues(flattened, fieldKey).map((val) => String(val))
    })

    setUniqueColumnValues((prev) => ({
      ...prev,
      ...(uniqueValues as Record<keyof FlattenedDataRow, string[]>),
    }))
  }, [data])

  // Apply filters from parent component
  useEffect(() => {
    if (appliedFilters && Object.keys(appliedFilters).length > 0) {
      // Create a new filters object to avoid direct mutation
      const newFilters = { ...columnFilters }
      let hasChanges = false

      // Apply each filter from parent
      Object.entries(appliedFilters).forEach(([field, values]) => {
        if (field in newFilters) {
          const fieldKey = field as keyof FlattenedDataRow
          // Only update if the values are different
          if (JSON.stringify(newFilters[fieldKey]) !== JSON.stringify(values)) {
            newFilters[fieldKey] = values
            hasChanges = true
          }
        }
      })

      // Only update state if there are actual changes
      if (hasChanges) {
        setColumnFilters(newFilters)
      }
    }
  }, [appliedFilters]) // Only depend on appliedFilters

  // Apply filters
  useEffect(() => {
    const filtered = flatData.filter((item) => {
      // Check each active filter
      return Object.entries(columnFilters).every(([field, selectedValues]) => {
        // If no values are selected for this field, don't filter on it
        if (selectedValues.length === 0) return true

        // If the field doesn't exist in this item, don't filter on it
        const fieldKey = field as keyof FlattenedDataRow
        if (item[fieldKey] === undefined) return true

        // Otherwise, check if the item's value for this field is in the selected values
        const fieldValue = String(item[fieldKey])
        return selectedValues.includes(fieldValue)
      })
    })

    setFilteredData(filtered)
  }, [flatData, columnFilters])

  // Add a separate effect for notifying the parent about filter changes
  useEffect(() => {
    // Only notify parent if filters have changed and callback exists
    if (!onUpdateFilters) return

    // Deep compare the filters to avoid unnecessary updates
    const filtersChanged = JSON.stringify(columnFilters) !== JSON.stringify(appliedFilters)

    if (filtersChanged) {
      onUpdateFilters(columnFilters)
    }
  }, [columnFilters, onUpdateFilters, appliedFilters])

  // Update a specific column filter
  const updateColumnFilter = (field: keyof FlattenedDataRow, selected: string[]) => {
    setColumnFilters((prev) => ({
      ...prev,
      [field]: selected,
    }))
  }

  // Clear a specific column filter
  const clearColumnFilter = (field: keyof FlattenedDataRow) => {
    setColumnFilters((prev) => ({
      ...prev,
      [field]: [],
    }))
  }

  // Clear all filters
  const clearAllFilters = () => {
    const emptyFilters: Record<keyof FlattenedDataRow, string[]> = {
      asvId: [],
      asvName: [],
      asvBA: [],
      repoName: [],
      repoUsecase: [],
      repoStatus: [],
      serviceName: [],
      attributeName: [],
    }
    setColumnFilters(emptyFilters)

    // Notify parent component
    if (onUpdateFilters) {
      onUpdateFilters({})
    }
  }

  // Group data for display based on active groups
  const groupData = (data: FlattenedDataRow[]): GroupedData => {
    if (activeGroups.length === 0) return { _rows: data, _isExpanded: true }

    const grouped: GroupedData = {}

    data.forEach((row) => {
      let currentLevel: GroupNode = grouped as GroupNode

      // Create nested structure based on active groups
      activeGroups.forEach((group, index) => {
        // Skip if the field doesn't exist in this row
        if (row[group] === undefined) return

        // Use a special placeholder for empty service names
        const groupValue = row[group] === "" ? "" : String(row[group])

        if (!currentLevel[groupValue]) {
          currentLevel[groupValue] = {
            _isExpanded: index < 1, // Expand first level by default
            _groupField: group,
            _groupValue: groupValue,
            _rows: [],
          }
        }

        if (index === activeGroups.length - 1) {
          ;(currentLevel[groupValue] as GroupNode)._rows.push(row)
        }

        currentLevel = currentLevel[groupValue] as GroupNode
      })
    })

    return grouped
  }

  const groupedData = groupData(filteredData)

  // Toggle row expansion
  const toggleExpand = (path: string[], level: number): void => {
    const element = document.querySelector(`[data-path="${path.join(".")}"]`)
    if (element) {
      const isExpanding = !element.classList.contains("expanded")
      element.classList.toggle("expanded")

      // Toggle visibility of child rows
      const childRows = document.querySelectorAll(`[data-parent^="${path.join(".")}"]`)
      childRows.forEach((row) => {
        ;(row as HTMLElement).style.display = element.classList.contains("expanded") ? "table-row" : "none"
      })

      // If this is a repository row and it's being expanded, fetch services
      if (level === 1 && activeGroups[0] === "asvName" && activeGroups[1] === "repoName" && isExpanding) {
        // Find the ASV ID for this ASV name
        const asvItem = data.find((item) => item.asv.asv === path[0])
        if (asvItem) {
          const asvId = asvItem.asv.id
          const repoName = path[1]
          if (asvId && repoName) {
            fetchServicesForRepo(asvId, repoName)
          }
        }
      }

      // If this is a service row and it's being expanded, fetch attributes
      if (
        level === 2 &&
        activeGroups[0] === "asvName" &&
        activeGroups[1] === "repoName" &&
        activeGroups[2] === "serviceName" &&
        isExpanding
      ) {
        // Find the ASV ID for this ASV name
        const asvItem = data.find((item) => item.asv.asv === path[0])
        if (asvItem) {
          const asvId = asvItem.asv.id
          const repoName = path[1]
          const serviceName = path[2]
          if (asvId && repoName && serviceName) {
            fetchAttributesForService(asvId, repoName, serviceName)
          }
        }
      }
    }
  }

  // Update the fetchServicesForRepo function to handle clicking on empty service cells
  const handleEmptyServiceClick = useCallback(
    (asvName: string, repoName: string) => {
      // Find the ASV ID for this ASV name
      const asvItem = data.find((item) => item.asv.asv === asvName)
      if (asvItem) {
        const asvId = asvItem.asv.id
        if (asvId) {
          fetchServicesForRepo(asvId, repoName)
        }
      }
    },
    [fetchServicesForRepo, data],
  )

  // Update the renderRows function to add click handler for empty service cells
  const renderPivotRows = (
    data: GroupedData | GroupNode,
    path: string[] = [],
    level = 0,
    parentPath = "",
  ): React.JSX.Element[] | null => {
    if (!data) return null

    // Use a Map to track rendered rows by their unique path
    const elements: React.JSX.Element[] = []
    const renderedPaths = new Set<string>()

    if (level === 0 && activeGroups.length === 0) {
      // If no grouping is selected, render flat data
      return (data as GroupNode)._rows.map((row: FlattenedDataRow, index: number) => (
        <tr key={`row-${index}`} className="data-row">
          {Object.keys(row).map((field) => (
            <td key={field}>{row[field as keyof FlattenedDataRow]}</td>
          ))}
        </tr>
      ))
    }

    // Process each key in the current level
    Object.keys(data)
      .filter((key) => key !== "_isExpanded" && key !== "_rows" && key !== "_groupField" && key !== "_groupValue")
      .forEach((key) => {
        const currentPath = [...path, key]
        const pathString = currentPath.join(".")

        // Skip if we've already rendered this path
        if (renderedPaths.has(pathString)) return
        renderedPaths.add(pathString)

        const parentPathString = parentPath ? parentPath : ""
        const currentGroup = data[key] as GroupNode

        // Group row
        elements.push(
          <tr
            key={pathString}
            className={`group-row level-${level} ${currentGroup._isExpanded ? "expanded" : ""}`}
            data-path={pathString}
            data-parent={parentPathString}
            style={{ display: level === 0 || parentPathString === "" ? "table-row" : "none" }}
          >
            {activeGroups.map((group, i) => {
              if (i === level) {
                if (level === 2 && activeGroups[2] === "serviceName" && key === "") {
                  return (
                    <td key={i} className="group-cell">
                      <div
                        className="expander-cell no-data-text"
                        onClick={() => handleEmptyServiceClick(path[0], path[1])}
                      >
                        <span>(No services available - click to load)</span>
                        {loadingServices[`${path[0]}-${path[1]}`] && <span className="loading-spinner-small"></span>}
                      </div>
                    </td>
                  )
                }

                return (
                  <td key={i} className="group-cell">
                    <div className="expander-cell">
                      {level < activeGroups.length - 1 && (
                        <button
                          className={`expander ${currentGroup._isExpanded ? "expanded" : ""}`}
                          onClick={() => toggleExpand(currentPath, level)}
                          aria-label={currentGroup._isExpanded ? "Collapse" : "Expand"}
                        ></button>
                      )}
                      <span>{key}</span>

                      {loadingServices[`${path[0]}-${key}`] &&
                        level === 1 &&
                        activeGroups[0] === "asvName" &&
                        activeGroups[1] === "repoName" &&
                        path[0] === currentPath[0] &&
                        !expandedRepos.has(`${path[0]}-${key}`) && <span className="loading-spinner-small"></span>}

                      {loadingAttributes[`${path[0]}-${path[1]}-${key}`] &&
                        level === 2 &&
                        activeGroups[0] === "asvName" &&
                        activeGroups[1] === "repoName" &&
                        activeGroups[2] === "serviceName" &&
                        path[0] === currentPath[0] &&
                        path[1] === currentPath[1] &&
                        !expandedServices.has(`${path[0]}-${path[1]}-${key}`) && (
                          <span className="loading-spinner-small"></span>
                        )}
                    </div>
                  </td>
                )
              } else if (i < level) {
                return <td key={i} className="empty-cell"></td>
              } else {
                return <td key={i}></td>
              }
            })}
          </tr>,
        )

        // Only render data rows if this is the last level of grouping
        if (level === activeGroups.length - 1 && currentGroup._rows && currentGroup._rows.length > 0) {
          // Create a unique key for each data row to avoid duplicates
          const rowsRendered = new Set<string>()

          currentGroup._rows.forEach((row: FlattenedDataRow, rowIndex: number) => {
            // Create a unique identifier for this row
            const rowKey = JSON.stringify(row)

            // Skip if we've already rendered this row
            if (rowsRendered.has(rowKey)) return
            rowsRendered.add(rowKey)

            elements.push(
              <tr
                key={`${pathString}-row-${rowIndex}`}
                className="data-row"
                data-parent={pathString}
                style={{ display: currentGroup._isExpanded ? "table-row" : "none" }}
              >
                {activeGroups.map((group, i) => (
                  <td key={i} className={i < level ? "empty-cell" : ""}>
                    {i === level ? row[group] : ""}
                  </td>
                ))}
              </tr>,
            )
          })
        }

        // Recursively render child groups if not at the last level
        if (level < activeGroups.length - 1) {
          const childElements = renderPivotRows(currentGroup, currentPath, level + 1, pathString)
          if (childElements) {
            elements.push(...childElements)
          }
        }
      })

    return elements
  }

  // Handle drag start for a group item
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number): void => {
    e.dataTransfer.setData("text/plain", index.toString())
    e.currentTarget.classList.add("dragging")
  }

  // Handle drag over for a group item
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault()
    const target = e.currentTarget as HTMLElement
    target.classList.add("drag-over")
  }

  // Handle drag leave for a group item
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>): void => {
    const target = e.currentTarget as HTMLElement
    target.classList.remove("drag-over")
  }

  // Handle drop for a group item
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number): void => {
    e.preventDefault()
    const dragIndex = Number.parseInt(e.dataTransfer.getData("text/plain"))
    const target = e.currentTarget as HTMLElement
    target.classList.remove("drag-over")

    if (dragIndex !== dropIndex) {
      const newGroups = [...activeGroups]
      const [removed] = newGroups.splice(dragIndex, 1)
      newGroups.splice(dropIndex, 0, removed)
      setActiveGroups(newGroups)
    }
  }

  // Handle drag end
  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>): void => {
    e.currentTarget.classList.remove("dragging")
  }

  // Add a group to the active groups
  const addGroup = (groupId: keyof FlattenedDataRow): void => {
    if (!activeGroups.includes(groupId)) {
      setActiveGroups([...activeGroups, groupId])
    }
  }

  // Remove a group from active groups
  const removeGroup = (groupId: keyof FlattenedDataRow): void => {
    setActiveGroups(activeGroups.filter((g) => g !== groupId))
  }

  return (
    <div className="main-content">
      {/* Sidebar for controls */}
      <div className="sidebar open">
        <div className="sidebar-header">
          <h2>Pivot Table Controls</h2>
        </div>
        <div className="sidebar-content">
          <div className="grouping-controls">
            <h3>Row Grouping</h3>

            <div className="grouping-explanation">
              <p>Drag and drop to reorder. The order determines the hierarchy of your data grouping.</p>
            </div>

            <div className="active-groups">
              {activeGroups.length > 0 ? (
                <div className="active-groups-list">
                  {activeGroups.map((group, index) => (
                    <div
                      key={String(group)}
                      className="group-pill"
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragEnd={handleDragEnd}
                    >
                      <span className="group-pill-text">
                        {index + 1}. {availableGroups.find((g) => g.id === group)?.label}
                      </span>
                      <button className="group-pill-remove" onClick={() => removeGroup(group)} title="Remove">
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-groups-message">No grouping selected. Select fields below to add grouping.</div>
              )}
            </div>

            <div className="available-groups">
              <div className="available-groups-label">Add field to grouping:</div>
              <div className="available-groups-list">
                {availableGroups.map((group) => (
                  <button
                    key={String(group.id)}
                    className={`available-group-btn ${activeGroups.includes(group.id) ? "disabled" : ""}`}
                    onClick={() => addGroup(group.id)}
                    disabled={activeGroups.includes(group.id)}
                  >
                    + {group.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="filter-actions">
            <button className="clear-filters-btn" onClick={clearAllFilters} title="Clear all filters">
              <span className="clear-icon">↺</span>
              Clear All Filters
            </button>
          </div>
        </div>
      </div>

      {/* Main table area */}
      <div className="table-container">
        <div className="table-wrapper">
          <table className="pivot-table">
            <thead>
              <tr>
                {activeGroups.length > 0
                  ? activeGroups.map((group, index) => {
                      const label = availableGroups.find((g) => g.id === group)?.label || String(group)
                      return (
                        <th key={index} className="group-header">
                          <ColumnHeader
                            field={group}
                            label={label}
                            uniqueValues={uniqueColumnValues[group] || []}
                            selectedFilters={columnFilters[group] || []}
                            onFilterChange={updateColumnFilter}
                            onClearFilter={clearColumnFilter}
                          />
                        </th>
                      )
                    })
                  : Object.keys(flatData[0] || {}).map((field) => {
                      const fieldKey = field as keyof FlattenedDataRow
                      return (
                        <th key={field} className="group-header">
                          <ColumnHeader
                            field={fieldKey}
                            label={field}
                            uniqueValues={uniqueColumnValues[fieldKey] || []}
                            selectedFilters={columnFilters[fieldKey] || []}
                            onFilterChange={updateColumnFilter}
                            onClearFilter={clearColumnFilter}
                          />
                        </th>
                      )
                    })}
              </tr>
            </thead>
            <tbody>{renderPivotRows(groupedData)}</tbody>
          </table>

          {filteredData.length === 0 && (
            <div className="no-data-message">No data available. Please adjust your filters.</div>
          )}
        </div>
      </div>
    </div>
  )
}
