import json
import sys
import pandas as pd
import numpy as np
from scipy import stats
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score
import warnings
warnings.filterwarnings('ignore')

def analyze_data(data_json, analysis_type, selected_columns):
    """
    Perform statistical analysis on the provided data
    Returns only insights and results, not raw data
    """
    try:
        # Parse input data
        data = pd.DataFrame(data_json)
        
        # Validate data
        if data.empty:
            return {"error": "No data provided"}
        
        results = {
            "success": True,
            "data_points_analyzed": len(data),
            "columns_analyzed": len(selected_columns),
            "analysis_type": analysis_type,
            "insights": {},
            "statistics": {},
            "recommendations": []
        }
        
        # Filter to selected columns
        if selected_columns:
            available_cols = [col for col in selected_columns if col in data.columns]
            if available_cols:
                analysis_data = data[available_cols]
            else:
                analysis_data = data
        else:
            analysis_data = data
        
        # Get numeric columns for analysis
        numeric_cols = analysis_data.select_dtypes(include=[np.number]).columns.tolist()
        
        if not numeric_cols:
            return {"error": "No numeric columns found for analysis"}
        
        # Perform analysis based on type
        if analysis_type == "time_series" or analysis_type == "time_series_forecast":
            results.update(perform_time_series_analysis(analysis_data, numeric_cols))
        elif analysis_type == "regression_feature_importance":
            results.update(perform_regression_analysis(analysis_data, numeric_cols))
        elif analysis_type == "pca_clustering":
            results.update(perform_clustering_analysis(analysis_data, numeric_cols))
        elif analysis_type == "statistical_tests":
            results.update(perform_statistical_tests(analysis_data, numeric_cols))
        else:
            results.update(perform_exploratory_analysis(analysis_data, numeric_cols))
        
        return results
        
    except Exception as e:
        return {"error": f"Analysis failed: {str(e)}"}

def perform_time_series_analysis(data, numeric_cols):
    """Perform time series analysis and forecasting"""
    results = {"insights": {}, "statistics": {}, "recommendations": []}
    
    # Find time-based column (month_number, date, etc.)
    time_col = None
    for col in data.columns:
        if 'month' in col.lower() or 'date' in col.lower() or 'time' in col.lower():
            time_col = col
            break
    
    if not time_col:
        time_col = data.columns[0]  # Use first column as time proxy
    
    for col in numeric_cols:
        if col != time_col:
            series = data[col].dropna()
            if len(series) > 3:
                # Calculate trend
                x = np.arange(len(series))
                slope, intercept, r_value, p_value, std_err = stats.linregress(x, series)
                
                # Calculate statistics
                mean_val = series.mean()
                std_val = series.std()
                min_val = series.min()
                max_val = series.max()
                
                # Detect seasonality (simple approach)
                if len(series) >= 12:
                    # Check for monthly patterns
                    monthly_means = []
                    for i in range(min(12, len(series))):
                        if i < len(series):
                            monthly_means.append(series.iloc[i])
                    seasonality_strength = np.std(monthly_means) / mean_val if mean_val != 0 else 0
                else:
                    seasonality_strength = 0
                
                results["statistics"][col] = {
                    "mean": float(mean_val),
                    "std_dev": float(std_val),
                    "min": float(min_val),
                    "max": float(max_val),
                    "trend_slope": float(slope),
                    "trend_r_squared": float(r_value**2),
                    "trend_p_value": float(p_value),
                    "seasonality_strength": float(seasonality_strength)
                }
                
                # Generate insights
                trend_direction = "increasing" if slope > 0 else "decreasing" if slope < 0 else "stable"
                trend_strength = "strong" if abs(r_value) > 0.7 else "moderate" if abs(r_value) > 0.4 else "weak"
                
                results["insights"][col] = {
                    "trend_direction": trend_direction,
                    "trend_strength": trend_strength,
                    "volatility": "high" if std_val > mean_val * 0.3 else "moderate" if std_val > mean_val * 0.1 else "low",
                    "seasonality": "strong" if seasonality_strength > 0.2 else "weak",
                    "forecast_next_period": float(slope * len(series) + intercept) if abs(r_value) > 0.3 else None
                }
    
    results["recommendations"] = [
        "Use trend analysis for strategic planning",
        "Monitor seasonal patterns for inventory management",
        "Consider external factors affecting volatility"
    ]
    
    return results

