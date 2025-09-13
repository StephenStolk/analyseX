// Real Machine Learning Algorithms Implementation
export interface MLDataset {
  X: number[][]
  y: number[]
  featureNames: string[]
  targetName: string
}

export interface MLModel {
  name: string
  type: "classification" | "regression"
  fit(X: number[][], y: number[]): void
  predict(X: number[][]): number[]
  predictProba?(X: number[][]): number[][]
  getFeatureImportance?(): number[]
  getParams(): any
}

// Real Linear Regression with Gradient Descent
export class LinearRegression implements MLModel {
  name = "Linear Regression"
  type = "regression" as const
  private weights: number[] = []
  private bias = 0
  private learningRate = 0.01
  private maxIterations = 1000
  private tolerance = 1e-6

  fit(X: number[][], y: number[]): void {
    const n = X.length
    const features = X[0].length

    // Initialize weights and bias
    this.weights = new Array(features).fill(0).map(() => Math.random() * 0.01)
    this.bias = 0

    let prevCost = Number.POSITIVE_INFINITY

    for (let iter = 0; iter < this.maxIterations; iter++) {
      // Forward pass
      const predictions = this.predict(X)

      // Calculate cost (MSE)
      const cost = predictions.reduce((sum, pred, i) => sum + Math.pow(pred - y[i], 2), 0) / (2 * n)

      // Check for convergence
      if (Math.abs(prevCost - cost) < this.tolerance) break
      prevCost = cost

      // Calculate gradients
      const weightGradients = new Array(features).fill(0)
      let biasGradient = 0

      for (let i = 0; i < n; i++) {
        const error = predictions[i] - y[i]
        biasGradient += error
        for (let j = 0; j < features; j++) {
          weightGradients[j] += error * X[i][j]
        }
      }

      // Update parameters
      for (let j = 0; j < features; j++) {
        this.weights[j] -= (this.learningRate * weightGradients[j]) / n
      }
      this.bias -= (this.learningRate * biasGradient) / n
    }
  }

  predict(X: number[][]): number[] {
    return X.map((row) => {
      const sum = row.reduce((acc, val, idx) => acc + val * this.weights[idx], 0)
      return sum + this.bias
    })
  }

  getFeatureImportance(): number[] {
    return this.weights.map((w) => Math.abs(w))
  }

  getParams(): any {
    return {
      weights: this.weights,
      bias: this.bias,
      learningRate: this.learningRate,
    }
  }
}

// Real Logistic Regression
export class LogisticRegression implements MLModel {
  name = "Logistic Regression"
  type = "classification" as const
  private weights: number[] = []
  private bias = 0
  private learningRate = 0.01
  private maxIterations = 1000
  private tolerance = 1e-6

  private sigmoid(z: number): number {
    return 1 / (1 + Math.exp(-Math.max(-250, Math.min(250, z))))
  }

  fit(X: number[][], y: number[]): void {
    const n = X.length
    const features = X[0].length

    this.weights = new Array(features).fill(0).map(() => Math.random() * 0.01)
    this.bias = 0

    for (let iter = 0; iter < this.maxIterations; iter++) {
      const weightGradients = new Array(features).fill(0)
      let biasGradient = 0

      for (let i = 0; i < n; i++) {
        const z = X[i].reduce((sum, val, idx) => sum + val * this.weights[idx], 0) + this.bias
        const prediction = this.sigmoid(z)
        const error = prediction - y[i]

        biasGradient += error
        for (let j = 0; j < features; j++) {
          weightGradients[j] += error * X[i][j]
        }
      }

      for (let j = 0; j < features; j++) {
        this.weights[j] -= (this.learningRate * weightGradients[j]) / n
      }
      this.bias -= (this.learningRate * biasGradient) / n
    }
  }

  predict(X: number[][]): number[] {
    return this.predictProba(X).map((probs) => (probs[1] > 0.5 ? 1 : 0))
  }

  predictProba(X: number[][]): number[][] {
    return X.map((row) => {
      const z = row.reduce((sum, val, idx) => sum + val * this.weights[idx], 0) + this.bias
      const prob1 = this.sigmoid(z)
      return [1 - prob1, prob1]
    })
  }

  getFeatureImportance(): number[] {
    return this.weights.map((w) => Math.abs(w))
  }

  getParams(): any {
    return {
      weights: this.weights,
      bias: this.bias,
      learningRate: this.learningRate,
    }
  }
}

// Real Random Forest Implementation
export class RandomForest implements MLModel {
  name = "Random Forest"
  type: "classification" | "regression"
  private trees: DecisionTree[] = []
  private nTrees = 10
  private maxDepth = 10
  private minSamplesSplit = 2
  private featureSubsetSize: number

  constructor(type: "classification" | "regression" = "classification", nTrees = 10) {
    this.type = type
    this.nTrees = nTrees
    this.featureSubsetSize = 0
  }

