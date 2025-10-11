import type React from "react"
import { IntegrationSidebar } from "@/components/integration-sidebar"

export default function MergeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <IntegrationSidebar service="merge" />
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  )
}
