import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createMergeLinkToken } from "@/lib/merge-unified-api"
import ZendeskClient from "./zendesk-client"

export default async function MergeZendeskPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  let linkToken: string | null = null

  // Fetch user's merge_handler_id from profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, merge_ticketing_token")
    .eq("id", user.id)
    .single()

  // Generate fresh link token on server
  linkToken = await createMergeLinkToken(
    user.id,
    profile?.email,
    ["ticketing"],
    "zendesk")

  return <ZendeskClient initialLinkToken={linkToken} />
}
