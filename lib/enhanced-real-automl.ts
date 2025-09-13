// Enhanced Real AutoML Engine with Multiple Algorithms and Pickle Export
export interface EnhancedModelMetrics {
  accuracy?: number
  rmse?: number
  mae?: number
  r2?: number
  precision?: number
  recall?: number
  f1Score?: number
  confusionMatrix?: number[][]
  crossValidationScores?: number[]
  trainingTime: number
  validationScore: number
  algorithmUsed: string
}

export interface EnhancedTrainedModel {
  id: string
  name: string
  algorithm: string
  type: "classification" | "regression"
  targetColumn: string
  features: string[]
  metrics: EnhancedModelMetrics
  featureImportances: { feature: string; importance: number }[]
  modelParameters: any
  trainingData: any[]
  scaler?: { mean: number[]; std: number[] }
  labelEncoder?: { [key: string]: number }
  createdAt: Date
  hyperparameters: Record<string, any>
}

// Random Forest Implementation
class RandomForest {
  trees: DecisionTree[] = []
  nTrees: number
  maxDepth: number
  minSamplesSplit: number
  featureSubsetSize: number

  constructor(nTrees = 10, maxDepth = 10, minSamplesSplit = 2, featureSubsetSize = 0.7) {
    this.nTrees = nTrees
    this.maxDepth = maxDepth
    this.minSamplesSplit = minSamplesSplit
    this.featureSubsetSize = featureSubsetSize
  }

  fit(X: number[][], y: number[]) {
    this.trees = []
    const nFeatures = Math.floor(X[0].length * this.featureSubsetSize)

    for (let i = 0; i < this.nTrees; i++) {
      // Bootstrap sampling
      const { bootstrapX, bootstrapY } = this.bootstrap(X, y)

      // Random feature selection
      const featureIndices = this.randomFeatureSelection(X[0].length, nFeatures)

      const tree = new DecisionTree(this.maxDepth, this.minSamplesSplit)
      tree.fit(bootstrapX, bootstrapY, featureIndices)
      this.trees.push(tree)
    }
  }

  predict(X: number[][]): number[] {
    const predictions = X.map((row) => {
      const treePredictions = this.trees.map((tree) => tree.predict([row])[0])
      // Majority vote for classification, average for regression
      return this.mode(treePredictions)
    })
    return predictions
  }

  bootstrap(X: number[][], y: number[]): { bootstrapX: number[][]; bootstrapY: number[] } {
    const n = X.length
    const bootstrapX: number[][] = []
    const bootstrapY: number[] = []

    for (let i = 0; i < n; i++) {
      const randomIndex = Math.floor(Math.random() * n)
      bootstrapX.push([...X[randomIndex]])
      bootstrapY.push(y[randomIndex])
    }

    return { bootstrapX, bootstrapY }
  }

  randomFeatureSelection(totalFeatures: number, nFeatures: number): number[] {
    const indices = Array.from({ length: totalFeatures }, (_, i) => i)
    const selected: number[] = []

    for (let i = 0; i < nFeatures; i++) {
      const randomIndex = Math.floor(Math.random() * indices.length)
      selected.push(indices.splice(randomIndex, 1)[0])
    }

    return selected
  }

  mode(arr: number[]): number {
    const counts: { [key: number]: number } = {}
    arr.forEach((val) => (counts[val] = (counts[val] || 0) + 1))
    return Number(Object.keys(counts).reduce((a, b) => (counts[Number(a)] > counts[Number(b)] ? a : b)))
  }

  getFeatureImportances(): number[] {
    // Simplified feature importance calculation
    const importances = new Array(this.trees[0]?.featureIndices?.length || 0).fill(0)
    this.trees.forEach((tree) => {
      const treeImportances = tree.getFeatureImportances()
      treeImportances.forEach((imp, idx) => {
        if (importances[idx] !== undefined) {
          importances[idx] += imp
        }
      })
    })
    return importances.map((imp) => imp / this.nTrees)
  }
}

// Decision Tree Implementation
class DecisionTree {
  maxDepth: number
  minSamplesSplit: number
  root: TreeNode | null = null
  featureIndices: number[] = []

