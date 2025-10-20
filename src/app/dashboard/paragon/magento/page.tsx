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

const PARAGON_PROJECT_ID = process.env.NEXT_PUBLIC_PARAGON_PROJECT_ID!

export default function ParagonMagentoPage() {
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)
  const [apiLoading, setApiLoading] = useState(false)
  const [apiResponse, setApiResponse] = useState<any>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [actionKitLoading, setActionKitLoading] = useState(false)
  const [actionKitResponse, setActionKitResponse] = useState<any>(null)
  const [actionKitError, setActionKitError] = useState<string | null>(null)
  const [variantLoading, setVariantLoading] = useState(false)
  const [variantResponse, setVariantResponse] = useState<any>(null)
  const [variantError, setVariantError] = useState<string | null>(null)
  const [sku, setSku] = useState("")

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
          .eq("service", "Paragon")
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
        const { paragon } = await import("@useparagon/connect")
        // Initialize Paragon with the JWT token
        paragon.authenticate(
          PARAGON_PROJECT_ID,
          await getParagonToken()
        )
        // Connect
        paragon.connect("custom.magento", {})
      }

      const { error } = await supabase.from("integration_connections").upsert(
        {
          user_id: user.id,
          service: "Paragon",
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

  async function getParagonToken() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("No user found")
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("paragon_token")
      .eq("id", user.id)
      .single()

    const paragonToken = profile?.paragon_token

    if (!paragonToken) {
      throw new Error("No Paragon token found")
    }

    return paragonToken
  }

  async function proxyGetProducts() {
    setApiLoading(true)
    setApiResponse(null)
    setApiError(null)

    try {
      const response = await fetch("/api/paragon/magento/proxy-get-products")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Unknown error")
      }

      setApiResponse(data)
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Unknown error")
    } finally {
      setApiLoading(false)
    }
  }

  async function workflowGetProducts() {
    setActionKitLoading(true)
    setActionKitResponse(null)
    setActionKitError(null)

    try {
      const response = await fetch("/api/paragon/magento/workflow-get-products", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Unknown error")
      }

      setActionKitResponse(data)
    } catch (error) {
      setActionKitError(error instanceof Error ? error.message : "Unknown error")
    } finally {
      setActionKitLoading(false)
    }
  }

  async function workflowGetProductVariant() {
    setVariantLoading(true)
    setVariantResponse(null)
    setVariantError(null)

    try {
      const response = await fetch("/api/paragon/magento/workflow-get-variants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sku,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Unknown error")
      }

      setVariantResponse(data)
    } catch (error) {
      setVariantError(error instanceof Error ? error.message : "Unknown error")
    } finally {
      setVariantLoading(false)
    }
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
              <CardDescription>Connect and sync data with Magento through Paragon</CardDescription>
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
                    <>{connected ? "Disconnect from Paragon" : "Connect via Paragon"}</>
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
                <CardTitle className="text-lg">Proxy: Get Products</CardTitle>
                <CardDescription>Retrieve products from your Magento store</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={proxyGetProducts} disabled={apiLoading}>
                  {apiLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Proxy: Get Products"
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
                <CardTitle className="text-lg">Workflow: Get Product Variants</CardTitle>
                <CardDescription>Retrieve variants for a specific product</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    type="text"
                    placeholder="Enter product SKU"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                  />
                </div>

                <Button onClick={workflowGetProductVariant} disabled={variantLoading}>
                  {variantLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Workflow: Get Product Variants"
                  )}
                </Button>

                {variantError && (
                  <div className="rounded-md bg-muted p-4">
                    <pre className="text-xs overflow-auto max-h-96">
                      {variantError}
                    </pre>
                  </div>
                )}
                {variantResponse && <JsonViewer data={variantResponse} />}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Workflow: Get Products</CardTitle>
                <CardDescription>Retrieve products</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={workflowGetProducts} disabled={actionKitLoading}>
                  {actionKitLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Workflow: Get Products"
                  )}
                </Button>

                {actionKitError && (
                  <div className="rounded-md bg-muted p-4">
                    <pre className="text-xs overflow-auto max-h-96">
                      {actionKitError}
                    </pre>
                  </div>
                )}
                {actionKitResponse && <JsonViewer data={actionKitResponse} />}
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
