"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle } from "lucide-react"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface ProfileFormProps {
  user: SupabaseUser
  profile: {
    id: string
    email: string
    full_name: string | null
    paragon_token: string | null
    integration_app_token: string | null
    merge_user_id: string | null
    merge_link_token: string | null
  } | null
}

export function ProfileForm({ user, profile }: ProfileFormProps) {
  const router = useRouter()
  const [fullName, setFullName] = useState(profile?.full_name || "")
  const [paragonToken, setParagonToken] = useState(profile?.paragon_token || "")
  const [integrationAppToken, setIntegrationAppToken] = useState(profile?.integration_app_token || "")
  const [mergeUserId, setMergeUserId] = useState(profile?.merge_user_id || "")
  const [mergeLinkToken, setMergeLinkToken] = useState(profile?.merge_link_token || "")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    const supabase = createClient()

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          paragon_token: paragonToken,
          integration_app_token: integrationAppToken,
          merge_user_id: mergeUserId,
          merge_link_token: mergeLinkToken,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id)

      if (error) throw error

      setMessage({ type: "success", text: "Profile updated successfully!" })
      router.refresh()
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to update profile",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>Update your personal details here</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={profile?.email || user.email || ""} disabled />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="full-name">Full Name</Label>
            <Input
              id="full-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paragon-token">Paragon Token</Label>
            <Input
              id="paragon-token"
              type="text"
              value={paragonToken}
              onChange={(e) => setParagonToken(e.target.value)}
              placeholder="Enter your Paragon token"
            />
            <p className="text-xs text-muted-foreground">Token for Paragon integration authentication</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="integration-app-token">Integration App Token</Label>
            <Input
              id="integration-app-token"
              type="text"
              value={integrationAppToken}
              onChange={(e) => setIntegrationAppToken(e.target.value)}
              placeholder="Enter your Integration App token"
            />
            <p className="text-xs text-muted-foreground">Token for Integration App authentication</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="merge-user-id">Merge User ID</Label>
            <Input
              id="merge-user-id"
              type="text"
              value={mergeUserId}
              onChange={(e) => setMergeUserId(e.target.value)}
              placeholder="Enter your Merge user ID"
            />
            <p className="text-xs text-muted-foreground">User ID for Merge integration</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="merge-link-token">Merge Link Token</Label>
            <Input
              id="merge-link-token"
              type="text"
              value={mergeLinkToken}
              onChange={(e) => setMergeLinkToken(e.target.value)}
              placeholder="Enter your Merge link token"
            />
            <p className="text-xs text-muted-foreground">Link token for Merge integration authentication</p>
          </div>

          {message && (
            <Alert variant={message.type === "error" ? "destructive" : "default"}>
              {message.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
