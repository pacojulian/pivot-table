"use client"

// Data service hook
import { useState, useCallback } from "react"
import { initialData, type DataItem, type FlattenedDataRow, fetchServices, fetchAttributes } from "@/lib/data-service"

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
