
import { useState, useEffect, useRef, useCallback } from "react"
import "./pivot-table.css"
import type React from "react"

// Define comprehensive types for the data structure
type AttributeData = {
  "attribute-name": string
  value?: string | number
}

type ServiceData = {
  name: string
  attributes?: AttributeData[] // Optional as they will be loaded on demand
}

type RepoData = {
  name: string
  usecase: string
  status: number
  services?: ServiceData[] // Optional as they will be loaded on demand
}

// Updated ASV data structure
type ASVData = {
  asv: string
  id: string
  ba: string
  repositories: RepoData[]
}

// Updated DataItem structure
type DataItem = {
  asv: ASVData
}

// Define the flattened data structure
type FlattenedDataRow = {
  asvId: string
  asvName: string
  asvBA: string
  repoName: string
  repoUsecase: string
  repoStatus: number
  serviceName?: string
  attributeName?: string
}

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

// Sample initial data with the new structure
const initialData: DataItem[] = [
  {
    asv: {
      asv: "ASV-001",
      id: "AllanFranciscoJulianNovoa",
      ba: "Finance",
      repositories: [
        {
          name: "AllanFranciscoJulian/AllanFrancisco",
          usecase: "Data Analysis",
          status: 200,
          services: [], // Empty array instead of undefined
        },
      ],
    },
  },
  {
    asv: {
      asv: "ASV-002",
      id: "ASV-002-ID",
      ba: "Marketing",
      repositories: [
        {
          name: "Repository B",
          usecase: "Reporting",
          status: 200,
          services: [], // Empty array instead of undefined
        },
      ],
    },
  },
  {
    asv: {
      asv: "ASV-003",
      id: "ASV-003-ID",
      ba: "Operations",
      repositories: [
        {
          name: "Repository A",
          usecase: "Analytics",
          status: 404,
          services: [], // Empty array instead of undefined
        },
        {
          name: "Repository A-2",
          usecase: "Monitoring",
          status: 200,
          services: [], // Empty array instead of undefined
        },
      ],
    },
  },
  {
    asv: {
      asv: "ASV-004",
      id: "ASV-004-ID",
      ba: "Sales",
      repositories: [
        {
          name: "Repository C",
          usecase: "Monitoring",
          status: 200,
          services: [], // Empty array instead of undefined
        },
      ],
    },
  },
  {
    asv: {
      asv: "ASV-005",
      id: "ASV-005-ID",
      ba: "IT",
      repositories: [
        {
          name: "Repository D",
          usecase: "Data Processing",
          status: 200,
          services: [], // Empty array instead of undefined
        },
      ],
    },
  },
]

// Mock service data for API responses
const mockServiceData: Record<string, ServiceData[]> = {
  "AllanFranciscoJulian/AllanFrancisco": [{ name: "cch" }, { name: "auth" }],
  "Repository A": [{ name: "analytics" }, { name: "dashboard" }],
  "Repository B": [{ name: "reporting" }, { name: "export" }],
  "Repository C": [{ name: "monitoring" }, { name: "alerts" }],
  "Repository D": [{ name: "processing" }, { name: "transformation" }],
  "Repository A-2": [{ name: "metrics" }, { name: "logs" }],
}

// Mock attribute data for API responses
const mockAttributeData: Record<string, AttributeData[]> = {
  cch: [{ "attribute-name": "accountReferenceId" }, { "attribute-name": "accountName" }],
  auth: [{ "attribute-name": "userId" }, { "attribute-name": "userRole" }],
  analytics: [{ "attribute-name": "metricId" }, { "attribute-name": "metricValue" }],
  dashboard: [{ "attribute-name": "dashboardId" }, { "attribute-name": "dashboardName" }],
  reporting: [{ "attribute-name": "reportId" }, { "attribute-name": "reportName" }],
  export: [{ "attribute-name": "exportFormat" }, { "attribute-name": "exportTimestamp" }],
  monitoring: [{ "attribute-name": "monitorId" }, { "attribute-name": "monitorStatus" }],
  alerts: [{ "attribute-name": "alertId" }, { "attribute-name": "alertSeverity" }],
  processing: [{ "attribute-name": "processId" }, { "attribute-name": "processStatus" }],
  transformation: [{ "attribute-name": "transformId" }, { "attribute-name": "transformType" }],
  metrics: [{ "attribute-name": "metricName" }, { "attribute-name": "metricUnit" }],
  logs: [{ "attribute-name": "logLevel" }, { "attribute-name": "logMessage" }],
}

