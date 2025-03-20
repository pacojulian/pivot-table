"use client"

import { useState, useEffect, useRef } from "react"
import "./file-tree-explorer.css"

// Define the data structure types based on the new sample
interface Attribute {
  "attribute-name": string
}

interface Service {
  name: string
  cch: Attribute[]
}

interface DataItem {
  asv: string
  repo: string
  usecase: string
  status: number
  field1: string
  field2: string
  services: Service[]
}

// Sample data structure
const SAMPLE_DATA: DataItem[] = [
  {
    asv: "ASV-001",
    repo: "Repository A",
    usecase: "Data Analysis",
    status: 200,
    field1: "value1",
    field2: "value2",
    services: [
      {
        name: "Service 1",
        cch: [{ "attribute-name": "accountReferenceId" }, { "attribute-name": "accountName" }],
      },
    ],
  },
  {
    asv: "ASV-001",
    repo: "Repository B",
    usecase: "Data Processing",
    status: 404,
    field1: "value3",
    field2: "value4",
    services: [
      {
        name: "Service 2",
        cch: [{ "attribute-name": "customerId" }, { "attribute-name": "customerAddress" }],
      },
    ],
  },
  {
    asv: "ASV-002",
    repo: "Repository C",
    usecase: "Reporting",
    status: 200,
    field1: "value5",
    field2: "value2",
    services: [
      {
        name: "Service 3",
        cch: [{ "attribute-name": "reportId" }, { "attribute-name": "reportName" }],
      },
      {
        name: "Service 4",
        cch: [{ "attribute-name": "timestamp" }, { "attribute-name": "duration" }],
      },
    ],
  },
]

// Filter type for dropdown filters
type FilterType = "asv" | "repo" | "field1" | "field2"