def perform_regression_analysis(data, numeric_cols):
    """Perform regression analysis to find drivers"""
    results = {"insights": {}, "statistics": {}, "recommendations": []}
    
    if len(numeric_cols) < 2:
        return results
    
    # Use last column as target (often total_profit, total_sales, etc.)
    target_col = numeric_cols[-1]
    feature_cols = numeric_cols[:-1]
    
    if not feature_cols:
        return results
    
    try:
        X = data[feature_cols].dropna()
        y = data[target_col].dropna()
        
        # Align X and y
        common_idx = X.index.intersection(y.index)
        X = X.loc[common_idx]
        y = y.loc[common_idx]
        
        if len(X) < 3:
            return results
        
        # Fit regression model
        model = LinearRegression()
        model.fit(X, y)
        
        # Calculate predictions and R²
        y_pred = model.predict(X)
        r2 = r2_score(y, y_pred)
        
        # Feature importance (absolute coefficients normalized)
        feature_importance = {}
        coef_abs = np.abs(model.coef_)
        coef_sum = np.sum(coef_abs)
        
        for i, col in enumerate(feature_cols):
            importance = coef_abs[i] / coef_sum if coef_sum > 0 else 0
            feature_importance[col] = {
                "coefficient": float(model.coef_[i]),
                "importance": float(importance),
                "correlation": float(np.corrcoef(X[col], y)[0, 1])
            }
        
        results["statistics"] = {
            "target_variable": target_col,
            "r_squared": float(r2),
            "intercept": float(model.intercept_),
            "feature_importance": feature_importance
        }
        
        # Generate insights
        top_driver = max(feature_importance.keys(), key=lambda k: feature_importance[k]["importance"])
        model_quality = "excellent" if r2 > 0.8 else "good" if r2 > 0.6 else "moderate" if r2 > 0.4 else "poor"
        
        results["insights"] = {
            "model_quality": model_quality,
            "top_driver": top_driver,
            "top_driver_impact": feature_importance[top_driver]["importance"],
            "explained_variance": float(r2),
            "predictability": "high" if r2 > 0.7 else "moderate" if r2 > 0.4 else "low"
        }
        
        results["recommendations"] = [
            f"Focus on {top_driver} as it has the highest impact on {target_col}",
            "Use this model for forecasting and scenario planning",
            "Monitor key drivers regularly for business optimization"
        ]
        
    except Exception as e:
        results["error"] = f"Regression analysis failed: {str(e)}"
    
    return results

def perform_clustering_analysis(data, numeric_cols):
    """Perform PCA and clustering analysis"""
    results = {"insights": {}, "statistics": {}, "recommendations": []}
    
    if len(numeric_cols) < 2:
        return results
    
    try:
        # Prepare data
        X = data[numeric_cols].dropna()
        if len(X) < 3:
            return results
        
        # Standardize data
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        # PCA Analysis
        pca = PCA()
        X_pca = pca.fit_transform(X_scaled)
        
        # Find optimal number of clusters (2-5)
        optimal_clusters = 2
        best_silhouette = -1
        
        for n_clusters in range(2, min(6, len(X))):
            kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
            cluster_labels = kmeans.fit_predict(X_scaled)
            
            # Simple silhouette approximation
            silhouette_avg = 0
            for i in range(n_clusters):
                cluster_points = X_scaled[cluster_labels == i]
                if len(cluster_points) > 1:
                    intra_cluster_dist = np.mean([np.linalg.norm(p1 - p2) for p1 in cluster_points for p2 in cluster_points])
                    silhouette_avg += 1 / (1 + intra_cluster_dist)
            
            if silhouette_avg > best_silhouette:
                best_silhouette = silhouette_avg
                optimal_clusters = n_clusters
        
        # Final clustering
        kmeans = KMeans(n_clusters=optimal_clusters, random_state=42, n_init=10)
        cluster_labels = kmeans.fit_predict(X_scaled)
        
        # Analyze clusters
        cluster_stats = {}
        for i in range(optimal_clusters):
            cluster_data = X[cluster_labels == i]
            cluster_stats[f"cluster_{i}"] = {
                "size": int(len(cluster_data)),
                "percentage": float(len(cluster_data) / len(X) * 100),
                "characteristics": {}
            }
            
            for col in numeric_cols:
                cluster_stats[f"cluster_{i}"]["characteristics"][col] = {
                    "mean": float(cluster_data[col].mean()),
                    "std": float(cluster_data[col].std())
                }
        
        results["statistics"] = {
            "pca_explained_variance": [float(x) for x in pca.explained_variance_ratio_[:3]],
            "optimal_clusters": optimal_clusters,
            "cluster_statistics": cluster_stats
        }
        
        results["insights"] = {
            "data_complexity": "high" if pca.explained_variance_ratio_[0] < 0.6 else "moderate",
            "natural_groupings": optimal_clusters,
            "main_variation_explained": float(pca.explained_variance_ratio_[0])
        }
        
        results["recommendations"] = [
            f"Your data naturally forms {optimal_clusters} distinct groups",
            "Use clustering for customer segmentation or product categorization",
            "Focus on the main components that explain most variation"
        ]
        
    except Exception as e:
        results["error"] = f"Clustering analysis failed: {str(e)}"
    
    return results

