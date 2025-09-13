// AutoML Engine - Simulates machine learning model training and evaluation
export interface ModelMetrics {
  accuracy?: number
  rmse?: number
  mae?: number
  r2?: number
  precision?: number
  recall?: number
  f1Score?: number
  confusionMatrix?: number[][]
}

export interface FeatureImportance {
  feature: string
  importance: number
  description: string
}

export interface TrainedModel {
  id: string
  name: string
  algorithm: string
  type: "classification" | "regression"
  targetColumn: string
  features: string[]
  metrics: ModelMetrics
  featureImportances: FeatureImportance[]
  trainingTime: number
  dataSize: number
  crossValidationScore: number
  hyperparameters: Record<string, any>
  modelSummary: string
  createdAt: Date
}

export interface PredictionResult {
  prediction: number | string
  confidence: number
  explanation: string
  featureContributions: { feature: string; contribution: number }[]
}

// Simulate different ML algorithms
const ALGORITHMS = [
  {
    name: "Random Forest",
    type: "ensemble",
    strengths: ["Handles missing values", "Feature importance", "Robust to outliers"],
    complexity: "medium",
  },
  {
    name: "Gradient Boosting",
    type: "ensemble",
    strengths: ["High accuracy", "Handles complex patterns", "Feature selection"],
    complexity: "high",
  },
  {
    name: "Linear Regression",
    type: "linear",
    strengths: ["Interpretable", "Fast training", "Good baseline"],
    complexity: "low",
  },
  {
    name: "Support Vector Machine",
    type: "kernel",
    strengths: ["Works with small datasets", "Effective in high dimensions"],
    complexity: "medium",
  },
  {
    name: "Neural Network",
    type: "deep",
    strengths: ["Captures complex patterns", "Flexible architecture"],
    complexity: "high",
  },
]

