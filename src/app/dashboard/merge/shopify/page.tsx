"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createBrowserClient } from "@supabase/ssr"
import { Loader2 } from "lucide-react"
import { useAgentHandlerLink } from "@mergeapi/react-agent-handler-link"

export default function MergeShopifyPage() {
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)
  const [linkToken, setLinkToken] = useState<string | undefined>(undefined)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const { open: openLink } = useAgentHandlerLink({
    linkToken: linkToken || "",
    onSuccess: async () => {
      // Update connection status after successful connection
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { error } = await supabase.from("integration_connections").upsert(
          {
            user_id: user.id,
            service: "Merge",
            integration: "Shopify",
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
          .eq("integration", "Shopify")
          .single()

        if (error && error.code !== "PGRST116") {
          console.error("Error fetching connection status:", error)
        }

        setConnected(data?.connected || false)

        // Fetch merge link token
        const { data: profile } = await supabase
          .from("profiles")
          .select("merge_link_token")
          .eq("id", user.id)
          .single()

        if (profile?.merge_link_token) {
          setLinkToken(profile.merge_link_token)
        }
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
            integration: "Shopify",
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
              <CardDescription>Connect and sync data with Shopify through Merge</CardDescription>
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
    </div>
  )
}
