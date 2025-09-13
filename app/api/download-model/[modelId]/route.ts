import { type NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { join } from "path"

export async function GET(request: NextRequest, { params }: { params: { modelId: string } }) {
  try {
    const { modelId } = params

    const modelPath = join(process.cwd(), "models", `${modelId}.pkl`)
    const modelData = await readFile(modelPath)

    return new NextResponse(modelData, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${modelId}.pkl"`,
      },
    })
  } catch (error) {
    console.error("Error downloading model:", error)
    return NextResponse.json({ error: "Model not found" }, { status: 404 })
  }
}
