import { NextResponse } from "next/server"
import { shopifyGetProductsRaw } from "@/lib/integration-app-api"

export async function POST() {
  try {
    const data = await shopifyGetProductsRaw()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in Integration App Shopify get products raw:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
