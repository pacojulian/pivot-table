// Hierarchy levels in our data structure
export type HierarchyLevel = "asv" | "repo" | "use-case" | "services" | "attributes"

// Available aggregation functions
export type AggregationFunction = "sum" | "average" | "count" | "min" | "max"

// Filtered state for each hierarchy level
export interface FilterState {
  [key in HierarchyLevel]?: string[]
}

// Definition for a column in the pivot table
export interface ColumnDefinition {
  field: string
  title?: string
  format?: "currency" | "percent" | "decimal" | "string"
  width?: number
}

// Row grouping configuration
export interface RowGrouping {
  field: HierarchyLevel
  direction: "asc" | "desc"
}

// Processed data for the pivot table
export interface PivotTableData {
  id: string
  level: number
  isGroup: boolean
  groupValue?: string
  field: string
  children?: PivotTableData[]
  [key: string]: any
}

// Main props for the PivotTable component
export interface PivotTableProps {
  data: any[]
  initialFilters?: FilterState
  initialGrouping?: RowGrouping[]
  initialColumns?: ColumnDefinition[]
  aggregationFunctions?: {
    [key in AggregationFunction]?: boolean
  }
}