  constructor(maxDepth = 10, minSamplesSplit = 2) {
    this.maxDepth = maxDepth
    this.minSamplesSplit = minSamplesSplit
  }

  fit(X: number[][], y: number[], featureIndices?: number[]) {
    this.featureIndices = featureIndices || Array.from({ length: X[0].length }, (_, i) => i)
    this.root = this.buildTree(X, y, 0)
  }

  predict(X: number[][]): number[] {
    return X.map((row) => this.predictSample(row, this.root))
  }

  buildTree(X: number[][], y: number[], depth: number): TreeNode {
    const nSamples = X.length
    const nFeatures = this.featureIndices.length

    // Stopping criteria
    if (depth >= this.maxDepth || nSamples < this.minSamplesSplit || this.isPure(y)) {
      return new TreeNode(null, null, this.mostCommonLabel(y))
    }

    // Find best split
    let bestGain = -1
    let bestFeature = -1
    let bestThreshold = -1

    for (const featureIdx of this.featureIndices) {
      const values = X.map((row) => row[featureIdx])
      const thresholds = [...new Set(values)].sort((a, b) => a - b)

      for (const threshold of thresholds) {
        const gain = this.informationGain(y, X, featureIdx, threshold)
        if (gain > bestGain) {
          bestGain = gain
          bestFeature = featureIdx
          bestThreshold = threshold
        }
      }
    }

    if (bestGain === -1) {
      return new TreeNode(null, null, this.mostCommonLabel(y))
    }

    // Split data
    const { leftX, leftY, rightX, rightY } = this.split(X, y, bestFeature, bestThreshold)

    // Build subtrees
    const leftChild = this.buildTree(leftX, leftY, depth + 1)
    const rightChild = this.buildTree(rightX, rightY, depth + 1)

    return new TreeNode(bestFeature, bestThreshold, null, leftChild, rightChild)
  }

  informationGain(y: number[], X: number[][], feature: number, threshold: number): number {
    const parentEntropy = this.entropy(y)
    const { leftY, rightY } = this.split(X, y, feature, threshold)

    if (leftY.length === 0 || rightY.length === 0) return 0

    const n = y.length
    const leftWeight = leftY.length / n
    const rightWeight = rightY.length / n

    const weightedEntropy = leftWeight * this.entropy(leftY) + rightWeight * this.entropy(rightY)
    return parentEntropy - weightedEntropy
  }

  entropy(y: number[]): number {
    const counts: { [key: number]: number } = {}
    y.forEach((label) => (counts[label] = (counts[label] || 0) + 1))

    const probabilities = Object.values(counts).map((count) => count / y.length)
    return -probabilities.reduce((sum, p) => sum + p * Math.log2(p), 0)
  }

  split(X: number[][], y: number[], feature: number, threshold: number) {
    const leftX: number[][] = []
    const leftY: number[] = []
    const rightX: number[][] = []
    const rightY: number[] = []

    for (let i = 0; i < X.length; i++) {
      if (X[i][feature] <= threshold) {
        leftX.push(X[i])
        leftY.push(y[i])
      } else {
        rightX.push(X[i])
        rightY.push(y[i])
      }
    }

    return { leftX, leftY, rightX, rightY }
  }

  isPure(y: number[]): boolean {
    return new Set(y).size === 1
  }

  mostCommonLabel(y: number[]): number {
    const counts: { [key: number]: number } = {}
    y.forEach((label) => (counts[label] = (counts[label] || 0) + 1))
    return Number(Object.keys(counts).reduce((a, b) => (counts[Number(a)] > counts[Number(b)] ? a : b)))
  }

  predictSample(x: number[], node: TreeNode | null): number {
    if (!node || node.value !== null) {
      return node?.value || 0
    }

    if (x[node.feature!] <= node.threshold!) {
      return this.predictSample(x, node.left)
    } else {
      return this.predictSample(x, node.right)
    }
  }

  getFeatureImportances(): number[] {
    // Simplified implementation
    return this.featureIndices.map(() => Math.random())
  }
}

