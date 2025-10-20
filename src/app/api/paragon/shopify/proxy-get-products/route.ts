import { NextResponse } from "next/server"
import { shopifyProxyGetProducts } from "@/lib/paragon-api"

export async function GET() {
  try {
    const data = await shopifyProxyGetProducts()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in Shopify proxy get products:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
