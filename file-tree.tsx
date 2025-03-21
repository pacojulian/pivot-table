"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import "./pivot-table.css"

// Define types for the provided data structure
type Attribute = {
  "attribute-name": string
  value?: any
}

type Service = {
  name: string
  attributes: Attribute[]
}

type Repo = {
  name: string
  usecase: string
  status: number
  services: Service[]
}

type ASV = {
  id: string
  repo: Repo
}

type DataItem = {
  asv: ASV
}

// Sample data based on the provided structure
const sampleData: DataItem[] = [
  {
    asv: {
      id: "ASV-001",
      repo: {
        name: "Repository A",
        usecase: "Data Analysis",
        status: 200,
        services: [
          {
            name: "cch",
            attributes: [{ "attribute-name": "accountReferenceId" }, { "attribute-name": "accountName" }],
          },
        ],
      },
    },
  },
  {
    asv: {
      id: "ASV-002",
      repo: {
        name: "Repository B",
        usecase: "Reporting",
        status: 200,
        services: [
          {
            name: "reporting",
            attributes: [{ "attribute-name": "reportId" }, { "attribute-name": "reportName" }],
          },
        ],
      },
    },
  },
  {
    asv: {
      id: "ASV-003",
      repo: {
        name: "Repository A",
        usecase: "Analytics",
        status: 404,
        services: [
          {
            name: "analytics",
            attributes: [{ "attribute-name": "metricId" }, { "attribute-name": "metricValue" }],
          },
          {
            name: "dashboard",
            attributes: [{ "attribute-name": "dashboardId" }, { "attribute-name": "dashboardName" }],
          },
        ],
      },
    },
  },
]

// Flatten data for table display
const flattenData = (data: DataItem[]) => {
  const flatData: any[] = []

  data.forEach((item) => {
    const asv = item.asv
    const repo = asv.repo

    repo.services.forEach((service) => {
      service.attributes.forEach((attr) => {
        const row = {
          asvId: asv.id,
          repoName: repo.name,
          repoUsecase: repo.usecase,
          repoStatus: repo.status,
          serviceName: service.name,
          attributeName: attr["attribute-name"],
        }
        flatData.push(row)
      })
    })
  })

  return flatData
}

// Get unique values for filters
const getUniqueValues = (data: any[], field: string) => {
  const values = new Set(data.map((item) => item[field]))
  return Array.from(values)
}