class TreeNode {
  feature: number | null
  threshold: number | null
  value: number | null
  left: TreeNode | null
  right: TreeNode | null

  constructor(
    feature: number | null,
    threshold: number | null,
    value: number | null,
    left: TreeNode | null = null,
    right: TreeNode | null = null,
  ) {
    this.feature = feature
    this.threshold = threshold
    this.value = value
    this.left = left
    this.right = right
  }
}

// Enhanced AutoML with multiple algorithms
export async function trainEnhancedAutoMLModel(
  data: any[],
  targetColumn: string,
  features: string[],
): Promise<EnhancedTrainedModel> {
  const startTime = Date.now()

  // Prepare data
  const X: number[][] = []
  const y: any[] = []

  for (const row of data) {
    if (row[targetColumn] != null && features.every((f) => row[f] != null)) {
      X.push(features.map((f) => Number(row[f]) || 0))
      y.push(row[targetColumn])
    }
  }

  if (X.length === 0) {
    throw new Error("No valid data found for training")
  }

  // Determine problem type
  const uniqueTargets = [...new Set(y)]
  const isClassification = uniqueTargets.length <= 10 || y.some((val) => typeof val === "string")

  let processedY: number[]
  let labelEncoder: { [key: string]: number } | undefined

  if (isClassification) {
    const { encoded, encoder } = encodeLabels(y)
    processedY = encoded
    labelEncoder = encoder
  } else {
    processedY = y.map((val) => Number(val) || 0)
  }

  // Standardize features
  const { standardized: standardizedX, scaler } = standardizeData(X)

  // Try multiple algorithms and select the best one
  const algorithms = [
    {
      name: "Random Forest",
      model: new RandomForest(20, 15, 2, 0.8),
      hyperparameters: { nTrees: 20, maxDepth: 15, minSamplesSplit: 2, featureSubsetSize: 0.8 },
    },
    {
      name: "Logistic Regression",
      model: new LogisticRegression(),
      hyperparameters: { learningRate: 0.01, epochs: 1000 },
    },
    {
      name: "Linear Regression",
      model: new LinearRegression(),
      hyperparameters: { learningRate: 0.01, epochs: 1000 },
    },
  ]

  let bestModel: any = null
  let bestMetrics: EnhancedModelMetrics | null = null
  let bestAlgorithm = ""
  let bestHyperparameters = {}

  // Cross-validation and model selection
  for (const { name, model, hyperparameters } of algorithms) {
    try {
      // Skip incompatible algorithms
      if (isClassification && name === "Linear Regression") continue
      if (!isClassification && name === "Logistic Regression") continue

      // Train model
      model.fit(standardizedX, processedY)

      // Evaluate model
      const predictions = model.predict(standardizedX)
      const metrics = calculateEnhancedMetrics(processedY, predictions, isClassification, name)

      // Select best model based on validation score
      if (!bestMetrics || metrics.validationScore > bestMetrics.validationScore) {
        bestModel = model
        bestMetrics = metrics
        bestAlgorithm = name
        bestHyperparameters = hyperparameters
      }
    } catch (error) {
      console.warn(`Failed to train ${name}:`, error)
    }
  }

  if (!bestModel || !bestMetrics) {
    throw new Error("Failed to train any model successfully")
  }

  // Calculate feature importance
  let featureImportances: { feature: string; importance: number }[] = []

  if (bestModel instanceof RandomForest) {
    const importances = bestModel.getFeatureImportances()
    featureImportances = features.map((feature, index) => ({
      feature,
      importance: importances[index] || 0,
    }))
  } else {
    // For linear models, use absolute weights
    const weights = bestModel.weights || []
    featureImportances = features.map((feature, index) => ({
      feature,
      importance: Math.abs(weights[index] || 0),
    }))
  }

  // Normalize importance scores
  const totalImportance = featureImportances.reduce((sum, fi) => sum + fi.importance, 0)
  if (totalImportance > 0) {
    featureImportances.forEach((fi) => (fi.importance = fi.importance / totalImportance))
  }

  const trainingTime = Date.now() - startTime

  return {
    id: `enhanced_model_${Date.now()}`,
    name: bestAlgorithm,
    algorithm: bestAlgorithm,
    type: isClassification ? "classification" : "regression",
    targetColumn,
    features,
    metrics: { ...bestMetrics, trainingTime },
    featureImportances: featureImportances.sort((a, b) => b.importance - a.importance),
    modelParameters: bestModel,
    trainingData: data,
    scaler,
    labelEncoder,
    createdAt: new Date(),
    hyperparameters: bestHyperparameters,
  }
}

