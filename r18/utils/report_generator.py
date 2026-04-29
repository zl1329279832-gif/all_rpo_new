import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple
import io
import base64
from utils.constants import ANALYSIS_METRICS, DEFAULT_CONFIG


class ReportGenerator:
    """报告生成类 - 负责生成分析报告和导出数据"""

    def __init__(self, 
                 data_processor,
                 analyzer,
                 visualizer,
                 config: Optional[Dict] = None):
        self.data_processor = data_processor
        self.analyzer = analyzer
        self.visualizer = visualizer
        self.config = config or DEFAULT_CONFIG

    def generate_excel_report(self,
                              df: pd.DataFrame,
                              metrics: Dict[str, Any],
                              analysis_data: Dict[str, Any],
                              include_charts: bool = True) -> bytes:
        """
        生成Excel格式的分析报告
        
        Args:
            df: 原始数据框
            metrics: 核心指标
            analysis_data: 分析数据
            include_charts: 是否包含图表
            
        Returns:
            Excel文件的字节数据
        """
        output = io.BytesIO()
        
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            metrics_sheet_data = []
            for key, value in metrics.items():
                metric_info = ANALYSIS_METRICS.get(key, {})
                name = metric_info.get('name', key)
                try:
                    if 'format' in metric_info:
                        formatted = metric_info['format'].format(value)
                    else:
                        formatted = f"{value}"
                except:
                    formatted = str(value)
                
                metrics_sheet_data.append({
                    '指标名称': name,
                    '英文标识': key,
                    '数值': value,
                    '格式化显示': formatted
                })
            
            metrics_df = pd.DataFrame(metrics_sheet_data)
            metrics_df.to_excel(writer, sheet_name='核心指标', index=False)

            data_summary = pd.DataFrame({
                '统计项': ['数据行数', '数据列数', '数据大小(MB)', '生成时间'],
                '值': [
                    len(df),
                    len(df.columns),
                    round(df.memory_usage(deep=True).sum() / 1024 / 1024, 2),
                    datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                ]
            })
            data_summary.to_excel(writer, sheet_name='数据概览', index=False)

            product_sales = analysis_data.get('product_sales', pd.DataFrame())
            if len(product_sales) > 0:
                product_sales.to_excel(writer, sheet_name='商品销量排行', index=False)

            region_sales = analysis_data.get('region_sales', pd.DataFrame())
            if len(region_sales) > 0:
                region_sales.to_excel(writer, sheet_name='地区销售分布', index=False)

            category_sales = analysis_data.get('category_sales', pd.DataFrame())
            if len(category_sales) > 0:
                category_sales.to_excel(writer, sheet_name='类别销售分析', index=False)

            trend_data = analysis_data.get('trend_data', pd.DataFrame())
            if len(trend_data) > 0:
                trend_data.to_excel(writer, sheet_name='时间趋势', index=False)

            customer_analysis = analysis_data.get('customer_analysis', {})
            customer_distribution = customer_analysis.get('customer_distribution', pd.DataFrame())
            if len(customer_distribution) > 0:
                customer_distribution.to_excel(writer, sheet_name='客户分布', index=False)

            profit_analysis = analysis_data.get('profit_analysis', {})
            profit_by_product = profit_analysis.get('by_product', pd.DataFrame())
            if len(profit_by_product) > 0:
                profit_by_product.to_excel(writer, sheet_name='利润分析', index=False)

            conclusions = analysis_data.get('conclusions', {})
            conclusions_data = []
            
            for category, items in conclusions.items():
                category_name = {
                    'key_findings': '关键发现',
                    'opportunities': '机会点',
                    'risks': '风险提示',
                    'recommendations': '建议措施'
                }.get(category, category)
                
                for item in items:
                    conclusions_data.append({
                        '类别': category_name,
                        '内容': item
                    })
            
            if conclusions_data:
                conclusions_df = pd.DataFrame(conclusions_data)
                conclusions_df.to_excel(writer, sheet_name='分析结论', index=False)

            cleaned_df = self.data_processor.clean_data(
                fill_missing=True,
                remove_outliers=False
            )
            cleaned_df.to_excel(writer, sheet_name='清洗后数据', index=False)

        output.seek(0)
        return output.getvalue()

    def generate_html_report(self,
                            df: pd.DataFrame,
                            metrics: Dict[str, Any],
                            analysis_data: Dict[str, Any],
                            title: str = "销售数据分析报告") -> str:
        """
        生成HTML格式的分析报告
        
        Args:
            df: 原始数据框
            metrics: 核心指标
            analysis_data: 分析数据
            title: 报告标题
            
        Returns:
            HTML字符串
        """
        html_parts = []
        
        html_parts.append(f"""
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        body {{
            font-family: 'Microsoft YaHei', Arial, sans-serif;
            background-color: #f5f7fa;
            color: #333;
            line-height: 1.6;
        }}
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }}
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            border-radius: 15px;
            margin-bottom: 30px;
            text-align: center;
        }}
        .header h1 {{
            font-size: 32px;
            margin-bottom: 10px;
        }}
        .header p {{
            font-size: 16px;
            opacity: 0.9;
        }}
        .section {{
            background: white;
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
        }}
        .section-title {{
            font-size: 24px;
            color: #333;
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 3px solid #667eea;
            display: flex;
            align-items: center;
        }}
        .section-title::before {{
            content: '';
            display: inline-block;
            width: 6px;
            height: 24px;
            background: #667eea;
            margin-right: 15px;
            border-radius: 3px;
        }}
        .metrics-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
        }}
        .metric-card {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            border-radius: 12px;
            text-align: center;
            transition: transform 0.3s ease;
        }}
        .metric-card:hover {{
            transform: translateY(-5px);
        }}
        .metric-card:nth-child(2) {{
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }}
        .metric-card:nth-child(3) {{
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }}
        .metric-card:nth-child(4) {{
            background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
        }}
        .metric-card:nth-child(5) {{
            background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
        }}
        .metric-card:nth-child(6) {{
            background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
        }}
        .metric-title {{
            font-size: 14px;
            opacity: 0.9;
            margin-bottom: 10px;
        }}
        .metric-value {{
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 5px;
        }}
        .metric-label {{
            font-size: 12px;
            opacity: 0.8;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }}
        th, td {{
            padding: 12px 15px;
            text-align: left;
            border-bottom: 1px solid #eee;
        }}
        th {{
            background-color: #f8f9fa;
            font-weight: bold;
            color: #333;
            border-bottom: 2px solid #667eea;
        }}
        tr:hover {{
            background-color: #f8f9fa;
        }}
        .conclusion-item {{
            padding: 15px;
            margin-bottom: 10px;
            border-radius: 8px;
            border-left: 4px solid;
        }}
        .conclusion-finding {{
            background-color: #e3f2fd;
            border-left-color: #2196f3;
        }}
        .conclusion-opportunity {{
            background-color: #e8f5e9;
            border-left-color: #4caf50;
        }}
        .conclusion-risk {{
            background-color: #fff3e0;
            border-left-color: #ff9800;
        }}
        .conclusion-recommendation {{
            background-color: #f3e5f5;
            border-left-color: #9c27b0;
        }}
        .footer {{
            text-align: center;
            padding: 30px;
            color: #666;
            font-size: 14px;
        }}
        .stat-card {{
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 15px;
        }}
        .stat-card h4 {{
            color: #666;
            font-size: 14px;
            margin-bottom: 10px;
        }}
        .stat-card .value {{
            font-size: 28px;
            font-weight: bold;
            color: #667eea;
        }}
        .empty-message {{
            text-align: center;
            padding: 40px;
            color: #999;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{title}</h1>
            <p>生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            <p>数据规模: {len(df)} 行, {len(df.columns)} 列</p>
        </div>
""")

        html_parts.append("""
        <div class="section">
            <div class="section-title">核心指标概览</div>
            <div class="metrics-grid">
""")

        metric_order = ['total_revenue', 'total_orders', 'total_quantity', 
                       'total_customers', 'avg_order_value', 'total_profit',
                       'profit_margin', 'repeat_purchase_rate']
        
        icons = ['💰', '📋', '📦', '👥', '💵', '📈', '📊', '🔄']
        
        for i, key in enumerate(metric_order):
            if key in metrics:
                value = metrics[key]
                metric_info = ANALYSIS_METRICS.get(key, {})
                name = metric_info.get('name', key)
                
                try:
                    if 'format' in metric_info:
                        formatted = metric_info['format'].format(value)
                    else:
                        formatted = f"{value}"
                except:
                    formatted = str(value)
                
                html_parts.append(f"""
                <div class="metric-card">
                    <div class="metric-title">{icons[i % len(icons)]} {name}</div>
                    <div class="metric-value">{formatted}</div>
                </div>
""")

        html_parts.append("""
            </div>
        </div>
""")

        conclusions = analysis_data.get('conclusions', {})
        if conclusions:
            html_parts.append("""
        <div class="section">
            <div class="section-title">智能分析结论</div>
""")

            if conclusions.get('key_findings'):
                html_parts.append("""
            <h3 style="margin-bottom: 15px; color: #2196f3;">📌 关键发现</h3>
""")
                for finding in conclusions['key_findings']:
                    html_parts.append(f"""
            <div class="conclusion-item conclusion-finding">
                <strong>{finding}</strong>
            </div>
""")

            if conclusions.get('opportunities'):
                html_parts.append("""
            <h3 style="margin: 25px 0 15px; color: #4caf50;">🎯 机会点</h3>
""")
                for opportunity in conclusions['opportunities']:
                    html_parts.append(f"""
            <div class="conclusion-item conclusion-opportunity">
                <strong>{opportunity}</strong>
            </div>
""")

            if conclusions.get('risks'):
                html_parts.append("""
            <h3 style="margin: 25px 0 15px; color: #ff9800;">⚠️ 风险提示</h3>
""")
                for risk in conclusions['risks']:
                    html_parts.append(f"""
            <div class="conclusion-item conclusion-risk">
                <strong>{risk}</strong>
            </div>
""")

            if conclusions.get('recommendations'):
                html_parts.append("""
            <h3 style="margin: 25px 0 15px; color: #9c27b0;">💡 建议措施</h3>
""")
                for recommendation in conclusions['recommendations']:
                    html_parts.append(f"""
            <div class="conclusion-item conclusion-recommendation">
                <strong>{recommendation}</strong>
            </div>
""")

            html_parts.append("""
        </div>
""")

        product_sales = analysis_data.get('product_sales', pd.DataFrame())
        if len(product_sales) > 0:
            html_parts.append("""
        <div class="section">
            <div class="section-title">商品销量排行 TOP 10</div>
            <table>
                <thead>
                    <tr>
""")
            for col in product_sales.columns:
                html_parts.append(f"<th>{col}</th>")
            html_parts.append("""
                    </tr>
                </thead>
                <tbody>
""")
            
            for _, row in product_sales.head(10).iterrows():
                html_parts.append("<tr>")
                for col in product_sales.columns:
                    val = row[col]
                    if isinstance(val, (int, float)):
                        val = f"{val:,.2f}"
                    html_parts.append(f"<td>{val}</td>")
                html_parts.append("</tr>")
            
            html_parts.append("""
                </tbody>
            </table>
        </div>
""")

        region_sales = analysis_data.get('region_sales', pd.DataFrame())
        if len(region_sales) > 0:
            html_parts.append("""
        <div class="section">
            <div class="section-title">地区销售分布</div>
            <table>
                <thead>
                    <tr>
""")
            for col in region_sales.columns:
                html_parts.append(f"<th>{col}</th>")
            html_parts.append("""
                    </tr>
                </thead>
                <tbody>
""")
            
            for _, row in region_sales.iterrows():
                html_parts.append("<tr>")
                for col in region_sales.columns:
                    val = row[col]
                    if col == 'percentage' and isinstance(val, (int, float)):
                        val = f"{val:.2%}"
                    elif isinstance(val, (int, float)):
                        val = f"{val:,.2f}"
                    html_parts.append(f"<td>{val}</td>")
                html_parts.append("</tr>")
            
            html_parts.append("""
                </tbody>
            </table>
        </div>
""")

        customer_analysis = analysis_data.get('customer_analysis', {})
        retention_summary = customer_analysis.get('retention_summary', {})
        if retention_summary:
            html_parts.append("""
        <div class="section">
            <div class="section-title">客户留存分析</div>
            <div class="metrics-grid">
""")
            
            customer_metrics = [
                ('total_customers', '总客户数', '👥'),
                ('one_time_customers', '一次购买客户', '1️⃣'),
                ('repeat_customers', '复购客户', '🔄'),
                ('loyal_customers', '忠诚客户(≥5次)', '⭐'),
                ('repeat_rate', '复购率', '📊'),
                ('loyalty_rate', '忠诚度', '💎')
            ]
            
            for key, name, icon in customer_metrics:
                if key in retention_summary:
                    value = retention_summary[key]
                    if key in ['repeat_rate', 'loyalty_rate']:
                        formatted = f"{value:.2%}"
                    else:
                        formatted = f"{int(value):,}"
                    
                    html_parts.append(f"""
                <div class="stat-card">
                    <h4>{icon} {name}</h4>
                    <div class="value">{formatted}</div>
                </div>
""")

            html_parts.append("""
            </div>
        </div>
""")

        profit_analysis = analysis_data.get('profit_analysis', {})
        profit_summary = profit_analysis.get('summary', {})
        if profit_summary:
            html_parts.append("""
        <div class="section">
            <div class="section-title">利润分析概览</div>
            <div class="metrics-grid">
""")
            
            profit_metrics = [
                ('total_revenue', '总销售额', '💰'),
                ('total_profit', '总利润', '📈'),
                ('profit_margin', '利润率', '📊')
            ]
            
            for key, name, icon in profit_metrics:
                if key in profit_summary:
                    value = profit_summary[key]
                    if key == 'profit_margin':
                        formatted = f"{value:.2%}"
                    else:
                        formatted = f"¥{value:,.2f}"
                    
                    html_parts.append(f"""
                <div class="stat-card">
                    <h4>{icon} {name}</h4>
                    <div class="value">{formatted}</div>
                </div>
""")

            html_parts.append("""
            </div>
        </div>
""")

        html_parts.append(f"""
        <div class="footer">
            <p>📊 本报告由销售数据分析与可视化平台自动生成</p>
            <p>© 2024 数据分析系统 | 生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
        </div>
    </div>
</body>
</html>
""")

        return '\n'.join(html_parts)

    def export_cleaned_data(self, df: pd.DataFrame, format_type: str = 'csv') -> bytes:
        """
        导出清洗后的数据
        
        Args:
            df: 数据框
            format_type: 格式类型 ('csv' 或 'xlsx')
            
        Returns:
            文件字节数据
        """
        if format_type.lower() == 'csv':
            output = io.BytesIO()
            df.to_csv(output, index=False, encoding='utf-8-sig')
            output.seek(0)
            return output.getvalue()
        
        elif format_type.lower() in ['xlsx', 'excel']:
            output = io.BytesIO()
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                df.to_excel(writer, index=False, sheet_name='数据')
            output.seek(0)
            return output.getvalue()
        
        else:
            raise ValueError(f"不支持的导出格式: {format_type}")

    def prepare_download_data(self, 
                              df: pd.DataFrame,
                              metrics: Dict[str, Any],
                              analysis_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        准备下载数据
        
        Returns:
            包含各种格式数据的字典
        """
        excel_data = self.generate_excel_report(
            df=df,
            metrics=metrics,
            analysis_data=analysis_data,
            include_charts=True
        )
        
        html_data = self.generate_html_report(
            df=df,
            metrics=metrics,
            analysis_data=analysis_data,
            title="销售数据分析报告"
        )
        
        cleaned_csv = self.export_cleaned_data(df, format_type='csv')
        cleaned_excel = self.export_cleaned_data(df, format_type='xlsx')
        
        return {
            'excel_report': excel_data,
            'html_report': html_data,
            'cleaned_csv': cleaned_csv,
            'cleaned_excel': cleaned_excel,
            'timestamp': datetime.now().strftime('%Y%m%d_%H%M%S')
        }
