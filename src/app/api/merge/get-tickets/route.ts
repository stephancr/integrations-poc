import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getTickets } from "@/lib/merge-unified-api"

export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get the account token from the user's profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("merge_ticketing_token")
      .eq("id", user.id)
      .single()

    const accountToken = profile?.merge_ticketing_token
    if (!accountToken) {
      return NextResponse.json(
        { error: "No Merge account token found" },
        { status: 400 }
      )
    }

    // Call Merge API via unified API function
    const data = await getTickets(accountToken)
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in get-tickets API:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