def perform_statistical_tests(data, numeric_cols):
    """Perform statistical tests for group comparisons"""
    results = {"insights": {}, "statistics": {}, "recommendations": []}
    
    if len(numeric_cols) < 2:
        return results
    
    try:
        # Perform normality tests
        normality_results = {}
        for col in numeric_cols:
            series = data[col].dropna()
            if len(series) > 3:
                statistic, p_value = stats.shapiro(series) if len(series) <= 5000 else stats.jarque_bera(series)
                normality_results[col] = {
                    "is_normal": p_value > 0.05,
                    "p_value": float(p_value),
                    "test_used": "shapiro" if len(series) <= 5000 else "jarque_bera"
                }
        
        # Perform correlation tests
        correlation_results = {}
        for i, col1 in enumerate(numeric_cols):
            for col2 in numeric_cols[i+1:]:
                series1 = data[col1].dropna()
                series2 = data[col2].dropna()
                
                # Align series
                common_idx = series1.index.intersection(series2.index)
                if len(common_idx) > 3:
                    s1 = series1.loc[common_idx]
                    s2 = series2.loc[common_idx]
                    
                    corr_coef, p_value = stats.pearsonr(s1, s2)
                    correlation_results[f"{col1}_vs_{col2}"] = {
                        "correlation": float(corr_coef),
                        "p_value": float(p_value),
                        "significant": p_value < 0.05,
                        "strength": "strong" if abs(corr_coef) > 0.7 else "moderate" if abs(corr_coef) > 0.4 else "weak"
                    }
        
        results["statistics"] = {
            "normality_tests": normality_results,
            "correlation_tests": correlation_results
        }
        
        # Generate insights
        normal_vars = [col for col, test in normality_results.items() if test["is_normal"]]
        significant_correlations = [pair for pair, test in correlation_results.items() if test["significant"]]
        
        results["insights"] = {
            "normal_distributions": len(normal_vars),
            "significant_relationships": len(significant_correlations),
            "data_quality": "good" if len(normal_vars) > len(numeric_cols) / 2 else "requires_attention"
        }
        
        results["recommendations"] = [
            "Use parametric tests for normally distributed variables",
            "Focus on statistically significant relationships",
            "Consider data transformation for non-normal variables"
        ]
        
    except Exception as e:
        results["error"] = f"Statistical tests failed: {str(e)}"
    
    return results

def perform_exploratory_analysis(data, numeric_cols):
    """Perform general exploratory data analysis"""
    results = {"insights": {}, "statistics": {}, "recommendations": []}
    
    try:
        # Basic statistics for each column
        column_stats = {}
        for col in numeric_cols:
            series = data[col].dropna()
            if len(series) > 0:
                column_stats[col] = {
                    "count": int(len(series)),
                    "mean": float(series.mean()),
                    "median": float(series.median()),
                    "std": float(series.std()),
                    "min": float(series.min()),
                    "max": float(series.max()),
                    "skewness": float(stats.skew(series)),
                    "kurtosis": float(stats.kurtosis(series))
                }
        
        # Overall data insights
        total_variance = sum([stats["std"]**2 for stats in column_stats.values()])
        high_variance_cols = [col for col, stats in column_stats.items() if stats["std"]**2 > total_variance / len(column_stats) * 1.5]
        
        results["statistics"] = {
            "column_statistics": column_stats,
            "high_variance_columns": high_variance_cols,
            "data_shape": {"rows": len(data), "columns": len(numeric_cols)}
        }
        
        results["insights"] = {
            "data_quality": "good",
            "most_variable_columns": high_variance_cols[:3],
            "analysis_readiness": "ready"
        }
        
        results["recommendations"] = [
            "Data is ready for detailed analysis",
            "Focus on high-variance columns for insights",
            "Consider specific analysis types based on business goals"
        ]
        
    except Exception as e:
        results["error"] = f"Exploratory analysis failed: {str(e)}"
    
    return results

if __name__ == "__main__":
    try:
        # Read input from command line arguments
        if len(sys.argv) != 4:
            print(json.dumps({"error": "Invalid arguments. Expected: data_json analysis_type selected_columns"}))
            sys.exit(1)
        
        data_json = json.loads(sys.argv[1])
        analysis_type = sys.argv[2]
        selected_columns = json.loads(sys.argv[3])
        
        # Perform analysis
        results = analyze_data(data_json, analysis_type, selected_columns)
        
        # Output results as JSON
        print(json.dumps(results, indent=2))
        
    except Exception as e:
        print(json.dumps({"error": f"Script execution failed: {str(e)}"}))
        sys.exit(1)