  fit(X: number[][], y: number[]): void {
    const n = X.length
    const features = X[0].length
    this.featureSubsetSize = Math.floor(Math.sqrt(features))

    this.trees = []

    for (let i = 0; i < this.nTrees; i++) {
      // Bootstrap sampling
      const bootstrapIndices = Array.from({ length: n }, () => Math.floor(Math.random() * n))
      const bootstrapX = bootstrapIndices.map((idx) => X[idx])
      const bootstrapY = bootstrapIndices.map((idx) => y[idx])

      // Create and train tree
      const tree = new DecisionTree(this.type, this.maxDepth, this.minSamplesSplit, this.featureSubsetSize)
      tree.fit(bootstrapX, bootstrapY)
      this.trees.push(tree)
    }
  }

  predict(X: number[][]): number[] {
    const predictions = this.trees.map((tree) => tree.predict(X))

    return X.map((_, i) => {
      const treePredictions = predictions.map((pred) => pred[i])

      if (this.type === "classification") {
        // Majority vote
        const counts = new Map<number, number>()
        treePredictions.forEach((pred) => {
          counts.set(pred, (counts.get(pred) || 0) + 1)
        })
        return Array.from(counts.entries()).reduce((a, b) => (a[1] > b[1] ? a : b))[0]
      } else {
        // Average for regression
        return treePredictions.reduce((sum, pred) => sum + pred, 0) / treePredictions.length
      }
    })
  }

  getFeatureImportance(): number[] {
    if (this.trees.length === 0) return []

    const importance = new Array(this.trees[0].getFeatureImportance().length).fill(0)

    this.trees.forEach((tree) => {
      const treeImportance = tree.getFeatureImportance()
      treeImportance.forEach((imp, idx) => {
        importance[idx] += imp
      })
    })

    // Average importance across trees
    return importance.map((imp) => imp / this.trees.length)
  }

  getParams(): any {
    return {
      nTrees: this.nTrees,
      maxDepth: this.maxDepth,
      minSamplesSplit: this.minSamplesSplit,
      featureSubsetSize: this.featureSubsetSize,
    }
  }
}

// Real Decision Tree Implementation
export class DecisionTree implements MLModel {
  name = "Decision Tree"
  type: "classification" | "regression"
  private tree: any = null
  private maxDepth: number
  private minSamplesSplit: number
  private featureSubsetSize: number
  private featureImportances: number[] = []

  constructor(
    type: "classification" | "regression" = "classification",
    maxDepth = 10,
    minSamplesSplit = 2,
    featureSubsetSize = 0,
  ) {
    this.type = type
    this.maxDepth = maxDepth
    this.minSamplesSplit = minSamplesSplit
    this.featureSubsetSize = featureSubsetSize
  }

  fit(X: number[][], y: number[]): void {
    const features = X[0].length
    this.featureImportances = new Array(features).fill(0)
    this.tree = this.buildTree(
      X,
      y,
      0,
      Array.from({ length: features }, (_, i) => i),
    )

    // Normalize feature importances
    const total = this.featureImportances.reduce((sum, imp) => sum + imp, 0)
    if (total > 0) {
      this.featureImportances = this.featureImportances.map((imp) => imp / total)
    }
  }

  private buildTree(X: number[][], y: number[], depth: number, availableFeatures: number[]): any {
    // Stopping criteria
    if (depth >= this.maxDepth || X.length < this.minSamplesSplit || new Set(y).size === 1) {
      return { value: this.getMostCommon(y) }
    }

    // Feature subset selection for Random Forest
    let featuresToConsider = availableFeatures
    if (this.featureSubsetSize > 0 && this.featureSubsetSize < availableFeatures.length) {
      featuresToConsider = this.shuffleArray([...availableFeatures]).slice(0, this.featureSubsetSize)
    }

    const bestSplit = this.findBestSplit(X, y, featuresToConsider)
    if (!bestSplit) {
      return { value: this.getMostCommon(y) }
    }

    const { featureIndex, threshold, leftIndices, rightIndices, impurityReduction } = bestSplit

    // Update feature importance
    this.featureImportances[featureIndex] += impurityReduction

    const leftX = leftIndices.map((i) => X[i])
    const leftY = leftIndices.map((i) => y[i])
    const rightX = rightIndices.map((i) => X[i])
    const rightY = rightIndices.map((i) => y[i])

    return {
      featureIndex,
      threshold,
      left: this.buildTree(leftX, leftY, depth + 1, availableFeatures),
      right: this.buildTree(rightX, rightY, depth + 1, availableFeatures),
    }
  }

