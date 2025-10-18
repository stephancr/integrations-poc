import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import {
  getMergeRegisteredUserId,
  createMergeRegisteredUser,
} from "@/lib/merge-handler-api"

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
    .select("email, full_name, merge_handler_id")
    .eq("id", user.id)
    .single()

  // Only fetch registered user if merge_handler_id is null
  if (!profile?.merge_handler_id) {
    // Try to get existing registered user ID
    let mergeHandlerId = await getMergeRegisteredUserId(user.id)

    // If no match found, create new registered user and store the ID
    if (!mergeHandlerId) {
      mergeHandlerId = await createMergeRegisteredUser(user.id, profile?.email || user.email || "")
    }

    // Store the Merge Handler ID only after creating new user
    if (mergeHandlerId) {
      await supabase
        .from("profiles")
        .update({
          merge_handler_id: mergeHandlerId
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
