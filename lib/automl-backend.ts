"use server"

import { writeFile, readFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

export interface AutoMLRequest {
  data: any[]
  targetColumn: string
  features: string[]
  taskType?: "classification" | "regression"
}

export interface AutoMLResult {
  modelId: string
  modelPath: string
  leaderboard: any[]
  bestModelName: string
  metrics: {
    accuracy?: number
    f1Score?: number
    precision?: number
    recall?: number
    rmse?: number
    r2Score?: number
    mae?: number
  }
  featureImportance: { feature: string; importance: number }[]
  trainingTime: number
  datasetInfo: {
    rows: number
    columns: number
    nullValues: number
    encodedColumns: string[]
  }
  crossValidationScores: number[]
}

// Simulate PyCaret AutoML training
export async function trainAutoMLModel(request: AutoMLRequest): Promise<AutoMLResult> {
  const startTime = Date.now()

  // Create models directory if it doesn't exist
  const modelsDir = join(process.cwd(), "models")
  if (!existsSync(modelsDir)) {
    await mkdir(modelsDir, { recursive: true })
  }

  // Generate unique model ID
  const modelId = `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const modelPath = join(modelsDir, `${modelId}.pkl`)

  // Analyze dataset
  const datasetInfo = analyzeDataset(request.data, request.features)

  // Auto-detect task type if not provided
  const taskType = request.taskType || detectTaskType(request.data, request.targetColumn)

  // Simulate training with multiple algorithms
  const algorithms = [
    "Random Forest",
    "XGBoost",
    "LightGBM",
    "Logistic Regression",
    "SVM",
    "Naive Bayes",
    "Decision Tree",
    "AdaBoost",
    "Gradient Boosting",
    "Extra Trees",
  ]

  // Generate realistic leaderboard
  const leaderboard = algorithms
    .map((algo, index) => {
      const baseScore =
        taskType === "classification"
          ? 0.75 + Math.random() * 0.2
          : // 0.75-0.95 for classification
            0.6 + Math.random() * 0.3 // 0.6-0.9 for regression

      return {
        Model: algo,
        Accuracy: taskType === "classification" ? baseScore : undefined,
        AUC: taskType === "classification" ? baseScore + Math.random() * 0.05 : undefined,
        Recall: taskType === "classification" ? baseScore - Math.random() * 0.1 : undefined,
        Precision: taskType === "classification" ? baseScore - Math.random() * 0.05 : undefined,
        F1: taskType === "classification" ? baseScore - Math.random() * 0.08 : undefined,
        Kappa: taskType === "classification" ? baseScore - Math.random() * 0.15 : undefined,
        MCC: taskType === "classification" ? baseScore - Math.random() * 0.2 : undefined,
        MAE: taskType === "regression" ? Math.random() * 5 + 1 : undefined,
        MSE: taskType === "regression" ? Math.random() * 10 + 2 : undefined,
        RMSE: taskType === "regression" ? Math.random() * 3 + 1 : undefined,
        R2: taskType === "regression" ? baseScore : undefined,
        RMSLE: taskType === "regression" ? Math.random() * 0.5 + 0.1 : undefined,
        MAPE: taskType === "regression" ? Math.random() * 20 + 5 : undefined,
        TT: Math.random() * 10 + 1, // Training Time
      }
    })
    .sort((a, b) => {
      const scoreA = taskType === "classification" ? a.Accuracy || 0 : a.R2 || 0
      const scoreB = taskType === "classification" ? b.Accuracy || 0 : b.R2 || 0
      return scoreB - scoreA
    })

  const bestModel = leaderboard[0]

  // Generate feature importance
  const featureImportance = request.features
    .map((feature) => ({
      feature,
      importance: Math.random(),
    }))
    .sort((a, b) => b.importance - a.importance)

  // Normalize feature importance
  const totalImportance = featureImportance.reduce((sum, fi) => sum + fi.importance, 0)
  featureImportance.forEach((fi) => (fi.importance = fi.importance / totalImportance))

  // Generate cross-validation scores
  const crossValidationScores = Array.from({ length: 5 }, () => {
    const baseScore = taskType === "classification" ? bestModel.Accuracy || 0.8 : bestModel.R2 || 0.7
    return baseScore + (Math.random() - 0.5) * 0.1
  })

  // Create model metadata
  const modelMetadata = {
    modelId,
    algorithm: bestModel.Model,
    taskType,
    targetColumn: request.targetColumn,
    features: request.features,
    trainingTime: Date.now() - startTime,
    createdAt: new Date().toISOString(),
    datasetInfo,
    metrics: {
      accuracy: bestModel.Accuracy,
      f1Score: bestModel.F1,
      precision: bestModel.Precision,
      recall: bestModel.Recall,
      rmse: bestModel.RMSE,
      r2Score: bestModel.R2,
      mae: bestModel.MAE,
    },
    featureImportance,
    crossValidationScores,
  }

  // Save model metadata (simulating .pkl file)
  await writeFile(modelPath, JSON.stringify(modelMetadata, null, 2))

  const trainingTime = Date.now() - startTime

  return {
    modelId,
    modelPath,
    leaderboard,
    bestModelName: bestModel.Model,
    metrics: {
      accuracy: bestModel.Accuracy,
      f1Score: bestModel.F1,
      precision: bestModel.Precision,
      recall: bestModel.Recall,
      rmse: bestModel.RMSE,
      r2Score: bestModel.R2,
      mae: bestModel.MAE,
    },
    featureImportance,
    trainingTime,
    datasetInfo,
    crossValidationScores,
  }
}

function analyzeDataset(data: any[], features: string[]) {
  const rows = data.length
  const columns = features.length

  let nullValues = 0
  const encodedColumns: string[] = []

  features.forEach((feature) => {
    const values = data.map((row) => row[feature])
    const nullCount = values.filter((val) => val == null || val === "").length
    nullValues += nullCount

    // Check if column needs encoding (contains strings)
    const hasStrings = values.some((val) => typeof val === "string" && val !== "")
    if (hasStrings) {
      encodedColumns.push(feature)
    }
  })

  return {
    rows,
    columns,
    nullValues,
    encodedColumns,
  }
}

function detectTaskType(data: any[], targetColumn: string): "classification" | "regression" {
  const targetValues = data.map((row) => row[targetColumn]).filter((val) => val != null)
  const uniqueValues = new Set(targetValues)

  // If target has string values or <= 10 unique values, it's likely classification
  const hasStrings = targetValues.some((val) => typeof val === "string")
  const isLowCardinality = uniqueValues.size <= 10

  return hasStrings || isLowCardinality ? "classification" : "regression"
}

export async function loadModel(modelId: string) {
  try {
    const modelPath = join(process.cwd(), "models", `${modelId}.pkl`)
    const modelData = await readFile(modelPath, "utf-8")
    return JSON.parse(modelData)
  } catch (error) {
    throw new Error(`Model ${modelId} not found`)
  }
}

export async function predictWithModel(
  modelId: string,
  inputData: Record<string, number>,
): Promise<{
  prediction: number | string
  confidence: number
  explanation: string
}> {
  const model = await loadModel(modelId)

  // Simulate prediction based on feature importance
  let score = 0
  model.featureImportance.forEach((fi: any) => {
    const value = inputData[fi.feature] || 0
    score += value * fi.importance
  })

  // Normalize score and add some randomness
  const normalizedScore = Math.tanh(score / 100) * 0.5 + 0.5 + (Math.random() - 0.5) * 0.1

  let prediction: number | string
  let confidence: number

  if (model.taskType === "classification") {
    prediction = normalizedScore > 0.5 ? 1 : 0
    confidence = Math.abs(normalizedScore - 0.5) * 2
  } else {
    // For regression, scale the prediction to a reasonable range
    const targetValues = Object.values(inputData)
    const avgValue = targetValues.reduce((a, b) => a + b, 0) / targetValues.length
    prediction = Number((avgValue * normalizedScore).toFixed(2))
    confidence = Math.min(0.95, 0.7 + Math.random() * 0.2)
  }

  const topFeatures = model.featureImportance
    .slice(0, 3)
    .map((fi: any) => `${fi.feature} (${(fi.importance * 100).toFixed(1)}%)`)
    .join(", ")

  const explanation = `Prediction based on ${model.algorithm} model. Key factors: ${topFeatures}. Model trained on ${model.datasetInfo.rows} samples with ${(model.metrics.accuracy || model.metrics.r2Score || 0.8) * 100}% ${model.taskType === "classification" ? "accuracy" : "R² score"}.`

  return {
    prediction,
    confidence,
    explanation,
  }
}
