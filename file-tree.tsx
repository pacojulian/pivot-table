"use client"

import { useState, useEffect, useCallback } from "react"
import "./file-tree.css"

// Sample data structure
const SAMPLE_DATA = [
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

// Mock API call to fetch services
const fetchServices = (repo: string) => {
  // In a real application, this would be an API call
  // For now, we'll just filter the sample data
  const repoData = SAMPLE_DATA.find((item) => item.repo === repo)
  return new Promise<any[]>((resolve) => {
    setTimeout(() => {
      resolve(repoData?.services || [])
    }, 500) // Simulate network delay
  })
}

interface TreeNode {
  id: string
  label: string
  type: "asv" | "repo" | "service" | "attribute"
  children: TreeNode[]
  data?: any
  isExpanded?: boolean
  isSelected?: boolean
  isLoading?: boolean
}

export default function FileTree() {
  const [treeData, setTreeData] = useState<TreeNode[]>([])
  const [selectedNodes, setSelectedNodes] = useState<string[]>([])
  const [filters, setFilters] = useState({
    asv: "",
    repo: "",
    field1: "",
    field2: "",
  })
  const [filterOptions, setFilterOptions] = useState({
    asv: new Set<string>(),
    repo: new Set<string>(),
    field1: new Set<string>(),
    field2: new Set<string>(),
  })

  // Initialize tree data from sample data
  useEffect(() => {
    const asvMap = new Map<string, TreeNode>()

    // Extract filter options
    const asvOptions = new Set<string>()
    const repoOptions = new Set<string>()
    const field1Options = new Set<string>()
    const field2Options = new Set<string>()

    SAMPLE_DATA.forEach((item) => {
      asvOptions.add(item.asv)
      repoOptions.add(item.repo)
      field1Options.add(item.field1)
      field2Options.add(item.field2)

      // Filter data based on current filters
      if (
        (filters.asv && item.asv !== filters.asv) ||
        (filters.repo && item.repo !== filters.repo) ||
        (filters.field1 && item.field1 !== filters.field1) ||
        (filters.field2 && item.field2 !== filters.field2)
      ) {
        return
      }

      // Create ASV node if it doesn't exist
      if (!asvMap.has(item.asv)) {
        asvMap.set(item.asv, {
          id: item.asv,
          label: item.asv,
          type: "asv",
          children: [],
          data: { asv: item.asv },
          isExpanded: false,
          isSelected: false,
        })
      }

      const asvNode = asvMap.get(item.asv)!

      // Add repo as child of ASV
      const repoNode: TreeNode = {
        id: `${item.asv}-${item.repo}`,
        label: item.repo,
        type: "repo",
        children: [],
        data: item,
        isExpanded: false,
        isSelected: false,
      }

      asvNode.children.push(repoNode)
    })

    setFilterOptions({
      asv: asvOptions,
      repo: repoOptions,
      field1: field1Options,
      field2: field2Options,
    })

    setTreeData(Array.from(asvMap.values()))
  }, [filters])

  // Toggle node expansion
  const toggleNode = useCallback(
    async (node: TreeNode) => {
      const updateNode = (nodes: TreeNode[]): TreeNode[] => {
        return nodes.map((n) => {
          if (n.id === node.id) {
            // If it's a repo node and not expanded yet, fetch services
            if (n.type === "repo" && !n.isExpanded && n.children.length === 0) {
              n.isLoading = true
              fetchServices(n.data.repo).then((services) => {
                const serviceNodes: TreeNode[] = services.map((service) => ({
                  id: `${n.id}-${service.name}`,
                  label: service.name || "Unnamed Service",
                  type: "service",
                  children: (service.cch || []).map((attr: any, index: number) => ({
                    id: `${n.id}-${service.name}-${index}`,
                    label: attr["attribute-name"],
                    type: "attribute",
                    children: [],
                    data: attr,
                    isExpanded: false,
                    isSelected: false,
                  })),
                  data: service,
                  isExpanded: false,
                  isSelected: false,
                }))

                setTreeData((prevData) => {
                  return updateNodeInTree(prevData, n.id, (foundNode) => {
                    foundNode.children = serviceNodes
                    foundNode.isLoading = false
                    return foundNode
                  })
                })
              })
            }

            return {
              ...n,
              isExpanded: !n.isExpanded,
            }
          } else if (n.children) {
            return {
              ...n,
              children: updateNode(n.children),
            }
          }
          return n
        })
      }

      setTreeData(updateNode(treeData))
    },
    [treeData],
  )

  // Helper function to update a node in the tree
  const updateNodeInTree = (nodes: TreeNode[], nodeId: string, updateFn: (node: TreeNode) => TreeNode): TreeNode[] => {
    return nodes.map((node) => {
      if (node.id === nodeId) {
        return updateFn(node)
      } else if (node.children.length > 0) {
        return {
          ...node,
          children: updateNodeInTree(node.children, nodeId, updateFn),
        }
      }
      return node
    })
  }

  // Toggle node selection
  const toggleSelection = useCallback(
    (node: TreeNode) => {
      const isSelected = !selectedNodes.includes(node.id)

      if (isSelected) {
        setSelectedNodes([...selectedNodes, node.id])
      } else {
        setSelectedNodes(selectedNodes.filter((id) => id !== node.id))
      }

      // Update the tree to reflect selection state
      const updateSelectionState = (nodes: TreeNode[]): TreeNode[] => {
        return nodes.map((n) => {
          if (n.id === node.id) {
            return {
              ...n,
              isSelected: isSelected,
            }
          } else if (n.children) {
            return {
              ...n,
              children: updateSelectionState(n.children),
            }
          }
          return n
        })
      }

      setTreeData(updateSelectionState(treeData))
    },
    [selectedNodes, treeData],
  )

  // Handle filter changes
  const handleFilterChange = (filterType: keyof typeof filters, value: string) => {
    setFilters({
      ...filters,
      [filterType]: value,
    })
  }

  // Render tree nodes recursively
  const renderTreeNodes = (nodes: TreeNode[]) => {
    return nodes.map((node) => (
      <li key={node.id} className={`tree-node ${node.type}`}>
        <div className="node-content">
          <input
            type="checkbox"
            checked={node.isSelected || false}
            onChange={() => toggleSelection(node)}
            className="node-checkbox"
          />
          <span
            className={`expand-icon ${node.children.length > 0 ? "has-children" : ""} ${node.isExpanded ? "expanded" : ""}`}
            onClick={() => toggleNode(node)}
          >
            {node.children.length > 0 && (node.isExpanded ? "−" : "+")}
          </span>
          <span className="node-label" onClick={() => toggleNode(node)}>
            {node.label}
            {node.isLoading && <span className="loading-indicator">Loading...</span>}
          </span>
        </div>
        {node.isExpanded && node.children.length > 0 && (
          <ul className="tree-children">{renderTreeNodes(node.children)}</ul>
        )}
      </li>
    ))
  }

  // Render filter dropdown
  const renderFilterDropdown = (filterType: keyof typeof filters, options: Set<string>) => {
    const [isOpen, setIsOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")

    const filteredOptions = Array.from(options).filter((option) =>
      option.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    return (
      <div className="filter-dropdown">
        <div className="filter-label">{filterType.toUpperCase()}</div>
        <div className="dropdown-container">
          <div className="dropdown-header" onClick={() => setIsOpen(!isOpen)}>
            {filters[filterType] || `Select ${filterType}`}
            <span className={`dropdown-arrow ${isOpen ? "open" : ""}`}>▼</span>
          </div>
          {isOpen && (
            <div className="dropdown-content">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="dropdown-search"
              />
              <div className="dropdown-options">
                <div
                  className="dropdown-option"
                  onClick={() => {
                    handleFilterChange(filterType, "")
                    setIsOpen(false)
                    setSearchTerm("")
                  }}
                >
                  Clear
                </div>
                {filteredOptions.map((option) => (
                  <div
                    key={option}
                    className="dropdown-option"
                    onClick={() => {
                      handleFilterChange(filterType, option)
                      setIsOpen(false)
                      setSearchTerm("")
                    }}
                  >
                    {option}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="file-tree-container">
      <div className="filter-section">
        {renderFilterDropdown("asv", filterOptions.asv)}
        {renderFilterDropdown("repo", filterOptions.repo)}
        {renderFilterDropdown("field1", filterOptions.field1)}
        {renderFilterDropdown("field2", filterOptions.field2)}
      </div>

      <div className="selected-count">
        {selectedNodes.length > 0 && <div className="selection-info">{selectedNodes.length} item(s) selected</div>}
      </div>

      <div className="tree-view">
        <ul className="tree-root">{renderTreeNodes(treeData)}</ul>
      </div>
    </div>
  )
}


