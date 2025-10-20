import { NextResponse } from "next/server"
import { magentoGetProductsRaw } from "@/lib/integration-app-api"

export async function POST() {
  try {
    const data = await magentoGetProductsRaw()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in Integration App Magento get products raw:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
