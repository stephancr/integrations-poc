"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createBrowserClient } from "@supabase/ssr"
import { Loader2 } from "lucide-react"

interface IntegrationViewProps {
  service: string
  integration: string
  logoUrl: string
  disabled?: boolean
}

export function IntegrationView({ service, integration, logoUrl, disabled = false }: IntegrationViewProps) {
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    async function fetchConnectionStatus() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setLoading(false)
          return
        }

        const { data, error } = await supabase
          .from("integration_connections")
          .select("connected")
          .eq("user_id", user.id)
          .eq("service", service)
          .eq("integration", integration)
          .single()

        if (error && error.code !== "PGRST116") {
          console.error("[v0] Error fetching connection status:", error)
        }

        setConnected(data?.connected || false)
      } catch (error) {
        console.error("[v0] Error in fetchConnectionStatus:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchConnectionStatus()
  }, [service, integration, supabase])

  async function toggleConnection() {
    setToggling(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        console.error("[v0] No user found")
        setToggling(false)
        return
      }

      const newConnectedState = !connected

      // If using Paragon service and connecting, call paragon.connect()
      if (service === "Paragon" && !connected) {
        const { paragon } = await import('@useparagon/connect')
        paragon.connect(integration.toLowerCase())
      }

      // If using Integration App service and connecting, call integrationApp.integration().openNewConnection()
      if (service === "Integration App" && !connected) {
        // Get the Integration App token from the user's profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("integration_app_token")
          .eq("id", user.id)
          .single()

        const integrationAppToken = profile?.integration_app_token

        if (integrationAppToken) {
          const { IntegrationAppClient } = await import('@membranehq/react')
          const integrationApp = new IntegrationAppClient({ token: integrationAppToken })
          await integrationApp.integration(integration.toLowerCase()).openNewConnection()
        }
      }

      const { error } = await supabase.from("integration_connections").upsert(
        {
          user_id: user.id,
          service,
          integration,
          connected: newConnectedState,
        },
        {
          onConflict: "user_id,service,integration",
        },
      )

      if (error) {
        console.error("[v0] Error toggling connection:", error)
      } else {
        setConnected(newConnectedState)
      }
    } catch (error) {
      console.error("[v0] Error in toggleConnection:", error)
    } finally {
      setToggling(false)
    }
  }

  return (
    <div className="p-8 space-y-6">
      {/* Integration Info Card - Compact */}
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 flex-shrink-0">
              <Image src={logoUrl || "/placeholder.svg"} alt={`${integration} logo`} fill className="object-contain" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl">{integration}</CardTitle>
              <CardDescription>
                {disabled ? (
                  <span className="text-muted-foreground">Coming soon - Integration not yet available</span>
                ) : (
                  <>Connect and sync data with {integration} through {service}</>
                )}
              </CardDescription>
            </div>
            <div className="flex-shrink-0">
              {loading ? (
                <Button disabled variant="outline">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </Button>
              ) : (
                <Button onClick={toggleConnection} disabled={toggling || disabled} variant={connected ? "destructive" : "default"}>
                  {toggling ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {connected ? "Disconnecting..." : "Connecting..."}
                    </>
                  ) : disabled ? (
                    "Coming Soon"
                  ) : (
                    <>{connected ? `Disconnect from ${service}` : `Connect via ${service}`}</>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* API Calls Card - Only shown when connected */}
      {connected && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>API Operations</CardTitle>
            <CardDescription>Make API calls to {integration} using the endpoints below</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Placeholder 1 */}
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-lg">API Endpoint 1</CardTitle>
                <CardDescription>Placeholder for API call component</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-32 bg-muted/50 rounded-md">
                  <p className="text-sm text-muted-foreground">API Call Component Placeholder</p>
                </div>
              </CardContent>
            </Card>

            {/* Placeholder 2 */}
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-lg">API Endpoint 2</CardTitle>
                <CardDescription>Placeholder for API call component</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-32 bg-muted/50 rounded-md">
                  <p className="text-sm text-muted-foreground">API Call Component Placeholder</p>
                </div>
              </CardContent>
            </Card>

            {/* Placeholder 3 */}
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-lg">API Endpoint 3</CardTitle>
                <CardDescription>Placeholder for API call component</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-32 bg-muted/50 rounded-md">
                  <p className="text-sm text-muted-foreground">API Call Component Placeholder</p>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
