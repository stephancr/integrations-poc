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

const PARAGON_PROJECT_ID = process.env.NEXT_PUBLIC_PARAGON_PROJECT_ID

export default function ParagonShopifyPage() {
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)
  const [apiLoading, setApiLoading] = useState(false)
  const [apiResponse, setApiResponse] = useState<any>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [actionKitLoading, setActionKitLoading] = useState(false)
  const [actionKitResponse, setActionKitResponse] = useState<any>(null)
  const [actionKitError, setActionKitError] = useState<string | null>(null)
  const [productIds, setProductIds] = useState("")

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
          .eq("integration", "Shopify")
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
        paragon.connect("shopify")
      }

      const { error } = await supabase.from("integration_connections").upsert(
        {
          user_id: user.id,
          service: "Paragon",
          integration: "Shopify",
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

  async function makeParagonRequest(
    url: string,
    options?: RequestInit
  ): Promise<any> {
    const paragonToken = await getParagonToken()

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${paragonToken}`,
        "Content-Type": "application/json",
        ...options?.headers,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(JSON.stringify(data, null, 2))
    }

    return data
  }

  async function proxyGetProducts() {
    setApiLoading(true)
    setApiResponse(null)
    setApiError(null)

    try {
      const data = await makeParagonRequest(
        `https://proxy.useparagon.com/projects/${PARAGON_PROJECT_ID}/sdk/proxy/shopify/admin/api/2025-10/products.json`
      )
      setApiResponse(data)
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Unknown error")
    } finally {
      setApiLoading(false)
    }
  }

  async function actionKitGetProducts() {
    setActionKitLoading(true)
    setActionKitResponse(null)
    setActionKitError(null)

    try {
      const data = await makeParagonRequest(
        `https://actionkit.useparagon.com/projects/${PARAGON_PROJECT_ID}/actions/#SHOPIFY_GET_PRODUCTS`,
        {
          method: "POST",
          body: JSON.stringify({
            action: "SHOPIFY_GET_PRODUCTS",
            parameters: {
              productIds: productIds,
            },
          }),
        }
      )
      setActionKitResponse(data)
    } catch (error) {
      setActionKitError(error instanceof Error ? error.message : "Unknown error")
    } finally {
      setActionKitLoading(false)
    }
  }

  return (
    <div className="p-8 space-y-6">
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 flex-shrink-0">
              <Image src="/shopify-logo.svg" alt="Shopify logo" fill className="object-contain" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl">Shopify</CardTitle>
              <CardDescription>Connect and sync data with Shopify through Paragon</CardDescription>
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
            <CardDescription>Make API calls to Shopify using the endpoints below</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Proxy: Get Products</CardTitle>
                <CardDescription>Retrieve products from your Shopify store</CardDescription>
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
                <CardTitle className="text-lg">ActionKit: Get Products</CardTitle>
                <CardDescription>Retrieve specific products by their IDs using ActionKit</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="productIds">Product IDs</Label>
                  <Input
                    id="productIds"
                    type="text"
                    placeholder="Enter product IDs"
                    value={productIds}
                    onChange={(e) => setProductIds(e.target.value)}
                  />
                </div>

                <Button onClick={actionKitGetProducts} disabled={actionKitLoading}>
                  {actionKitLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "ActionKit: Get Products"
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
