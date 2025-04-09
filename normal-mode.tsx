"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import ColumnHeader from "./components/column-header"
import type { DataItem, FlattenedDataRow } from "./lib/data-service"
import { flattenData, getUniqueValues } from "./lib/data-service"

// Update the NormalMode component to include service search and display applied filters

// First, update the props type definition
type NormalModeProps = {
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

// Then, update the component definition to accept these props
const NormalMode = ({
  data,
  loadingServices,
  loadingAttributes,
  expandedRepos,
  expandedServices,
  fetchServicesForRepo,
  fetchAttributesForService,
  appliedFilters = {},
  onUpdateFilters,
}: NormalModeProps) => {
  // State for flattened and filtered data
  const [flatData, setFlatData] = useState<FlattenedDataRow[]>([])
  const [filteredData, setFilteredData] = useState<FlattenedDataRow[]>([])

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
  }, [columnFilters, onUpdateFilters])

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

  // Handle repository dropdown click
  const handleRepoDropdownClick = useCallback(
    (asvId: string, repoName: string) => {
      fetchServicesForRepo(asvId, repoName)
    },
    [fetchServicesForRepo],
  )

  // Handle service dropdown click
  const handleServiceDropdownClick = useCallback(
    (asvId: string, repoName: string, serviceName: string) => {
      fetchAttributesForService(asvId, repoName, serviceName)
    },
    [fetchAttributesForService],
  )

  // Render rows for normal mode
  const renderNormalRows = (): React.JSX.Element[] => {
    const elements: React.JSX.Element[] = []
    const renderedRows = new Set<string>()

    // Group data by ASV and Repository to avoid duplicates
    data.forEach((item) => {
      const asv = item.asv

      asv.repositories.forEach((repo) => {
        const rowKey = `${asv.asv}-${repo.name}`

        if (!renderedRows.has(rowKey)) {
          renderedRows.add(rowKey)

          // Check if this row should be included based on filters
          const shouldInclude = Object.entries(columnFilters).every(([field, selectedValues]) => {
            if (selectedValues.length === 0) return true

            const fieldKey = field as keyof FlattenedDataRow

            // Handle different fields
            if (fieldKey === "asvName") {
              return selectedValues.length === 0 || selectedValues.includes(asv.asv)
            } else if (fieldKey === "asvId") {
              return selectedValues.length === 0 || selectedValues.includes(asv.id)
            } else if (fieldKey === "asvBA") {
              return selectedValues.length === 0 || selectedValues.includes(asv.ba)
            } else if (fieldKey === "repoName") {
              return selectedValues.length === 0 || selectedValues.includes(repo.name)
            } else if (fieldKey === "repoUsecase") {
              return selectedValues.length === 0 || selectedValues.includes(repo.usecase)
            } else if (fieldKey === "repoStatus") {
              return selectedValues.length === 0 || selectedValues.includes(String(repo.status))
            } else if (fieldKey === "serviceName") {
              // For service name, check if any of the repo's services match the filter
              if (selectedValues.length === 0) return true
              if (!repo.services || repo.services.length === 0) return false
              return repo.services.some((service) => selectedValues.includes(service.name))
            } else if (fieldKey === "attributeName") {
              // For attribute name, check if any of the repo's services' attributes match the filter
              if (selectedValues.length === 0) return true
              if (!repo.services || repo.services.length === 0) return false

              return repo.services.some((service) => {
                if (!service.attributes || service.attributes.length === 0) return false
                return service.attributes.some((attr) => selectedValues.includes(attr["attribute-name"]))
              })
            }

            return true
          })

          if (shouldInclude) {
            elements.push(
              <tr key={rowKey} className="data-row">
                <td>{asv.asv}</td>
                <td>{asv.id}</td>
                <td>{asv.ba}</td>
                <td>
                  <div className="repo-cell">
                    <button
                      className="repo-dropdown-btn"
                      onClick={() => handleRepoDropdownClick(asv.id, repo.name)}
                      aria-label="Toggle services"
                    >
                      {expandedRepos.has(`${asv.id}-${repo.name}`) ? (
                        <span className="dropdown-icon expanded">▼</span>
                      ) : (
                        <span className="dropdown-icon">▶</span>
                      )}
                      {repo.name}
                    </button>
                    {loadingServices[`${asv.id}-${repo.name}`] && <span className="loading-spinner-small"></span>}
                  </div>
                </td>
                <td>{repo.usecase}</td>
                <td>{repo.status}</td>
                <td>
                  {expandedRepos.has(`${asv.id}-${repo.name}`) && repo.services && repo.services.length > 0 ? (
                    <div className="services-container">
                      {repo.services.map((service, sIndex) => (
                        <div key={`service-${sIndex}`} className="service-item">
                          <button
                            className="service-dropdown-btn"
                            onClick={() => handleServiceDropdownClick(asv.id, repo.name, service.name)}
                            aria-label="Toggle attributes"
                          >
                            {expandedServices.has(`${asv.id}-${repo.name}-${service.name}`) ? (
                              <span className="dropdown-icon expanded">▼</span>
                            ) : (
                              <span className="dropdown-icon">▶</span>
                            )}
                            {service.name}
                          </button>
                          {loadingAttributes[`${asv.id}-${repo.name}-${service.name}`] && (
                            <span className="loading-spinner-small"></span>
                          )}

                          {expandedServices.has(`${asv.id}-${repo.name}-${service.name}`) &&
                            service.attributes &&
                            service.attributes.length > 0 && (
                              <div className="attributes-container">
                                {service.attributes.map((attr, aIndex) => (
                                  <div key={`attribute-${aIndex}`} className="attribute-item">
                                    {attr["attribute-name"]}
                                  </div>
                                ))}
                              </div>
                            )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="no-data-text" onClick={() => handleRepoDropdownClick(asv.id, repo.name)}>
                      Click to load services
                    </span>
                  )}
                </td>
                <td>
                  {expandedRepos.has(`${asv.id}-${repo.name}`) &&
                  repo.services &&
                  repo.services.some((s) => s.attributes && s.attributes.length > 0) ? (
                    <div className="attributes-container">
                      {repo.services
                        .filter((service) => expandedServices.has(`${asv.id}-${repo.name}-${service.name}`))
                        .flatMap((service) => service.attributes || [])
                        .map((attr, aIndex) => (
                          <div key={`attribute-${aIndex}`} className="attribute-item">
                            {attr["attribute-name"]}
                          </div>
                        ))}
                    </div>
                  ) : (
                    <span className="no-data-text">
                      {expandedRepos.has(`${asv.id}-${repo.name}`)
                        ? "Expand a service to view attributes"
                        : "Expand repository first"}
                    </span>
                  )}
                </td>
              </tr>,
            )
          }
        }
      })
    })

    return elements
  }

  return (
    <div className="table-container">
      <div className="table-wrapper">
        <table className="pivot-table normal-table">
          <thead>
            <tr>
              <th>
                <ColumnHeader
                  field="asvName"
                  label="ASV"
                  uniqueValues={uniqueColumnValues.asvName}
                  selectedFilters={columnFilters.asvName}
                  onFilterChange={updateColumnFilter}
                  onClearFilter={clearColumnFilter}
                />
              </th>
              <th>
                <ColumnHeader
                  field="asvId"
                  label="ASV ID"
                  uniqueValues={uniqueColumnValues.asvId}
                  selectedFilters={columnFilters.asvId}
                  onFilterChange={updateColumnFilter}
                  onClearFilter={clearColumnFilter}
                />
              </th>
              <th>
                <ColumnHeader
                  field="asvBA"
                  label="Business Area"
                  uniqueValues={uniqueColumnValues.asvBA}
                  selectedFilters={columnFilters.asvBA}
                  onFilterChange={updateColumnFilter}
                  onClearFilter={clearColumnFilter}
                />
              </th>
              <th>
                <ColumnHeader
                  field="repoName"
                  label="Repository"
                  uniqueValues={uniqueColumnValues.repoName}
                  selectedFilters={columnFilters.repoName}
                  onFilterChange={updateColumnFilter}
                  onClearFilter={clearColumnFilter}
                />
              </th>
              <th>
                <ColumnHeader
                  field="repoUsecase"
                  label="Usecase"
                  uniqueValues={uniqueColumnValues.repoUsecase}
                  selectedFilters={columnFilters.repoUsecase}
                  onFilterChange={updateColumnFilter}
                  onClearFilter={clearColumnFilter}
                />
              </th>
              <th>
                <ColumnHeader
                  field="repoStatus"
                  label="Status"
                  uniqueValues={uniqueColumnValues.repoStatus}
                  selectedFilters={columnFilters.repoStatus}
                  onFilterChange={updateColumnFilter}
                  onClearFilter={clearColumnFilter}
                />
              </th>
              <th>
                <ColumnHeader
                  field="serviceName"
                  label="Services"
                  uniqueValues={uniqueColumnValues.serviceName}
                  selectedFilters={columnFilters.serviceName}
                  onFilterChange={updateColumnFilter}
                  onClearFilter={clearColumnFilter}
                />
              </th>
              <th>
                <ColumnHeader
                  field="attributeName"
                  label="Attributes"
                  uniqueValues={uniqueColumnValues.attributeName}
                  selectedFilters={columnFilters.attributeName}
                  onFilterChange={updateColumnFilter}
                  onClearFilter={clearColumnFilter}
                />
              </th>
            </tr>
          </thead>
          <tbody>{renderNormalRows()}</tbody>
        </table>

        {filteredData.length === 0 && (
          <div className="no-data-message">No data available. Please adjust your filters.</div>
        )}
      </div>
    </div>
  )
}

export default NormalMode