// Component for custom checkbox dropdown with search
const CheckboxDropdown = ({
  label,
  options,
  selectedOptions,
  onChange,
}: {
  label: string
  options: string[]
  selectedOptions: string[]
  onChange: (selected: string[]) => void
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleToggle = (option: string) => {
    if (selectedOptions.includes(option)) {
      onChange(selectedOptions.filter((item) => item !== option))
    } else {
      onChange([...selectedOptions, option])
    }
  }

  const toggleAll = () => {
    if (selectedOptions.length === options.length) {
      onChange([])
    } else {
      onChange([...options])
    }
  }

  const filteredOptions = options.filter((option) => option.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="checkbox-dropdown" ref={dropdownRef}>
      <div className="dropdown-header" onClick={() => setIsOpen(!isOpen)}>
        <span>
          {label} ({selectedOptions.length}/{options.length})
        </span>
        <span className={`dropdown-arrow ${isOpen ? "open" : ""}`}></span>
      </div>
      {isOpen && (
        <div className="dropdown-content">
          <div className="dropdown-search">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <label className="checkbox-item">
            <input type="checkbox" checked={selectedOptions.length === options.length} onChange={toggleAll} />
            <span className="checkbox-label">Select All</span>
          </label>
          {filteredOptions.map((option) => (
            <label key={option} className="checkbox-item">
              <input type="checkbox" checked={selectedOptions.includes(option)} onChange={() => handleToggle(option)} />
              <span className="checkbox-label">{option}</span>
            </label>
          ))}
          {filteredOptions.length === 0 && <div className="no-results">No matching options</div>}
        </div>
      )}
    </div>
  )
}

// Main Pivot Table Component
export default function PivotTable() {
  const [data] = useState<DataItem[]>(sampleData)
  const [flatData, setFlatData] = useState<any[]>([])
  const [filteredData, setFilteredData] = useState<any[]>([])

  // Available grouping fields
  const availableGroups = [
    { id: "asvId", label: "ASV ID" },
    { id: "repoName", label: "Repository Name" },
    { id: "repoUsecase", label: "Repository Usecase" },
    { id: "repoStatus", label: "Repository Status" },
    { id: "serviceName", label: "Service Name" },
    { id: "attributeName", label: "Attribute Name" },
  ]

  // Grouping state - ordered list of selected groups
  const [activeGroups, setActiveGroups] = useState<string[]>(["asvId", "repoName", "serviceName", "attributeName"])

  // Filter states
  const [asvFilters, setAsvFilters] = useState<string[]>([])
  const [repoFilters, setRepoFilters] = useState<string[]>([])
  const [serviceFilters, setServiceFilters] = useState<string[]>([])

  // Unique values for filters
  const [uniqueAsvs, setUniqueAsvs] = useState<string[]>([])
  const [uniqueRepos, setUniqueRepos] = useState<string[]>([])
  const [uniqueServices, setUniqueServices] = useState<string[]>([])

  // Initialize data
  useEffect(() => {
    const flattened = flattenData(data)
    setFlatData(flattened)
    setFilteredData(flattened)

    setUniqueAsvs(getUniqueValues(flattened, "asvId"))
    setUniqueRepos(getUniqueValues(flattened, "repoName"))
    setUniqueServices(getUniqueValues(flattened, "serviceName"))

    // Initialize filters with all values selected
    setAsvFilters(getUniqueValues(flattened, "asvId") as string[])
    setRepoFilters(getUniqueValues(flattened, "repoName") as string[])
    setServiceFilters(getUniqueValues(flattened, "serviceName") as string[])
  }, [data])

  // Apply filters
  useEffect(() => {
    const filtered = flatData.filter(
      (item) =>
        asvFilters.includes(item.asvId) &&
        repoFilters.includes(item.repoName) &&
        serviceFilters.includes(item.serviceName),
    )
    setFilteredData(filtered)
  }, [flatData, asvFilters, repoFilters, serviceFilters])

  // Group data for display based on active groups
  const groupData = (data: any[]) => {
    if (activeGroups.length === 0) return { _rows: data }

    const grouped: any = {}

    data.forEach((row) => {
      let currentLevel = grouped

      // Create nested structure based on active groups
      activeGroups.forEach((group, index) => {
        const groupValue = row[group]

        if (!currentLevel[groupValue]) {
          currentLevel[groupValue] = {
            _isExpanded: index < 1, // Expand first level by default
            _groupField: group,
            _groupValue: groupValue,
            _rows: [],
          }
        }

        if (index === activeGroups.length - 1) {
          currentLevel[groupValue]._rows.push(row)
        }

        currentLevel = currentLevel[groupValue]
      })
    })

    return grouped
  }

  const groupedData = groupData(filteredData)

  // Toggle row expansion
  const toggleExpand = (path: string[]) => {
    const element = document.querySelector(`[data-path="${path.join(".")}"]`)
    if (element) {
      element.classList.toggle("expanded")

      // Toggle visibility of child rows
      const childRows = document.querySelectorAll(`[data-parent^="${path.join(".")}"]`)
      childRows.forEach((row) => {
        ;(row as HTMLElement).style.display = element.classList.contains("expanded") ? "table-row" : "none"
      })
    }
  }

  // Render table rows recursively
  const renderRows = (data: any, path: string[] = [], level = 0, parentPath = "") => {
    if (!data) return null

    if (level === 0 && activeGroups.length === 0) {
      // If no grouping is selected, render flat data
      return data._rows.map((row: any, index: number) => (
        <tr key={`row-${index}`} className="data-row">
          {Object.keys(row).map((field) => (
            <td key={field}>{row[field]}</td>
          ))}
        </tr>
      ))
    }

    return Object.keys(data)
      .filter((key) => key !== "_isExpanded" && key !== "_rows" && key !== "_groupField" && key !== "_groupValue")
      .map((key) => {
        const currentPath = [...path, key]
        const pathString = currentPath.join(".")
        const parentPathString = parentPath ? parentPath : ""
        const currentGroup = data[key]

        return (
          <>
            <tr
              key={pathString}
              className={`group-row level-${level} ${currentGroup._isExpanded ? "expanded" : ""}`}
              data-path={pathString}
              data-parent={parentPathString}
              style={{ display: level === 0 || parentPathString === "" ? "table-row" : "none" }}
            >
              {activeGroups.map((group, i) => {
                if (i === level) {
                  return (
                    <td key={i} className="group-cell">
                      <div className="expander-cell">
                        <button
                          className={`expander ${currentGroup._isExpanded ? "expanded" : ""}`}
                          onClick={() => toggleExpand(currentPath)}
                        ></button>
                        <span>{key}</span>
                      </div>
                    </td>
                  )
                } else if (i < level) {
                  return <td key={i} className="empty-cell"></td>
                } else {
                  return <td key={i}></td>
                }
              })}
            </tr>

            {/* If this is the last level, render the data rows */}
            {level === activeGroups.length - 1 &&
              currentGroup._rows.map((row: any, rowIndex: number) => (
                <tr
                  key={`${pathString}-row-${rowIndex}`}
                  className="data-row"
                  data-parent={pathString}
                  style={{ display: currentGroup._isExpanded ? "table-row" : "none" }}
                >
                  {activeGroups.map((group, i) => (
                    <td key={i} className={i < level ? "empty-cell" : i === level ? "highlight-cell" : ""}>
                      {i === level ? row[group] : ""}
                    </td>
                  ))}
                </tr>
              ))}

            {/* Render child groups */}
            {level < activeGroups.length - 1 && renderRows(currentGroup, currentPath, level + 1, pathString)}
          </>
        )
      })
  }

  // Handle drag start for a group item
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", index.toString())
    e.currentTarget.classList.add("dragging")
  }

  // Handle drag over for a group item
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    const target = e.currentTarget as HTMLElement
    target.classList.add("drag-over")
  }

  // Handle drag leave for a group item
  const handleDragLeave = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement
    target.classList.remove("drag-over")
  }

  // Handle drop for a group item
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
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
  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("dragging")
  }

  // Add a group to the active groups
  const addGroup = (groupId: string) => {
    if (!activeGroups.includes(groupId)) {
      setActiveGroups([...activeGroups, groupId])
    }
  }

  // Remove a group from active groups
  const removeGroup = (groupId: string) => {
    setActiveGroups(activeGroups.filter((g) => g !== groupId))
  }

  return (
    <div className="pivot-table-container">
      <div className="pivot-controls">
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
                    key={group}
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
                  key={group.id}
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

        <div className="filter-controls">
          <h3>Filters</h3>
          <div className="filter-dropdowns">
            <CheckboxDropdown
              label="ASV ID"
              options={uniqueAsvs}
              selectedOptions={asvFilters}
              onChange={setAsvFilters}
            />
            <CheckboxDropdown
              label="Repository"
              options={uniqueRepos}
              selectedOptions={repoFilters}
              onChange={setRepoFilters}
            />
            <CheckboxDropdown
              label="Service"
              options={uniqueServices}
              selectedOptions={serviceFilters}
              onChange={setServiceFilters}
            />
          </div>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="pivot-table">
          <thead>
            <tr>
              {activeGroups.length > 0
                ? activeGroups.map((group, index) => (
                    <th key={index} className="group-header">
                      {availableGroups.find((g) => g.id === group)?.label || group.toUpperCase()}
                    </th>
                  ))
                : Object.keys(flatData[0] || {}).map((field) => (
                    <th key={field} className="group-header">
                      {field.toUpperCase()}
                    </th>
                  ))}
            </tr>
          </thead>
          <tbody>{renderRows(groupedData)}</tbody>
        </table>
      </div>
    </div>
  )
}

