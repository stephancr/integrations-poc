import { NextResponse } from "next/server"
import { magentoGetProducts } from "@/lib/integration-app-api"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { cursor } = body

    const data = await magentoGetProducts(cursor)
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in Integration App Magento get products:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
