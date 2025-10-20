import { NextResponse } from "next/server"
import { magentoWorkflowGetProducts } from "@/lib/paragon-api"

export async function POST() {
  try {
    const data = await magentoWorkflowGetProducts()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in Magento workflow get products:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
