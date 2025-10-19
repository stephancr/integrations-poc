import { NextRequest, NextResponse } from "next/server"
import { exchangeMergeAccountToken } from "@/lib/merge-unified-api"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
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

    const { public_token } = await request.json()
    if (!public_token) {
      return NextResponse.json(
        { error: "public_token is required" },
        { status: 400 }
      )
    }

    // Exchanging public token for account token...
    const account_token = await exchangeMergeAccountToken(public_token)
    if (!account_token) {
      return NextResponse.json(
        { error: "Failed to exchange token" },
        { status: 500 }
      )
    }

    return NextResponse.json({ account_token })
  } catch (error) {
    console.error("Error in exchange-token API:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
