"use client"

// Data service for managing API calls and data handling
import { useState, useCallback } from "react"

// Define comprehensive types for the data structure
export type AttributeData = {
  "attribute-name": string
  value?: string | number
}

export type ServiceData = {
  name: string
  attributes?: AttributeData[] // Optional as they will be loaded on demand
}

export type RepoData = {
  name: string
  usecase: string
  status: number
  services?: ServiceData[] // Optional as they will be loaded on demand
}

// Updated ASV data structure
export type ASVData = {
  asv: string
  id: string
  ba: string
  repositories: RepoData[]
}

// Updated DataItem structure
export type DataItem = {
  asv: ASVData
}

// Define the flattened data structure
export type FlattenedDataRow = {
  asvId: string
  asvName: string
  asvBA: string
  repoName: string
  repoUsecase: string
  repoStatus: number
  serviceName?: string
  attributeName?: string
}

// Sample initial data with the new structure
export const initialData: DataItem[] = [
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
export const fetchServices = async (asvId: string, repoName: string): Promise<ServiceData[]> => {
  console.log(`Fetching services for ASV: ${asvId}, Repository: ${repoName}`)
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500))
  return mockServiceData[repoName] || []
}

export const fetchAttributes = async (
  asvId: string,
  repoName: string,
  serviceName: string,
): Promise<AttributeData[]> => {
  console.log(`Fetching attributes for ASV: ${asvId}, Repository: ${repoName}, Service: ${serviceName}`)
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500))
  return mockAttributeData[serviceName] || []
}

// Updated flatten data function to handle the new structure
export const flattenData = (data: DataItem[]): FlattenedDataRow[] => {
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
export const getUniqueValues = <T extends object, K extends keyof T>(data: T[], field: K): Array<T[K]> => {
  const values = new Set(data.map((item) => item[field]).filter(Boolean))
  return Array.from(values)
}

// Define the type for available group
export type AvailableGroup = {
  id: keyof FlattenedDataRow
  label: string
}

// Data service hook
export const useDataService = () => {
  const [data, setData] = useState<DataItem[]>(initialData)
  const [loadingServices, setLoadingServices] = useState<Record<string, boolean>>({})
  const [loadingAttributes, setLoadingAttributes] = useState<Record<string, boolean>>({})
  const [expandedRepos, setExpandedRepos] = useState<Set<string>>(new Set())
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set())
  const [isSearching, setIsSearching] = useState(false)

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

      // Set loading state for this repository
      setLoadingServices((prev) => ({ ...prev, [`${asvId}-${repoName}`]: true }))

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
      } catch (error) {
        console.error("Error fetching services:", error)
      } finally {
        setLoadingServices((prev) => ({ ...prev, [`${asvId}-${repoName}`]: false }))
      }
    },
    [expandedRepos, data, findRepository],
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

      // Set loading state for this service
      setLoadingAttributes((prev) => ({ ...prev, [`${asvId}-${repoName}-${serviceName}`]: true }))

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

        // Mark this service as expanded
        setExpandedServices((prev) => {
          const newSet = new Set(prev)
          newSet.add(`${asvId}-${repoName}-${serviceName}`)
          return newSet
        })
      } catch (error) {
        console.error("Error fetching attributes:", error)
      } finally {
        setLoadingAttributes((prev) => ({ ...prev, [`${asvId}-${repoName}-${serviceName}`]: false }))
      }
    },
    [expandedServices, data, findService],
  )

  // Search for repositories by service and attribute
  const searchServicesByAttribute = useCallback(
    async (serviceName: string, attributeName?: string) => {
      console.log(
        `Searching for repositories with service: ${serviceName}${attributeName ? ` and attribute: ${attributeName}` : ""}`,
      )

      // Set loading state
      setIsSearching(true)

      try {
        // Find repositories in our data that have this service
        const results: { asvId: string; repoName: string }[] = []

        // Iterate through all ASVs and repositories
        for (const item of data) {
          const asv = item.asv

          for (const repo of asv.repositories) {
            // First, fetch services for this repository if not already loaded
            if (!repo.services || repo.services.length === 0) {
              await fetchServicesForRepo(asv.id, repo.name)
            }

            // Check if the repository has the service we're looking for
            const updatedRepo = data
              .find((d) => d.asv.id === asv.id)
              ?.asv.repositories.find((r) => r.name === repo.name)

            if (updatedRepo?.services) {
              const serviceMatch = updatedRepo.services.find((s) => s.name === serviceName)

              if (serviceMatch) {
                // If we're also filtering by attribute, fetch and check attributes
                if (attributeName) {
                  await fetchAttributesForService(asv.id, repo.name, serviceName)

                  // Get the updated service with attributes
                  const updatedService = data
                    .find((d) => d.asv.id === asv.id)
                    ?.asv.repositories.find((r) => r.name === repo.name)
                    ?.services?.find((s) => s.name === serviceName)

                  if (updatedService?.attributes?.some((attr) => attr["attribute-name"] === attributeName)) {
                    results.push({ asvId: asv.id, repoName: repo.name })
                  }
                } else {
                  // If we're just filtering by service, add the repository
                  results.push({ asvId: asv.id, repoName: repo.name })
                }
              }
            }
          }
        }

        setIsSearching(false)
        return results
      } catch (error) {
        console.error("Error searching for services:", error)
        setIsSearching(false)
        return []
      }
    },
    [data, fetchServicesForRepo, fetchAttributesForService],
  )

  // Add searchServicesByAttribute to the return object
  return {
    data,
    loadingServices,
    loadingAttributes,
    expandedRepos,
    expandedServices,
    findRepository,
    findService,
    fetchServicesForRepo,
    fetchAttributesForService,
    searchServicesByAttribute,
    isSearching,
  }
}
