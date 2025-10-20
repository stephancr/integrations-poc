import { NextResponse } from "next/server"
import { shopifyActionKitGetProducts } from "@/lib/paragon-api"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { productIds } = body

    const data = await shopifyActionKitGetProducts(productIds)
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in Shopify ActionKit get products:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
