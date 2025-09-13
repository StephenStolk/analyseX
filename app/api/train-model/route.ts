import { type NextRequest, NextResponse } from "next/server"
import { trainAutoMLModel, type AutoMLRequest } from "@/lib/automl-backend"

export async function POST(request: NextRequest) {
  try {
    const body: AutoMLRequest = await request.json()

    // Validate request
    if (!body.data || !body.targetColumn || !body.features) {
      return NextResponse.json({ error: "Missing required fields: data, targetColumn, features" }, { status: 400 })
    }

    if (body.data.length === 0) {
      return NextResponse.json({ error: "Dataset is empty" }, { status: 400 })
    }

    if (body.features.length === 0) {
      return NextResponse.json({ error: "No features selected" }, { status: 400 })
    }

    // Train the model
    const result = await trainAutoMLModel(body)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error training model:", error)
    return NextResponse.json({ error: "Failed to train model" }, { status: 500 })
  }
}
