import { NextResponse } from "next/server"
import { magentoProxyGetProducts } from "@/lib/paragon-api"

export async function GET() {
  try {
    const data = await magentoProxyGetProducts()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in Magento proxy get products:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
