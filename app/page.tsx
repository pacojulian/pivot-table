"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useDataService, type FlattenedDataRow } from "@/lib/data-service"
import {
  Menu,
  X,
  Check,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Filter,
  ChevronDown,
} from "lucide-react"
import "@/data-table.css"

// Define column configuration type
type ColumnConfig = {
  id: keyof FlattenedDataRow
  label: string
  visible: boolean
  order: number
  sortDirection?: "asc" | "desc" | null
  filterValues?: string[]
}

export default function Home() {
  // State for sidebar and filters
  const [showSidebar, setShowSidebar] = useState(false)
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string[]>>({})
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [showServiceDropdown, setShowServiceDropdown] = useState(false)
  const [serviceSearchQuery, setServiceSearchQuery] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilterDropdown, setActiveFilterDropdown] = useState<keyof FlattenedDataRow | null>(null)
  const filterDropdownRef = useRef<HTMLDivElement>(null)

  // Column management state
  const [columns, setColumns] = useState<ColumnConfig[]>([
    { id: "asvName", label: "ASV", visible: true, order: 0 },
    { id: "asvId", label: "ASV ID", visible: true, order: 1 },
    { id: "asvBA", label: "Business Area", visible: true, order: 2 },
    { id: "repoName", label: "Repository", visible: true, order: 3 },
    { id: "repoUsecase", label: "Usecase", visible: true, order: 4 },
    { id: "repoStatus", label: "Status", visible: true, order: 5 },
    { id: "serviceName", label: "Services", visible: true, order: 6 },
    { id: "attributeName", label: "Attributes", visible: true, order: 7 },
  ])

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

  // Drag and drop state
  const [draggedColumn, setDraggedColumn] = useState<keyof FlattenedDataRow | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<keyof FlattenedDataRow | null>(null)

  // Get data service
  const {
    data,
    loadingServices,
    loadingAttributes,
    expandedRepos,
    expandedServices,
    fetchServicesForRepo,
    fetchAttributesForService,
    searchServicesByAttribute,
  } = useDataService()

  // Filtered and sorted data
  const [filteredData, setFilteredData] = useState<FlattenedDataRow[]>([])
  const [flatData, setFlatData] = useState<FlattenedDataRow[]>([])

  // Available services
  const availableServices = [
    "cch",
    "auth",
    "analytics",
    "dashboard",
    "reporting",
    "export",
    "monitoring",
    "alerts",
    "processing",
    "transformation",
    "metrics",
    "logs",
  ]

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setActiveFilterDropdown(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Initialize flat data
  useEffect(() => {
    if (data.length > 0) {
      const flattened = data.flatMap((item) => {
        const asv = item.asv
        return asv.repositories.flatMap((repo) => {
          if (!repo.services || repo.services.length === 0) {
            return [
              {
                asvId: asv.id,
                asvName: asv.asv,
                asvBA: asv.ba,
                repoName: repo.name,
                repoUsecase: repo.usecase,
                repoStatus: repo.status,
                serviceName: "",
                attributeName: "",
              },
            ]
          } else {
            return repo.services.flatMap((service) => {
              if (!service.attributes || service.attributes.length === 0) {
                return [
                  {
                    asvId: asv.id,
                    asvName: asv.asv,
                    asvBA: asv.ba,
                    repoName: repo.name,
                    repoUsecase: repo.usecase,
                    repoStatus: repo.status,
                    serviceName: service.name,
                    attributeName: "",
                  },
                ]
              } else {
                return service.attributes.map((attr) => ({
                  asvId: asv.id,
                  asvName: asv.asv,
                  asvBA: asv.ba,
                  repoName: repo.name,
                  repoUsecase: repo.usecase,
                  repoStatus: repo.status,
                  serviceName: service.name,
                  attributeName: attr["attribute-name"],
                }))
              }
            })
          }
        })
      })
      setFlatData(flattened)
      setFilteredData(flattened)

      // Extract unique values for filters
      const uniqueValues: Partial<Record<keyof FlattenedDataRow, string[]>> = {}
      Object.keys(flattened[0] || {}).forEach((field) => {
        const fieldKey = field as keyof FlattenedDataRow
        const values = new Set(flattened.map((item) => String(item[fieldKey])).filter(Boolean))
        uniqueValues[fieldKey] = Array.from(values)
      })
      setUniqueColumnValues(uniqueValues as Record<keyof FlattenedDataRow, string[]>)
    }
  }, [data])

  // Apply filters and search
  useEffect(() => {
    let filtered = [...flatData]

    // Apply column filters
    if (Object.keys(appliedFilters).length > 0) {
      filtered = filtered.filter((item) => {
        return Object.entries(appliedFilters).every(([field, values]) => {
          if (values.length === 0) return true

          const fieldKey = field as keyof FlattenedDataRow
          if (item[fieldKey] === undefined) return true

          const fieldValue = String(item[fieldKey])
          return values.includes(fieldValue)
        })
      })
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter((item) => {
        return Object.entries(item).some(([_, value]) => {
          return String(value).toLowerCase().includes(query)
        })
      })
    }

    // Apply sorting
    const sortColumn = columns.find((col) => col.sortDirection)
    if (sortColumn) {
      filtered.sort((a, b) => {
        const aValue = a[sortColumn.id]
        const bValue = b[sortColumn.id]

        if (aValue === undefined && bValue === undefined) return 0
        if (aValue === undefined) return 1
        if (bValue === undefined) return -1

        const comparison = String(aValue).localeCompare(String(bValue))
        return sortColumn.sortDirection === "asc" ? comparison : -comparison
      })
    }

    setFilteredData(filtered)
  }, [flatData, appliedFilters, searchQuery, columns])

  // Toggle sidebar
  const toggleSidebar = () => {
    setShowSidebar(!showSidebar)
  }

  // Toggle service selection
  const toggleServiceSelection = (service: string) => {
    setSelectedServices((prev) => {
      if (prev.includes(service)) {
        return prev.filter((s) => s !== service)
      } else {
        return [...prev, service]
      }
    })
  }

  // Apply service filter
  const applyServiceFilter = () => {
    if (selectedServices.length > 0) {
      const newFilters = { ...appliedFilters }
      newFilters.serviceName = selectedServices
      setAppliedFilters(newFilters)

      // Trigger search for each selected service
      selectedServices.forEach((service) => {
        searchServicesByAttribute(service)
      })

      setShowServiceDropdown(false)
      setServiceSearchQuery("")
    }
  }

  // Handle removing a filter
  const handleRemoveFilter = (field: string, value: string) => {
    const newFilters = { ...appliedFilters }
    newFilters[field] = newFilters[field].filter((v) => v !== value)
    if (newFilters[field].length === 0) {
      delete newFilters[field]
    }
    setAppliedFilters(newFilters)

    // If removing a service filter, update selectedServices
    if (field === "serviceName") {
      setSelectedServices((prev) => prev.filter((s) => s !== value))
    }
  }

  // Handle clearing all filters
  const handleClearAllFilters = () => {
    setAppliedFilters({})
    setSelectedServices([])
    setSearchQuery("")
  }

  // Format filter label
  const formatFilterLabel = (field: string) => {
    switch (field) {
      case "asvId":
        return "ASV ID"
      case "asvName":
        return "ASV"
      case "asvBA":
        return "Business Area"
      case "repoName":
        return "Repository"
      case "repoUsecase":
        return "Usecase"
      case "repoStatus":
        return "Status"
      case "serviceName":
        return "Service"
      case "attributeName":
        return "Attribute"
      default:
        return field
    }
  }

  // Toggle column visibility
  const toggleColumnVisibility = (columnId: keyof FlattenedDataRow) => {
    setColumns((prev) => prev.map((col) => (col.id === columnId ? { ...col, visible: !col.visible } : col)))
  }

  // Handle column sort
  const handleSort = (columnId: keyof FlattenedDataRow) => {
    setColumns((prev) =>
      prev.map((col) => {
        if (col.id === columnId) {
          // Cycle through: null -> asc -> desc -> null
          const nextDirection = col.sortDirection === null ? "asc" : col.sortDirection === "asc" ? "desc" : null
          return { ...col, sortDirection: nextDirection }
        } else {
          // Clear sort direction for other columns
          return { ...col, sortDirection: null }
        }
      }),
    )
  }

  // Toggle filter dropdown
  const toggleFilterDropdown = (columnId: keyof FlattenedDataRow) => {
    setActiveFilterDropdown(activeFilterDropdown === columnId ? null : columnId)
  }

  // Apply column filter
  const applyColumnFilter = (columnId: keyof FlattenedDataRow, selectedValues: string[]) => {
    if (selectedValues.length > 0) {
      const newFilters = { ...appliedFilters }
      newFilters[columnId] = selectedValues
      setAppliedFilters(newFilters)
    } else {
      const newFilters = { ...appliedFilters }
      delete newFilters[columnId]
      setAppliedFilters(newFilters)
    }
    setActiveFilterDropdown(null)
  }

  // Handle column drag start
  const handleDragStart = (columnId: keyof FlattenedDataRow) => {
    setDraggedColumn(columnId)
  }

  // Handle column drag over
  const handleDragOver = (e: React.DragEvent, columnId: keyof FlattenedDataRow) => {
    e.preventDefault()
    setDragOverColumn(columnId)
  }

  // Handle column drop
  const handleDrop = (targetColumnId: keyof FlattenedDataRow) => {
    if (!draggedColumn || draggedColumn === targetColumnId) {
      setDraggedColumn(null)
      setDragOverColumn(null)
      return
    }

    // Reorder columns
    const updatedColumns = [...columns]
    const draggedColIndex = updatedColumns.findIndex((col) => col.id === draggedColumn)
    const targetColIndex = updatedColumns.findIndex((col) => col.id === targetColumnId)

    // Update order values
    if (draggedColIndex !== -1 && targetColIndex !== -1) {
      const draggedCol = { ...updatedColumns[draggedColIndex] }

      // Remove the dragged column
      updatedColumns.splice(draggedColIndex, 1)

      // Insert at the target position
      updatedColumns.splice(targetColIndex, 0, draggedCol)

      // Update order values
      updatedColumns.forEach((col, index) => {
        col.order = index
      })

      setColumns(updatedColumns)
    }

    setDraggedColumn(null)
    setDragOverColumn(null)
  }

  // Handle repository dropdown click
  const handleRepoDropdownClick = (asvId: string, repoName: string) => {
    fetchServicesForRepo(asvId, repoName)
  }

  // Handle service dropdown click
  const handleServiceDropdownClick = (asvId: string, repoName: string, serviceName: string) => {
    fetchAttributesForService(asvId, repoName, serviceName)
  }

  // Get visible columns in order
  const visibleColumns = columns.filter((col) => col.visible).sort((a, b) => a.order - b.order)

  // Filter services by search query
  const filteredServices = availableServices.filter((service) =>
    service.toLowerCase().includes(serviceSearchQuery.toLowerCase()),
  )

  return (
    <main className="p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6">Data Table with Column Management</h1>

      <div className={`data-table-container ${showSidebar ? "sidebar-open" : ""}`}>
        {/* Top toolbar */}
        <div className="data-toolbar">
          <div className="toolbar-left">
            <button className="sidebar-toggle-btn" onClick={toggleSidebar} title="Toggle filters sidebar">
              <Menu size={18} />
              <span className="sidebar-toggle-text">Filters & Columns</span>
            </button>
          </div>
          <h2 className="data-title">Data Table</h2>
        </div>

        {/* Sidebar */}
        {showSidebar && (
          <div className="data-sidebar">
            <div className="sidebar-header">
              <h3>Filters & Columns</h3>
              <button className="close-sidebar" onClick={toggleSidebar}>
                ×
              </button>
            </div>
            <div className="sidebar-content">
              {/* Global Search Section */}
              <div className="sidebar-section">
                <h4>Search</h4>
                <div className="search-container">
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search in table..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                  {searchQuery && (
                    <button className="clear-search-btn" onClick={() => setSearchQuery("")} title="Clear search">
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Column Management Section */}
              <div className="sidebar-section">
                <h4>Manage Columns</h4>
                <div className="column-management">
                  {columns.map((column) => (
                    <div key={String(column.id)} className="column-toggle">
                      <label className="column-toggle-label">
                        <input
                          type="checkbox"
                          checked={column.visible}
                          onChange={() => toggleColumnVisibility(column.id)}
                        />
                        <span className="checkbox-custom">{column.visible && <Check size={14} />}</span>
                        <span className="column-label">{column.label}</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Service Filter Section */}
              <div className="sidebar-section">
                <h4>Service Filter</h4>
                <div className="multi-select-container">
                  <button className="multi-select-button" onClick={() => setShowServiceDropdown(!showServiceDropdown)}>
                    {selectedServices.length > 0 ? `${selectedServices.length} service(s) selected` : "Select services"}
                    <ChevronDown size={16} className="dropdown-chevron" />
                  </button>

                  {showServiceDropdown && (
                    <div className="multi-select-dropdown">
                      <div className="dropdown-search">
                        <Search size={14} className="dropdown-search-icon" />
                        <input
                          type="text"
                          placeholder="Search services..."
                          value={serviceSearchQuery}
                          onChange={(e) => setServiceSearchQuery(e.target.value)}
                          className="dropdown-search-input"
                        />
                      </div>
                      <div className="multi-select-options">
                        {filteredServices.length > 0 ? (
                          filteredServices.map((service) => (
                            <label key={service} className="multi-select-option">
                              <input
                                type="checkbox"
                                checked={selectedServices.includes(service)}
                                onChange={() => toggleServiceSelection(service)}
                              />
                              <span className="checkbox-custom">
                                {selectedServices.includes(service) && <Check size={14} />}
                              </span>
                              <span className="option-label">{service}</span>
                            </label>
                          ))
                        ) : (
                          <div className="no-results">No matching services found</div>
                        )}
                      </div>
                      <div className="multi-select-actions">
                        <button
                          className="apply-button"
                          onClick={applyServiceFilter}
                          disabled={selectedServices.length === 0}
                        >
                          Apply
                        </button>
                        <button className="cancel-button" onClick={() => setShowServiceDropdown(false)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Applied Filters Section */}
              <div className="sidebar-section">
                <h4>Applied Filters</h4>
                {Object.keys(appliedFilters).length > 0 || searchQuery ? (
                  <div className="applied-filters-sidebar">
                    <div className="filters-header">
                      <button className="clear-all-filters" onClick={handleClearAllFilters}>
                        Clear All
                      </button>
                    </div>
                    <div className="filter-pills">
                      {/* Search query filter */}
                      {searchQuery && (
                        <div className="filter-pill">
                          <span className="filter-label">Search:</span>
                          <div className="filter-values-group">
                            <span className="filter-value-item">
                              {searchQuery}
                              <button
                                className="remove-filter-btn"
                                onClick={() => setSearchQuery("")}
                                title="Clear search"
                              >
                                <X size={12} />
                              </button>
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Group ASV-related filters */}
                      {(appliedFilters.asvName?.length > 0 ||
                        appliedFilters.asvId?.length > 0 ||
                        appliedFilters.asvBA?.length > 0) && (
                        <div className="filter-pill">
                          <span className="filter-label">ASV:</span>
                          <div className="filter-values-group">
                            {appliedFilters.asvName?.map((value) => (
                              <span key={`asvName-${value}`} className="filter-value-item">
                                {value}
                                <button
                                  className="remove-filter-btn"
                                  onClick={() => handleRemoveFilter("asvName", value)}
                                  title={`Remove ${value}`}
                                >
                                  <X size={12} />
                                </button>
                              </span>
                            ))}
                            {appliedFilters.asvId?.map((value) => (
                              <span key={`asvId-${value}`} className="filter-value-item">
                                ID: {value}
                                <button
                                  className="remove-filter-btn"
                                  onClick={() => handleRemoveFilter("asvId", value)}
                                  title={`Remove ${value}`}
                                >
                                  <X size={12} />
                                </button>
                              </span>
                            ))}
                            {appliedFilters.asvBA?.map((value) => (
                              <span key={`asvBA-${value}`} className="filter-value-item">
                                BA: {value}
                                <button
                                  className="remove-filter-btn"
                                  onClick={() => handleRemoveFilter("asvBA", value)}
                                  title={`Remove ${value}`}
                                >
                                  <X size={12} />
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Repository filters */}
                      {(appliedFilters.repoName?.length > 0 ||
                        appliedFilters.repoUsecase?.length > 0 ||
                        appliedFilters.repoStatus?.length > 0) && (
                        <div className="filter-pill">
                          <span className="filter-label">Repository:</span>
                          <div className="filter-values-group">
                            {appliedFilters.repoName?.map((value) => (
                              <span key={`repoName-${value}`} className="filter-value-item">
                                {value}
                                <button
                                  className="remove-filter-btn"
                                  onClick={() => handleRemoveFilter("repoName", value)}
                                  title={`Remove ${value}`}
                                >
                                  <X size={12} />
                                </button>
                              </span>
                            ))}
                            {appliedFilters.repoUsecase?.map((value) => (
                              <span key={`repoUsecase-${value}`} className="filter-value-item">
                                Usecase: {value}
                                <button
                                  className="remove-filter-btn"
                                  onClick={() => handleRemoveFilter("repoUsecase", value)}
                                  title={`Remove ${value}`}
                                >
                                  <X size={12} />
                                </button>
                              </span>
                            ))}
                            {appliedFilters.repoStatus?.map((value) => (
                              <span key={`repoStatus-${value}`} className="filter-value-item">
                                Status: {value}
                                <button
                                  className="remove-filter-btn"
                                  onClick={() => handleRemoveFilter("repoStatus", value)}
                                  title={`Remove ${value}`}
                                >
                                  <X size={12} />
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Service filters */}
                      {appliedFilters.serviceName?.length > 0 && (
                        <div className="filter-pill">
                          <span className="filter-label">Service:</span>
                          <div className="filter-values-group">
                            {appliedFilters.serviceName.map((value) => (
                              <span key={`serviceName-${value}`} className="filter-value-item">
                                {value}
                                <button
                                  className="remove-filter-btn"
                                  onClick={() => handleRemoveFilter("serviceName", value)}
                                  title={`Remove ${value}`}
                                >
                                  <X size={12} />
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Attribute filters */}
                      {appliedFilters.attributeName?.length > 0 && (
                        <div className="filter-pill">
                          <span className="filter-label">Attribute:</span>
                          <div className="filter-values-group">
                            {appliedFilters.attributeName.map((value) => (
                              <span key={`attributeName-${value}`} className="filter-value-item">
                                {value}
                                <button
                                  className="remove-filter-btn"
                                  onClick={() => handleRemoveFilter("attributeName", value)}
                                  title={`Remove ${value}`}
                                >
                                  <X size={12} />
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="no-filters-message">No filters applied</div>
                )}
              </div>

              <button
                className="clear-all-btn"
                onClick={handleClearAllFilters}
                disabled={Object.keys(appliedFilters).length === 0 && !searchQuery}
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}

        {/* Data Table */}
        <div className="table-container">
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  {visibleColumns.map((column) => (
                    <th
                      key={String(column.id)}
                      draggable
                      onDragStart={() => handleDragStart(column.id)}
                      onDragOver={(e) => handleDragOver(e, column.id)}
                      onDrop={() => handleDrop(column.id)}
                      className={dragOverColumn === column.id ? "drag-over" : ""}
                    >
                      <div className="column-header">
                        <div className="drag-handle">
                          <GripVertical size={14} />
                        </div>
                        <span className="column-title">{column.label}</span>
                        <div className="column-actions">
                          <button
                            className="sort-button"
                            onClick={() => handleSort(column.id)}
                            title={
                              column.sortDirection === "asc"
                                ? "Sort descending"
                                : column.sortDirection === "desc"
                                  ? "Clear sort"
                                  : "Sort ascending"
                            }
                          >
                            {column.sortDirection === "asc" ? (
                              <ArrowUp size={14} />
                            ) : column.sortDirection === "desc" ? (
                              <ArrowDown size={14} />
                            ) : (
                              <ArrowUpDown size={14} />
                            )}
                          </button>
                          <button
                            className={`filter-button ${appliedFilters[column.id]?.length ? "active" : ""}`}
                            onClick={() => toggleFilterDropdown(column.id)}
                            title="Filter column"
                          >
                            <Filter size={14} />
                          </button>

                          {activeFilterDropdown === column.id && (
                            <div className="filter-dropdown" ref={filterDropdownRef}>
                              <div className="filter-dropdown-header">
                                <h4>Filter: {column.label}</h4>
                                <button
                                  className="close-filter-btn"
                                  onClick={() => setActiveFilterDropdown(null)}
                                  title="Close"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                              <div className="filter-dropdown-search">
                                <input type="text" placeholder="Search values..." className="filter-search-input" />
                              </div>
                              <div className="filter-dropdown-options">
                                {uniqueColumnValues[column.id]?.length > 0 ? (
                                  uniqueColumnValues[column.id].map((value) => (
                                    <label key={value} className="filter-option">
                                      <input
                                        type="checkbox"
                                        checked={appliedFilters[column.id]?.includes(value) || false}
                                        onChange={() => {
                                          const currentValues = appliedFilters[column.id] || []
                                          const newValues = currentValues.includes(value)
                                            ? currentValues.filter((v) => v !== value)
                                            : [...currentValues, value]
                                          applyColumnFilter(column.id, newValues)
                                        }}
                                      />
                                      <span className="checkbox-custom">
                                        {appliedFilters[column.id]?.includes(value) && <Check size={14} />}
                                      </span>
                                      <span className="option-label">{value || "(Empty)"}</span>
                                    </label>
                                  ))
                                ) : (
                                  <div className="no-filter-options">No values available</div>
                                )}
                              </div>
                              <div className="filter-dropdown-actions">
                                <button className="apply-filter-btn" onClick={() => setActiveFilterDropdown(null)}>
                                  Apply
                                </button>
                                <button
                                  className="clear-filter-btn"
                                  onClick={() => applyColumnFilter(column.id, [])}
                                  disabled={!appliedFilters[column.id]?.length}
                                >
                                  Clear
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? (
                  filteredData.map((row, rowIndex) => (
                    <tr key={rowIndex} className="data-row">
                      {visibleColumns.map((column) => (
                        <td key={`${rowIndex}-${String(column.id)}`}>
                          {column.id === "repoName" ? (
                            <div className="repo-cell">
                              <button
                                className="repo-dropdown-btn"
                                onClick={() => handleRepoDropdownClick(row.asvId, row.repoName)}
                                aria-label="Toggle services"
                              >
                                {expandedRepos.has(`${row.asvId}-${row.repoName}`) ? (
                                  <span className="dropdown-icon expanded">▼</span>
                                ) : (
                                  <span className="dropdown-icon">▶</span>
                                )}
                                {row.repoName}
                              </button>
                              {loadingServices[`${row.asvId}-${row.repoName}`] && (
                                <span className="loading-spinner-small"></span>
                              )}
                            </div>
                          ) : column.id === "serviceName" ? (
                            expandedRepos.has(`${row.asvId}-${row.repoName}`) && row.serviceName ? (
                              <div className="service-item">
                                <button
                                  className="service-dropdown-btn"
                                  onClick={() => handleServiceDropdownClick(row.asvId, row.repoName, row.serviceName)}
                                  aria-label="Toggle attributes"
                                >
                                  {expandedServices.has(`${row.asvId}-${row.repoName}-${row.serviceName}`) ? (
                                    <span className="dropdown-icon expanded">▼</span>
                                  ) : (
                                    <span className="dropdown-icon">▶</span>
                                  )}
                                  {row.serviceName}
                                </button>
                                {loadingAttributes[`${row.asvId}-${row.repoName}-${row.serviceName}`] && (
                                  <span className="loading-spinner-small"></span>
                                )}
                              </div>
                            ) : (
                              <span
                                className="no-data-text"
                                onClick={() => handleRepoDropdownClick(row.asvId, row.repoName)}
                              >
                                {row.serviceName || "Click to load services"}
                              </span>
                            )
                          ) : (
                            row[column.id]
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={visibleColumns.length} className="no-data-message">
                      No data available. Please adjust your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  )
}
