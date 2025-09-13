export interface BlogPost {
  id: string
  title: string
  excerpt: string
  content: string
  author: string
  date: string
  readTime: string
  category: string
  tags: string[]
  featured?: boolean
  codePreview?: string
  difficulty?: "Beginner" | "Intermediate" | "Advanced"
}

export const blogPosts: BlogPost[] = [
  {
    id: "complete-python-data-analysis-guide",
    title: "Complete Python Data Analysis Guide: From Pandas to Advanced Visualization",
    excerpt:
      "Master data analysis with Python using pandas, numpy, matplotlib, and scikit-learn. Includes practical examples and real-world datasets.",
    content: `# Complete Python Data Analysis Guide

This comprehensive guide covers everything from basic pandas operations to advanced machine learning techniques. Learn how to manipulate data, create visualizations, and build predictive models using Python's most powerful libraries.

## Getting Started with Pandas

Pandas is the cornerstone of data analysis in Python. Here's how to get started:

### Loading Data
- Read CSV files with pd.read_csv()
- Handle different file formats
- Deal with missing data

### Data Manipulation
- Filtering and selecting data
- Grouping and aggregation
- Merging datasets

## Advanced Visualization

Create compelling visualizations using matplotlib and seaborn:
- Statistical plots
- Interactive dashboards
- Custom styling

## Machine Learning Integration

Integrate your analysis with scikit-learn for predictive modeling.`,
    author: "Aditya Kumar Jha",
    date: "2024-02-25",
    readTime: "45 min read",
    category: "Python",
    tags: ["Python", "Data Analysis", "Pandas", "Machine Learning"],
    featured: true,
    difficulty: "Intermediate",
    codePreview: `import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.ensemble import RandomForestClassifier`,
  },
  {
    id: "advanced-sql-techniques",
    title: "Advanced SQL Techniques for Data Scientists: Window Functions, CTEs, and Performance Optimization",
    excerpt:
      "Master advanced SQL concepts including window functions, common table expressions, query optimization, and database performance tuning for large-scale data analysis.",
    content: `# Advanced SQL Techniques for Data Scientists

SQL is the backbone of data analysis, and mastering advanced techniques is crucial for working with large datasets efficiently. This guide covers the most important advanced SQL concepts every data scientist should know.

## Window Functions

Window functions allow you to perform calculations across a set of table rows that are somehow related to the current row:

### Running Totals
- Calculate cumulative sums
- Moving averages
- Ranking functions

### Partitioning Data
- GROUP BY vs PARTITION BY
- Frame specifications
- Performance considerations

## Common Table Expressions (CTEs)

CTEs make complex queries more readable and maintainable:
- Recursive CTEs
- Multiple CTEs in one query
- Performance implications

## Query Optimization

Learn how to make your queries faster:
- Index strategies
- Execution plan analysis
- Query rewriting techniques`,
    author: "Aditya Kumar Jha",
    date: "2024-02-20",
    readTime: "35 min read",
    category: "SQL",
    tags: ["SQL", "Database", "Performance", "Analytics"],
    featured: true,
    difficulty: "Advanced",
    codePreview: `WITH monthly_sales AS (
  SELECT DATE_TRUNC('month', sale_date) as month,
         SUM(amount) as total_sales
  FROM sales_data
  GROUP BY 1
)
SELECT * FROM monthly_sales;`,
  },
  {
    id: "machine-learning-model-deployment",
    title: "Machine Learning Model Deployment: From Development to Production",
    excerpt:
      "Learn how to deploy ML models to production using Docker, Kubernetes, and cloud platforms. Includes monitoring, scaling, and CI/CD best practices.",
    content: `# Machine Learning Model Deployment

Deploying machine learning models to production requires careful consideration of scalability, monitoring, and maintenance. This comprehensive guide covers everything from containerization to monitoring in production.

## Containerization with Docker

Learn how to package your ML models:
- Creating Dockerfiles for ML applications
- Managing dependencies
- Optimizing image size

## Orchestration with Kubernetes

Scale your deployments:
- Pod management
- Service discovery
- Auto-scaling strategies

## Monitoring and Maintenance

Keep your models healthy:
- Performance monitoring
- Model drift detection
- A/B testing strategies`,
    author: "Aditya Kumar Jha",
    date: "2024-02-15",
    readTime: "40 min read",
    category: "MLOps",
    tags: ["Machine Learning", "Deployment", "Docker", "Kubernetes"],
    featured: false,
    difficulty: "Advanced",
    codePreview: `from flask import Flask, request, jsonify
import joblib
import numpy as np

app = Flask(__name__)
model = joblib.load('model.pkl')

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    prediction = model.predict([data['features']])
    return jsonify({'prediction': prediction.tolist()})`,
  },
  {
    id: "statistical-analysis-r",
    title: "Statistical Analysis with R: Hypothesis Testing and Experimental Design",
    excerpt:
      "Comprehensive guide to statistical analysis using R, covering hypothesis testing, ANOVA, regression analysis, and experimental design principles.",
    content: `# Statistical Analysis with R

R is the gold standard for statistical analysis. This guide covers fundamental and advanced statistical techniques that every data scientist should master.

## Hypothesis Testing

Learn the fundamentals:
- t-tests and their applications
- Chi-square tests
- Non-parametric alternatives

## ANOVA and Regression

Advanced statistical modeling:
- One-way and two-way ANOVA
- Linear and logistic regression
- Model diagnostics

## Experimental Design

Design robust experiments:
- Randomization strategies
- Power analysis
- Sample size calculations`,
    author: "Aditya Kumar Jha",
    date: "2024-02-10",
    readTime: "50 min read",
    category: "Statistics",
    tags: ["R", "Statistics", "Hypothesis Testing", "ANOVA"],
    featured: false,
    difficulty: "Intermediate",
    codePreview: `# Load required libraries
library(tidyverse)
library(broom)

# Perform t-test
t_test_result <- t.test(group1, group2)
tidy(t_test_result)`,
  },
  {
    id: "data-visualization-best-practices",
    title: "Data Visualization Best Practices: Creating Compelling Charts and Dashboards",
    excerpt:
      "Learn the principles of effective data visualization, color theory, chart selection, and dashboard design using modern tools and libraries.",
    content: `# Data Visualization Best Practices

Effective data visualization is both an art and a science. This guide covers the fundamental principles of creating compelling and informative visualizations.

## Design Principles

Core concepts for effective visualization:
- Color theory and accessibility
- Typography and layout
- Cognitive load considerations

## Chart Selection

Choose the right chart type:
- When to use bar charts vs line charts
- Scatter plots and correlation
- Advanced chart types

## Dashboard Design

Create effective dashboards:
- Layout principles
- Interactive elements
- Performance optimization`,
    author: "Aditya Kumar Jha",
    date: "2024-02-05",
    readTime: "30 min read",
    category: "Visualization",
    tags: ["Data Visualization", "Charts", "Dashboards", "Design"],
    featured: false,
    difficulty: "Beginner",
    codePreview: `import matplotlib.pyplot as plt
import seaborn as sns

# Set style and color palette
plt.style.use('seaborn-v0_8')
sns.set_palette("husl")

# Create visualization
fig, ax = plt.subplots(figsize=(10, 6))
sns.barplot(data=df, x='category', y='value', ax=ax)`,
  },
  {
    id: "big-data-processing-spark",
    title: "Big Data Processing with Apache Spark: Scalable Analytics for Large Datasets",
    excerpt:
      "Master Apache Spark for big data processing, including DataFrames, SQL operations, machine learning with MLlib, and cluster optimization.",
    content: `# Big Data Processing with Apache Spark

Apache Spark has revolutionized big data processing with its in-memory computing capabilities. Learn how to process massive datasets efficiently.

## Spark Fundamentals

Core concepts:
- RDDs vs DataFrames
- Lazy evaluation
- Cluster architecture

## Data Processing

Advanced operations:
- Transformations and actions
- Joins and aggregations
- Performance optimization

## Machine Learning with MLlib

Scalable ML:
- Feature engineering at scale
- Model training and evaluation
- Pipeline creation`,
    author: "Aditya Kumar Jha",
    date: "2024-01-30",
    readTime: "55 min read",
    category: "Big Data",
    tags: ["Apache Spark", "Big Data", "Scala", "PySpark"],
    featured: false,
    difficulty: "Advanced",
    codePreview: `from pyspark.sql import SparkSession
from pyspark.sql.functions import col, sum, avg

spark = SparkSession.builder.appName("DataAnalysis").getOrCreate()
df = spark.read.csv("large_dataset.csv", header=True, inferSchema=True)

# Perform aggregations
result = df.groupBy("category").agg(
    sum("sales").alias("total_sales"),
    avg("price").alias("avg_price")
)`,
  },
]