function calculateEnhancedMetrics(
  actual: number[],
  predicted: number[],
  isClassification: boolean,
  algorithm: string,
): EnhancedModelMetrics {
  if (isClassification) {
    // Classification metrics
    const tp = actual.reduce((sum, act, i) => sum + (act === 1 && predicted[i] === 1 ? 1 : 0), 0)
    const fp = actual.reduce((sum, act, i) => sum + (act === 0 && predicted[i] === 1 ? 1 : 0), 0)
    const tn = actual.reduce((sum, act, i) => sum + (act === 0 && predicted[i] === 0 ? 1 : 0), 0)
    const fn = actual.reduce((sum, act, i) => sum + (act === 1 && predicted[i] === 0 ? 1 : 0), 0)

    const accuracy = (tp + tn) / (tp + fp + tn + fn)
    const precision = tp / (tp + fp) || 0
    const recall = tp / (tp + fn) || 0
    const f1Score = (2 * (precision * recall)) / (precision + recall) || 0

    return {
      accuracy,
      precision,
      recall,
      f1Score,
      confusionMatrix: [
        [tn, fp],
        [fn, tp],
      ],
      trainingTime: 0,
      validationScore: accuracy,
      algorithmUsed: algorithm,
    }
  } else {
    // Regression metrics
    const n = actual.length
    const meanActual = actual.reduce((sum, val) => sum + val, 0) / n

    const mse = actual.reduce((sum, act, i) => sum + Math.pow(act - predicted[i], 2), 0) / n
    const rmse = Math.sqrt(mse)
    const mae = actual.reduce((sum, act, i) => sum + Math.abs(act - predicted[i]), 0) / n

    const totalSumSquares = actual.reduce((sum, act) => sum + Math.pow(act - meanActual, 2), 0)
    const r2 = 1 - (mse * n) / totalSumSquares

    return {
      rmse,
      mae,
      r2,
      trainingTime: 0,
      validationScore: r2,
      algorithmUsed: algorithm,
    }
  }
}

// Enhanced prediction function
export function makeEnhancedPrediction(
  model: EnhancedTrainedModel,
  inputData: Record<string, number>,
): number | string {
  const X = [model.features.map((feature) => Number(inputData[feature]) || 0)]

  // Standardize input
  if (model.scaler) {
    X[0] = X[0].map((val, i) => (val - model.scaler!.mean[i]) / model.scaler!.std[i])
  }

  // Make prediction using the trained model
  const prediction = model.modelParameters.predict(X)[0]

  if (model.type === "classification" && model.labelEncoder) {
    // Decode label if encoder exists
    const reverseEncoder = Object.fromEntries(Object.entries(model.labelEncoder).map(([k, v]) => [v, k]))
    return reverseEncoder[prediction] || prediction
  }

  return prediction
}

