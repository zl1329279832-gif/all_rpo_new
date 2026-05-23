import os
import io
import pandas as pd
from typing import Dict, Any, Optional
from datetime import datetime
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.chart import BarChart, LineChart, Reference
import plotly.graph_objects as go
import json


def _create_excel_style(workbook: Workbook) -> Dict[str, Any]:
    styles = {}
    styles["header_font"] = Font(name="微软雅黑", size=12, bold=True, color="FFFFFF")
    styles["title_font"] = Font(name="微软雅黑", size=16, bold=True, color="1976D2")
    styles["normal_font"] = Font(name="微软雅黑", size=10)
    styles["highlight_font"] = Font(name="微软雅黑", size=11, bold=True, color="FF9800")

    styles["header_fill"] = PatternFill(start_color="FF1976D2", end_color="FF1976D2", fill_type="solid")
    styles["title_fill"] = PatternFill(start_color="FFE3F2FD", end_color="FFE3F2FD", fill_type="solid")
    styles["alternate_fill"] = PatternFill(start_color="FFF5F5F5", end_color="FFF5F5F5", fill_type="solid")

    styles["center"] = Alignment(horizontal="center", vertical="center", wrap_text=True)
    styles["left"] = Alignment(horizontal="left", vertical="center", wrap_text=True)
    styles["right"] = Alignment(horizontal="right", vertical="center", wrap_text=True)

    thin_border = Border(
        left=Side(style="thin", color="FFCCCCCC"),
        right=Side(style="thin", color="FFCCCCCC"),
        top=Side(style="thin", color="FFCCCCCC"),
        bottom=Side(style="thin", color="FFCCCCCC"),
    )
    styles["border"] = thin_border

    return styles


def _write_dataframe_to_sheet(
    ws,
    df: pd.DataFrame,
    start_row: int,
    styles: Dict[str, Any],
    title: Optional[str] = None,
) -> int:
    current_row = start_row

    if title:
        ws.cell(row=current_row, column=1, value=title)
        ws.cell(row=current_row, column=1).font = styles["title_font"]
        ws.cell(row=current_row, column=1).fill = styles["title_fill"]
        ws.cell(row=current_row, column=1).alignment = styles["center"]
        ws.merge_cells(
            start_row=current_row,
            start_column=1,
            end_row=current_row,
            end_column=len(df.columns) if not df.empty else 1,
        )
        current_row += 1

    if not df.empty:
        for col_idx, col_name in enumerate(df.columns, 1):
            cell = ws.cell(row=current_row, column=col_idx, value=str(col_name))
            cell.font = styles["header_font"]
            cell.fill = styles["header_fill"]
            cell.alignment = styles["center"]
            cell.border = styles["border"]
        current_row += 1

        for row_idx, (_, row) in enumerate(df.iterrows()):
            for col_idx, value in enumerate(row, 1):
                cell = ws.cell(row=current_row, column=col_idx, value=value)
                cell.font = styles["normal_font"]
                cell.alignment = styles["center"] if col_idx > 1 else styles["left"]
                cell.border = styles["border"]
                if row_idx % 2 == 1:
                    cell.fill = styles["alternate_fill"]
            current_row += 1

        for col_idx in range(1, len(df.columns) + 1):
            ws.column_dimensions[get_column_letter(col_idx)].width = max(
                15, len(str(df.columns[col_idx - 1])) * 2 + 5
            )
    else:
        ws.cell(row=current_row, column=1, value="暂无数据")
        current_row += 1

    current_row += 1
    return current_row