// Mock API functions
const fetchServices = async (asvId: string, repoName: string): Promise<ServiceData[]> => {
  console.log(`Fetching services for ASV: ${asvId}, Repository: ${repoName}`)
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500))
  return mockServiceData[repoName] || []
}

const fetchAttributes = async (asvId: string, repoName: string, serviceName: string): Promise<AttributeData[]> => {
  console.log(`Fetching attributes for ASV: ${asvId}, Repository: ${repoName}, Service: ${serviceName}`)
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500))
  return mockAttributeData[serviceName] || []
}

// Updated flatten data function to handle the new structure
const flattenData = (data: DataItem[]): FlattenedDataRow[] => {
  const flatData: FlattenedDataRow[] = []

  data.forEach((item) => {
    const asv = item.asv

    asv.repositories.forEach((repo) => {
      if (!repo.services || repo.services.length === 0) {
        // If no services, add a row with just ASV and Repo data, but include an empty serviceName
        const row: FlattenedDataRow = {
          asvId: asv.id,
          asvName: asv.asv,
          asvBA: asv.ba,
          repoName: repo.name,
          repoUsecase: repo.usecase,
          repoStatus: repo.status,
          serviceName: "", // Include empty serviceName to maintain column structure
        }
        flatData.push(row)
      } else {
        repo.services.forEach((service) => {
          if (!service.attributes || service.attributes.length === 0) {
            // If no attributes, just add up to service level
            const row: FlattenedDataRow = {
              asvId: asv.id,
              asvName: asv.asv,
              asvBA: asv.ba,
              repoName: repo.name,
              repoUsecase: repo.usecase,
              repoStatus: repo.status,
              serviceName: service.name,
            }
            flatData.push(row)
          } else {
            service.attributes.forEach((attr) => {
              const row: FlattenedDataRow = {
                asvId: asv.id,
                asvName: asv.asv,
                asvBA: asv.ba,
                repoName: repo.name,
                repoUsecase: repo.usecase,
                repoStatus: repo.status,
                serviceName: service.name,
                attributeName: attr["attribute-name"],
              }
              flatData.push(row)
            })
          }
        })
      }
    })
  })

  return flatData
}

// Get unique values for filters
const getUniqueValues = <T extends object, K extends keyof T>(data: T[], field: K): Array<T[K]> => {
  const values = new Set(data.map((item) => item[field]).filter(Boolean))
  return Array.from(values)
}

// Type for checkbox dropdown props
type CheckboxDropdownProps = {
  label: string
  options: string[]
  selectedOptions: string[]
  onChange: (selected: string[]) => void
  anchorRef: React.RefObject<HTMLElement>
}

// Component for custom checkbox dropdown with search
const CheckboxDropdown = ({ label, options, selectedOptions, onChange, anchorRef }: CheckboxDropdownProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 })
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [anchorRef])

  // Calculate popover position when opening
  useEffect(() => {
    if (isOpen && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect()
      const tableContainer = document.querySelector(".table-wrapper")
      const tableRect = tableContainer?.getBoundingClientRect() || { left: 0, right: window.innerWidth }

      // Position the dropdown below the header
      let left = rect.left
      const top = rect.bottom + window.scrollY

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
  }, [isOpen, anchorRef])

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

  const filteredOptions = options.filter((option) => String(option).toLowerCase().includes(searchTerm.toLowerCase()))

  const toggleDropdown = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      setSearchTerm("")
    }
  }

  return (
    <>
      <button className="column-filter-button" onClick={toggleDropdown} title={`Filter ${label}`}>
        <span className={`filter-icon ${selectedOptions.length > 0 ? "active" : ""}`}></span>
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
            <button className="popover-close" onClick={() => setIsOpen(false)}>
              ×
            </button>
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
              <input type="checkbox" checked={selectedOptions.length === options.length} onChange={toggleAll} />
              <span className="checkbox-label">Select All</span>
            </label>
            {filteredOptions.map((option) => (
              <label key={String(option)} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={selectedOptions.includes(String(option))}
                  onChange={() => handleToggle(String(option))}
                />
                <span className="checkbox-label">{String(option)}</span>
              </label>
            ))}
            {filteredOptions.length === 0 && <div className="no-results">No matching options</div>}
          </div>
        </div>
      )}
    </>
  )
}

