"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Integration {
  id: string
  name: string
  logo: string
}

const integrations: Integration[] = [
  { id: "shopify", name: "Shopify", logo: "/shopify-logo.svg" },
  { id: "magento", name: "Magento", logo: "/magento-logo.svg" },
  { id: "zendesk", name: "Zendesk", logo: "/zendesk-logo.svg" },
  { id: "hubspot", name: "Hubspot", logo: "/hubspot-logo.svg" },
]

interface IntegrationSidebarProps {
  service: "paragon" | "integration-app" | "merge"
}

export function IntegrationSidebar({ service }: IntegrationSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-64 border-r bg-muted/40">
      <div className="flex h-full flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4">
          <h2 className="text-lg font-semibold">Integrations</h2>
        </div>
        <nav className="flex-1 space-y-1 p-2">
          {integrations.map((integration) => {
            const href = `/dashboard/${service}/${integration.id}`
            const isActive = pathname === href

            return (
              <Link key={integration.id} href={href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn("w-full justify-start gap-3", isActive && "bg-secondary")}
                >
                  <div className="relative h-6 w-6 flex-shrink-0">
                    <Image
                      src={integration.logo || "/placeholder.svg"}
                      alt={`${integration.name} logo`}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <span>{integration.name}</span>
                </Button>
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