def generate_excel_report(
    analysis_results: Dict[str, Any],
    output_path: Optional[str] = None,
) -> bytes:
    wb = Workbook()
    styles = _create_excel_style(wb)

    ws = wb.active
    ws.title = "报告概览"
    ws.sheet_view.showGridLines = False

    current_row = 1
    ws.cell(row=current_row, column=1, value="连锁餐饮数据分析报告")
    ws.cell(row=current_row, column=1).font = Font(name="微软雅黑", size=20, bold=True, color="1976D2")
    ws.merge_cells(start_row=current_row, start_column=1, end_row=current_row, end_column=5)
    current_row += 2

    ws.cell(row=current_row, column=1, value=f"生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    ws.cell(row=current_row, column=1).font = styles["normal_font"]
    current_row += 1

    date_range = analysis_results.get("date_range", ("未指定", "未指定"))
    ws.cell(row=current_row, column=1, value=f"分析周期: {date_range[0]} 至 {date_range[1]}")
    ws.cell(row=current_row, column=1).font = styles["normal_font"]
    current_row += 2

    kpi_data = analysis_results.get("kpi_metrics", {})
    if kpi_data:
        ws.cell(row=current_row, column=1, value="核心指标")
        ws.cell(row=current_row, column=1).font = styles["highlight_font"]
        current_row += 1
        kpi_df = pd.DataFrame([{"指标": k, "数值": v} for k, v in kpi_data.items()])
        current_row = _write_dataframe_to_sheet(ws, kpi_df, current_row, styles)

    if "store_metrics" in analysis_results:
        ws_store = wb.create_sheet("门店分析")
        _write_dataframe_to_sheet(ws_store, analysis_results["store_metrics"], 1, styles, "门店经营指标")

    if "dish_metrics" in analysis_results:
        ws_dish = wb.create_sheet("菜品分析")
        _write_dataframe_to_sheet(ws_dish, analysis_results["dish_metrics"].head(30), 1, styles, "菜品销售排行TOP30")

    if "category_metrics" in analysis_results:
        ws_cat = wb.create_sheet("品类分析")
        _write_dataframe_to_sheet(ws_cat, analysis_results["category_metrics"], 1, styles, "品类销售分析")

    if "rfm_result" in analysis_results:
        ws_rfm = wb.create_sheet("会员分析")
        _write_dataframe_to_sheet(ws_rfm, analysis_results["rfm_result"], 1, styles, "会员RFM分析")

    if "promotion_metrics" in analysis_results:
        ws_promo = wb.create_sheet("活动分析")
        _write_dataframe_to_sheet(ws_promo, analysis_results["promotion_metrics"], 1, styles, "促销活动效果分析")

    if "refund_analysis" in analysis_results and "退款原因分布" in analysis_results["refund_analysis"]:
        ws_refund = wb.create_sheet("退款分析")
        refund_df = analysis_results["refund_analysis"]["退款原因分布"]
        _write_dataframe_to_sheet(ws_refund, refund_df, 1, styles, "退款原因分析")

    if "anomaly_stores" in analysis_results:
        ws_anomaly = wb.create_sheet("异常检测")
        _write_dataframe_to_sheet(ws_anomaly, analysis_results["anomaly_stores"], 1, styles, "门店异常检测")

    if "hourly_trend" in analysis_results:
        ws_hourly = wb.create_sheet("时段分析")
        _write_dataframe_to_sheet(ws_hourly, analysis_results["hourly_trend"], 1, styles, "营业时段分析")

    if "dish_combinations" in analysis_results:
        ws_combo = wb.create_sheet("菜品组合")
        _write_dataframe_to_sheet(ws_combo, analysis_results["dish_combinations"].head(30), 1, styles, "热门菜品组合")

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)

    if output_path:
        with open(output_path, "wb") as f:
            f.write(output.getvalue())
        return output_path

    return output.getvalue()


