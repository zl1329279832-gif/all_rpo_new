import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
from collections import defaultdict
from utils.constants import ANALYSIS_METRICS, DEFAULT_CONFIG


class SalesAnalyzer:
    """销售数据分析类 - 负责各类销售分析逻辑"""

    def __init__(self, data_processor, config: Optional[Dict] = None):
        self.data_processor = data_processor
        self.config = config or DEFAULT_CONFIG

    def get_field(self, field_type: str) -> Optional[str]:
        """获取字段列名"""
        return self.data_processor.get_field_column(field_type)

    def calculate_core_metrics(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        计算核心指标
        
        Returns:
            包含总销售额、总订单数、客单价等核心指标的字典
        """
        metrics = {}

        revenue_col = self.get_field('revenue')
        quantity_col = self.get_field('quantity')
        order_col = self.get_field('order_id')
        customer_col = self.get_field('customer_id')
        cost_col = self.get_field('cost')
        profit_col = self.get_field('profit')
        unit_price_col = self.get_field('unit_price')

        if revenue_col and revenue_col in df.columns:
            metrics['total_revenue'] = float(df[revenue_col].sum())
        elif quantity_col and unit_price_col:
            metrics['total_revenue'] = float((df[quantity_col] * df[unit_price_col]).sum())
        else:
            metrics['total_revenue'] = 0

        if order_col and order_col in df.columns:
            metrics['total_orders'] = int(df[order_col].nunique())
        else:
            metrics['total_orders'] = len(df)

        if quantity_col and quantity_col in df.columns:
            metrics['total_quantity'] = int(df[quantity_col].sum())
        else:
            metrics['total_quantity'] = 0

        if customer_col and customer_col in df.columns:
            metrics['total_customers'] = int(df[customer_col].nunique())
        else:
            metrics['total_customers'] = 0

        if metrics['total_orders'] > 0 and metrics['total_revenue'] > 0:
            metrics['avg_order_value'] = metrics['total_revenue'] / metrics['total_orders']
        else:
            metrics['avg_order_value'] = 0

        if profit_col and profit_col in df.columns:
            metrics['total_profit'] = float(df[profit_col].sum())
        elif cost_col and cost_col in df.columns:
            metrics['total_profit'] = metrics['total_revenue'] - float(df[cost_col].sum())
        else:
            metrics['total_profit'] = metrics['total_revenue'] * 0.3

        if metrics['total_revenue'] > 0:
            metrics['profit_margin'] = metrics['total_profit'] / metrics['total_revenue']
        else:
            metrics['profit_margin'] = 0

        metrics['repeat_purchase_rate'] = self._calculate_repeat_purchase_rate(df)

        return metrics

    def _calculate_repeat_purchase_rate(self, df: pd.DataFrame) -> float:
        """计算复购率"""
        customer_col = self.get_field('customer_id')
        order_col = self.get_field('order_id')
        date_col = self.get_field('date')

        if not customer_col or customer_col not in df.columns:
            return 0.0

        if order_col and order_col in df.columns:
            customer_orders = df.groupby(customer_col)[order_col].nunique()
        elif date_col and date_col in df.columns:
            customer_orders = df.groupby(customer_col)[date_col].nunique()
        else:
            customer_orders = df.groupby(customer_col).size()

        total_customers = len(customer_orders)
        repeat_customers = (customer_orders >= 2).sum()

        if total_customers > 0:
            return float(repeat_customers / total_customers)
        return 0.0

    def analyze_sales_trend(self, df: pd.DataFrame, freq: str = 'M') -> pd.DataFrame:
        """
        销售时间趋势分析
        
        Args:
            df: 数据框
            freq: 时间频率 ('D'=日, 'W'=周, 'M'=月, 'Q'=季, 'Y'=年)
            
        Returns:
            按时间分组的销售统计
        """
        date_col = self.get_field('date')
        revenue_col = self.get_field('revenue')
        quantity_col = self.get_field('quantity')
        order_col = self.get_field('order_id')

        if not date_col or date_col not in df.columns:
            return pd.DataFrame()

        df_trend = df.copy()
        df_trend[date_col] = pd.to_datetime(df_trend[date_col], errors='coerce')
        df_trend = df_trend.dropna(subset=[date_col])

        if len(df_trend) == 0:
            return pd.DataFrame()

        df_trend['period'] = df_trend[date_col].dt.to_period(freq)

        agg_dict = {}
        
        if revenue_col and revenue_col in df_trend.columns:
            agg_dict[revenue_col] = 'sum'
        if quantity_col and quantity_col in df_trend.columns:
            agg_dict[quantity_col] = 'sum'
        if order_col and order_col in df_trend.columns:
            agg_dict[order_col] = 'nunique'

        if not agg_dict:
            return pd.DataFrame()

        trend_data = df_trend.groupby('period').agg(agg_dict).reset_index()
        trend_data['period'] = trend_data['period'].astype(str)

        trend_data.columns = ['period'] + [
            'revenue' if col == revenue_col else
            'quantity' if col == quantity_col else
            'orders' if col == order_col else col
            for col in trend_data.columns[1:]
        ]

        return trend_data

    def analyze_product_sales(self, df: pd.DataFrame, top_n: int = None) -> pd.DataFrame:
        """
        商品销量分析
        
        Args:
            df: 数据框
            top_n: 返回前N个商品，默认使用配置值
            
        Returns:
            按销量排序的商品数据
        """
        if top_n is None:
            top_n = self.config['analysis']['top_n_products']

        product_col = self.get_field('product')
        category_col = self.get_field('category')
        revenue_col = self.get_field('revenue')
        quantity_col = self.get_field('quantity')
        unit_price_col = self.get_field('unit_price')

        if not product_col or product_col not in df.columns:
            return pd.DataFrame()

        agg_dict = {}
        
        if quantity_col and quantity_col in df.columns:
            agg_dict[quantity_col] = 'sum'
        else:
            agg_dict[product_col] = 'count'

        if revenue_col and revenue_col in df.columns:
            agg_dict[revenue_col] = 'sum'
        elif quantity_col and unit_price_col:
            pass

        product_data = df.groupby(product_col).agg(agg_dict).reset_index()

        if category_col and category_col in df.columns:
            category_map = df.groupby(product_col)[category_col].first().to_dict()
            product_data['category'] = product_data[product_col].map(category_map)

        quantity_col_name = quantity_col if quantity_col and quantity_col in df.columns else product_col
        product_data = product_data.sort_values(
            by=quantity_col_name, 
            ascending=False
        ).head(top_n)

        column_mapping = {
            product_col: 'product',
            quantity_col: 'quantity',
            revenue_col: 'revenue'
        }
        product_data.columns = [column_mapping.get(col, col) for col in product_data.columns]

        return product_data

    def analyze_region_sales(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        地区销售分布分析
        
        Returns:
            按地区统计的销售数据
        """
        region_col = self.get_field('region')
        revenue_col = self.get_field('revenue')
        quantity_col = self.get_field('quantity')
        order_col = self.get_field('order_id')

        if not region_col or region_col not in df.columns:
            return pd.DataFrame()

        agg_dict = {}
        
        if revenue_col and revenue_col in df.columns:
            agg_dict[revenue_col] = 'sum'
        if quantity_col and quantity_col in df.columns:
            agg_dict[quantity_col] = 'sum'
        if order_col and order_col in df.columns:
            agg_dict[order_col] = 'nunique'

        if not agg_dict:
            agg_dict[region_col] = 'count'

        region_data = df.groupby(region_col).agg(agg_dict).reset_index()

        column_mapping = {
            region_col: 'region',
            revenue_col: 'revenue',
            quantity_col: 'quantity',
            order_col: 'orders'
        }
        region_data.columns = [column_mapping.get(col, col) for col in region_data.columns]

        if 'revenue' in region_data.columns:
            total_revenue = region_data['revenue'].sum()
            if total_revenue > 0:
                region_data['percentage'] = region_data['revenue'] / total_revenue

        return region_data

    def analyze_category_sales(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        商品类别销售分析
        
        Returns:
            按类别统计的销售数据
        """
        category_col = self.get_field('category')
        revenue_col = self.get_field('revenue')
        quantity_col = self.get_field('quantity')
        order_col = self.get_field('order_id')

        if not category_col or category_col not in df.columns:
            return pd.DataFrame()

        agg_dict = {}
        
        if revenue_col and revenue_col in df.columns:
            agg_dict[revenue_col] = 'sum'
        if quantity_col and quantity_col in df.columns:
            agg_dict[quantity_col] = 'sum'
        if order_col and order_col in df.columns:
            agg_dict[order_col] = 'nunique'

        if not agg_dict:
            agg_dict[category_col] = 'count'

        category_data = df.groupby(category_col).agg(agg_dict).reset_index()

        column_mapping = {
            category_col: 'category',
            revenue_col: 'revenue',
            quantity_col: 'quantity',
            order_col: 'orders'
        }
        category_data.columns = [column_mapping.get(col, col) for col in category_data.columns]

        if 'revenue' in category_data.columns:
            total_revenue = category_data['revenue'].sum()
            if total_revenue > 0:
                category_data['percentage'] = category_data['revenue'] / total_revenue

        return category_data

    def analyze_customer_retention(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        客户复购/留存分析
        
        Returns:
            客户分析结果字典
        """
        customer_col = self.get_field('customer_id')
        order_col = self.get_field('order_id')
        date_col = self.get_field('date')
        revenue_col = self.get_field('revenue')

        if not customer_col or customer_col not in df.columns:
            return {
                'customer_distribution': pd.DataFrame(),
                'retention_summary': {}
            }

        df_customers = df.copy()

        if order_col and order_col in df_customers.columns:
            customer_orders = df_customers.groupby(customer_col)[order_col].nunique()
        elif date_col and date_col in df_customers.columns:
            df_customers[date_col] = pd.to_datetime(df_customers[date_col], errors='coerce')
            customer_orders = df_customers.groupby(customer_col)[date_col].nunique()
        else:
            customer_orders = df_customers.groupby(customer_col).size()

        distribution = pd.DataFrame({
            'order_count': customer_orders.value_counts().index,
            'customer_count': customer_orders.value_counts().values
        }).sort_values('order_count')

        total_customers = len(customer_orders)
        one_time_customers = (customer_orders == 1).sum()
        repeat_customers = (customer_orders >= 2).sum()
        loyal_customers = (customer_orders >= 5).sum()

        if revenue_col and revenue_col in df_customers.columns:
            customer_revenue = df_customers.groupby(customer_col)[revenue_col].sum()
            
            rfm_data = pd.DataFrame({
                'frequency': customer_orders,
                'monetary': customer_revenue
            }).dropna()

            if len(rfm_data) > 0:
                rfm_data['f_segment'] = pd.qcut(
                    rfm_data['frequency'], 
                    q=min(4, len(rfm_data['frequency'].unique())),
                    labels=[1, 2, 3, 4] if len(rfm_data['frequency'].unique()) >= 4 else range(1, len(rfm_data['frequency'].unique()) + 1)
                )
                rfm_data['m_segment'] = pd.qcut(
                    rfm_data['monetary'], 
                    q=min(4, len(rfm_data['monetary'].unique())),
                    labels=[1, 2, 3, 4] if len(rfm_data['monetary'].unique()) >= 4 else range(1, len(rfm_data['monetary'].unique()) + 1)
                )
            else:
                rfm_data = pd.DataFrame()
        else:
            rfm_data = pd.DataFrame()

        return {
            'customer_distribution': distribution,
            'retention_summary': {
                'total_customers': int(total_customers),
                'one_time_customers': int(one_time_customers),
                'repeat_customers': int(repeat_customers),
                'loyal_customers': int(loyal_customers),
                'repeat_rate': float(repeat_customers / total_customers) if total_customers > 0 else 0,
                'loyalty_rate': float(loyal_customers / total_customers) if total_customers > 0 else 0
            },
            'rfm_analysis': rfm_data
        }

    def analyze_profit(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        利润分析
        
        Returns:
            利润分析结果字典
        """
        revenue_col = self.get_field('revenue')
        cost_col = self.get_field('cost')
        profit_col = self.get_field('profit')
        product_col = self.get_field('product')
        category_col = self.get_field('category')
        region_col = self.get_field('region')

        result = {
            'summary': {},
            'by_product': pd.DataFrame(),
            'by_category': pd.DataFrame(),
            'by_region': pd.DataFrame()
        }

        if profit_col and profit_col in df.columns:
            total_profit = df[profit_col].sum()
            result['summary']['total_profit'] = float(total_profit)
        elif revenue_col and cost_col:
            if revenue_col in df.columns and cost_col in df.columns:
                result['summary']['total_profit'] = float(df[revenue_col].sum() - df[cost_col].sum())
        elif revenue_col and revenue_col in df.columns:
            result['summary']['total_profit'] = float(df[revenue_col].sum() * 0.3)
        else:
            result['summary']['total_profit'] = 0

        if revenue_col and revenue_col in df.columns:
            total_revenue = df[revenue_col].sum()
            result['summary']['total_revenue'] = float(total_revenue)
            if total_revenue > 0:
                result['summary']['profit_margin'] = result['summary']['total_profit'] / total_revenue
            else:
                result['summary']['profit_margin'] = 0

        if product_col and product_col in df.columns:
            agg_dict = {}
            if profit_col and profit_col in df.columns:
                agg_dict[profit_col] = 'sum'
            if revenue_col and revenue_col in df.columns:
                agg_dict[revenue_col] = 'sum'
            
            if agg_dict:
                product_profit = df.groupby(product_col).agg(agg_dict).reset_index()
                
                column_mapping = {
                    product_col: 'product',
                    profit_col: 'profit',
                    revenue_col: 'revenue'
                }
                product_profit.columns = [column_mapping.get(col, col) for col in product_profit.columns]
                
                if 'profit' in product_profit.columns:
                    product_profit = product_profit.sort_values('profit', ascending=False)
                
                result['by_product'] = product_profit

        if category_col and category_col in df.columns:
            agg_dict = {}
            if profit_col and profit_col in df.columns:
                agg_dict[profit_col] = 'sum'
            if revenue_col and revenue_col in df.columns:
                agg_dict[revenue_col] = 'sum'
            
            if agg_dict:
                category_profit = df.groupby(category_col).agg(agg_dict).reset_index()
                
                column_mapping = {
                    category_col: 'category',
                    profit_col: 'profit',
                    revenue_col: 'revenue'
                }
                category_profit.columns = [column_mapping.get(col, col) for col in category_profit.columns]
                
                if 'profit' in category_profit.columns:
                    category_profit = category_profit.sort_values('profit', ascending=False)
                
                result['by_category'] = category_profit

        if region_col and region_col in df.columns:
            agg_dict = {}
            if profit_col and profit_col in df.columns:
                agg_dict[profit_col] = 'sum'
            if revenue_col and revenue_col in df.columns:
                agg_dict[revenue_col] = 'sum'
            
            if agg_dict:
                region_profit = df.groupby(region_col).agg(agg_dict).reset_index()
                
                column_mapping = {
                    region_col: 'region',
                    profit_col: 'profit',
                    revenue_col: 'revenue'
                }
                region_profit.columns = [column_mapping.get(col, col) for col in region_profit.columns]
                
                if 'profit' in region_profit.columns:
                    region_profit = region_profit.sort_values('profit', ascending=False)
                
                result['by_region'] = region_profit

        return result

    def generate_analysis_conclusions(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        自动生成分析结论
        
        Returns:
            分析结论字典，包含关键发现和建议
        """
        conclusions = {
            'key_findings': [],
            'opportunities': [],
            'risks': [],
            'recommendations': []
        }

        metrics = self.calculate_core_metrics(df)
        
        repeat_rate = metrics.get('repeat_purchase_rate', 0)
        profit_margin = metrics.get('profit_margin', 0)
        avg_order_value = metrics.get('avg_order_value', 0)

        if repeat_rate > 0.5:
            conclusions['key_findings'].append(
                f"客户复购率达到 {repeat_rate:.1%}，客户忠诚度较高，客户关系维护效果良好。"
            )
        elif repeat_rate < 0.2:
            conclusions['risks'].append(
                f"客户复购率较低 ({repeat_rate:.1%})，客户流失风险较高，需关注客户留存策略。"
            )

        if profit_margin > 0.3:
            conclusions['key_findings'].append(
                f"利润率表现优秀 ({profit_margin:.1%})，成本控制效果良好。"
            )
        elif profit_margin < 0.1:
            conclusions['risks'].append(
                f"利润率偏低 ({profit_margin:.1%})，建议优化成本结构或提升产品定价。"
            )

        region_data = self.analyze_region_sales(df)
        if len(region_data) > 0 and 'percentage' in region_data.columns:
            top_region = region_data.iloc[0]
            top_percentage = top_region.get('percentage', 0)
            
            if top_percentage > 0.4:
                conclusions['risks'].append(
                    f"销售区域高度集中，{top_region['region']} 占比超过 40% ({top_percentage:.1%})，存在区域依赖风险。"
                )
            else:
                conclusions['key_findings'].append(
                    f"销售区域分布较为均衡，{top_region['region']} 为最大销售区域 ({top_percentage:.1%})。"
                )

        product_data = self.analyze_product_sales(df, top_n=5)
        if len(product_data) > 0:
            products = product_data['product'].tolist()
            conclusions['key_findings'].append(
                f"热销商品 TOP 5: {', '.join(products[:3])}{' 等' if len(products) > 3 else ''}。建议确保库存供应。"
            )

        category_data = self.analyze_category_sales(df)
        if len(category_data) > 1 and 'percentage' in category_data.columns:
            category_percentages = category_data['percentage'].tolist()
            max_percentage = max(category_percentages)
            min_percentage = min(category_percentages)
            
            if max_percentage - min_percentage > 0.3:
                conclusions['opportunities'].append(
                    "商品类别销售差距较大，低销量类别有增长潜力，建议制定针对性促销策略。"
                )

        trend_data = self.analyze_sales_trend(df, freq='M')
        if len(trend_data) >= 3 and 'revenue' in trend_data.columns:
            revenues = trend_data['revenue'].tolist()
            recent_trend = revenues[-3:]
            
            if len(recent_trend) >= 3:
                if recent_trend[-1] > recent_trend[-2] > recent_trend[-3]:
                    conclusions['key_findings'].append(
                        "近期销售额呈现持续增长趋势，业务发展势态良好。"
                    )
                elif recent_trend[-1] < recent_trend[-2] < recent_trend[-3]:
                    conclusions['risks'].append(
                        "近期销售额呈现连续下滑趋势，需关注市场竞争或营销策略效果。"
                    )

        if repeat_rate < 0.3:
            conclusions['recommendations'].append(
                "建议实施客户忠诚度计划，如会员积分、优惠券等，提升复购率。"
            )

        if profit_margin < 0.15:
            conclusions['recommendations'].append(
                "建议分析成本结构，寻找供应链优化空间，或考虑产品定价策略调整。"
            )

        if len(region_data) > 0:
            conclusions['recommendations'].append(
                "建议关注低销售区域的市场拓展机会，评估新区域市场潜力。"
            )

        return conclusions
