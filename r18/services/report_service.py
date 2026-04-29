import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, List, Optional, Any
import os
from utils.report_generator import ReportGenerator


class ReportService:
    """报告服务类 - 管理报告生成和导出"""

    def __init__(self, report_generator: Optional[ReportGenerator] = None):
        self.report_generator = report_generator

    def generate_report_summary(self,
                                 metrics: Dict[str, Any],
                                 analysis_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        生成报告摘要
        
        Args:
            metrics: 核心指标
            analysis_data: 分析数据
            
        Returns:
            报告摘要字典
        """
        summary = {
            'generated_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'executive_summary': self._generate_executive_summary(metrics, analysis_data),
            'key_metrics': self._format_key_metrics(metrics),
            'data_quality': self._extract_data_quality(analysis_data),
            'action_items': self._extract_action_items(analysis_data)
        }

        return summary

    def _generate_executive_summary(self,
                                     metrics: Dict[str, Any],
                                     analysis_data: Dict[str, Any]) -> str:
        """
        生成执行摘要
        
        Returns:
            执行摘要文本
        """
        parts = []

        total_revenue = metrics.get('total_revenue', 0)
        total_orders = metrics.get('total_orders', 0)
        total_customers = metrics.get('total_customers', 0)
        avg_order_value = metrics.get('avg_order_value', 0)
        repeat_rate = metrics.get('repeat_purchase_rate', 0)

        parts.append(f"本次分析覆盖了 {total_orders:,.0f} 个订单，")
        parts.append(f"实现总销售额 ¥{total_revenue:,.2f}，")
        parts.append(f"涉及 {total_customers:,.0f} 位客户，")
        parts.append(f"平均客单价为 ¥{avg_order_value:,.2f}。")

        if repeat_rate > 0.3:
            parts.append(f"客户复购率达到 {repeat_rate:.1%}，表现优异。")
        elif repeat_rate > 0.15:
            parts.append(f"客户复购率为 {repeat_rate:.1%}，处于中等水平。")
        else:
            parts.append(f"客户复购率为 {repeat_rate:.1%}，有较大提升空间。")

        profit_margin = metrics.get('profit_margin', 0)
        if profit_margin > 0.25:
            parts.append(f"利润率为 {profit_margin:.1%}，盈利能力较强。")
        elif profit_margin > 0.1:
            parts.append(f"利润率为 {profit_margin:.1%}，处于正常范围。")
        else:
            parts.append(f"利润率为 {profit_margin:.1%}，建议关注成本控制。")

        return ' '.join(parts)

    def _format_key_metrics(self, metrics: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        格式化核心指标
        
        Returns:
            格式化的指标列表
        """
        from utils.constants import ANALYSIS_METRICS

        formatted = []
        for key, value in metrics.items():
            metric_info = ANALYSIS_METRICS.get(key, {})
            name = metric_info.get('name', key)
            
            try:
                if 'format' in metric_info:
                    display = metric_info['format'].format(value)
                else:
                    display = f"{value}"
            except:
                display = str(value)

            formatted.append({
                'key': key,
                'name': name,
                'value': value,
                'display': display,
                'category': self._get_metric_category(key)
            })

        return formatted

    def _get_metric_category(self, key: str) -> str:
        """获取指标分类"""
        revenue_metrics = ['total_revenue', 'total_profit', 'profit_margin']
        order_metrics = ['total_orders', 'total_quantity', 'avg_order_value']
        customer_metrics = ['total_customers', 'repeat_purchase_rate']

        if key in revenue_metrics:
            return 'revenue'
        elif key in order_metrics:
            return 'order'
        elif key in customer_metrics:
            return 'customer'
        else:
            return 'other'

    def _extract_data_quality(self, analysis_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        提取数据质量信息
        
        Returns:
            数据质量信息字典
        """
        validation = analysis_data.get('validation_report', {})
        
        missing = validation.get('missing_values', {})
        outliers = validation.get('outliers', {})
        recommendations = validation.get('recommendations', [])

        quality_score = 100
        
        total_missing = missing.get('total_missing', 0)
        data_info = analysis_data.get('data_info', {})
        total_rows = data_info.get('row_count', 1)
        total_cells = total_rows * data_info.get('column_count', 1)
        
        if total_cells > 0:
            missing_ratio = total_missing / total_cells
            quality_score -= missing_ratio * 20

        total_outliers = outliers.get('total_outliers', 0)
        if total_rows > 0:
            outlier_ratio = total_outliers / total_rows
            quality_score -= outlier_ratio * 10

        quality_score = max(0, min(100, quality_score))

        return {
            'quality_score': round(quality_score, 1),
            'missing_values': missing,
            'outliers': outliers,
            'issues': len(recommendations),
            'recommendations': recommendations
        }

    def _extract_action_items(self, analysis_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        提取行动项
        
        Returns:
            行动项列表
        """
        conclusions = analysis_data.get('conclusions', {})
        action_items = []

        risks = conclusions.get('risks', [])
        for i, risk in enumerate(risks):
            action_items.append({
                'type': 'risk',
                'priority': 'high',
                'description': risk,
                'action': f"评估风险并制定缓解措施: {risk}"
            })

        recommendations = conclusions.get('recommendations', [])
        for i, rec in enumerate(recommendations):
            action_items.append({
                'type': 'recommendation',
                'priority': 'medium',
                'description': rec,
                'action': f"实施建议: {rec}"
            })

        opportunities = conclusions.get('opportunities', [])
        for i, opp in enumerate(opportunities):
            action_items.append({
                'type': 'opportunity',
                'priority': 'medium',
                'description': opp,
                'action': f"抓住机会: {opp}"
            })

        return action_items

    def save_report_to_file(self,
                            report_data: bytes,
                            file_path: str,
                            format_type: str = 'xlsx') -> bool:
        """
        保存报告到文件
        
        Args:
            report_data: 报告数据
            file_path: 文件路径
            format_type: 格式类型
            
        Returns:
            是否成功
        """
        try:
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            
            with open(file_path, 'wb') as f:
                f.write(report_data)
            
            return True

        except Exception as e:
            print(f"保存报告失败: {str(e)}")
            return False

    def get_report_filenames(self, base_name: str = "sales_analysis") -> Dict[str, str]:
        """
        生成报告文件名
        
        Args:
            base_name: 基础名称
            
        Returns:
            包含各格式文件名的字典
        """
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        return {
            'excel': f"{base_name}_{timestamp}.xlsx",
            'html': f"{base_name}_{timestamp}.html",
            'csv': f"{base_name}_cleaned_{timestamp}.csv"
        }