// Type for column header props
type ColumnHeaderProps = {
  field: keyof FlattenedDataRow
  label: string
  uniqueValues: string[]
  selectedFilters: string[]
  onFilterChange: (field: keyof FlattenedDataRow, selected: string[]) => void
}

// Column header component with filter
const ColumnHeader = ({ field, label, uniqueValues, selectedFilters, onFilterChange }: ColumnHeaderProps) => {
  const headerRef = useRef<HTMLDivElement>(null)

  return (
    <div className="column-header" ref={headerRef}>
      <span className="column-title">{label}</span>
      <CheckboxDropdown
        label={label}
        options={uniqueValues}
        selectedOptions={selectedFilters}
        onChange={(selected) => onFilterChange(field, selected)}
        anchorRef={headerRef}
      />
    </div>
  )
}

// Type for available group
type AvailableGroup = {
  id: keyof FlattenedDataRow
  label: string
}

// Toggle switch component
type ToggleSwitchProps = {
  label: string
  isChecked: boolean
  onChange: (checked: boolean) => void
}

const ToggleSwitch = ({ label, isChecked, onChange }: ToggleSwitchProps) => {
  return (
    <div className="toggle-switch-container">
      <label className="toggle-switch">
        <input type="checkbox" checked={isChecked} onChange={(e) => onChange(e.target.checked)} />
        <span className="toggle-slider"></span>
      </label>
      <span className="toggle-label">{label}</span>
    </div>
  )
}

// Sidebar component for controls
type SidebarProps = {
  isOpen: boolean
  children: React.ReactNode
}

const Sidebar = ({ isOpen, children }: SidebarProps) => {
  return (
    <div className={`sidebar ${isOpen ? "open" : ""}`}>
      <div className="sidebar-header">
        <h2>Pivot Table Controls</h2>
      </div>
      <div className="sidebar-content">{children}</div>
    </div>
  )
}

// Loading indicator component
const LoadingIndicator = ({ message = "Loading..." }: { message?: string }) => {
  return (
    <div className="loading-indicator">
      <div className="spinner"></div>
      <div className="loading-message">{message}</div>
    </div>
  )
}