  private findBestSplit(X: number[][], y: number[], featureIndices: number[]): any {
    let bestImpurity = Number.POSITIVE_INFINITY
    let bestSplit = null

    for (const featureIndex of featureIndices) {
      const values = X.map((row) => row[featureIndex])
      const uniqueValues = [...new Set(values)].sort((a, b) => a - b)

      for (let i = 0; i < uniqueValues.length - 1; i++) {
        const threshold = (uniqueValues[i] + uniqueValues[i + 1]) / 2
        const leftIndices: number[] = []
        const rightIndices: number[] = []

        X.forEach((row, idx) => {
          if (row[featureIndex] <= threshold) {
            leftIndices.push(idx)
          } else {
            rightIndices.push(idx)
          }
        })

        if (leftIndices.length === 0 || rightIndices.length === 0) continue

        const leftY = leftIndices.map((i) => y[i])
        const rightY = rightIndices.map((i) => y[i])

        const impurity = this.calculateWeightedImpurity(leftY, rightY, y.length)
        const impurityReduction = this.calculateImpurity(y) - impurity

        if (impurity < bestImpurity) {
          bestImpurity = impurity
          bestSplit = { featureIndex, threshold, leftIndices, rightIndices, impurityReduction }
        }
      }
    }

    return bestSplit
  }

  private calculateImpurity(y: number[]): number {
    if (this.type === "classification") {
      return this.giniImpurity(y)
    } else {
      return this.mseImpurity(y)
    }
  }

  private calculateWeightedImpurity(leftY: number[], rightY: number[], totalSize: number): number {
    const leftWeight = leftY.length / totalSize
    const rightWeight = rightY.length / totalSize
    return leftWeight * this.calculateImpurity(leftY) + rightWeight * this.calculateImpurity(rightY)
  }

  private giniImpurity(y: number[]): number {
    const counts = new Map<number, number>()
    y.forEach((val) => counts.set(val, (counts.get(val) || 0) + 1))

    let gini = 1
    const total = y.length
    for (const count of counts.values()) {
      const prob = count / total
      gini -= prob * prob
    }
    return gini
  }

  private mseImpurity(y: number[]): number {
    const mean = y.reduce((sum, val) => sum + val, 0) / y.length
    return y.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / y.length
  }

  private getMostCommon(y: number[]): number {
    if (this.type === "regression") {
      return y.reduce((sum, val) => sum + val, 0) / y.length
    }

    const counts = new Map<number, number>()
    y.forEach((val) => counts.set(val, (counts.get(val) || 0) + 1))

    let maxCount = 0
    let mostCommon = y[0]
    for (const [value, count] of counts.entries()) {
      if (count > maxCount) {
        maxCount = count
        mostCommon = value
      }
    }
    return mostCommon
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  predict(X: number[][]): number[] {
    return X.map((row) => this.predictSingle(row, this.tree))
  }

  private predictSingle(row: number[], node: any): number {
    if (node.value !== undefined) {
      return node.value
    }

    if (row[node.featureIndex] <= node.threshold) {
      return this.predictSingle(row, node.left)
    } else {
      return this.predictSingle(row, node.right)
    }
  }

  getFeatureImportance(): number[] {
    return this.featureImportances
  }

  getParams(): any {
    return {
      maxDepth: this.maxDepth,
      minSamplesSplit: this.minSamplesSplit,
      featureSubsetSize: this.featureSubsetSize,
    }
  }
}

// Support Vector Machine (simplified implementation)
export class SVM implements MLModel {
  name = "Support Vector Machine"
  type = "classification" as const
  private weights: number[] = []
  private bias = 0
  private C = 1.0 // Regularization parameter
  private learningRate = 0.001
  private maxIterations = 1000

  fit(X: number[][], y: number[]): void {
    const n = X.length
    const features = X[0].length

    // Convert labels to -1, 1 for SVM
    const yConverted = y.map((label) => (label === 0 ? -1 : 1))

    this.weights = new Array(features).fill(0).map(() => Math.random() * 0.01)
    this.bias = 0

    for (let iter = 0; iter < this.maxIterations; iter++) {
      for (let i = 0; i < n; i++) {
        const xi = X[i]
        const yi = yConverted[i]

        const decision = xi.reduce((sum, val, idx) => sum + val * this.weights[idx], 0) + this.bias

        if (yi * decision < 1) {
          // Misclassified or within margin
          for (let j = 0; j < features; j++) {
            this.weights[j] = this.weights[j] - this.learningRate * ((2 * this.weights[j]) / this.C - yi * xi[j])
          }
          this.bias = this.bias - this.learningRate * -yi
        } else {
          // Correctly classified
          for (let j = 0; j < features; j++) {
            this.weights[j] = this.weights[j] - this.learningRate * ((2 * this.weights[j]) / this.C)
          }
        }
      }
    }
  }

  predict(X: number[][]): number[] {
    return X.map((row) => {
      const decision = row.reduce((sum, val, idx) => sum + val * this.weights[idx], 0) + this.bias
      return decision >= 0 ? 1 : 0
    })
  }

  getFeatureImportance(): number[] {
    return this.weights.map((w) => Math.abs(w))
  }

  getParams(): any {
    return {
      weights: this.weights,
      bias: this.bias,
      C: this.C,
      learningRate: this.learningRate,
    }
  }
}
