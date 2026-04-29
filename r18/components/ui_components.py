import streamlit as st
import pandas as pd
import numpy as np
from datetime import datetime, date
from typing import Dict, List, Optional, Any, Tuple
from utils.constants import ANALYSIS_METRICS, COLOR_SCHEMES


def create_data_upload_section() -> Tuple[Optional[Any], bool]:
    """
    创建数据上传区域
    
    Returns:
        (上传的文件对象, 是否选择示例数据)
    """
    st.markdown("""
    <div style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 2rem; border-radius: 15px; margin-bottom: 2rem;'>
        <h1 style='color: white; text-align: center; margin: 0; font-size: 2.5rem;'>📊 销售数据分析与可视化平台</h1>
        <p style='color: rgba(255,255,255,0.9); text-align: center; margin-top: 0.5rem; font-size: 1.1rem;'>
            智能数据分析 · 深度洞察 · 一键生成报告
        </p>
    </div>
    """, unsafe_allow_html=True)

    col1, col2 = st.columns([1, 1])
    
    uploaded_file = None
    use_sample = False

    with col1:
        st.markdown("### 📁 上传数据文件")
        st.markdown("支持 CSV、Excel 格式 (xlsx, xls)")
        
        uploaded_file = st.file_uploader(
            "选择数据文件",
            type=['csv', 'xlsx', 'xls'],
            help="上传您的销售数据文件进行分析"
        )
        
        if uploaded_file:
            st.success(f"✅ 已选择文件: {uploaded_file.name}")

    with col2:
        st.markdown("### 🎯 使用示例数据")
        st.markdown("快速体验平台功能，使用内置示例数据")
        
        use_sample = st.button(
            "🚀 加载示例数据",
            use_container_width=True,
            type="primary"
        )

    st.markdown("---")
    
    return uploaded_file, use_sample


def create_filter_section(filter_options: Dict[str, Any]) -> Tuple[Dict[str, Any], bool, bool]:
    """
    创建筛选条件区域
    
    Args:
        filter_options: 筛选选项字典
        
    Returns:
        (筛选条件字典, 是否点击应用筛选, 是否点击重置筛选)
    """
    st.markdown("""
    <div style='background-color: #f8f9fa; padding: 1.5rem; border-radius: 10px; margin-bottom: 1rem;'>
        <h3 style='margin: 0; color: #333;'>🔍 筛选条件</h3>
    </div>
    """, unsafe_allow_html=True)

    filters = {
        'date_range': (None, None),
        'categories': [],
        'regions': [],
        'products': [],
        'channels': []
    }

    col1, col2, col3 = st.columns(3)

    with col1:
        date_range = filter_options.get('date_range', (None, None))
        if all(date_range):
            min_date, max_date = date_range
            
            selected_date_range = st.date_input(
                "📅 日期范围",
                value=(min_date, max_date),
                min_value=min_date,
                max_value=max_date,
                key="filter_date"
            )
            
            if len(selected_date_range) == 2:
                filters['date_range'] = selected_date_range
            else:
                filters['date_range'] = (min_date, max_date)
        else:
            st.date_input(
                "📅 日期范围",
                disabled=True,
                help="需要有效的日期字段"
            )

    with col2:
        categories = filter_options.get('categories', [])
        if categories:
            filters['categories'] = st.multiselect(
                "🏷️ 商品类别",
                options=categories,
                default=[],
                key="filter_category",
                help="选择要分析的商品类别（留空表示全部）"
            )
        else:
            st.multiselect(
                "🏷️ 商品类别",
                options=[],
                disabled=True,
                help="未检测到类别字段"
            )

    with col3:
        regions = filter_options.get('regions', [])
        if regions:
            filters['regions'] = st.multiselect(
                "🌍 销售地区",
                options=regions,
                default=[],
                key="filter_region",
                help="选择要分析的地区（留空表示全部）"
            )
        else:
            st.multiselect(
                "🌍 销售地区",
                options=[],
                disabled=True,
                help="未检测到地区字段"
            )

    col4, col5 = st.columns(2)

    with col4:
        channels = filter_options.get('channels', [])
        if channels:
            filters['channels'] = st.multiselect(
                "📱 销售渠道",
                options=channels,
                default=[],
                key="filter_channel",
                help="选择要分析的销售渠道（留空表示全部）"
            )
        else:
            st.multiselect(
                "📱 销售渠道",
                options=[],
                disabled=True,
                help="未检测到渠道字段"
            )

    with col5:
        products = filter_options.get('products', [])
        if products and len(products) <= 50:
            filters['products'] = st.multiselect(
                "🛍️ 具体商品",
                options=products,
                default=[],
                key="filter_product",
                help="选择要分析的具体商品（留空表示全部）"
            )
        elif products:
            st.info(f"商品数量较多 ({len(products)} 个)，暂不提供多选筛选")

    col_filter1, col_filter2, _ = st.columns([1, 1, 2])
    with col_filter1:
        apply_filter = st.button(
            "✅ 应用筛选",
            use_container_width=True,
            type="primary"
        )
    with col_filter2:
        reset_filter = st.button(
            "🔄 重置筛选",
            use_container_width=True
        )

    return filters, apply_filter, reset_filter


