import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
import os
import tempfile
from utils.data_processor import DataProcessor
from utils.analyzer import SalesAnalyzer
from utils.visualizer import Visualizer
from utils.report_generator import ReportGenerator
from utils.constants import DEFAULT_CONFIG


class DataService:
    """数据服务类 - 统一管理数据分析流程"""

    def __init__(self, config: Optional[Dict] = None):
        self.config = config or DEFAULT_CONFIG
        self.data_processor: Optional[DataProcessor] = None
        self.analyzer: Optional[SalesAnalyzer] = None
        self.visualizer: Optional[Visualizer] = None
        self.report_generator: Optional[ReportGenerator] = None
        self.raw_data: Optional[pd.DataFrame] = None
        self.filtered_data: Optional[pd.DataFrame] = None
        self.data_info: Dict[str, Any] = {}
        self.validation_report: Dict[str, Any] = {}

    def load_uploaded_file(self, uploaded_file) -> Tuple[bool, str]:
        """
        加载上传的文件
        
        Args:
            uploaded_file: Streamlit上传的文件对象
            
        Returns:
            (是否成功, 消息)
        """
        try:
            file_name = uploaded_file.name
            file_type = file_name.split('.')[-1].lower()

            with tempfile.NamedTemporaryFile(delete=False, suffix=f'.{file_type}') as tmp_file:
                tmp_file.write(uploaded_file.getvalue())
                temp_path = tmp_file.name

            try:
                self.data_processor = DataProcessor(self.config)
                self.raw_data, self.data_info = self.data_processor.load_data(
                    temp_path, file_type
                )
                self.filtered_data = self.raw_data.copy()

                self.analyzer = SalesAnalyzer(self.data_processor, self.config)
                self.visualizer = Visualizer(self.config)
                self.report_generator = ReportGenerator(
                    self.data_processor, 
                    self.analyzer, 
                    self.visualizer,
                    self.config
                )

                self.validation_report = self.data_processor.validate_data()

            finally:
                if os.path.exists(temp_path):
                    os.unlink(temp_path)

            return True, f"数据加载成功！共 {len(self.raw_data)} 行，{len(self.raw_data.columns)} 列"

        except Exception as e:
            return False, f"数据加载失败: {str(e)}"

    def load_sample_data(self) -> Tuple[bool, str]:
        """
        加载示例数据
        
        Returns:
            (是否成功, 消息)
        """
        try:
            sample_data = self._generate_sample_data()
            
            with tempfile.NamedTemporaryFile(delete=False, suffix='.csv') as tmp_file:
                sample_data.to_csv(tmp_file.name, index=False, encoding='utf-8-sig')
                temp_path = tmp_file.name

            try:
                self.data_processor = DataProcessor(self.config)
                self.raw_data, self.data_info = self.data_processor.load_data(
                    temp_path, 'csv'
                )
                self.filtered_data = self.raw_data.copy()

                self.analyzer = SalesAnalyzer(self.data_processor, self.config)
                self.visualizer = Visualizer(self.config)
                self.report_generator = ReportGenerator(
                    self.data_processor, 
                    self.analyzer, 
                    self.visualizer,
                    self.config
                )

                self.validation_report = self.data_processor.validate_data()

            finally:
                if os.path.exists(temp_path):
                    os.unlink(temp_path)

            return True, f"示例数据加载成功！共 {len(self.raw_data)} 行，{len(self.raw_data.columns)} 列"

        except Exception as e:
            return False, f"示例数据加载失败: {str(e)}"

    def _generate_sample_data(self, num_records: int = 5000) -> pd.DataFrame:
        """
        生成示例销售数据
        
        Args:
            num_records: 记录数量
            
        Returns:
            示例数据DataFrame
        """
        np.random.seed(42)

        start_date = datetime(2023, 1, 1)
        end_date = datetime(2024, 12, 31)
        date_range = pd.date_range(start=start_date, end=end_date, freq='D')

        dates = np.random.choice(date_range, size=num_records)

        products = [
            '智能手机 Pro Max', '笔记本电脑 Air', '平板电脑 Mini', 
            '智能手表 Series', '无线耳机 Pro', '蓝牙音箱',
            '游戏手柄', '移动电源', '充电器套装', '数据线',
            '保护壳', '屏幕保护膜', '键盘', '鼠标', '显示器'
        ]

        categories = ['电子产品', '配件', '外设', '服务']
        category_map = {
            '智能手机 Pro Max': '电子产品',
            '笔记本电脑 Air': '电子产品',
            '平板电脑 Mini': '电子产品',
            '智能手表 Series': '电子产品',
            '无线耳机 Pro': '配件',
            '蓝牙音箱': '配件',
            '游戏手柄': '外设',
            '移动电源': '配件',
            '充电器套装': '配件',
            '数据线': '配件',
            '保护壳': '配件',
            '屏幕保护膜': '配件',
            '键盘': '外设',
            '鼠标': '外设',
            '显示器': '外设'
        }

        prices = {
            '智能手机 Pro Max': 5999,
            '笔记本电脑 Air': 7999,
            '平板电脑 Mini': 2999,
            '智能手表 Series': 1999,
            '无线耳机 Pro': 899,
            '蓝牙音箱': 399,
            '游戏手柄': 299,
            '移动电源': 149,
            '充电器套装': 99,
            '数据线': 49,
            '保护壳': 69,
            '屏幕保护膜': 39,
            '键盘': 199,
            '鼠标': 129,
            '显示器': 1599
        }

        regions = ['华东', '华北', '华南', '西南', '西北', '东北', '华中']
        cities = {
            '华东': ['上海', '杭州', '南京', '苏州', '宁波'],
            '华北': ['北京', '天津', '石家庄', '太原', '济南'],
            '华南': ['广州', '深圳', '东莞', '佛山', '厦门'],
            '西南': ['成都', '重庆', '昆明', '贵阳', '南宁'],
            '西北': ['西安', '兰州', '银川', '西宁', '乌鲁木齐'],
            '东北': ['沈阳', '大连', '哈尔滨', '长春', '大庆'],
            '华中': ['武汉', '郑州', '长沙', '合肥', '南昌']
        }

        channels = ['线上商城', '线下门店', '第三方平台', '直播带货', '团购']
        payment_methods = ['微信支付', '支付宝', '银行卡', '信用卡', '货到付款']

        product_list = np.random.choice(products, size=num_records)
        quantities = np.random.randint(1, 5, size=num_records)
        regions_list = np.random.choice(regions, size=num_records)
        cities_list = [np.random.choice(cities[r]) for r in regions_list]

        unit_prices = [prices[p] for p in product_list]
        quantities = np.array(quantities)
        unit_prices = np.array(unit_prices)

        revenues = quantities * unit_prices
        cost_ratios = np.random.uniform(0.4, 0.7, size=num_records)
        costs = revenues * cost_ratios
        profits = revenues - costs

        customer_ids = [f'C{str(i).zfill(6)}' for i in np.random.randint(1, 2000, size=num_records)]
        order_ids = [f'O{str(i).zfill(8)}' for i in np.random.randint(1, 3000, size=num_records)]

        data = {
            '订单日期': dates,
            '订单编号': order_ids,
            '客户编号': customer_ids,
            '商品名称': product_list,
            '商品类别': [category_map[p] for p in product_list],
            '销售数量': quantities,
            '销售单价': unit_prices,
            '销售金额': revenues,
            '销售成本': costs,
            '销售利润': profits,
            '销售地区': regions_list,
            '销售城市': cities_list,
            '销售渠道': np.random.choice(channels, size=num_records),
            '支付方式': np.random.choice(payment_methods, size=num_records)
        }

        df = pd.DataFrame(data)

        date_col = df['订单日期']
        df['订单日期'] = date_col + pd.to_timedelta(
            np.random.randint(0, 24, size=num_records), unit='h'
        ) + pd.to_timedelta(
            np.random.randint(0, 60, size=num_records), unit='m'
        )

        return df

    def is_data_loaded(self) -> bool:
        """检查是否已加载数据"""
        return self.raw_data is not None and self.data_processor is not None

    def get_filter_options(self) -> Dict[str, Any]:
        """
        获取筛选选项
        
        Returns:
            包含日期范围、类别、地区、商品等筛选选项的字典
        """
        if not self.is_data_loaded():
            return {}

        options = {
            'date_range': (None, None),
            'categories': [],
            'regions': [],
            'products': [],
            'channels': []
        }

        date_col = self.data_processor.get_field_column('date')
        if date_col and date_col in self.raw_data.columns:
            dates = pd.to_datetime(self.raw_data[date_col], errors='coerce')
            valid_dates = dates.dropna()
            if len(valid_dates) > 0:
                options['date_range'] = (
                    valid_dates.min().date(),
                    valid_dates.max().date()
                )

        category_col = self.data_processor.get_field_column('category')
        if category_col and category_col in self.raw_data.columns:
            options['categories'] = sorted(self.raw_data[category_col].dropna().unique().tolist())

        region_col = self.data_processor.get_field_column('region')
        if region_col and region_col in self.raw_data.columns:
            options['regions'] = sorted(self.raw_data[region_col].dropna().unique().tolist())

        product_col = self.data_processor.get_field_column('product')
        if product_col and product_col in self.raw_data.columns:
            options['products'] = sorted(self.raw_data[product_col].dropna().unique().tolist())

        channel_col = self.data_processor.get_field_column('channel')
        if channel_col and channel_col in self.raw_data.columns:
            options['channels'] = sorted(self.raw_data[channel_col].dropna().unique().tolist())

        return options

    def apply_filters(self,
                      date_range: Optional[Tuple] = None,
                      categories: Optional[List[str]] = None,
                      regions: Optional[List[str]] = None,
                      products: Optional[List[str]] = None,
                      channels: Optional[List[str]] = None) -> pd.DataFrame:
        """
        应用筛选条件
        
        Args:
            date_range: 日期范围
            categories: 商品类别
            regions: 地区
            products: 商品
            channels: 渠道
            
        Returns:
            筛选后的数据
        """
        if not self.is_data_loaded():
            return pd.DataFrame()

        filtered = self.raw_data.copy()

        if date_range and all(date_range):
            date_col = self.data_processor.get_field_column('date')
            if date_col and date_col in filtered.columns:
                filtered[date_col] = pd.to_datetime(filtered[date_col], errors='coerce')
                start_date, end_date = date_range
                filtered = filtered[
                    (filtered[date_col].dt.date >= start_date) &
                    (filtered[date_col].dt.date <= end_date)
                ]

        if categories and len(categories) > 0:
            category_col = self.data_processor.get_field_column('category')
            if category_col and category_col in filtered.columns:
                filtered = filtered[filtered[category_col].isin(categories)]

        if regions and len(regions) > 0:
            region_col = self.data_processor.get_field_column('region')
            if region_col and region_col in filtered.columns:
                filtered = filtered[filtered[region_col].isin(regions)]

        if products and len(products) > 0:
            product_col = self.data_processor.get_field_column('product')
            if product_col and product_col in filtered.columns:
                filtered = filtered[filtered[product_col].isin(products)]

        if channels and len(channels) > 0:
            channel_col = self.data_processor.get_field_column('channel')
            if channel_col and channel_col in filtered.columns:
                filtered = filtered[filtered[channel_col].isin(channels)]

        self.filtered_data = filtered
        return filtered

    def get_full_analysis(self) -> Dict[str, Any]:
        """
        获取完整分析结果
        
        Returns:
            包含所有分析数据的字典
        """
        if not self.is_data_loaded() or self.filtered_data is None:
            return {}

        df = self.filtered_data

        metrics = self.analyzer.calculate_core_metrics(df)
        trend_data = self.analyzer.analyze_sales_trend(df, freq='M')
        product_sales = self.analyzer.analyze_product_sales(df)
        region_sales = self.analyzer.analyze_region_sales(df)
        category_sales = self.analyzer.analyze_category_sales(df)
        customer_analysis = self.analyzer.analyze_customer_retention(df)
        profit_analysis = self.analyzer.analyze_profit(df)
        conclusions = self.analyzer.generate_analysis_conclusions(df)

        return {
            'metrics': metrics,
            'trend_data': trend_data,
            'product_sales': product_sales,
            'region_sales': region_sales,
            'category_sales': category_sales,
            'customer_analysis': customer_analysis,
            'profit_analysis': profit_analysis,
            'conclusions': conclusions,
            'validation_report': self.validation_report,
            'data_info': self.data_info
        }

    def prepare_downloads(self) -> Optional[Dict[str, Any]]:
        """
        准备下载数据
        
        Returns:
            包含各种格式数据的字典
        """
        if not self.is_data_loaded() or self.filtered_data is None:
            return None

        analysis_data = self.get_full_analysis()
        
        return self.report_generator.prepare_download_data(
            df=self.filtered_data,
            metrics=analysis_data.get('metrics', {}),
            analysis_data=analysis_data
        )

    def get_data_preview(self, max_rows: int = 100) -> pd.DataFrame:
        """
        获取数据预览
        
        Args:
            max_rows: 最大显示行数
            
        Returns:
            预览数据
        """
        if self.filtered_data is not None:
            return self.filtered_data.head(max_rows)
        elif self.raw_data is not None:
            return self.raw_data.head(max_rows)
        return pd.DataFrame()

    def get_column_stats(self) -> Dict[str, Any]:
        """
        获取列统计信息
        
        Returns:
            列统计信息字典
        """
        if self.raw_data is None:
            return {}

        stats = {
            'numeric_columns': {},
            'categorical_columns': {}
        }

        numeric_cols = self.raw_data.select_dtypes(include=['int64', 'float64']).columns
        for col in numeric_cols:
            stats['numeric_columns'][col] = {
                'count': int(self.raw_data[col].count()),
                'missing': int(self.raw_data[col].isnull().sum()),
                'mean': float(self.raw_data[col].mean()) if self.raw_data[col].count() > 0 else 0,
                'min': float(self.raw_data[col].min()) if self.raw_data[col].count() > 0 else 0,
                'max': float(self.raw_data[col].max()) if self.raw_data[col].count() > 0 else 0,
                'median': float(self.raw_data[col].median()) if self.raw_data[col].count() > 0 else 0,
                'std': float(self.raw_data[col].std()) if self.raw_data[col].count() > 1 else 0
            }

        categorical_cols = self.raw_data.select_dtypes(include=['object']).columns
        for col in categorical_cols:
            stats['categorical_columns'][col] = {
                'count': int(self.raw_data[col].count()),
                'missing': int(self.raw_data[col].isnull().sum()),
                'unique': int(self.raw_data[col].nunique()),
                'top_values': self.raw_data[col].value_counts().head(5).to_dict()
            }

        return stats
