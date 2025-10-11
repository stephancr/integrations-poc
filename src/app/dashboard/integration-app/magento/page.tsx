"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createBrowserClient } from "@supabase/ssr"
import { Loader2 } from "lucide-react"
import { JsonViewer } from "@/components/json-viewer"

export default function IntegrationAppMagentoPage() {
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)
  const [apiLoading, setApiLoading] = useState(false)
  const [apiResponse, setApiResponse] = useState<any>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [cursor, setCursor] = useState("")
  const [rawApiLoading, setRawApiLoading] = useState(false)
  const [rawApiResponse, setRawApiResponse] = useState<any>(null)
  const [rawApiError, setRawApiError] = useState<string | null>(null)

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
          .eq("service", "Integration App")
          .eq("integration", "Magento")
          .single()

        if (error && error.code !== "PGRST116") {
          console.error("Error fetching connection status:", error)
        }

        setConnected(data?.connected || false)
      } catch (error) {
        console.error("Error in fetchConnectionStatus:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchConnectionStatus()
  }, [supabase])

  async function toggleConnection() {
    setToggling(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        console.error("No user found")
        setToggling(false)
        return
      }

      const newConnectedState = !connected

      if (!connected) {
        // Get the Integration App token from the user's profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("integration_app_token")
          .eq("id", user.id)
          .single()

        const integrationAppToken = profile?.integration_app_token

        if (integrationAppToken) {
          const { IntegrationAppClient } = await import("@membranehq/react")
          const integrationApp = new IntegrationAppClient({ token: integrationAppToken })
          await integrationApp.integration("adobe-commerce").openNewConnection()
        }
      }

      const { error } = await supabase.from("integration_connections").upsert(
        {
          user_id: user.id,
          service: "Integration App",
          integration: "Magento",
          connected: newConnectedState,
        },
        {
          onConflict: "user_id,service,integration",
        },
      )

      if (error) {
        console.error("Error toggling connection:", error)
      } else {
        setConnected(newConnectedState)
      }
    } catch (error) {
      console.error("Error in toggleConnection:", error)
    } finally {
      setToggling(false)
    }
  }

  async function getIntegrationAppToken(): Promise<string | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return null
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("integration_app_token")
      .eq("id", user.id)
      .single()

    return profile?.integration_app_token || null
  }

  async function makeApiRequest(
    url: string,
    body: any,
    setLoading: (loading: boolean) => void,
    setResponse: (response: any) => void,
    setError: (error: string | null) => void
  ) {
    setLoading(true)
    setResponse(null)
    setError(null)

    try {
      const integrationAppToken = await getIntegrationAppToken()

      if (!integrationAppToken) {
        setError("No Integration App token found")
        setLoading(false)
        return
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${integrationAppToken}`,
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      })

      const data = await response.json()

      if (!response.ok) {
        setError(JSON.stringify(data, null, 2))
      } else {
        setResponse(data)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  async function getProducts() {
    await makeApiRequest(
      "https://api.integration.app/connections/adobe-commerce/actions/get-products/run",
      { cursor: cursor || undefined },
      setApiLoading,
      setApiResponse,
      setApiError
    )
  }

  async function getProductsRaw() {
    await makeApiRequest(
      "https://api.integration.app/data-source-instances/68e6c7ba8b353b15c50e30c0/collection/list",
      null,
      setRawApiLoading,
      setRawApiResponse,
      setRawApiError
    )
  }

  return (
    <div className="p-8 space-y-6">
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 flex-shrink-0">
              <Image src="/magento-logo.svg" alt="Magento logo" fill className="object-contain" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl">Magento</CardTitle>
              <CardDescription>Connect and sync data with Magento through Integration App</CardDescription>
            </div>
            <div className="flex-shrink-0">
              {loading ? (
                <Button disabled variant="outline">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </Button>
              ) : (
                <Button onClick={toggleConnection} disabled={toggling} variant={connected ? "destructive" : "default"}>
                  {toggling ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {connected ? "Disconnecting..." : "Connecting..."}
                    </>
                  ) : (
                    <>{connected ? "Disconnect from Integration App" : "Connect via Integration App"}</>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {connected && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>API Operations</CardTitle>
            <CardDescription>Make API calls to Magento using the endpoints below</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Get Products</CardTitle>
                <CardDescription>Retrieve products from your Magento store</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cursor">Cursor (Optional)</Label>
                  <Input
                    id="cursor"
                    type="text"
                    placeholder="Enter cursor value"
                    value={cursor}
                    onChange={(e) => setCursor(e.target.value)}
                  />
                </div>

                <Button onClick={getProducts} disabled={apiLoading}>
                  {apiLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Get Products"
                  )}
                </Button>

                {apiError && (
                  <div className="rounded-md bg-muted p-4">
                    <pre className="text-xs overflow-auto max-h-96">
                      {apiError}
                    </pre>
                  </div>
                )}
                {apiResponse && <JsonViewer data={apiResponse} />}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Get Products (raw)</CardTitle>
                <CardDescription>Retrieve products from your Magento store (raw data)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={getProductsRaw} disabled={rawApiLoading}>
                  {rawApiLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Get Products"
                  )}
                </Button>

                {rawApiError && (
                  <div className="rounded-md bg-muted p-4">
                    <pre className="text-xs overflow-auto max-h-96">
                      {rawApiError}
                    </pre>
                  </div>
                )}
                {rawApiResponse && <JsonViewer data={rawApiResponse} />}
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
