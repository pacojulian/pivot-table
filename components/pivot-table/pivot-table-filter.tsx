"use client"

import React, { useState } from "react"
import type { HierarchyLevel } from "./types"

interface PivotTableFilterProps {
  level: HierarchyLevel
  values: string[]
  selectedValues: string[]
  onChange: (values: string[]) => void
}

export function PivotTableFilter({ level, values, selectedValues, onChange }: PivotTableFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchText, setSearchText] = useState("")

  // Toggle dropdown
  const toggleDropdown = () => {
    setIsOpen(!isOpen)
  }

  // Close dropdown when clicking outside
  const handleClickOutside = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      setIsOpen(false)
    }
  }

  // Handle select all option
  const handleSelectAll = () => {
    if (selectedValues.length === values.length) {
      onChange([])
    } else {
      onChange([...values])
    }
  }

  // Handle individual checkbox toggle
  const handleToggleValue = (value: string) => {
    const newSelectedValues = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value]

    onChange(newSelectedValues)
  }

  // Format level name for display
  const formatLevelName = (level: string) => {
    return level
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  // Filter values based on search text
  const filteredValues = values.filter((value) => value.toLowerCase().includes(searchText.toLowerCase()))

  return (
    <div className="pivot-table-filter">
      <div className="filter-header" onClick={toggleDropdown}>
        <span className="filter-level-name">{formatLevelName(level)}</span>
        <span className="filter-count">{selectedValues.length > 0 ? `(${selectedValues.length})` : ""}</span>
        <span className={`filter-icon ${isOpen ? "open" : ""}`} />
      </div>

      {isOpen && (
        <>
          {/* Ensure overlay closes the dropdown when clicked outside */}
          <div className="filter-dropdown-overlay" onClick={handleClickOutside} />
          <div className="filter-dropdown">
            <div className="filter-search">
              <input
                type="text"
                placeholder="Search..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
              <button className="search-clear" onClick={() => setSearchText("")}>
                <span className="visually-hidden">Clear</span>
              </button>
            </div>

            <div className="filter-select-all">
              <label>
                <input type="checkbox" checked={selectedValues.length === values.length} onChange={handleSelectAll} />
                <span>Select All</span>
              </label>
            </div>

            <div className="filter-values-list">
              {filteredValues.length > 0 ? (
                filteredValues.map((value) => (
                  <div key={value} className="filter-value-item">
                    <label>
                      <input
                        type="checkbox"
                        checked={selectedValues.includes(value)}
                        onChange={() => handleToggleValue(value)}
                      />
                      <span>{value}</span>
                    </label>
                  </div>
                ))
              ) : (
                <div className="filter-no-results">No matching items</div>
              )}
            </div>

            <div className="filter-actions">
              <button className="filter-apply" onClick={() => setIsOpen(false)}>
                Apply
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
