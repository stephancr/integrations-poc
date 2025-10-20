import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { mergeCreateLinkToken } from "@/lib/merge-handler-api"
import ShopifyClient from "./shopify-client"

export default async function MergeShopifyPage() {
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
    .select("merge_handler_id")
    .eq("id", user.id)
    .single()

  const mergeHandlerId = profile?.merge_handler_id

  // Only generate link token if merge_handler_id exists
  if (mergeHandlerId) {
    // Generate fresh link token on server
    linkToken = await mergeCreateLinkToken(mergeHandlerId, "shopify")
  }

  return <ShopifyClient initialLinkToken={linkToken} />
}
