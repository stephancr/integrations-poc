import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

const apiKey = process.env.MERGE_API_KEY

async function getMergeRegisteredUserId(userId: string, apiKey: string): Promise<string | null> {
  try {
    const response = await fetch("https://ah-api.merge.dev/api/v1/registered-users", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      console.error("Failed to fetch Merge registered users:", response.statusText)
      return null
    }

    const data = await response.json()

    // Iterate through results to find matching user
    if (data.results && Array.isArray(data.results)) {
      for (const registeredUser of data.results) {
        if (registeredUser.origin_user_id === userId) {
          return registeredUser.id
        }
      }
    }

    // No match found
    return null
  } catch (error) {
    console.error("Error fetching Merge registered users:", error)
    return null
  }
}

async function createMergeRegisteredUser(
  userId: string,
  userEmail: string,
  apiKey: string
): Promise<string | null> {
  try {
    const response = await fetch("https://ah-api.merge.dev/api/v1/registered-users", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        origin_user_id: userId,
        origin_user_name: userEmail,
        shared_credential_group: {
          origin_company_id: "2c9b228f-da0f-46fd-9c7b-f97031ce0985-default",
          origin_company_name: "Meta default",
          custom_groupings: {},
        },
        user_type: "HUMAN",
      }),
    })

    if (!response.ok) {
      console.error("Failed to create Merge registered user:", response.statusText)
      return null
    }

    const data = await response.json()
    return data.id || null
  } catch (error) {
    console.error("Error creating Merge registered user:", error)
    return null
  }
}

async function createMergeLinkToken(mergeUserId: string, apiKey: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://ah-api.merge.dev/api/v1/registered-users/${mergeUserId}/link-token`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          connector: "shopify",
        }),
      }
    )

    if (!response.ok) {
      console.error("Failed to create Merge link token:", response.statusText)
      return null
    }

    const data = await response.json()
    return data.link_token || null
  } catch (error) {
    console.error("Error creating Merge link token:", error)
    return null
  }
}

export default async function MergePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name, merge_user_id")
    .eq("id", user.id)
    .single()

  // Only fetch registered user if merge_user_id is null
  if (apiKey && !profile?.merge_user_id) {
    // Try to get existing registered user ID
    let mergeUserId = await getMergeRegisteredUserId(user.id, apiKey)

    // If no match found, create new registered user and store the ID
    if (!mergeUserId) {
      mergeUserId = await createMergeRegisteredUser(user.id, profile?.email || user.email || "", apiKey)
    }

    // Store the Merge user ID only after creating new user
    if (mergeUserId) {
      // Create link token for the new user
      const linkToken = await createMergeLinkToken(mergeUserId, apiKey)

      await supabase
        .from("profiles")
        .update({
          merge_user_id: mergeUserId,
          merge_link_token: linkToken
        })
        .eq("id", user.id)
    }
  }

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Merge</h1>
        <p className="text-muted-foreground">Select an integration from the sidebar to get started</p>
      </div>
    </div>
  )
}