def create_metric_cards(metrics: Dict[str, Any], num_columns: int = 4) -> None:
    """
    创建核心指标卡片
    
    Args:
        metrics: 指标字典
        num_columns: 每行显示的卡片数量
    """
    st.markdown("""
    <div style='background-color: #f8f9fa; padding: 1.5rem; border-radius: 10px; margin: 2rem 0 1rem 0;'>
        <h3 style='margin: 0; color: #333;'>📈 核心指标概览</h3>
    </div>
    """, unsafe_allow_html=True)

    metric_order = ['total_revenue', 'total_orders', 'total_quantity', 
                   'total_customers', 'avg_order_value', 'total_profit',
                   'profit_margin', 'repeat_purchase_rate']

    display_metrics = []
    for key in metric_order:
        if key in metrics:
            display_metrics.append((key, metrics[key]))

    card_colors = [
        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
        "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
        "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
        "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
        "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
        "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
        "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)"
    ]

    icons = ['💰', '📋', '📦', '👥', '💵', '📈', '📊', '🔄']

    for i in range(0, len(display_metrics), num_columns):
        cols = st.columns(num_columns)
        for j in range(num_columns):
            if i + j < len(display_metrics):
                key, value = display_metrics[i + j]
                metric_info = ANALYSIS_METRICS.get(key, {})
                name = metric_info.get('name', key)
                color_idx = (i + j) % len(card_colors)
                
                try:
                    if 'format' in metric_info:
                        display_value = metric_info['format'].format(value)
                    else:
                        display_value = f"{value:,.2f}"
                except:
                    display_value = str(value)

                with cols[j]:
                    st.markdown(f"""
                    <div style='background: {card_colors[color_idx]}; padding: 1.5rem; border-radius: 15px; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.1);'>
                        <div style='font-size: 2rem; margin-bottom: 0.5rem;'>{icons[color_idx]}</div>
                        <div style='color: rgba(255,255,255,0.9); font-size: 0.9rem; margin-bottom: 0.5rem;'>{name}</div>
                        <div style='color: white; font-size: 1.8rem; font-weight: bold;'>{display_value}</div>
                    </div>
                    """, unsafe_allow_html=True)