// Main Pivot Table Component
export default function PivotTable() {
  // Data states
  const [data, setData] = useState<DataItem[]>(initialData)
  const [flatData, setFlatData] = useState<FlattenedDataRow[]>([])
  const [filteredData, setFilteredData] = useState<FlattenedDataRow[]>([])
  const [isPivotEnabled, setIsPivotEnabled] = useState<boolean>(false)

  // Loading states
  const [loadingServices, setLoadingServices] = useState<boolean>(false)
  const [loadingAttributes, setLoadingAttributes] = useState<boolean>(false)

  // Track expanded state for repositories and services
  const [expandedRepos, setExpandedRepos] = useState<Set<string>>(new Set())
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set())

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

  // Find repository in data
  const findRepository = useCallback(
    (asvId: string, repoName: string): { asvIndex: number; repoIndex: number } | null => {
      for (let i = 0; i < data.length; i++) {
        const asv = data[i].asv
        if (asv.id === asvId) {
          for (let j = 0; j < asv.repositories.length; j++) {
            if (asv.repositories[j].name === repoName) {
              return { asvIndex: i, repoIndex: j }
            }
          }
        }
      }
      return null
    },
    [data],
  )

  // Fetch services for a repository
  const fetchServicesForRepo = useCallback(
    async (asvId: string, repoName: string) => {
      // Find the repository in the data
      const repoLocation = findRepository(asvId, repoName)
      if (!repoLocation) return

      const { asvIndex, repoIndex } = repoLocation
      const repo = data[asvIndex].asv.repositories[repoIndex]

      // If already fetched and expanded, just toggle expanded state
      if (expandedRepos.has(`${asvId}-${repoName}`)) {
        setExpandedRepos((prev) => {
          const newSet = new Set(prev)
          newSet.delete(`${asvId}-${repoName}`)
          return newSet
        })
        return
      }

      // If services are already loaded and not empty, just mark as expanded
      if (repo.services && repo.services.length > 0) {
        setExpandedRepos((prev) => {
          const newSet = new Set(prev)
          newSet.add(`${asvId}-${repoName}`)
          return newSet
        })
        return
      }

      setLoadingServices(true)
      try {
        const services = await fetchServices(asvId, repoName)

        // Update the data with the fetched services
        setData((prevData) => {
          const newData = [...prevData]
          newData[asvIndex] = {
            ...newData[asvIndex],
            asv: {
              ...newData[asvIndex].asv,
              repositories: [
                ...newData[asvIndex].asv.repositories.slice(0, repoIndex),
                {
                  ...newData[asvIndex].asv.repositories[repoIndex],
                  services,
                },
                ...newData[asvIndex].asv.repositories.slice(repoIndex + 1),
              ],
            },
          }
          return newData
        })

        // Mark this repo as expanded
        setExpandedRepos((prev) => {
          const newSet = new Set(prev)
          newSet.add(`${asvId}-${repoName}`)
          return newSet
        })

        // Update unique values for service name
        const serviceNames = services.map((s) => s.name)
        setUniqueColumnValues((prev) => ({
          ...prev,
          serviceName: [...new Set([...prev.serviceName, ...serviceNames])],
        }))
      } catch (error) {
        console.error("Error fetching services:", error)
      } finally {
        setLoadingServices(false)
      }
    },
    [expandedRepos, data, findRepository],
  )

  // Find service in data
  const findService = useCallback(
    (
      asvId: string,
      repoName: string,
      serviceName: string,
    ): { asvIndex: number; repoIndex: number; serviceIndex: number } | null => {
      const repoLocation = findRepository(asvId, repoName)
      if (!repoLocation) return null

      const { asvIndex, repoIndex } = repoLocation
      const repo = data[asvIndex].asv.repositories[repoIndex]

      if (!repo.services) return null

      for (let i = 0; i < repo.services.length; i++) {
        if (repo.services[i].name === serviceName) {
          return { asvIndex, repoIndex, serviceIndex: i }
        }
      }

      return null
    },
    [data, findRepository],
  )

  // Fetch attributes for a service
  const fetchAttributesForService = useCallback(
    async (asvId: string, repoName: string, serviceName: string) => {
      // Find the service in the data
      const serviceLocation = findService(asvId, repoName, serviceName)
      if (!serviceLocation) return

      const { asvIndex, repoIndex, serviceIndex } = serviceLocation
      const service = data[asvIndex].asv.repositories[repoIndex].services?.[serviceIndex]

      if (!service) return

      // If already fetched and expanded, just toggle expanded state
      if (expandedServices.has(`${asvId}-${repoName}-${serviceName}`)) {
        setExpandedServices((prev) => {
          const newSet = new Set(prev)
          newSet.delete(`${asvId}-${repoName}-${serviceName}`)
          return newSet
        })
        return
      }

      // If attributes are already loaded, just mark as expanded
      if (service.attributes && service.attributes.length > 0) {
        setExpandedServices((prev) => {
          const newSet = new Set(prev)
          newSet.add(`${asvId}-${repoName}-${serviceName}`)
          return newSet
        })
        return
      }

      setLoadingAttributes(true)
      try {
        const attributes = await fetchAttributes(asvId, repoName, serviceName)

        // Update the data with the fetched attributes
        setData((prevData) => {
          const newData = [...prevData]
          const services = [...(newData[asvIndex].asv.repositories[repoIndex].services || [])]

          services[serviceIndex] = {
            ...services[serviceIndex],
            attributes,
          }

          newData[asvIndex] = {
            ...newData[asvIndex],
            asv: {
              ...newData[asvIndex].asv,
              repositories: [
                ...newData[asvIndex].asv.repositories.slice(0, repoIndex),
                {
                  ...newData[asvIndex].asv.repositories[repoIndex],
                  services,
                },
                ...newData[asvIndex].asv.repositories.slice(repoIndex + 1),
              ],
            },
          }

          return newData
        })

        // Update available groups to include attribute
        if (!availableGroups.some((g) => g.id === "attributeName")) {
          setAvailableGroups((prev) => [...prev, { id: "attributeName", label: "Attribute Name" }])
        }

        // Update active groups to include attribute if not already included
        if (!activeGroups.includes("attributeName")) {
          setActiveGroups((prev) => [...prev, "attributeName"])
        }

        // Mark this service as expanded
        setExpandedServices((prev) => {
          const newSet = new Set(prev)
          newSet.add(`${asvId}-${repoName}-${serviceName}`)
          return newSet
        })

        // Update unique values for attribute name
        const attributeNames = attributes.map((a) => a["attribute-name"])
        setUniqueColumnValues((prev) => ({
          ...prev,
          attributeName: [...new Set([...prev.attributeName, ...attributeNames])],
        }))
      } catch (error) {
        console.error("Error fetching attributes:", error)
      } finally {
        setLoadingAttributes(false)
      }
    },
    [expandedServices, availableGroups, activeGroups, data, findService],
  )

  // Update a specific column filter
  const updateColumnFilter = (field: keyof FlattenedDataRow, selected: string[]) => {
    setColumnFilters((prev) => ({
      ...prev,
      [field]: selected,
    }))
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
  const renderRows = (
    data: GroupedData | GroupNode,
    path: string[] = [],
    level = 0,
    parentPath = "",
  ): React.JSX.Element[] | null => {
    if (!data) return null

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

    const elements: React.JSX.Element[] = []

    Object.keys(data)
      .filter((key) => key !== "_isExpanded" && key !== "_rows" && key !== "_groupField" && key !== "_groupValue")
      .forEach((key) => {
        const currentPath = [...path, key]
        const pathString = currentPath.join(".")
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
                // If this is an empty service cell at the service level
                if (level === 2 && activeGroups[2] === "serviceName" && key === "") {
                  return (
                    <td key={i} className="group-cell">
                      <div
                        className="expander-cell no-data-text"
                        onClick={() => handleEmptyServiceClick(path[0], path[1])}
                      >
                        <span>(No services available - click to load)</span>
                        {loadingServices && <span className="loading-spinner-small"></span>}
                      </div>
                    </td>
                  )
                }

                return (
                  <td key={i} className="group-cell">
                    <div className="expander-cell">
                      {/* Only show expander if not at the last level */}
                      {level < activeGroups.length - 1 && (
                        <button
                          className={`expander ${currentGroup._isExpanded ? "expanded" : ""}`}
                          onClick={() => toggleExpand(currentPath, level)}
                        ></button>
                      )}
                      <span>{key}</span>

                      {/* Show loading indicator if fetching services or attributes */}
                      {loadingServices &&
                        level === 1 &&
                        activeGroups[0] === "asvName" &&
                        activeGroups[1] === "repoName" &&
                        path[0] === currentPath[0] &&
                        !expandedRepos.has(`${path[0]}-${key}`) && <span className="loading-spinner-small"></span>}

                      {loadingAttributes &&
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

        // If this is the last level, render the data rows
        if (level === activeGroups.length - 1) {
          currentGroup._rows.forEach((row: FlattenedDataRow, rowIndex: number) => {
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

        // Render child groups
        if (level < activeGroups.length - 1) {
          const childElements = renderRows(currentGroup, currentPath, level + 1, pathString)
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

  // Toggle pivot controls
  const togglePivotControls = (enabled: boolean) => {
    setIsPivotEnabled(enabled)
  }

  return (
    <div className={`pivot-table-container ${isPivotEnabled ? "pivot-enabled" : ""}`}>
      {/* Top toolbar with toggle switch */}
      <div className="pivot-toolbar">
        <ToggleSwitch label="Pivot" isChecked={isPivotEnabled} onChange={togglePivotControls} />
        <h2 className="pivot-title">Pivot Table</h2>
      </div>

      <div className="main-content">
        {/* Sidebar for controls - only shown when pivot is enabled */}
        {isPivotEnabled && (
          <Sidebar isOpen={true}>
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
          </Sidebar>
        )}

        {/* Main table area */}
        <div className="table-container">
          <div className="table-wrapper">
            <table className="pivot-table">
              <thead>
                <tr>
                  {activeGroups.length > 0
                    ? activeGroups.map((group, index) => {
                        const label = availableGroups.find((g) => g.id === group)?.label || String(group).toUpperCase()
                        return (
                          <th key={index} className="group-header">
                            <ColumnHeader
                              field={group}
                              label={label}
                              uniqueValues={uniqueColumnValues[group] || []}
                              selectedFilters={columnFilters[group] || []}
                              onFilterChange={updateColumnFilter}
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
                              label={field.toUpperCase()}
                              uniqueValues={uniqueColumnValues[fieldKey] || []}
                              selectedFilters={columnFilters[fieldKey] || []}
                              onFilterChange={updateColumnFilter}
                            />
                          </th>
                        )
                      })}
                </tr>
              </thead>
              <tbody>{renderRows(groupedData)}</tbody>
            </table>

            {filteredData.length === 0 && (
              <div className="no-data-message">No data available. Please adjust your filters.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