export default function FileTreeExplorer() {
  const [expandedAsv, setExpandedAsv] = useState<string[]>([])
  const [expandedRepo, setExpandedRepo] = useState<string[]>([])
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [filteredData, setFilteredData] = useState<DataItem[]>(SAMPLE_DATA)
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(false)

  // Filter states
  const [openFilter, setOpenFilter] = useState<FilterType | null>(null)
  const [filterSearchTerms, setFilterSearchTerms] = useState<{
    asv: string
    repo: string
    field1: string
    field2: string
  }>({
    asv: "",
    repo: "",
    field1: "",
    field2: "",
  })

  const [activeFilters, setActiveFilters] = useState<{
    asv: string[]
    repo: string[]
    field1: string[]
    field2: string[]
  }>({
    asv: [],
    repo: [],
    field1: [],
    field2: [],
  })

  // Available filter options
  const [availableFilters, setAvailableFilters] = useState<{
    asv: string[]
    repo: string[]
    field1: string[]
    field2: string[]
  }>({
    asv: [],
    repo: [],
    field1: [],
    field2: [],
  })

  // Refs for filter dropdowns
  const filterRefs = {
    asv: useRef<HTMLDivElement>(null),
    repo: useRef<HTMLDivElement>(null),
    field1: useRef<HTMLDivElement>(null),
    field2: useRef<HTMLDivElement>(null),
  }

  // Extract all available filter options from the data
  useEffect(() => {
    const asvs = Array.from(new Set(SAMPLE_DATA.map((item) => item.asv)))
    const repos = Array.from(new Set(SAMPLE_DATA.map((item) => item.repo)))
    const field1s = Array.from(new Set(SAMPLE_DATA.map((item) => item.field1)))
    const field2s = Array.from(new Set(SAMPLE_DATA.map((item) => item.field2)))

    setAvailableFilters({
      asv: asvs,
      repo: repos,
      field1: field1s,
      field2: field2s,
    })
  }, [])

  // Apply filters to the data
  useEffect(() => {
    let filtered = [...SAMPLE_DATA]

    // Apply ASV filter
    if (activeFilters.asv.length > 0) {
      filtered = filtered.filter((item) => activeFilters.asv.includes(item.asv))
    }

    // Apply Repo filter
    if (activeFilters.repo.length > 0) {
      filtered = filtered.filter((item) => activeFilters.repo.includes(item.repo))
    }

    // Apply Field1 filter
    if (activeFilters.field1.length > 0) {
      filtered = filtered.filter((item) => activeFilters.field1.includes(item.field1))
    }

    // Apply Field2 filter
    if (activeFilters.field2.length > 0) {
      filtered = filtered.filter((item) => activeFilters.field2.includes(item.field2))
    }

    setFilteredData(filtered)

    // Reset selected repo if it's no longer in filtered data
    if (selectedRepo && !filtered.some((item) => item.repo === selectedRepo)) {
      setSelectedRepo(null)
      setSelectedService(null)
    }
  }, [activeFilters, selectedRepo])

  // Toggle filter dropdown
  const toggleFilter = (filterType: FilterType) => {
    setOpenFilter((prev) => (prev === filterType ? null : filterType))

    // Reset search term when opening filter
    if (openFilter !== filterType) {
      setFilterSearchTerms((prev) => ({
        ...prev,
        [filterType]: "",
      }))
    }
  }

  // Handle filter search term change
  const handleFilterSearch = (filterType: FilterType, term: string) => {
    setFilterSearchTerms((prev) => ({
      ...prev,
      [filterType]: term,
    }))
  }

  // Toggle a filter item selection
  const toggleFilterItem = (filterType: FilterType, value: string) => {
    setActiveFilters((prev) => {
      const isActive = prev[filterType].includes(value)

      if (isActive) {
        return {
          ...prev,
          [filterType]: prev[filterType].filter((item) => item !== value),
        }
      } else {
        return {
          ...prev,
          [filterType]: [...prev[filterType], value],
        }
      }
    })
  }

  // Clear all filters
  const clearAllFilters = () => {
    setActiveFilters({
      asv: [],
      repo: [],
      field1: [],
      field2: [],
    })
  }

  // Clear a specific filter
  const clearFilter = (filterType: FilterType) => {
    setActiveFilters((prev) => ({
      ...prev,
      [filterType]: [],
    }))
  }

  // Handle click outside to close filter dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (openFilter) {
        const ref = filterRefs[openFilter]
        if (ref.current && !ref.current.contains(event.target as Node)) {
          setOpenFilter(null)
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [openFilter])

  // Handle expanding/collapsing ASV nodes
  const toggleAsv = (asvName: string) => {
    setExpandedAsv((prev) => (prev.includes(asvName) ? prev.filter((name) => name !== asvName) : [...prev, asvName]))
  }

  // Handle expanding/collapsing Repo nodes
  const toggleRepo = (repoName: string) => {
    setExpandedRepo((prev) =>
      prev.includes(repoName) ? prev.filter((name) => name !== repoName) : [...prev, repoName],
    )
  }

  // Mock fetching services for a repo
  const fetchServices = (repo: string) => {
    setLoading(true)

    // Simulate API call with setTimeout
    setTimeout(() => {
      const repoData = SAMPLE_DATA.find((item) => item.repo === repo)
      if (repoData) {
        setServices(repoData.services)
      } else {
        setServices([])
      }
      setLoading(false)
    }, 500) // 500ms delay to simulate network request
  }

  // Handle selecting a repo
  const selectRepo = (repo: string) => {
    if (selectedRepo === repo) {
      setSelectedRepo(null)
      setSelectedService(null)
      setServices([])
    } else {
      setSelectedRepo(repo)
      setSelectedService(null)
      fetchServices(repo)
    }
  }

  // Handle selecting a service
  const selectService = (service: Service) => {
    setSelectedService(service)
  }

  // Get filtered options for a filter type
  const getFilteredOptions = (filterType: FilterType) => {
    const searchTerm = filterSearchTerms[filterType].toLowerCase()
    return availableFilters[filterType].filter((option) => !searchTerm || option.toLowerCase().includes(searchTerm))
  }

  // Count active filters
  const activeFilterCount =
    activeFilters.asv.length + activeFilters.repo.length + activeFilters.field1.length + activeFilters.field2.length

  return (
    <div className="file-tree-container">
      <div className="filters-container">
        <div className="filters-row">
          {/* ASV Filter */}
          <div className="filter-dropdown-container">
            <button
              className={`filter-button ${activeFilters.asv.length > 0 ? "has-filters" : ""}`}
              onClick={() => toggleFilter("asv")}
            >
              ASV {activeFilters.asv.length > 0 && `(${activeFilters.asv.length})`}
            </button>
            {openFilter === "asv" && (
              <div className="filter-dropdown" ref={filterRefs.asv}>
                <div className="filter-dropdown-header">
                  <input
                    type="text"
                    placeholder="Search ASVs..."
                    value={filterSearchTerms.asv}
                    onChange={(e) => handleFilterSearch("asv", e.target.value)}
                    className="filter-search-input"
                  />
                  {activeFilters.asv.length > 0 && (
                    <button className="clear-filter-button" onClick={() => clearFilter("asv")}>
                      Clear
                    </button>
                  )}
                </div>
                <div className="filter-options">
                  {getFilteredOptions("asv").map((asv) => (
                    <label key={asv} className="filter-option">
                      <input
                        type="checkbox"
                        checked={activeFilters.asv.includes(asv)}
                        onChange={() => toggleFilterItem("asv", asv)}
                      />
                      {asv}
                    </label>
                  ))}
                  {getFilteredOptions("asv").length === 0 && <div className="no-filter-results">No matching ASVs</div>}
                </div>
              </div>
            )}
          </div>

          {/* Repo Filter */}
          <div className="filter-dropdown-container">
            <button
              className={`filter-button ${activeFilters.repo.length > 0 ? "has-filters" : ""}`}
              onClick={() => toggleFilter("repo")}
            >
              Repository {activeFilters.repo.length > 0 && `(${activeFilters.repo.length})`}
            </button>
            {openFilter === "repo" && (
              <div className="filter-dropdown" ref={filterRefs.repo}>
                <div className="filter-dropdown-header">
                  <input
                    type="text"
                    placeholder="Search repositories..."
                    value={filterSearchTerms.repo}
                    onChange={(e) => handleFilterSearch("repo", e.target.value)}
                    className="filter-search-input"
                  />
                  {activeFilters.repo.length > 0 && (
                    <button className="clear-filter-button" onClick={() => clearFilter("repo")}>
                      Clear
                    </button>
                  )}
                </div>
                <div className="filter-options">
                  {getFilteredOptions("repo").map((repo) => (
                    <label key={repo} className="filter-option">
                      <input
                        type="checkbox"
                        checked={activeFilters.repo.includes(repo)}
                        onChange={() => toggleFilterItem("repo", repo)}
                      />
                      {repo}
                    </label>
                  ))}
                  {getFilteredOptions("repo").length === 0 && (
                    <div className="no-filter-results">No matching repositories</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Field1 Filter */}
          <div className="filter-dropdown-container">
            <button
              className={`filter-button ${activeFilters.field1.length > 0 ? "has-filters" : ""}`}
              onClick={() => toggleFilter("field1")}
            >
              Field 1 {activeFilters.field1.length > 0 && `(${activeFilters.field1.length})`}
            </button>
            {openFilter === "field1" && (
              <div className="filter-dropdown" ref={filterRefs.field1}>
                <div className="filter-dropdown-header">
                  <input
                    type="text"
                    placeholder="Search field1 values..."
                    value={filterSearchTerms.field1}
                    onChange={(e) => handleFilterSearch("field1", e.target.value)}
                    className="filter-search-input"
                  />
                  {activeFilters.field1.length > 0 && (
                    <button className="clear-filter-button" onClick={() => clearFilter("field1")}>
                      Clear
                    </button>
                  )}
                </div>
                <div className="filter-options">
                  {getFilteredOptions("field1").map((field1) => (
                    <label key={field1} className="filter-option">
                      <input
                        type="checkbox"
                        checked={activeFilters.field1.includes(field1)}
                        onChange={() => toggleFilterItem("field1", field1)}
                      />
                      {field1}
                    </label>
                  ))}
                  {getFilteredOptions("field1").length === 0 && (
                    <div className="no-filter-results">No matching field1 values</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Field2 Filter */}
          <div className="filter-dropdown-container">
            <button
              className={`filter-button ${activeFilters.field2.length > 0 ? "has-filters" : ""}`}
              onClick={() => toggleFilter("field2")}
            >
              Field 2 {activeFilters.field2.length > 0 && `(${activeFilters.field2.length})`}
            </button>
            {openFilter === "field2" && (
              <div className="filter-dropdown" ref={filterRefs.field2}>
                <div className="filter-dropdown-header">
                  <input
                    type="text"
                    placeholder="Search field2 values..."
                    value={filterSearchTerms.field2}
                    onChange={(e) => handleFilterSearch("field2", e.target.value)}
                    className="filter-search-input"
                  />
                  {activeFilters.field2.length > 0 && (
                    <button className="clear-filter-button" onClick={() => clearFilter("field2")}>
                      Clear
                    </button>
                  )}
                </div>
                <div className="filter-options">
                  {getFilteredOptions("field2").map((field2) => (
                    <label key={field2} className="filter-option">
                      <input
                        type="checkbox"
                        checked={activeFilters.field2.includes(field2)}
                        onChange={() => toggleFilterItem("field2", field2)}
                      />
                      {field2}
                    </label>
                  ))}
                  {getFilteredOptions("field2").length === 0 && (
                    <div className="no-filter-results">No matching field2 values</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Clear All Filters Button */}
          {activeFilterCount > 0 && (
            <button className="clear-all-filters-button" onClick={clearAllFilters}>
              Clear All Filters
            </button>
          )}
        </div>

        {/* Active Filters Display */}
        {activeFilterCount > 0 && (
          <div className="active-filters">
            <span className="active-filters-label">Active filters:</span>
            <div className="filter-tags">
              {activeFilters.asv.map((asv) => (
                <div key={`asv-${asv}`} className="filter-tag">
                  ASV: {asv}
                  <span className="remove-tag" onClick={() => toggleFilterItem("asv", asv)}>
                    ×
                  </span>
                </div>
              ))}
              {activeFilters.repo.map((repo) => (
                <div key={`repo-${repo}`} className="filter-tag">
                  Repo: {repo}
                  <span className="remove-tag" onClick={() => toggleFilterItem("repo", repo)}>
                    ×
                  </span>
                </div>
              ))}
              {activeFilters.field1.map((field1) => (
                <div key={`field1-${field1}`} className="filter-tag">
                  Field1: {field1}
                  <span className="remove-tag" onClick={() => toggleFilterItem("field1", field1)}>
                    ×
                  </span>
                </div>
              ))}
              {activeFilters.field2.map((field2) => (
                <div key={`field2-${field2}`} className="filter-tag">
                  Field2: {field2}
                  <span className="remove-tag" onClick={() => toggleFilterItem("field2", field2)}>
                    ×
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="main-content">
        <div className="file-tree">
          <h2>Repository Explorer</h2>
          <div className="tree-content">
            {filteredData.length > 0 ? (
              Array.from(new Set(filteredData.map((item) => item.asv))).map((asv) => (
                <div key={asv} className="tree-node">
                  <div className="node-header" onClick={() => toggleAsv(asv)}>
                    <span className="expand-icon">{expandedAsv.includes(asv) ? "▼" : "►"}</span>
                    <span className="node-name asv-node">{asv}</span>
                  </div>
                  {expandedAsv.includes(asv) && (
                    <div className="node-children">
                      {filteredData
                        .filter((item) => item.asv === asv)
                        .map((item) => (
                          <div key={item.repo} className="tree-node">
                            <div
                              className={`node-header repo-header ${selectedRepo === item.repo ? "selected" : ""}`}
                              onClick={() => selectRepo(item.repo)}
                            >
                              <span className="node-name repo-node">{item.repo}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="no-results">No matching data found</div>
            )}
          </div>
        </div>

        <div className="content-panel">
          {selectedRepo ? (
            <div className="repo-details">
              <div className="panel-header">
                <h3>{selectedRepo}</h3>
              </div>

              {loading ? (
                <div className="loading">Loading services...</div>
              ) : (
                <>
                  {/* Repository Details */}
                  {filteredData
                    .filter((item) => item.repo === selectedRepo)
                    .map((item, index) => (
                      <div key={index} className="details-section">
                        <h4>Repository Information</h4>
                        <div className="detail-item">
                          <span className="detail-label">ASV:</span>
                          <span className="detail-value">{item.asv}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Use Case:</span>
                          <span className="detail-value">{item.usecase}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Status:</span>
                          <span className="detail-value">{item.status}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Field 1:</span>
                          <span className="detail-value">{item.field1}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Field 2:</span>
                          <span className="detail-value">{item.field2}</span>
                        </div>
                      </div>
                    ))}

                  {/* Services List */}
                  <div className="services-section">
                    <h4>Services</h4>
                    {services.length > 0 ? (
                      <div className="services-list">
                        {services.map((service, index) => (
                          <div
                            key={index}
                            className={`service-item ${selectedService?.name === service.name ? "selected" : ""}`}
                            onClick={() => selectService(service)}
                          >
                            {service.name}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-results">No services found</div>
                    )}
                  </div>

                  {/* Selected Service Attributes */}
                  {selectedService && (
                    <div className="attributes-section">
                      <h4>{selectedService.name} Attributes</h4>
                      <div className="attributes-list">
                        {selectedService.cch.length > 0 ? (
                          selectedService.cch.map((attr, index) => (
                            <div key={index} className="attribute-item">
                              <span className="attribute-name">{attr["attribute-name"]}</span>
                            </div>
                          ))
                        ) : (
                          <div className="no-results">No attributes found</div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="select-prompt">
              <p>Select a repository to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