def create_validation_report(validation_report: Dict[str, Any]) -> None:
    """
    创建数据验证报告显示
    
    Args:
        validation_report: 验证报告字典
    """
    st.markdown("""
    <div style='background-color: #f8f9fa; padding: 1.5rem; border-radius: 10px; margin: 2rem 0 1rem 0;'>
        <h3 style='margin: 0; color: #333;'>🔍 数据质量检查</h3>
    </div>
    """, unsafe_allow_html=True)

    field_mapping = validation_report.get('field_mapping', {})
    missing_values = validation_report.get('missing_values', {})
    outliers = validation_report.get('outliers', {})
    recommendations = validation_report.get('recommendations', [])
    data_info = validation_report.get('basic_info', {})

    col1, col2, col3 = st.columns(3)

    with col1:
        total_missing = missing_values.get('total_missing', 0)
        st.metric(
            "缺失值数量",
            f"{total_missing:,}",
            delta_color="inverse" if total_missing > 0 else "normal"
        )

    with col2:
        total_outliers = outliers.get('total_outliers', 0)
        st.metric(
            "异常值数量",
            f"{total_outliers:,}",
            delta_color="inverse" if total_outliers > 0 else "normal"
        )

    with col3:
        identified_fields = len(field_mapping)
        st.metric(
            "已识别字段",
            f"{identified_fields} 个"
        )

    st.markdown("#### 📋 字段识别结果")
    
    if field_mapping:
        field_data = []
        for original_col, field_type in field_mapping.items():
            field_data.append({
                '原始列名': original_col,
                '识别类型': field_type
            })
        
        st.dataframe(
            pd.DataFrame(field_data),
            use_container_width=True,
            hide_index=True
        )
    else:
        st.warning("未能识别任何关键字段，请检查数据列名")

    missing_by_col = missing_values.get('missing_by_column', {})
    if missing_by_col:
        st.markdown("#### ⚠️ 缺失值详情")
        missing_data = []
        for col, info in missing_by_col.items():
            missing_data.append({
                '列名': col,
                '缺失数量': info['count'],
                '缺失比例': f"{info['percentage']:.2f}%"
            })
        st.dataframe(
            pd.DataFrame(missing_data),
            use_container_width=True,
            hide_index=True
        )

    outliers_by_col = outliers.get('outliers_by_column', {})
    if outliers_by_col:
        st.markdown("#### 📊 异常值详情")
        outlier_data = []
        for col, info in outliers_by_col.items():
            outlier_data.append({
                '列名': col,
                '异常数量': info['count'],
                '异常比例': f"{info['percentage']:.2f}%",
                '示例值': ', '.join([f"{v:.2f}" if isinstance(v, (int, float)) else str(v) for v in info.get('values', [])[:5]])
            })
        st.dataframe(
            pd.DataFrame(outlier_data),
            use_container_width=True,
            hide_index=True
        )

    if recommendations:
        st.markdown("#### 💡 数据处理建议")
        for i, rec in enumerate(recommendations, 1):
            st.info(f"{i}. {rec}")


def create_conclusions_section(conclusions: Dict[str, Any]) -> None:
    """
    创建分析结论展示区域
    
    Args:
        conclusions: 分析结论字典
    """
    st.markdown("""
    <div style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 1.5rem; border-radius: 10px; margin: 2rem 0 1rem 0;'>
        <h3 style='margin: 0; color: white;'>🎯 智能分析结论</h3>
    </div>
    """, unsafe_allow_html=True)

    key_findings = conclusions.get('key_findings', [])
    opportunities = conclusions.get('opportunities', [])
    risks = conclusions.get('risks', [])
    recommendations = conclusions.get('recommendations', [])

    if key_findings:
        with st.expander("📌 关键发现", expanded=True):
            for finding in key_findings:
                st.success(f"✅ {finding}")

    if opportunities:
        with st.expander("🎯 机会点", expanded=True):
            for opportunity in opportunities:
                st.info(f"💡 {opportunity}")

    if risks:
        with st.expander("⚠️ 风险提示", expanded=True):
            for risk in risks:
                st.warning(f"⚠️ {risk}")

    if recommendations:
        with st.expander("💡 建议措施", expanded=True):
            for i, recommendation in enumerate(recommendations, 1):
                st.markdown(f"**{i}.** {recommendation}")

    if not any([key_findings, opportunities, risks, recommendations]):
        st.info("暂无智能分析结论")


