import { NextResponse } from "next/server"
import { magentoWorkflowGetVariants } from "@/lib/paragon-api"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { sku } = body

    const data = await magentoWorkflowGetVariants(sku)
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in Magento workflow get product variants:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
