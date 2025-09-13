import { type NextRequest, NextResponse } from "next/server"
import { predictWithModel } from "@/lib/automl-backend"

export async function POST(request: NextRequest) {
  try {
    const { modelId, inputData } = await request.json()

    if (!modelId || !inputData) {
      return NextResponse.json({ error: "Missing modelId or inputData" }, { status: 400 })
    }

    const result = await predictWithModel(modelId, inputData)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error making prediction:", error)
    return NextResponse.json({ error: "Failed to make prediction" }, { status: 500 })
  }
}