// Simulate model training process
export async function trainAutoMLModel(
  data: any[],
  targetColumn: string,
  features: string[],
  problemType: "classification" | "regression",
): Promise<TrainedModel> {
  // Simulate training time
  await new Promise((resolve) => setTimeout(resolve, 2000 + Math.random() * 3000))

  // Analyze data to determine best algorithm
  const dataSize = data.length
  const featureCount = features.length

  // Select best algorithm based on data characteristics
  let bestAlgorithm = ALGORITHMS[0]

  if (dataSize < 1000 && featureCount < 10) {
    bestAlgorithm = ALGORITHMS.find((a) => a.name === "Linear Regression") || ALGORITHMS[0]
  } else if (dataSize > 5000 && featureCount > 20) {
    bestAlgorithm = ALGORITHMS.find((a) => a.name === "Gradient Boosting") || ALGORITHMS[0]
  } else {
    bestAlgorithm = ALGORITHMS.find((a) => a.name === "Random Forest") || ALGORITHMS[0]
  }

  // Calculate realistic metrics based on data quality
  const targetValues = data.map((row) => row[targetColumn]).filter((v) => v !== null && v !== undefined)
  const uniqueTargets = [...new Set(targetValues)].length

  let metrics: ModelMetrics = {}

  if (problemType === "classification") {
    // Classification metrics
    const baseAccuracy = Math.min(0.95, 0.6 + (dataSize / 10000) * 0.2 + Math.random() * 0.15)
    metrics = {
      accuracy: baseAccuracy,
      precision: baseAccuracy - 0.02 + Math.random() * 0.04,
      recall: baseAccuracy - 0.03 + Math.random() * 0.06,
      f1Score: baseAccuracy - 0.01 + Math.random() * 0.02,
      confusionMatrix: generateConfusionMatrix(uniqueTargets, Math.floor(dataSize * 0.2)),
    }
  } else {
    // Regression metrics
    const targetMean = targetValues.reduce((sum, val) => sum + Number(val), 0) / targetValues.length
    const targetStd = Math.sqrt(
      targetValues.reduce((sum, val) => sum + Math.pow(Number(val) - targetMean, 2), 0) / targetValues.length,
    )

    metrics = {
      rmse: targetStd * (0.1 + Math.random() * 0.2),
      mae: targetStd * (0.08 + Math.random() * 0.15),
      r2: Math.min(0.95, 0.5 + (dataSize / 10000) * 0.3 + Math.random() * 0.2),
    }
  }

  // Generate feature importances
  const featureImportances: FeatureImportance[] = features
    .map((feature) => {
      const importance = Math.random()
      return {
        feature,
        importance,
        description: `${feature} contributes ${(importance * 100).toFixed(1)}% to the model's predictions`,
      }
    })
    .sort((a, b) => b.importance - a.importance)

  // Normalize importances to sum to 1
  const totalImportance = featureImportances.reduce((sum, fi) => sum + fi.importance, 0)
  featureImportances.forEach((fi) => (fi.importance = fi.importance / totalImportance))

  const model: TrainedModel = {
    id: `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: `${bestAlgorithm.name} Model`,
    algorithm: bestAlgorithm.name,
    type: problemType,
    targetColumn,
    features,
    metrics,
    featureImportances,
    trainingTime: 2000 + Math.random() * 3000,
    dataSize,
    crossValidationScore: (metrics.accuracy || metrics.r2 || 0.8) - 0.05 + Math.random() * 0.1,
    hyperparameters: generateHyperparameters(bestAlgorithm.name),
    modelSummary: generateModelSummary(bestAlgorithm, problemType, metrics, dataSize),
    createdAt: new Date(),
  }

  return model
}

// Generate confusion matrix for classification
function generateConfusionMatrix(numClasses: number, testSize: number): number[][] {
  const matrix: number[][] = []
  const samplesPerClass = Math.floor(testSize / numClasses)

  for (let i = 0; i < numClasses; i++) {
    matrix[i] = []
    for (let j = 0; j < numClasses; j++) {
      if (i === j) {
        // Diagonal elements (correct predictions)
        matrix[i][j] = Math.floor(samplesPerClass * (0.7 + Math.random() * 0.25))
      } else {
        // Off-diagonal elements (misclassifications)
        matrix[i][j] = Math.floor(samplesPerClass * Math.random() * 0.1)
      }
    }
  }

  return matrix
}

// Generate realistic hyperparameters
function generateHyperparameters(algorithm: string): Record<string, any> {
  switch (algorithm) {
    case "Random Forest":
      return {
        n_estimators: 100 + Math.floor(Math.random() * 400),
        max_depth: 5 + Math.floor(Math.random() * 15),
        min_samples_split: 2 + Math.floor(Math.random() * 8),
        min_samples_leaf: 1 + Math.floor(Math.random() * 4),
      }
    case "Gradient Boosting":
      return {
        n_estimators: 100 + Math.floor(Math.random() * 300),
        learning_rate: 0.01 + Math.random() * 0.19,
        max_depth: 3 + Math.floor(Math.random() * 7),
        subsample: 0.8 + Math.random() * 0.2,
      }
    case "Linear Regression":
      return {
        fit_intercept: true,
        normalize: Math.random() > 0.5,
        alpha: Math.random() * 0.1,
      }
    case "Support Vector Machine":
      return {
        C: Math.pow(10, -2 + Math.random() * 4),
        kernel: ["rbf", "linear", "poly"][Math.floor(Math.random() * 3)],
        gamma: "scale",
      }
    case "Neural Network":
      return {
        hidden_layer_sizes: `(${50 + Math.floor(Math.random() * 150)}, ${25 + Math.floor(Math.random() * 75)})`,
        activation: ["relu", "tanh", "logistic"][Math.floor(Math.random() * 3)],
        learning_rate: 0.001 + Math.random() * 0.009,
        max_iter: 200 + Math.floor(Math.random() * 300),
      }
    default:
      return {}
  }
}

// Generate model summary
function generateModelSummary(algorithm: any, problemType: string, metrics: ModelMetrics, dataSize: number): string {
  const performanceDesc =
    problemType === "classification"
      ? `${((metrics.accuracy || 0) * 100).toFixed(1)}% accuracy`
      : `R² score of ${(metrics.r2 || 0).toFixed(3)}`

  return `This ${algorithm.name} model was trained on ${dataSize} samples for ${problemType}. 
The model achieved ${performanceDesc} with cross-validation. 
${algorithm.name} is particularly effective because it ${algorithm.strengths.join(", ").toLowerCase()}. 
The model complexity is ${algorithm.complexity}, making it ${algorithm.complexity === "low" ? "highly interpretable" : algorithm.complexity === "medium" ? "balanced between performance and interpretability" : "optimized for maximum performance"}.`
}

// Make predictions with the trained model
export async function makePrediction(
  model: TrainedModel,
  inputData: Record<string, number>,
): Promise<PredictionResult> {
  // Simulate prediction time
  await new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 300))

  // Calculate prediction based on feature importances and input values
  let prediction: number | string
  let confidence: number

  if (model.type === "classification") {
    // For classification, return class prediction
    const classes = ["Class A", "Class B", "Class C", "Class D"]
    prediction = classes[Math.floor(Math.random() * Math.min(classes.length, 3))]
    confidence = 0.6 + Math.random() * 0.35
  } else {
    // For regression, calculate weighted prediction
    let weightedSum = 0
    let totalWeight = 0

    model.features.forEach((feature) => {
      const importance = model.featureImportances.find((fi) => fi.feature === feature)?.importance || 0
      const value = inputData[feature] || 0
      weightedSum += value * importance
      totalWeight += importance
    })

    prediction = totalWeight > 0 ? weightedSum / totalWeight : 0
    // Add some realistic variation
    prediction = prediction * (0.8 + Math.random() * 0.4)
    confidence = 0.7 + Math.random() * 0.25
  }

  // Calculate feature contributions
  const featureContributions = model.features
    .map((feature) => {
      const importance = model.featureImportances.find((fi) => fi.feature === feature)?.importance || 0
      const value = inputData[feature] || 0
      return {
        feature,
        contribution: importance * (value / 100), // Normalized contribution
      }
    })
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))

  const explanation =
    model.type === "classification"
      ? `The model predicts "${prediction}" with ${(confidence * 100).toFixed(1)}% confidence. The top contributing features are ${featureContributions
          .slice(0, 3)
          .map((fc) => fc.feature)
          .join(", ")}.`
      : `The model predicts a value of ${typeof prediction === "number" ? prediction.toFixed(2) : prediction} with ${(confidence * 100).toFixed(1)}% confidence. This prediction is primarily influenced by ${featureContributions
          .slice(0, 3)
          .map((fc) => fc.feature)
          .join(", ")}.`

  return {
    prediction,
    confidence,
    explanation,
    featureContributions,
  }
}

// Export model data for download
export function exportModel(model: TrainedModel): string {
  const exportData = {
    model_info: {
      name: model.name,
      algorithm: model.algorithm,
      type: model.type,
      target_column: model.targetColumn,
      features: model.features,
      created_at: model.createdAt.toISOString(),
    },
    performance_metrics: model.metrics,
    feature_importances: model.featureImportances,
    hyperparameters: model.hyperparameters,
    model_summary: model.modelSummary,
    training_info: {
      training_time_ms: model.trainingTime,
      data_size: model.dataSize,
      cross_validation_score: model.crossValidationScore,
    },
  }

  return JSON.stringify(exportData, null, 2)
}

// Determine problem type based on target column
export function determineProblemType(data: any[], targetColumn: string): "classification" | "regression" {
  const targetValues = data.map((row) => row[targetColumn]).filter((v) => v !== null && v !== undefined)
  const uniqueValues = [...new Set(targetValues)]

  // If target has few unique values or contains strings, it's likely classification
  if (uniqueValues.length <= 10 || targetValues.some((v) => typeof v === "string")) {
    return "classification"
  }

  // If target is numeric with many unique values, it's likely regression
  return "regression"
}
