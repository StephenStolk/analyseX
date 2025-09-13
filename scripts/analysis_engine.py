import pandas as pd
import numpy as np
from scipy import stats
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score, mean_absolute_error
import json
import sys
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

class DataAnalysisEngine:
    def __init__(self, data_json):
        """Initialize with JSON data from frontend"""
        self.df = pd.DataFrame(data_json)
        self.results = {}
        
    def get_data_summary(self):
        """Get comprehensive data summary"""
        summary = {
            'total_rows': len(self.df),
            'total_columns': len(self.df.columns),
            'numeric_columns': list(self.df.select_dtypes(include=[np.number]).columns),
            'categorical_columns': list(self.df.select_dtypes(include=['object']).columns),
            'missing_values': self.df.isnull().sum().to_dict(),
            'data_types': self.df.dtypes.astype(str).to_dict(),
            'basic_stats': {}
        }
        
        # Add basic statistics for numeric columns
        for col in summary['numeric_columns']:
            summary['basic_stats'][col] = {
                'mean': float(self.df[col].mean()),
                'median': float(self.df[col].median()),
                'std': float(self.df[col].std()),
                'min': float(self.df[col].min()),
                'max': float(self.df[col].max()),
                'count': int(self.df[col].count())
            }
            
        return summary
    
    def run_correlation_analysis(self, columns=None):
        """Perform correlation analysis"""
        if columns is None:
            numeric_cols = self.df.select_dtypes(include=[np.number]).columns
        else:
            numeric_cols = [col for col in columns if col in self.df.select_dtypes(include=[np.number]).columns]
        
        if len(numeric_cols) < 2:
            return {'error': 'Need at least 2 numeric columns for correlation analysis'}
        
        corr_matrix = self.df[numeric_cols].corr()
        
        # Find strongest correlations
        correlations = []
        for i in range(len(numeric_cols)):
            for j in range(i+1, len(numeric_cols)):
                corr_value = corr_matrix.iloc[i, j]
                if not np.isnan(corr_value):
                    correlations.append({
                        'var1': numeric_cols[i],
                        'var2': numeric_cols[j],
                        'correlation': float(corr_value),
                        'strength': self._interpret_correlation(abs(corr_value))
                    })
        
        # Sort by absolute correlation value
        correlations.sort(key=lambda x: abs(x['correlation']), reverse=True)
        
        return {
            'correlation_matrix': corr_matrix.to_dict(),
            'top_correlations': correlations[:10],
            'summary': f"Found {len(correlations)} correlation pairs among {len(numeric_cols)} numeric variables"
        }
    
    def run_regression_analysis(self, target_column, feature_columns=None):
        """Perform regression analysis with feature importance"""
        if target_column not in self.df.columns:
            return {'error': f'Target column {target_column} not found'}
        
        if feature_columns is None:
            feature_columns = [col for col in self.df.select_dtypes(include=[np.number]).columns 
                             if col != target_column]
        
        if len(feature_columns) == 0:
            return {'error': 'No feature columns available for regression'}
        
        # Prepare data
        X = self.df[feature_columns].fillna(self.df[feature_columns].mean())
        y = self.df[target_column].fillna(self.df[target_column].mean())
        
        # Fit models
        rf_model = RandomForestRegressor(n_estimators=100, random_state=42)
        lr_model = LinearRegression()
        
        rf_model.fit(X, y)
        lr_model.fit(X, y)
        
        # Get predictions and metrics
        rf_pred = rf_model.predict(X)
        lr_pred = lr_model.predict(X)
        
        rf_r2 = r2_score(y, rf_pred)
        lr_r2 = r2_score(y, lr_pred)
        
        # Feature importance
        feature_importance = list(zip(feature_columns, rf_model.feature_importances_))
        feature_importance.sort(key=lambda x: x[1], reverse=True)
        
        return {
            'target_column': target_column,
            'feature_columns': feature_columns,
            'random_forest_r2': float(rf_r2),
            'linear_regression_r2': float(lr_r2),
            'feature_importance': [{'feature': feat, 'importance': float(imp)} for feat, imp in feature_importance],
            'top_drivers': feature_importance[:5],
            'model_comparison': 'Random Forest' if rf_r2 > lr_r2 else 'Linear Regression',
            'summary': f"Model explains {max(rf_r2, lr_r2):.1%} of variance in {target_column}"
        }
    
    def run_clustering_analysis(self, columns=None, n_clusters=None):
        """Perform clustering analysis"""
        if columns is None:
            numeric_cols = self.df.select_dtypes(include=[np.number]).columns
        else:
            numeric_cols = [col for col in columns if col in self.df.select_dtypes(include=[np.number]).columns]
        
        if len(numeric_cols) < 2:
            return {'error': 'Need at least 2 numeric columns for clustering'}
        
        # Prepare data
        X = self.df[numeric_cols].fillna(self.df[numeric_cols].mean())
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        # Determine optimal number of clusters if not provided
        if n_clusters is None:
            inertias = []
            K_range = range(2, min(8, len(self.df)//2))
            for k in K_range:
                kmeans = KMeans(n_clusters=k, random_state=42)
                kmeans.fit(X_scaled)
                inertias.append(kmeans.inertia_)
            
            # Simple elbow method
            n_clusters = 3  # Default fallback
            if len(inertias) >= 2:
                diffs = [inertias[i] - inertias[i+1] for i in range(len(inertias)-1)]
                n_clusters = K_range[diffs.index(max(diffs))]
        
        # Perform clustering
        kmeans = KMeans(n_clusters=n_clusters, random_state=42)
        clusters = kmeans.fit_predict(X_scaled)
        
        # Analyze clusters
        cluster_summary = []
        for i in range(n_clusters):
            cluster_data = self.df[clusters == i]
            cluster_info = {
                'cluster_id': i,
                'size': len(cluster_data),
                'percentage': len(cluster_data) / len(self.df) * 100,
                'characteristics': {}
            }
            
            for col in numeric_cols:
                cluster_info['characteristics'][col] = {
                    'mean': float(cluster_data[col].mean()),
                    'vs_overall': float(cluster_data[col].mean() - self.df[col].mean())
                }
            
            cluster_summary.append(cluster_info)
        
        return {
            'n_clusters': n_clusters,
            'cluster_assignments': clusters.tolist(),
            'cluster_summary': cluster_summary,
            'features_used': numeric_cols,
            'summary': f"Identified {n_clusters} distinct groups in your data"
        }
    
    def run_statistical_tests(self, test_type, variables):
        """Perform statistical tests"""
        results = {}
        
        if test_type == 'ttest' and len(variables) == 2:
            # T-test between two groups
            var1, var2 = variables
            if var1 in self.df.columns and var2 in self.df.columns:
                data1 = self.df[var1].dropna()
                data2 = self.df[var2].dropna()
                
                statistic, p_value = stats.ttest_ind(data1, data2)
                
                results = {
                    'test_type': 'Independent T-Test',
                    'variables': variables,
                    'statistic': float(statistic),
                    'p_value': float(p_value),
                    'significant': p_value < 0.05,
                    'interpretation': self._interpret_ttest(p_value, data1.mean(), data2.mean()),
                    'summary': f"Comparing {var1} vs {var2}"
                }
        
        elif test_type == 'anova':
            # ANOVA test
            if len(variables) >= 2:
                groups = [self.df[var].dropna() for var in variables if var in self.df.columns]
                if len(groups) >= 2:
                    statistic, p_value = stats.f_oneway(*groups)
                    
                    results = {
                        'test_type': 'One-Way ANOVA',
                        'variables': variables,
                        'statistic': float(statistic),
                        'p_value': float(p_value),
                        'significant': p_value < 0.05,
                        'interpretation': self._interpret_anova(p_value),
                        'summary': f"Comparing means across {len(variables)} groups"
                    }
        
        return results
    
    def run_time_series_forecast(self, target_column, periods=6):
        """Simple time series forecasting"""
        if target_column not in self.df.columns:
            return {'error': f'Target column {target_column} not found'}
        
        # Simple trend-based forecast
        data = self.df[target_column].dropna()
        
        if len(data) < 3:
            return {'error': 'Need at least 3 data points for forecasting'}
        
        # Calculate trend
        x = np.arange(len(data))
        slope, intercept, r_value, p_value, std_err = stats.linregress(x, data)
        
        # Generate forecast
        future_x = np.arange(len(data), len(data) + periods)
        forecast = slope * future_x + intercept
        
        # Calculate confidence intervals (simple approach)
        residuals = data - (slope * x + intercept)
        mse = np.mean(residuals**2)
        std_error = np.sqrt(mse)
        
        forecast_upper = forecast + 1.96 * std_error
        forecast_lower = forecast - 1.96 * std_error
        
        return {
            'target_column': target_column,
            'historical_data': data.tolist(),
            'forecast': forecast.tolist(),
            'forecast_upper': forecast_upper.tolist(),
            'forecast_lower': forecast_lower.tolist(),
            'trend_slope': float(slope),
            'r_squared': float(r_value**2),
            'periods_forecasted': periods,
            'summary': f"Forecasted {periods} periods for {target_column} with {r_value**2:.1%} trend fit"
        }
    
    def _interpret_correlation(self, corr_value):
        """Interpret correlation strength"""
        if corr_value >= 0.7:
            return 'Strong'
        elif corr_value >= 0.3:
            return 'Moderate'
        elif corr_value >= 0.1:
            return 'Weak'
        else:
            return 'Very Weak'
    
    def _interpret_ttest(self, p_value, mean1, mean2):
        """Interpret t-test results"""
        if p_value < 0.05:
            direction = "higher" if mean1 > mean2 else "lower"
            return f"Statistically significant difference found (p={p_value:.3f}). First group is {direction}."
        else:
            return f"No statistically significant difference found (p={p_value:.3f})."
    
    def _interpret_anova(self, p_value):
        """Interpret ANOVA results"""
        if p_value < 0.05:
            return f"Statistically significant differences found between groups (p={p_value:.3f})."
        else:
            return f"No statistically significant differences found between groups (p={p_value:.3f})."

def main():
    """Main function to handle analysis requests"""
    if len(sys.argv) < 3:
        print(json.dumps({'error': 'Usage: python analysis_engine.py <data_json> <analysis_config>'}))
        return
    
    try:
        # Parse input arguments
        data_json = json.loads(sys.argv[1])
        analysis_config = json.loads(sys.argv[2])
        
        # Initialize analysis engine
        engine = DataAnalysisEngine(data_json)
        
        # Get data summary first
        results = {
            'data_summary': engine.get_data_summary(),
            'analyses': {}
        }
        
        # Perform requested analyses
        analysis_type = analysis_config.get('type', 'summary')
        
        if analysis_type == 'correlation':
            results['analyses']['correlation'] = engine.run_correlation_analysis(
                analysis_config.get('columns')
            )
        
        elif analysis_type == 'regression':
            results['analyses']['regression'] = engine.run_regression_analysis(
                analysis_config['target_column'],
                analysis_config.get('feature_columns')
            )
        
        elif analysis_type == 'clustering':
            results['analyses']['clustering'] = engine.run_clustering_analysis(
                analysis_config.get('columns'),
                analysis_config.get('n_clusters')
            )
        
        elif analysis_type == 'statistical_tests':
            results['analyses']['statistical_tests'] = engine.run_statistical_tests(
                analysis_config['test_type'],
                analysis_config['variables']
            )
        
        elif analysis_type == 'forecast':
            results['analyses']['forecast'] = engine.run_time_series_forecast(
                analysis_config['target_column'],
                analysis_config.get('periods', 6)
            )
        
        elif analysis_type == 'comprehensive':
            # Run multiple analyses
            numeric_cols = results['data_summary']['numeric_columns']
            if len(numeric_cols) >= 2:
                results['analyses']['correlation'] = engine.run_correlation_analysis()
                
                # Use first numeric column as target for regression
                if len(numeric_cols) >= 2:
                    target = numeric_cols[0]
                    features = numeric_cols[1:]
                    results['analyses']['regression'] = engine.run_regression_analysis(target, features)
                
                results['analyses']['clustering'] = engine.run_clustering_analysis()
        
        print(json.dumps(results, indent=2))
        
    except Exception as e:
        print(json.dumps({'error': f'Analysis failed: {str(e)}'}))

if __name__ == '__main__':
    main()
