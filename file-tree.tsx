"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import "./pivot-table.css"

// Define types for the data structure
type Attribute = {
  "attribute-name": string
  value?: string | number | boolean | null
}

type Service = {
  name: string
  attributes: Attribute[]
}

type Repo = {
  name: string
  usecase: string
  status: string | number // status can be string or number based on sample data
  services: Service[]
}

type ASV = {
  id: string
  repo: Repo
}

type DataItem = {
  asv: ASV
}

interface Group {
  _isExpanded: boolean;
  _groupField: string;
  _groupValue: string;
  _rows: FlatDataRow[];
  [nestedKey: string]: GroupedData;
}

interface FlatDataRow {
  asvId: string;
  repoName: string;
  repoUsecase: string;
  repoStatus: string | number;
  serviceName: string;
  attributeName: string;
}

type GroupedData = Group | FlatDataRow[] | boolean | string;
// Sample data remains the same
const sampleData: DataItem[] = [/* ... same as original ... */]

// Flatten data for table display
const flattenData = (data: DataItem[]): FlatDataRow[] => {
  const flatData: FlatDataRow[] = []

  data.forEach((item) => {
    const asv = item.asv
    const repo = asv.repo

    repo.services.forEach((service) => {
      service.attributes.forEach((attr) => {
        const row: FlatDataRow = {
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
const getUniqueValues = <T extends keyof FlatDataRow>(data: FlatDataRow[], field: T): string[] => {
  const values = new Set(data.map((item) => String(item[field])))
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
  // ... same implementation, just with proper prop typing above ...
  // No changes needed in the component body as it was already well-typed
}

// Main Pivot Table Component
export default function PivotTable() {
  const [data] = useState<DataItem[]>(sampleData)
  const [flatData, setFlatData] = useState<FlatDataRow[]>([])
  const [filteredData, setFilteredData] = useState<FlatDataRow[]>([])

  // Available grouping fields
  const availableGroups = [
    { id: "asvId", label: "ASV ID" },
    { id: "repoName", label: "Repository Name" },
    { id: "repoUsecase", label: "Repository Usecase" },
    { id: "repoStatus", label: "Repository Status" },
    { id: "serviceName", label: "Service Name" },
    { id: "attributeName", label: "Attribute Name" },
  ] as const

  type GroupField = typeof availableGroups[number]['id']

  // Grouping state - ordered list of selected groups
  const [activeGroups, setActiveGroups] = useState<GroupField[]>(["asvId", "repoName", "serviceName", "attributeName"])

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

    setAsvFilters(getUniqueValues(flattened, "asvId"))
    setRepoFilters(getUniqueValues(flattened, "repoName"))
    setServiceFilters(getUniqueValues(flattened, "serviceName"))
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
  const groupData = (data: FlatDataRow[]): GroupedData => {
    if (activeGroups.length === 0) return { _rows: data }

    const grouped: GroupedData = {}

    data.forEach((row) => {
      let currentLevel = grouped

      activeGroups.forEach((group, index) => {
        const groupValue = String(row[group])

        if (!currentLevel[groupValue]) {
          currentLevel[groupValue] = {
            _isExpanded: index < 1,
            _groupField: group,
            _groupValue: groupValue,
            _rows: [],
          }
        }

        if (index === activeGroups.length - 1) {
          currentLevel[groupValue]._rows.push(row)
        }

        currentLevel = currentLevel[groupValue] as GroupedData
      })
    })

    return grouped
  }

  const groupedData = groupData(filteredData)

  // Toggle row expansion
  const toggleExpand = (path: string[]) => {
    const element = document.querySelector(`[data-path="${path.join(".")}"]`) as HTMLElement | null
    if (element) {
      element.classList.toggle("expanded")

      const childRows = document.querySelectorAll(`[data-parent^="${path.join(".")}"]`)
      childRows.forEach((row) => {
        (row as HTMLElement).style.display = element.classList.contains("expanded") ? "table-row" : "none"
      })
    }
  }

  // Render table rows recursively
  const renderRows = (data: GroupedData, path: string[] = [], level = 0, parentPath = ""): React.ReactNode => {
    if (!data) return null

    if (level === 0 && activeGroups.length === 0) {
      return (data._rows as FlatDataRow[]).map((row, index) => (
        <tr key={`row-${index}`} className="data-row">
          {Object.keys(row).map((field) => (
            <td key={field}>{String(row[field as keyof FlatDataRow])}</td>
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
        const currentGroup = data[key] as GroupedData[string]

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

            {level === activeGroups.length - 1 &&
              currentGroup._rows.map((row: FlatDataRow, rowIndex: number) => (
                <tr
                  key={`${pathString}-row-${rowIndex}`}
                  className="data-row"
                  data-parent={pathString}
                  style={{ display: currentGroup._isExpanded ? "table-row" : "none" }}
                >
                  {activeGroups.map((group, i) => (
                    <td key={i} className={i < level ? "empty-cell" : i === level ? "highlight-cell" : ""}>
                      {i === level ? String(row[group]) : ""}
                    </td>
                  ))}
                </tr>
              ))}

            {level < activeGroups.length - 1 && renderRows(currentGroup, currentPath, level + 1, pathString)}
          </>
        )
      })
  }

  // Event handlers with proper typing
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.dataTransfer.setData("text/plain", index.toString())
    e.currentTarget.classList.add("dragging")
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.currentTarget.classList.add("drag-over")
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove("drag-over")
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault()
    const dragIndex = Number.parseInt(e.dataTransfer.getData("text/plain"))
    e.currentTarget.classList.remove("drag-over")

    if (dragIndex !== dropIndex) {
      const newGroups = [...activeGroups]
      const [removed] = newGroups.splice(dragIndex, 1)
      newGroups.splice(dropIndex, 0, removed)
      setActiveGroups(newGroups)
    }
  }

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove("dragging")
  }

  const addGroup = (groupId: GroupField) => {
    if (!activeGroups.includes(groupId)) {
      setActiveGroups([...activeGroups, groupId])
    }
  }

  const removeGroup = (groupId: GroupField) => {
    setActiveGroups(activeGroups.filter((g) => g !== groupId))
  }

  // Rest of the component remains structurally the same with updated types
  return (
    <div className="pivot-table-container">
      {/* ... rest of the JSX remains the same ... */}
    </div>
  )
}
