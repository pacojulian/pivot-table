"use client"

import { useRef, useState, useEffect } from "react"
import type { FlattenedDataRow } from "../lib/data-service"

// Type for column header props
type ColumnHeaderProps = {
  field: keyof FlattenedDataRow
  label: string
  uniqueValues: string[]
  selectedFilters: string[]
  onFilterChange: (field: keyof FlattenedDataRow, selected: string[]) => void
  onClearFilter?: (field: keyof FlattenedDataRow) => void
}

// Column header component with filter
const ColumnHeader = ({
  field,
  label,
  uniqueValues,
  selectedFilters,
  onFilterChange,
  onClearFilter,
}: ColumnHeaderProps) => {
  const headerRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 })
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        headerRef.current &&
        !headerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Calculate popover position when opening
  useEffect(() => {
    if (isOpen && headerRef.current) {
      const rect = headerRef.current.getBoundingClientRect()
      const tableContainer = document.querySelector(".table-wrapper")
      const tableRect = tableContainer?.getBoundingClientRect() || { left: 0, right: window.innerWidth }

      // Position the dropdown above the header
      let left = rect.left
      const top = rect.bottom + 5 // Position below the filter icon

      // Ensure the dropdown doesn't go off-screen to the right
      const dropdownWidth = 280
      if (left + dropdownWidth > tableRect.right) {
        left = Math.max(tableRect.left, rect.right - dropdownWidth)
      }

      setPopoverPosition({
        top,
        left,
      })
    }
  }, [isOpen])

  const handleToggle = (option: string) => {
    if (selectedFilters.includes(option)) {
      onFilterChange(
        field,
        selectedFilters.filter((item) => item !== option),
      )
    } else {
      onFilterChange(field, [...selectedFilters, option])
    }
  }

  const toggleAll = () => {
    if (selectedFilters.length === uniqueValues.length) {
      onFilterChange(field, [])
    } else {
      onFilterChange(field, [...uniqueValues])
    }
  }

  const clearFilter = () => {
    onFilterChange(field, [])
    if (onClearFilter) onClearFilter(field)
  }

  const filteredOptions = uniqueValues.filter((option) =>
    String(option).toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const toggleDropdown = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      setSearchTerm("")
    }
  }

  return (
    <div className="column-header" ref={headerRef}>
      <span className="column-title">{label}</span>
      <button className="column-filter-button" onClick={toggleDropdown} title={`Filter ${label}`}>
        <span className={`filter-icon ${selectedFilters.length > 0 ? "active" : ""}`}></span>
      </button>

      {isOpen && (
        <div
          className="dropdown-popover"
          ref={dropdownRef}
          style={{
            top: `${popoverPosition.top}px`,
            left: `${popoverPosition.left}px`,
          }}
        >
          <div className="popover-header">
            <h4>{label} Filter</h4>
            <div className="popover-actions">
              <button className="popover-clear" onClick={clearFilter} title="Clear filter">
                <span className="clear-icon">↺</span>
              </button>
              <button className="popover-close" onClick={() => setIsOpen(false)} title="Close">
                ×
              </button>
            </div>
          </div>
          <div className="dropdown-search">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="dropdown-options">
            <label className="checkbox-item">
              <input type="checkbox" checked={selectedFilters.length === uniqueValues.length} onChange={toggleAll} />
              <span className="checkbox-label">Select All</span>
            </label>
            {filteredOptions.map((option) => (
              <label key={String(option)} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={selectedFilters.includes(String(option))}
                  onChange={() => handleToggle(String(option))}
                />
                <span className="checkbox-label">{String(option)}</span>
              </label>
            ))}
            {filteredOptions.length === 0 && <div className="no-results">No matching options</div>}
          </div>
        </div>
      )}
    </div>
  )
}

export default ColumnHeader