def create_download_section(download_data: Dict[str, Any]) -> None:
    """
    创建下载区域
    
    Args:
        download_data: 下载数据字典
    """
    st.markdown("""
    <div style='background-color: #f8f9fa; padding: 1.5rem; border-radius: 10px; margin: 2rem 0 1rem 0;'>
        <h3 style='margin: 0; color: #333;'>📥 导出分析结果</h3>
    </div>
    """, unsafe_allow_html=True)

    timestamp = download_data.get('timestamp', datetime.now().strftime('%Y%m%d_%H%M%S'))

    col1, col2 = st.columns(2)

    with col1:
        excel_report = download_data.get('excel_report')
        if excel_report:
            st.download_button(
                label="📊 下载完整分析报告 (Excel)",
                data=excel_report,
                file_name=f"销售数据分析报告_{timestamp}.xlsx",
                mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                use_container_width=True,
                type="primary"
            )
            st.caption("包含所有指标、图表数据、分析结论和清洗后数据")

    with col2:
        html_report = download_data.get('html_report')
        if html_report:
            st.download_button(
                label="🌐 下载分析报告 (HTML)",
                data=html_report,
                file_name=f"销售数据分析报告_{timestamp}.html",
                mime="text/html",
                use_container_width=True
            )
            st.caption("美观的HTML格式报告，可直接在浏览器查看")

    col3, col4 = st.columns(2)

    with col3:
        cleaned_csv = download_data.get('cleaned_csv')
        if cleaned_csv:
            st.download_button(
                label="📋 下载清洗后数据 (CSV)",
                data=cleaned_csv,
                file_name=f"清洗后数据_{timestamp}.csv",
                mime="text/csv",
                use_container_width=True
            )
            st.caption("经过数据清洗和筛选后的CSV格式数据")

    with col4:
        cleaned_excel = download_data.get('cleaned_excel')
        if cleaned_excel:
            st.download_button(
                label="📊 下载清洗后数据 (Excel)",
                data=cleaned_excel,
                file_name=f"清洗后数据_{timestamp}.xlsx",
                mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                use_container_width=True
            )
            st.caption("经过数据清洗和筛选后的Excel格式数据")


def create_data_preview(df: pd.DataFrame, max_rows: int = 100) -> None:
    """
    创建数据预览区域
    
    Args:
        df: 数据框
        max_rows: 最大显示行数
    """
    st.markdown("""
    <div style='background-color: #f8f9fa; padding: 1.5rem; border-radius: 10px; margin: 2rem 0 1rem 0;'>
        <h3 style='margin: 0; color: #333;'>📋 数据预览</h3>
    </div>
    """, unsafe_allow_html=True)

    if df is None or len(df) == 0:
        st.info("暂无数据")
        return

    display_df = df.head(max_rows)

    st.markdown(f"""
    <div style='background-color: #e3f2fd; padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 1rem;'>
        <strong>📊 数据规模:</strong> {len(df):,} 行 × {len(df.columns)} 列 
        &nbsp;&nbsp;|&nbsp;&nbsp;
        <strong>显示:</strong> 前 {min(len(df), max_rows)} 行
    </div>
    """, unsafe_allow_html=True)

    st.dataframe(
        display_df,
        use_container_width=True,
        hide_index=True
    )

    st.markdown("#### 📈 数据列信息")
    
    col_info = []
    for col in df.columns:
        col_info.append({
            '列名': col,
            '数据类型': str(df[col].dtype),
            '非空值数': int(df[col].count()),
            '缺失值数': int(df[col].isnull().sum()),
            '唯一值数': int(df[col].nunique())
        })
    
    st.dataframe(
        pd.DataFrame(col_info),
        use_container_width=True,
        hide_index=True
    )
