"use client"

import { useState, useEffect } from "react"
import "./styles.css"
import { PivotTableFilter } from "./pivot-table-filter"
import { PivotTableGrid } from "./pivot-table-grid"
import { PivotTableToolbar } from "./pivot-table-toolbar"
import type {
  FilterState,
  HierarchyLevel,
  PivotTableProps,
  PivotTableData,
  AggregationFunction,
  ColumnDefinition,
  RowGrouping,
} from "./types"

export function PivotTable({
  data,
  initialFilters = {},
  initialGrouping = [],
  initialColumns = [],
  aggregationFunctions = {
    sum: true,
    average: true,
    count: true,
    min: true,
    max: true,
  },
}: PivotTableProps) {
  // State for filters, columns, and data
  const [filters, setFilters] = useState<FilterState>(initialFilters)
  const [columns, setColumns] = useState<ColumnDefinition[]>(initialColumns)
  const [rowGrouping, setRowGrouping] = useState<RowGrouping[]>(initialGrouping)
  const [selectedAggregation, setSelectedAggregation] = useState<AggregationFunction>("sum")
  const [processedData, setProcessedData] = useState<PivotTableData[]>([])
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
  const [sortConfig, setSortConfig] = useState<{ column: string; direction: "asc" | "desc" } | null>(null)

  // Process data based on filters, grouping, and aggregation
  useEffect(() => {
    const filteredData = filterData(data, filters)
    let groupedAndAggregatedData = groupAndAggregate(filteredData, rowGrouping, columns, selectedAggregation)

    if (sortConfig) {
      groupedAndAggregatedData = sortData(groupedAndAggregatedData, sortConfig.column, sortConfig.direction)
    }

    setProcessedData(groupedAndAggregatedData)
  }, [data, filters, rowGrouping, columns, selectedAggregation, sortConfig])

  // Filter data based on filter state
  const filterData = (data: any[], filterState: FilterState): any[] => {
    return data.filter((item) => {
      for (const level in filterState) {
        const filterValues = filterState[level as HierarchyLevel]

        if (filterValues && filterValues.length > 0) {
          if (!item[level] || !filterValues.includes(item[level])) {
            return false
          }
        }
      }
      return true
    })
  }

  // Group and aggregate data
  const groupAndAggregate = (
    data: any[],
    grouping: RowGrouping[],
    columns: ColumnDefinition[],
    aggregation: AggregationFunction,
  ): PivotTableData[] => {
    if (!data.length || !grouping.length) return data

    const result: PivotTableData[] = []
    const groupMap = new Map()

    // First level grouping
    data.forEach((item) => {
      const groupValue = item[grouping[0].field]
      if (!groupMap.has(groupValue)) {
        groupMap.set(groupValue, [])
      }
      groupMap.get(groupValue).push(item)
    })

    // Process each group
    groupMap.forEach((groupItems, groupValue) => {
      const groupRow: PivotTableData = {
        id: `group-${groupValue}`,
        level: 0,
        isGroup: true,
        groupValue,
        field: grouping[0].field,
        children: [],
      }

      // Add aggregation values for each column
      columns.forEach((column) => {
        groupRow[column.field] = aggregateValues(groupItems, column.field, aggregation)
      })

      // Process next level of grouping if available
      if (grouping.length > 1) {
        processNextGroupLevel(groupRow, groupItems, grouping, 1, columns, aggregation)
      }

      result.push(groupRow)
    })

    return result
  }

  // Recursively process nested group levels
  const processNextGroupLevel = (
    parentRow: PivotTableData,
    items: any[],
    grouping: RowGrouping[],
    level: number,
    columns: ColumnDefinition[],
    aggregation: AggregationFunction,
  ) => {
    if (level >= grouping.length) return

    const field = grouping[level].field
    const groupMap = new Map()

    // Group items at this level
    items.forEach((item) => {
      const groupValue = item[field]
      if (!groupMap.has(groupValue)) {
        groupMap.set(groupValue, [])
      }
      groupMap.get(groupValue).push(item)
    })

    // Process each group
    groupMap.forEach((groupItems, groupValue) => {
      const childRow: PivotTableData = {
        id: `${parentRow.id}-${groupValue}`,
        level,
        isGroup: true,
        groupValue,
        field,
        children: [],
      }

      // Add aggregation values for each column
      columns.forEach((column) => {
        childRow[column.field] = aggregateValues(groupItems, column.field, aggregation)
      })

      // Process next level of grouping if available
      if (level < grouping.length - 1) {
        processNextGroupLevel(childRow, groupItems, grouping, level + 1, columns, aggregation)
      }

      // Add individual items at the lowest level
      if (level === grouping.length - 1) {
        groupItems.forEach((item: any, index: number) => {
          const leafRow: PivotTableData = {
            id: `${childRow.id}-item-${index}`,
            level: level + 1,
            isGroup: false,
            ...item,
          }
          childRow.children?.push(leafRow)
        })
      }

      parentRow.children?.push(childRow)
    })
  }

  // Aggregate values based on function (sum, average, count, etc.)
  const aggregateValues = (items: any[], field: string, aggregation: AggregationFunction) => {
    if (!items.length) return null

    const values = items.map((item) => item[field]).filter((v) => v !== undefined && v !== null)

    if (!values.length) return null

    switch (aggregation) {
      case "sum":
        return values.reduce((sum, val) => sum + (Number(val) || 0), 0)
      case "average":
        return values.reduce((sum, val) => sum + (Number(val) || 0), 0) / values.length
      case "count":
        return values.length
      case "min":
        return Math.min(...values.map((v) => Number(v) || 0))
      case "max":
        return Math.max(...values.map((v) => Number(v) || 0))
      default:
        return null
    }
  }

  // Sort data based on column and direction
  const sortData = (data: PivotTableData[], column: string, direction: "asc" | "desc"): PivotTableData[] => {
    const sortedData = [...data].sort((a, b) => {
      const aValue = a[column] !== undefined ? a[column] : ""
      const bValue = b[column] !== undefined ? b[column] : ""

      if (aValue === bValue) return 0

      const comparison = aValue < bValue ? -1 : 1
      return direction === "asc" ? comparison : -comparison
    })

    // Sort children recursively
    sortedData.forEach((row) => {
      if (row.children && row.children.length) {
        row.children = sortData(row.children, column, direction)
      }
    })

    return sortedData
  }

  // Handle filter changes
  const handleFilterChange = (level: HierarchyLevel, values: string[]) => {
    setFilters((prev) => ({
      ...prev,
      [level]: values,
    }))
  }

  // Handle row expansion toggle
  const handleRowExpand = (rowId: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [rowId]: !prev[rowId],
    }))
  }

  // Handle column sorting
  const handleSort = (column: string) => {
    setSortConfig((prevSort) => {
      if (prevSort && prevSort.column === column) {
        return prevSort.direction === "asc" ? { column, direction: "desc" } : null
      }
      return { column, direction: "asc" }
    })
  }

  // Handle aggregation function change
  const handleAggregationChange = (func: AggregationFunction) => {
    setSelectedAggregation(func)
  }

  // Handle row grouping changes
  const handleRowGroupingChange = (grouping: RowGrouping[]) => {
    setRowGrouping(grouping)
  }

  // Handle column definition changes
  const handleColumnsChange = (columns: ColumnDefinition[]) => {
    setColumns(columns)
  }

  // Generate unique values for each hierarchy level
  const getUniqueValuesForLevel = (level: HierarchyLevel) => {
    const uniqueValues = new Set()
    data.forEach((item) => {
      if (item[level] !== undefined) {
        uniqueValues.add(item[level])
      }
    })
    return Array.from(uniqueValues) as string[]
  }

  return (
    <div className="pivot-table-container">
      <PivotTableToolbar
        selectedAggregation={selectedAggregation}
        availableAggregations={
          Object.keys(aggregationFunctions).filter(
            (key) => aggregationFunctions[key as AggregationFunction],
          ) as AggregationFunction[]
        }
        rowGrouping={rowGrouping}
        columns={columns}
        hierarchyLevels={["asv", "repo", "use-case", "services", "attributes"]}
        onAggregationChange={handleAggregationChange}
        onRowGroupingChange={handleRowGroupingChange}
        onColumnsChange={handleColumnsChange}
      />

      <div className="pivot-table-filters">
        {["asv", "repo", "use-case", "services", "attributes"].map((level) => (
          <PivotTableFilter
            key={level}
            level={level as HierarchyLevel}
            values={getUniqueValuesForLevel(level as HierarchyLevel)}
            selectedValues={filters[level as HierarchyLevel] || []}
            onChange={(values) => handleFilterChange(level as HierarchyLevel, values)}
          />
        ))}
      </div>

      <PivotTableGrid
        data={processedData}
        columns={columns}
        expandedRows={expandedRows}
        sortConfig={sortConfig}
        onRowExpand={handleRowExpand}
        onSort={handleSort}
      />
    </div>
  )
}