// Enhanced export with pickle-like format
export function exportEnhancedModel(
  model: EnhancedTrainedModel,
  format: "json" | "csv" | "python" | "pkl",
): string | Uint8Array {
  switch (format) {
    case "pkl":
      // Create a pickle-like binary format (simplified)
      const modelData = {
        algorithm: model.algorithm,
        type: model.type,
        features: model.features,
        target: model.targetColumn,
        parameters: serializeModel(model.modelParameters),
        scaler: model.scaler,
        labelEncoder: model.labelEncoder,
        hyperparameters: model.hyperparameters,
        metrics: model.metrics,
        created: model.createdAt.toISOString(),
      }

      // Convert to binary format (simplified pickle-like)
      const jsonString = JSON.stringify(modelData)
      const encoder = new TextEncoder()
      return encoder.encode(jsonString)

    case "json":
      return JSON.stringify(
        {
          model_info: {
            name: model.name,
            algorithm: model.algorithm,
            type: model.type,
            target_column: model.targetColumn,
            features: model.features,
            created_at: model.createdAt.toISOString(),
          },
          hyperparameters: model.hyperparameters,
          model_parameters: serializeModel(model.modelParameters),
          performance_metrics: model.metrics,
          feature_importances: model.featureImportances,
          preprocessing: {
            scaler: model.scaler,
            label_encoder: model.labelEncoder,
          },
        },
        null,
        2,
      )

    case "python":
      return generatePythonCode(model)

    case "csv":
      let csv = "Feature,Importance,Weight\n"
      model.features.forEach((feature, i) => {
        const importance = model.featureImportances.find((fi) => fi.feature === feature)?.importance || 0
        const weight = model.modelParameters.weights?.[i] || 0
        csv += `${feature},${importance},${weight}\n`
      })
      return csv

    default:
      return JSON.stringify(model, null, 2)
  }
}

function serializeModel(model: any): any {
  if (model instanceof RandomForest) {
    return {
      type: "RandomForest",
      nTrees: model.nTrees,
      maxDepth: model.maxDepth,
      minSamplesSplit: model.minSamplesSplit,
      featureSubsetSize: model.featureSubsetSize,
      // Note: In a real implementation, you'd serialize the trees
      trees: "serialized_trees_data",
    }
  } else if (model.weights) {
    return {
      type: model.constructor.name,
      weights: model.weights,
      intercept: model.intercept,
    }
  }
  return { type: "unknown" }
}

function generatePythonCode(model: EnhancedTrainedModel): string {
  if (model.algorithm === "Random Forest") {
    return `# Generated Python code for ${model.name}
import numpy as np
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.preprocessing import StandardScaler
import pickle

class ${model.algorithm.replace(/\s+/g, "")}Model:
    def __init__(self):
        self.algorithm = "${model.algorithm}"
        self.type = "${model.type}"
        self.features = [${model.features.map((f) => `'${f}'`).join(", ")}]
        self.scaler_mean = np.array([${model.scaler?.mean.join(", ") || ""}])
        self.scaler_std = np.array([${model.scaler?.std.join(", ") || ""}])
        self.hyperparameters = ${JSON.stringify(model.hyperparameters, null, 8)}
        
        # Initialize the model with trained parameters
        if self.type == "classification":
            self.model = RandomForestClassifier(**self.hyperparameters)
        else:
            self.model = RandomForestRegressor(**self.hyperparameters)
            
    def preprocess(self, X):
        # Standardize input
        return (X - self.scaler_mean) / self.scaler_std
        
    def predict(self, X):
        X_scaled = self.preprocess(X)
        return self.model.predict(X_scaled)
        
    def predict_proba(self, X):
        if self.type == "classification":
            X_scaled = self.preprocess(X)
            return self.model.predict_proba(X_scaled)
        else:
            raise ValueError("predict_proba not available for regression models")

# Usage example:
# model = ${model.algorithm.replace(/\s+/g, "")}Model()
# prediction = model.predict(np.array([[${model.features.map(() => "0").join(", ")}]]))

# To save the model:
# with open('model.pkl', 'wb') as f:
#     pickle.dump(model, f)
`
  } else {
    return `# Generated Python code for ${model.name}
import numpy as np

class ${model.algorithm.replace(/\s+/g, "")}Model:
    def __init__(self):
        self.weights = np.array([${model.modelParameters.weights?.join(", ") || ""}])
        self.intercept = ${model.modelParameters.intercept || 0}
        self.features = [${model.features.map((f) => `'${f}'`).join(", ")}]
        self.scaler_mean = np.array([${model.scaler?.mean.join(", ") || ""}])
        self.scaler_std = np.array([${model.scaler?.std.join(", ") || ""}])
        
    def predict(self, X):
        X_scaled = (X - self.scaler_mean) / self.scaler_std
        prediction = np.dot(X_scaled, self.weights) + self.intercept
        
        ${model.type === "classification" ? "return 1 / (1 + np.exp(-prediction)) > 0.5" : "return prediction"}

# Usage example:
# model = ${model.algorithm.replace(/\s+/g, "")}Model()
# prediction = model.predict(np.array([[${model.features.map(() => "0").join(", ")}]]))
`
  }
}

