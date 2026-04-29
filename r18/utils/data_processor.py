import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any
from utils.constants import FIELD_PATTERNS, DEFAULT_CONFIG
import re


class DataProcessor:
    """数据处理类 - 负责数据读取、字段识别、清洗和验证"""

    def __init__(self, config: Optional[Dict] = None):
        self.config = config or DEFAULT_CONFIG
        self.field_mapping: Dict[str, str] = {}
        self.data: Optional[pd.DataFrame] = None
        self.data_info: Dict[str, Any] = {}

    def load_data(self, file_path: str, file_type: str) -> Tuple[pd.DataFrame, Dict]:
        """
        从文件加载数据
        
        Args:
            file_path: 文件路径
            file_type: 文件类型 (csv, xlsx, xls)
            
        Returns:
            (DataFrame, 数据信息字典)
        """
        try:
            if file_type.lower() == 'csv':
                self.data = pd.read_csv(file_path, encoding='utf-8-sig')
            elif file_type.lower() in ['xlsx', 'xls']:
                self.data = pd.read_excel(file_path)
            else:
                raise ValueError(f"不支持的文件类型: {file_type}")

            self.data_info = self._generate_data_info()
            self.field_mapping = self._detect_fields()
            
            return self.data, self.data_info

        except Exception as e:
            raise Exception(f"数据加载失败: {str(e)}")

    def _generate_data_info(self) -> Dict[str, Any]:
        """生成数据基本信息"""
        if self.data is None:
            return {}
        
        info = {
            'row_count': len(self.data),
            'column_count': len(self.data.columns),
            'columns': list(self.data.columns),
            'dtypes': {col: str(dtype) for col, dtype in self.data.dtypes.items()},
            'memory_usage': self.data.memory_usage(deep=True).sum() / 1024 / 1024,
            'load_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        return info

    def _detect_fields(self) -> Dict[str, str]:
        """
        自动识别数据字段类型
        返回映射: {原始列名: 标准字段类型}
        """
        if self.data is None:
            return {}

        mapping = {}
        columns_lower = {col.lower(): col for col in self.data.columns}

        for field_type, patterns in FIELD_PATTERNS.items():
            matched = False
            
            for keyword in patterns['keywords']:
                keyword_lower = keyword.lower()
                
                for col_lower, original_col in columns_lower.items():
                    if original_col in mapping.values():
                        continue
                    
                    if keyword_lower in col_lower or col_lower in keyword_lower:
                        mapping[original_col] = field_type
                        matched = True
                        break
                
                if matched:
                    break

        return mapping

    def get_field_column(self, field_type: str) -> Optional[str]:
        """根据字段类型获取原始列名"""
        for col, ftype in self.field_mapping.items():
            if ftype == field_type:
                return col
        return None

    def detect_missing_values(self) -> Dict[str, Any]:
        """检测缺失值"""
        if self.data is None:
            return {}

        missing = self.data.isnull()
        missing_stats = {
            'total_missing': int(missing.sum().sum()),
            'missing_by_column': {
                col: {
                    'count': int(missing[col].sum()),
                    'percentage': float(missing[col].mean() * 100)
                }
                for col in self.data.columns
                if missing[col].sum() > 0
            },
            'rows_with_missing': int(missing.any(axis=1).sum())
        }
        
        return missing_stats

    def detect_outliers(self, method: str = 'iqr') -> Dict[str, Any]:
        """
        检测异常值
        
        Args:
            method: 检测方法 ('iqr' 或 'zscore')
            
        Returns:
            异常值统计信息
        """
        if self.data is None:
            return {}

        numeric_cols = self.data.select_dtypes(include=['int64', 'float64']).columns
        outliers_info = {
            'total_outliers': 0,
            'outliers_by_column': {},
            'method': method
        }

        threshold = self.config['analysis']['outlier_threshold']

        for col in numeric_cols:
            if col not in [self.get_field_column('revenue'), 
                          self.get_field_column('quantity'),
                          self.get_field_column('unit_price'),
                          self.get_field_column('profit')]:
                continue

            data = self.data[col].dropna()
            
            if len(data) == 0:
                continue

            if method == 'iqr':
                Q1 = data.quantile(0.25)
                Q3 = data.quantile(0.75)
                IQR = Q3 - Q1
                lower_bound = Q1 - 1.5 * IQR
                upper_bound = Q3 + 1.5 * IQR
                outlier_mask = (data < lower_bound) | (data > upper_bound)
            else:
                mean = data.mean()
                std = data.std()
                if std == 0:
                    continue
                z_scores = np.abs((data - mean) / std)
                outlier_mask = z_scores > threshold

            outlier_indices = data[outlier_mask].index.tolist()
            outlier_count = len(outlier_indices)

            if outlier_count > 0:
                outliers_info['outliers_by_column'][col] = {
                    'count': outlier_count,
                    'percentage': float(outlier_count / len(data) * 100),
                    'indices': outlier_indices[:100],
                    'values': data.loc[outlier_indices[:10]].tolist()
                }
                outliers_info['total_outliers'] += outlier_count

        return outliers_info

    def validate_data(self) -> Dict[str, Any]:
        """综合数据验证"""
        if self.data is None:
            return {}

        validation = {
            'basic_info': self.data_info,
            'field_mapping': self.field_mapping,
            'missing_values': self.detect_missing_values(),
            'outliers': self.detect_outliers(),
            'data_types': self._analyze_data_types(),
            'recommendations': self._generate_recommendations()
        }

        return validation

    def _analyze_data_types(self) -> Dict[str, Any]:
        """分析数据类型"""
        if self.data is None:
            return {}

        type_analysis = {
            'numeric_columns': [],
            'categorical_columns': [],
            'datetime_columns': [],
            'text_columns': []
        }

        for col in self.data.columns:
            dtype = str(self.data[col].dtype)
            
            if 'int' in dtype or 'float' in dtype:
                type_analysis['numeric_columns'].append(col)
            elif 'datetime' in dtype:
                type_analysis['datetime_columns'].append(col)
            elif self.data[col].dtype == 'object':
                unique_ratio = self.data[col].nunique() / len(self.data[col])
                if unique_ratio < 0.5:
                    type_analysis['categorical_columns'].append(col)
                else:
                    type_analysis['text_columns'].append(col)

        return type_analysis

    def _generate_recommendations(self) -> List[str]:
        """生成数据处理建议"""
        recommendations = []
        
        missing = self.detect_missing_values()
        if missing['total_missing'] > 0:
            recommendations.append(
                f"检测到 {missing['total_missing']} 个缺失值，建议进行填充或删除处理"
            )
        
        outliers = self.detect_outliers()
        if outliers['total_outliers'] > 0:
            recommendations.append(
                f"检测到 {outliers['total_outliers']} 个异常值，建议进行验证或修正"
            )
        
        required_fields = ['date', 'revenue', 'quantity', 'product', 'region']
        missing_fields = [f for f in required_fields if self.get_field_column(f) is None]
        if missing_fields:
            recommendations.append(
                f"以下关键字段未识别: {', '.join(missing_fields)}，可能影响分析功能"
            )

        return recommendations

    def clean_data(self, 
                   fill_missing: bool = True,
                   remove_outliers: bool = False,
                   convert_dates: bool = True) -> pd.DataFrame:
        """
        数据清洗
        
        Args:
            fill_missing: 是否填充缺失值
            remove_outliers: 是否删除异常值
            convert_dates: 是否转换日期格式
            
        Returns:
            清洗后的DataFrame
        """
        if self.data is None:
            raise ValueError("没有加载的数据")

        cleaned_df = self.data.copy()

        if convert_dates:
            date_col = self.get_field_column('date')
            if date_col:
                cleaned_df[date_col] = pd.to_datetime(
                    cleaned_df[date_col],
                    errors='coerce',
                    infer_datetime_format=True
                )

        if fill_missing:
            numeric_cols = cleaned_df.select_dtypes(include=['int64', 'float64']).columns
            for col in numeric_cols:
                cleaned_df[col] = cleaned_df[col].fillna(cleaned_df[col].median())
            
            categorical_cols = cleaned_df.select_dtypes(include=['object']).columns
            for col in categorical_cols:
                cleaned_df[col] = cleaned_df[col].fillna('未知')

        if remove_outliers:
            outliers = self.detect_outliers()
            outlier_indices = set()
            for col_info in outliers['outliers_by_column'].values():
                outlier_indices.update(col_info['indices'])
            
            if outlier_indices:
                cleaned_df = cleaned_df.drop(index=list(outlier_indices))

        return cleaned_df

    def filter_data(self,
                    df: pd.DataFrame,
                    date_range: Optional[Tuple[datetime, datetime]] = None,
                    categories: Optional[List[str]] = None,
                    regions: Optional[List[str]] = None,
                    products: Optional[List[str]] = None) -> pd.DataFrame:
        """
        动态筛选数据
        
        Args:
            df: 原始DataFrame
            date_range: 日期范围 (start_date, end_date)
            categories: 商品类别列表
            regions: 地区列表
            products: 商品列表
            
        Returns:
            筛选后的DataFrame
        """
        filtered = df.copy()

        if date_range:
            date_col = self.get_field_column('date')
            if date_col and date_col in filtered.columns:
                start_date, end_date = date_range
                filtered = filtered[
                    (filtered[date_col] >= start_date) &
                    (filtered[date_col] <= end_date)
                ]

        if categories:
            category_col = self.get_field_column('category')
            if category_col and category_col in filtered.columns:
                filtered = filtered[filtered[category_col].isin(categories)]

        if regions:
            region_col = self.get_field_column('region')
            if region_col and region_col in filtered.columns:
                filtered = filtered[filtered[region_col].isin(regions)]

        if products:
            product_col = self.get_field_column('product')
            if product_col and product_col in filtered.columns:
                filtered = filtered[filtered[product_col].isin(products)]

        return filtered
