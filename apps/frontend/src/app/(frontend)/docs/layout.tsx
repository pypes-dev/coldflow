import type { ReactNode } from 'react'
import { Layout } from 'nextra-theme-docs'
import { getPageMap } from 'nextra/page-map'
import 'nextra-theme-docs/style-prefixed.css'

export const metadata = {
  title: 'ColdFlow Docs',
  description: 'Documentation for ColdFlow — open-source cold email and outreach automation.',
}

function filterPageMapForDocs(pageMap: any): any {
  if (!pageMap) return null
  
  if (Array.isArray(pageMap)) {
    return pageMap
      .map((item) => filterPageMapForDocs(item))
      .filter((item) => item !== null)
  }
  
  if (typeof pageMap === 'object') {
    const route = pageMap.route || pageMap.name || ''
    const hasDocsRoute = route.includes('/docs')
    
    // If this item has a docs route, include it and filter its children
    if (hasDocsRoute) {
      const filtered: any = { ...pageMap }
      if (pageMap.children) {
        filtered.children = filterPageMapForDocs(pageMap.children)
      }
      return filtered
    }
    
    // If this item doesn't have docs route, check if any children do
    if (pageMap.children) {
      const filteredChildren = filterPageMapForDocs(pageMap.children)
      if (filteredChildren && (Array.isArray(filteredChildren) ? filteredChildren.length > 0 : Object.keys(filteredChildren).length > 0)) {
        return {
          ...pageMap,
          children: filteredChildren,
        }
      }
    }
    
    return null
  }
  
  return null
}

export default async function DocsLayout({
  children,
}: {
  children: ReactNode
}) {
  const pageMap = await getPageMap()
  const filteredPageMap = filterPageMapForDocs(pageMap)

  return (
    <Layout
      pageMap={filteredPageMap}
      docsRepositoryBase="https://github.com/shuding/nextra/tree/main/docs"
    >
      {children}
    </Layout>
  )
}