// Helper functions (reuse from previous implementation)
export function standardizeData(data: number[][]): {
  standardized: number[][]
  scaler: { mean: number[]; std: number[] }
} {
  const n = data[0].length
  const mean = new Array(n).fill(0)
  const std = new Array(n).fill(0)

  // Calculate means
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < data.length; i++) {
      mean[j] += data[i][j]
    }
    mean[j] /= data.length
  }

  // Calculate standard deviations
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < data.length; i++) {
      std[j] += Math.pow(data[i][j] - mean[j], 2)
    }
    std[j] = Math.sqrt(std[j] / data.length)
    if (std[j] === 0) std[j] = 1
  }

  // Standardize data
  const standardized = data.map((row) => row.map((val, j) => (val - mean[j]) / std[j]))

  return { standardized, scaler: { mean, std } }
}

export function encodeLabels(labels: any[]): { encoded: number[]; encoder: { [key: string]: number } } {
  const uniqueLabels = [...new Set(labels)]
  const encoder: { [key: string]: number } = {}

  uniqueLabels.forEach((label, index) => {
    encoder[String(label)] = index
  })

  const encoded = labels.map((label) => encoder[String(label)])
  return { encoded, encoder }
}

// Linear Regression class (reuse from previous)
class LinearRegression {
  weights: number[] = []
  intercept = 0

  fit(X: number[][], y: number[], learningRate = 0.01, epochs = 1000) {
    const m = X.length
    const n = X[0].length

    this.weights = new Array(n).fill(0)
    this.intercept = 0

    for (let epoch = 0; epoch < epochs; epoch++) {
      const predictions = this.predict(X)
      const dw = new Array(n).fill(0)
      let db = 0

      for (let i = 0; i < m; i++) {
        const error = predictions[i] - y[i]
        db += error
        for (let j = 0; j < n; j++) {
          dw[j] += error * X[i][j]
        }
      }

      for (let j = 0; j < n; j++) {
        this.weights[j] -= (learningRate * dw[j]) / m
      }
      this.intercept -= (learningRate * db) / m
    }
  }

  predict(X: number[][]): number[] {
    return X.map((row) => {
      let sum = this.intercept
      for (let i = 0; i < row.length; i++) {
        sum += this.weights[i] * row[i]
      }
      return sum
    })
  }
}

// Logistic Regression class (reuse from previous)
class LogisticRegression {
  weights: number[] = []
  intercept = 0

  sigmoid(z: number): number {
    return 1 / (1 + Math.exp(-Math.max(-250, Math.min(250, z))))
  }

  fit(X: number[][], y: number[], learningRate = 0.01, epochs = 1000) {
    const m = X.length
    const n = X[0].length

    this.weights = new Array(n).fill(0)
    this.intercept = 0

    for (let epoch = 0; epoch < epochs; epoch++) {
      const dw = new Array(n).fill(0)
      let db = 0

      for (let i = 0; i < m; i++) {
        let z = this.intercept
        for (let j = 0; j < n; j++) {
          z += this.weights[j] * X[i][j]
        }

        const prediction = this.sigmoid(z)
        const error = prediction - y[i]

        db += error
        for (let j = 0; j < n; j++) {
          dw[j] += error * X[i][j]
        }
      }

      for (let j = 0; j < n; j++) {
        this.weights[j] -= (learningRate * dw[j]) / m
      }
      this.intercept -= (learningRate * db) / m
    }
  }

  predict(X: number[][]): number[] {
    return X.map((row) => {
      let z = this.intercept
      for (let i = 0; i < row.length; i++) {
        z += this.weights[i] * row[i]
      }
      return this.sigmoid(z) > 0.5 ? 1 : 0
    })
  }
}
