"use client"

import { useState } from "react"
import PivotTable from "@/pivot-table"
import NormalMode from "@/normal-mode"
import { useDataService } from "@/lib/data-service"
import { SlidersHorizontal, Menu, X, Check } from "lucide-react"
import ToggleSwitch from "@/components/ui/toggle-switch"
import "@/pivot-table.css"
import "@/normal-mode.css"

// Define view modes
type ViewMode = "normal" | "pivot"

export default function Home() {
  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>("normal")
  const [showSidebar, setShowSidebar] = useState(false)
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string[]>>({})
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [showServiceDropdown, setShowServiceDropdown] = useState(false)

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

  // Toggle view mode
  const toggleViewMode = (checked: boolean) => {
    setViewMode(checked ? "pivot" : "normal")
  }

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
    // No data reloading here
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
      default:
        return field
    }
  }

  return (
    <main className="p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6">Hierarchical Data Pivot Table</h1>

      <div
        className={`pivot-table-container ${viewMode === "pivot" ? "pivot-enabled" : "normal-mode"} ${showSidebar ? "sidebar-open" : ""}`}
      >
        {/* Top toolbar with toggle switch */}
        <div className="pivot-toolbar">
          <div className="toolbar-left">
            <ToggleSwitch
              label="Pivot Mode"
              isChecked={viewMode === "pivot"}
              onChange={(checked) => toggleViewMode(checked)}
              icon={<SlidersHorizontal size={14} className="toggle-icon" />}
            />

            {viewMode === "normal" && (
              <button className="sidebar-toggle-btn" onClick={toggleSidebar} title="Toggle filters sidebar">
                <Menu size={18} />
                <span className="sidebar-toggle-text">Filters</span>
              </button>
            )}
          </div>
          <h2 className="pivot-title">Data Table</h2>
        </div>

        {/* Normal mode sidebar */}
        {viewMode === "normal" && showSidebar && (
          <div className="normal-sidebar">
            <div className="sidebar-header">
              <h3>Filters</h3>
              <button className="close-sidebar" onClick={toggleSidebar}>
                ×
              </button>
            </div>
            <div className="sidebar-content">
              {Object.keys(appliedFilters).length > 0 && (
                <div className="sidebar-section">
                  <h4>Applied Filters</h4>
                  <div className="applied-filters-sidebar">
                    <div className="filters-header">
                      <button className="clear-all-filters" onClick={handleClearAllFilters}>
                        Clear All
                      </button>
                    </div>
                    <div className="filter-pills">
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
                </div>
              )}
              <div className="sidebar-section">
                <h4>Service Filter</h4>
                <div className="multi-select-container">
                  <button className="multi-select-button" onClick={() => setShowServiceDropdown(!showServiceDropdown)}>
                    {selectedServices.length > 0 ? `${selectedServices.length} service(s) selected` : "Select services"}
                  </button>

                  {showServiceDropdown && (
                    <div className="multi-select-dropdown">
                      <div className="multi-select-options">
                        {availableServices.map((service) => (
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
                        ))}
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

              <button
                className="clear-all-btn"
                onClick={handleClearAllFilters}
                disabled={Object.keys(appliedFilters).length === 0}
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}

        {viewMode === "pivot" ? (
          <PivotTable
            data={data}
            loadingServices={loadingServices}
            loadingAttributes={loadingAttributes}
            expandedRepos={expandedRepos}
            expandedServices={expandedServices}
            fetchServicesForRepo={fetchServicesForRepo}
            fetchAttributesForService={fetchAttributesForService}
            appliedFilters={appliedFilters}
            onUpdateFilters={setAppliedFilters}
          />
        ) : (
          <NormalMode
            data={data}
            loadingServices={loadingServices}
            loadingAttributes={loadingAttributes}
            expandedRepos={expandedRepos}
            expandedServices={expandedServices}
            fetchServicesForRepo={fetchServicesForRepo}
            fetchAttributesForService={fetchAttributesForService}
            appliedFilters={appliedFilters}
            onUpdateFilters={setAppliedFilters}
          />
        )}
      </div>
    </main>
  )
}
