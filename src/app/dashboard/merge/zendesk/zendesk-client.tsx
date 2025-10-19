"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createBrowserClient } from "@supabase/ssr"
import { Loader2 } from "lucide-react"
import { useMergeLink } from "@mergeapi/react-merge-link"
import { JsonViewer } from "@/components/json-viewer"

interface ZendeskClientProps {
  initialLinkToken: string | null
}

export default function ZendeskClient({ initialLinkToken }: ZendeskClientProps) {
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)
  const [linkToken, setLinkToken] = useState<string | undefined>(initialLinkToken || undefined)
  const [apiLoading, setApiLoading] = useState(false)
  const [apiResponse, setApiResponse] = useState<any>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [rawApiLoading, setRawApiLoading] = useState(false)
  const [rawApiResponse, setRawApiResponse] = useState<any>(null)
  const [rawApiError, setRawApiError] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const { open: openLink } = useMergeLink({
    linkToken: linkToken || "",
    onSuccess: async (public_token: string) => {
      console.log("Merge connection successful, public_token:", public_token)

      // Exchange the public token for an account token
      const response = await fetch("/api/merge/exchange-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ public_token }),
      })

      if (!response.ok) {
        console.error("Failed to exchange token")
        setToggling(false)
        return
      }

      const { account_token } = await response.json()
      console.log("Account token received:", account_token ? "present" : "missing")

      // Update connection status after successful connection
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        // Store the account token in the profiles table
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            merge_ticketing_token: account_token,
          })
          .eq("id", user.id)

        if (profileError) {
          console.error("Error storing account token:", profileError)
        } else {
          console.log("Account token stored successfully in profiles")
        }

        // Update connection status
        const { error } = await supabase.from("integration_connections").upsert(
          {
            user_id: user.id,
            service: "Merge",
            integration: "Zendesk",
            connected: true,
          },
          {
            onConflict: "user_id,service,integration",
          },
        )

        if (!error) {
          setConnected(true)
        }
      }
      setToggling(false)
    },
    onExit: () => {
      setLinkToken(undefined)
      setToggling(false)
    },
  })

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
          .eq("service", "Merge")
          .eq("integration", "Zendesk")
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

      if (!connected) {
        // Open Merge Agent Handler Link
        openLink()
      } else {
        // Handle disconnection
        const { error } = await supabase.from("integration_connections").upsert(
          {
            user_id: user.id,
            service: "Merge",
            integration: "Zendesk",
            connected: false,
          },
          {
            onConflict: "user_id,service,integration",
          },
        )

        if (error) {
          console.error("Error disconnecting:", error)
        } else {
          setConnected(false)
        }
        setToggling(false)
      }
    } catch (error) {
      console.error("Error in toggleConnection:", error)
      setToggling(false)
    }
  }

  async function getTickets() {
    setApiLoading(true)
    setApiResponse(null)
    setApiError(null)

    try {
      const response = await fetch("/api/merge/get-tickets", {
        method: "GET",
      })

      const data = await response.json()
      if (!response.ok) {
        setApiError(JSON.stringify(data, null, 2))
      } else {
        setApiResponse(data)
      }
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Unknown error")
    } finally {
      setApiLoading(false)
    }
  }

  async function getTicketsRaw() {
    setRawApiLoading(true)
    setRawApiResponse(null)
    setRawApiError(null)

    try {
      const response = await fetch("/api/merge/get-tickets-raw", {
        method: "GET",
      })

      const data = await response.json()
      if (!response.ok) {
        setRawApiError(JSON.stringify(data, null, 2))
      } else {
        setRawApiResponse(data)
      }
    } catch (error) {
      setRawApiError(error instanceof Error ? error.message : "Unknown error")
    } finally {
      setRawApiLoading(false)
    }
  }

  return (
    <div className="p-8 space-y-6">
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 flex-shrink-0">
              <Image src="/zendesk-logo.svg" alt="Zendesk logo" fill className="object-contain" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl">Zendesk</CardTitle>
              <CardDescription>Connect and sync data with Zendesk through Merge</CardDescription>
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
                    <>{connected ? "Disconnect from Merge" : "Connect via Merge"}</>
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
            <CardDescription>Make API calls to Zendesk using the endpoints below</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Get Tickets</CardTitle>
                <CardDescription>Retrieve tickets from your Zendesk account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={getTickets} disabled={apiLoading}>
                  {apiLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Get Tickets"
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
                <CardTitle className="text-lg">Get Tickets (raw)</CardTitle>
                <CardDescription>Retrieve tickets from your Zendesk account (raw data)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={getTicketsRaw} disabled={rawApiLoading}>
                  {rawApiLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Get Tickets"
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
