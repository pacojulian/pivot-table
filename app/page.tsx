"use client"

import { useState } from "react"
import { PivotTable } from "@/components/pivot-table"
import type { ColumnDefinition, RowGrouping } from "@/components/pivot-table"

// Sample data
const SAMPLE_DATA = [
  {
    asv: "ASV-001",
    repo: "Repository A",
    "use-case": "Data Analysis",
    services: "Data Processing",
    attributes: "High Performance",
  },
  {
    asv: "ASV-001",
    repo: "Repository A",
    "use-case": "Data Analysis",
    services: "Visualization",
    attributes: "Interactive",
  },
   {
    asv: "ASV-002",
    repo: "Repository B",
    "use-case": "Data Analysis",
    services: "CCB",
    attributes: "accountName",
  },

]

// Generate more sample data
/*for (let i = 6; i <= 20; i++) {
  const asvId = `ASV-${i.toString().padStart(3, "0")}`
  const repoIndex = i % 5
  const repoName = `Repository ${String.fromCharCode(65 + repoIndex)}`
  const useCases = ["Data Analysis", "API Gateway", "Infrastructure", "Web Services", "Data Storage"]
  const services = [
    "Data Processing",
    "Visualization",
    "Authentication",
    "Rate Limiting",
    "Monitoring",
    "Alerting",
    "Content Delivery",
    "Backend",
    "Database",
    "Caching",
  ]
  const attributes = [
    "High Performance",
    "Interactive",
    "Secure",
    "Scalable",
    "Real-time",
    "Configurable",
    "Fast",
    "Reliable",
    "Durable",
    "Low Latency",
  ]

  const useCase = useCases[i % 5]
  const service = services[i % 10]
  const attribute = attributes[i % 10]

  SAMPLE_DATA.push({
    asv: asvId,
    repo: repoName,
    "use-case": useCase,
    services: service,
    attributes: attribute,
    value: 1500 + Math.floor(Math.random() * 2000),
    usage: 50 + Math.floor(Math.random() * 50),
    score: 3.5 + Math.random(),
  })
}
*/

export default function Home() {
  // Initial columns
  const [columns] = useState<ColumnDefinition[]>([
      { field: "attributes", title: "attributes" },
  ])

  // Initial row grouping
  const [rowGrouping] = useState<RowGrouping[]>([
    { field: "asv", direction: "asc" },
    { field: "repo", direction: "asc" },
  ])

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Hierarchical Pivot Table</h1>

      <div className="pivot-table-wrapper">
        <PivotTable data={SAMPLE_DATA} initialColumns={columns} initialGrouping={rowGrouping} />
      </div>
    </div>
  )
}