def generate_html_report(
    analysis_results: Dict[str, Any],
    template_path: Optional[str] = None,
) -> str:
    date_range = analysis_results.get("date_range", ("未指定", "未指定"))
    kpi_data = analysis_results.get("kpi_metrics", {})

    html_content = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>连锁餐饮数据分析报告</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            font-family: 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 40px 20px;
        }}
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }}
        .header {{
            background: linear-gradient(135deg, #1976D2 0%, #0D47A1 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }}
        .header h1 {{ font-size: 32px; margin-bottom: 10px; }}
        .header p {{ opacity: 0.9; font-size: 14px; }}
        .content {{ padding: 40px; }}
        .section {{ margin-bottom: 40px; }}
        .section-title {{
            font-size: 24px;
            color: #1976D2;
            border-bottom: 3px solid #FF9800;
            padding-bottom: 10px;
            margin-bottom: 20px;
            display: inline-block;
        }}
        .kpi-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }}
        .kpi-card {{
            background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%);
            padding: 25px;
            border-radius: 12px;
            border-left: 5px solid #1976D2;
        }}
        .kpi-card .label {{ font-size: 14px; color: #666; margin-bottom: 8px; }}
        .kpi-card .value {{ font-size: 28px; font-weight: bold; color: #1976D2; }}
        table {{
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }}
        th {{
            background: #1976D2;
            color: white;
            padding: 12px 15px;
            text-align: left;
            font-weight: 600;
        }}
        td {{ padding: 12px 15px; border-bottom: 1px solid #eee; }}
        tr:hover {{ background: #F5F5F5; }}
        tr:nth-child(even) {{ background: #FAFAFA; }}
        tr:nth-child(even):hover {{ background: #F5F5F5; }}
        .footer {{
            background: #F5F5F5;
            padding: 20px;
            text-align: center;
            color: #999;
            font-size: 12px;
        }}
        .badge {{
            display: inline-block;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }}
        .badge-success {{ background: #C8E6C9; color: #2E7D32; }}
        .badge-warning {{ background: #FFECB3; color: #F57F17; }}
        .badge-danger {{ background: #FFCDD2; color: #C62828; }}
        .badge-info {{ background: #B3E5FC; color: #01579B; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🍜 连锁餐饮数据分析报告</h1>
            <p>分析周期: {date_range[0]} 至 {date_range[1]}</p>
            <p>生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
        </div>
        <div class="content">
"""

    if kpi_data:
        html_content += """
            <div class="section">
                <h2 class="section-title">📊 核心指标概览</h2>
                <div class="kpi-grid">
"""
        for label, value in kpi_data.items():
            if isinstance(value, float):
                display_value = f"{value:,.2f}"
            else:
                display_value = f"{value:,}"
            if "率" in label or "比" in label:
                display_value += "%"
            elif "金额" in label or "营业额" in label or "毛利" in label or "单价" in label:
                display_value = "¥" + display_value
            html_content += f"""
                    <div class="kpi-card">
                        <div class="label">{label}</div>
                        <div class="value">{display_value}</div>
                    </div>
"""
        html_content += """
                </div>
            </div>
"""

    if "store_metrics" in analysis_results:
        df = analysis_results["store_metrics"].head(10)
        html_content += _df_to_html(df, "🏪 门店经营分析")

    if "dish_metrics" in analysis_results:
        df = analysis_results["dish_metrics"].head(15)
        html_content += _df_to_html(df, "🍲 菜品销售排行TOP15")

    if "category_metrics" in analysis_results:
        df = analysis_results["category_metrics"]
        html_content += _df_to_html(df, "🥡 品类销售分析")

    if "rfm_result" in analysis_results:
        df = analysis_results["rfm_result"].head(20)
        html_content += _df_to_html(df, "👥 会员价值分析")

    if "promotion_metrics" in analysis_results:
        df = analysis_results["promotion_metrics"]
        html_content += _df_to_html(df, "🎁 促销活动效果")

    if "anomaly_stores" in analysis_results:
        df = analysis_results["anomaly_stores"]
        html_content += _df_to_html(df, "⚠️ 门店异常检测")

    if "refund_analysis" in analysis_results and "退款原因分布" in analysis_results["refund_analysis"]:
        df = analysis_results["refund_analysis"]["退款原因分布"]
        html_content += _df_to_html(df, "💸 退款原因分析")

    if "dish_combinations" in analysis_results:
        df = analysis_results["dish_combinations"].head(15)
        html_content += _df_to_html(df, "🍱 热门菜品组合")

    html_content += f"""
        </div>
        <div class="footer">
            <p>本报告由连锁餐饮数据分析平台自动生成 | 数据更新时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
        </div>
    </div>
</body>
</html>
"""

    return html_content


def _df_to_html(df: pd.DataFrame, title: str) -> str:
    if df.empty:
        return ""

    html = f"""
            <div class="section">
                <h2 class="section-title">{title}</h2>
                <table>
                    <thead>
                        <tr>
"""
    for col in df.columns:
        html += f"<th>{col}</th>"
    html += """
                        </tr>
                    </thead>
                    <tbody>
"""
    for _, row in df.iterrows():
        html += "<tr>"
        for col in df.columns:
            value = row[col]
            if "状态" in str(col):
                if "异常" in str(value):
                    badge_class = "badge-danger"
                elif "正常" in str(value):
                    badge_class = "badge-success"
                else:
                    badge_class = "badge-info"
                html += f'<td><span class="badge {badge_class}">{value}</span></td>'
            elif isinstance(value, float):
                html += f"<td>{value:,.2f}</td>"
            else:
                html += f"<td>{value}</td>"
        html += "</tr>"
    html += """
                    </tbody>
                </table>
            </div>
"""
    return html
