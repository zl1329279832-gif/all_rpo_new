import streamlit as st
import pandas as pd
import numpy as np
from datetime import datetime, date
from typing import Dict, List, Optional, Any

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.data_service import DataService
from components.ui_components import (
    create_data_upload_section,
    create_filter_section,
    create_metric_cards,
    create_validation_report,
    create_conclusions_section,
    create_download_section,
    create_data_preview
)
from config.settings import APP_CONFIG


st.set_page_config(
    page_title=APP_CONFIG['page_title'],
    page_icon=APP_CONFIG['page_icon'],
    layout=APP_CONFIG['layout'],
    initial_sidebar_state=APP_CONFIG['initial_sidebar_state'],
    menu_items=APP_CONFIG['menu_items']
)


if 'data_service' not in st.session_state:
    st.session_state.data_service = DataService()

if 'analysis_results' not in st.session_state:
    st.session_state.analysis_results = None

if 'download_data' not in st.session_state:
    st.session_state.download_data = None

if 'filter_applied' not in st.session_state:
    st.session_state.filter_applied = False

if 'current_filters' not in st.session_state:
    st.session_state.current_filters = None


def load_data(uploaded_file, use_sample):
    """加载数据"""
    data_service = st.session_state.data_service
    
    with st.spinner('🔄 正在加载数据...'):
        if use_sample:
            success, message = data_service.load_sample_data()
        elif uploaded_file:
            success, message = data_service.load_uploaded_file(uploaded_file)
        else:
            return False, "请上传数据文件或使用示例数据"
        
        if success:
            st.session_state.analysis_results = data_service.get_full_analysis()
            st.session_state.filter_applied = False
            st.session_state.current_filters = None
        
        return success, message


def apply_filters(filters):
    """应用筛选条件"""
    data_service = st.session_state.data_service
    
    with st.spinner('🔄 正在应用筛选条件...'):
        date_range = filters.get('date_range', (None, None))
        categories = filters.get('categories', [])
        regions = filters.get('regions', [])
        products = filters.get('products', [])
        channels = filters.get('channels', [])

        filtered_df = data_service.apply_filters(
            date_range=date_range,
            categories=categories if categories else None,
            regions=regions if regions else None,
            products=products if products else None,
            channels=channels if channels else None
        )

        st.session_state.analysis_results = data_service.get_full_analysis()
        st.session_state.filter_applied = True
        st.session_state.current_filters = filters
        
        return len(filtered_df)


def generate_downloads():
    """生成下载数据"""
    data_service = st.session_state.data_service
    
    with st.spinner('📦 正在准备下载文件...'):
        st.session_state.download_data = data_service.prepare_downloads()
        return st.session_state.download_data is not None


def main():
    """主应用函数"""
    
    uploaded_file, use_sample = create_data_upload_section()
    
    if uploaded_file or use_sample:
        if use_sample:
            success, message = load_data(None, True)
            if success:
                st.success(message)
            else:
                st.error(message)
        else:
            success, message = load_data(uploaded_file, False)
            if success:
                st.success(message)
            else:
                st.error(message)
    
    data_service = st.session_state.data_service
    
    if data_service.is_data_loaded():
        filter_options = data_service.get_filter_options()
        
        st.markdown("---")
        
        filters, apply_btn, reset_btn = create_filter_section(filter_options)
        
        if apply_btn:
            record_count = apply_filters(filters)
            st.info(f"✅ 筛选完成，共 {record_count:,} 条记录")
        
        if reset_btn:
            data_service.filtered_data = data_service.raw_data.copy()
            st.session_state.analysis_results = data_service.get_full_analysis()
            st.session_state.filter_applied = False
            st.session_state.current_filters = None
            st.info("🔄 筛选条件已重置")
        
        analysis = st.session_state.analysis_results
        
        if analysis:
            metrics = analysis.get('metrics', {})
            if metrics:
                create_metric_cards(metrics)
            
            tab1, tab2, tab3, tab4, tab5 = st.tabs([
                "📈 销售趋势分析",
                "🏷️ 商品与类别分析",
                "🌍 地区销售分析",
                "👥 客户分析",
                "💡 数据质量与结论"
            ])
            
            with tab1:
                render_sales_trend_tab(analysis, data_service)
            
            with tab2:
                render_product_category_tab(analysis, data_service)
            
            with tab3:
                render_region_tab(analysis, data_service)
            
            with tab4:
                render_customer_tab(analysis, data_service)
            
            with tab5:
                render_quality_conclusion_tab(analysis)
            
            st.markdown("---")
            
            col1, col2, col3 = st.columns([1, 1, 2])
            with col1:
                if st.button("📥 准备导出报告", type="primary", use_container_width=True):
                    if generate_downloads():
                        st.success("✅ 报告已准备好！")
            
            if st.session_state.download_data:
                create_download_section(st.session_state.download_data)
            
            st.markdown("---")
            
            with st.expander("📋 查看数据明细", expanded=False):
                preview_df = data_service.get_data_preview(max_rows=100)
                create_data_preview(preview_df)
    
    else:
        st.markdown("""
        <div style='text-align: center; padding: 4rem 2rem;'>
            <div style='font-size: 5rem; margin-bottom: 1rem;'>📊</div>
            <h2 style='color: #666; margin-bottom: 1rem;'>开始您的数据分析之旅</h2>
            <p style='color: #888; font-size: 1.1rem; max-width: 600px; margin: 0 auto;'>
                上传您的销售数据文件或使用示例数据，<br>
                体验智能数据分析与可视化功能
            </p>
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown("""
        ### 📋 支持的数据格式
        
        | 格式 | 扩展名 | 说明 |
        |------|--------|------|
        | CSV | .csv | 逗号分隔值文件 |
        | Excel | .xlsx, .xls | Excel 工作簿文件 |
        
        ### 🎯 建议的数据字段
        
        为获得最佳分析效果，建议数据包含以下字段：
        
        - **日期字段**: 订单日期、销售日期、date 等
        - **订单字段**: 订单编号、order_id 等
        - **客户字段**: 客户编号、customer_id 等
        - **商品字段**: 商品名称、product 等
        - **类别字段**: 商品类别、category 等
        - **数量字段**: 销售数量、quantity 等
        - **金额字段**: 销售金额、revenue 等
        - **成本字段**: 销售成本、cost 等（可选）
        - **利润字段**: 销售利润、profit 等（可选）
        - **地区字段**: 销售地区、region 等
        - **渠道字段**: 销售渠道、channel 等（可选）
        """)


def render_sales_trend_tab(analysis: Dict, data_service: DataService):
    """渲染销售趋势分析标签页"""
    st.markdown("### 📈 销售趋势分析")
    
    trend_data = analysis.get('trend_data', pd.DataFrame())
    
    if len(trend_data) > 0:
        visualizer = data_service.visualizer
        
        col1, col2 = st.columns([1, 3])
        with col1:
            freq_option = st.selectbox(
                "时间粒度",
                options=['按月', '按季', '按年'],
                key="trend_freq"
            )
        
        freq_map = {'按月': 'M', '按季': 'Q', '按年': 'Y'}
        selected_freq = freq_map[freq_option]
        
        if selected_freq != 'M':
            trend_data = data_service.analyzer.analyze_sales_trend(
                data_service.filtered_data,
                freq=selected_freq
            )
        
        y_cols = []
        if 'revenue' in trend_data.columns:
            y_cols.append('revenue')
        if 'quantity' in trend_data.columns:
            y_cols.append('quantity')
        if 'orders' in trend_data.columns:
            y_cols.append('orders')
        
        if y_cols:
            selected_y = st.multiselect(
                "选择指标",
                options=y_cols,
                default=y_cols,
                format_func=lambda x: {
                    'revenue': '销售额',
                    'quantity': '销量',
                    'orders': '订单数'
                }.get(x, x)
            )
            
            if selected_y:
                fig = visualizer.create_trend_chart(
                    data=trend_data,
                    x_col='period',
                    y_cols=selected_y,
                    title=f"销售趋势分析 ({freq_option})",
                    yaxis_title="数值"
                )
                st.plotly_chart(fig, use_container_width=True)
        
        st.markdown("#### 📊 趋势数据明细")
        display_trend = trend_data.copy()
        if 'revenue' in display_trend.columns:
            display_trend['revenue'] = display_trend['revenue'].apply(lambda x: f"¥{x:,.2f}")
        st.dataframe(display_trend, use_container_width=True, hide_index=True)
    
    else:
        st.info("暂无销售趋势数据")


def render_product_category_tab(analysis: Dict, data_service: DataService):
    """渲染商品与类别分析标签页"""
    st.markdown("### 🏷️ 商品与类别分析")
    
    product_subtab, category_subtab = st.tabs(["🛍️ 商品销量排行", "📊 类别销售分析"])
    
    with product_subtab:
        product_sales = analysis.get('product_sales', pd.DataFrame())
        
        if len(product_sales) > 0:
            visualizer = data_service.visualizer
            
            col1, col2 = st.columns([1, 3])
            with col1:
                top_n = st.slider(
                    "显示 TOP N",
                    min_value=5,
                    max_value=20,
                    value=10,
                    key="product_top_n"
                )
            
            display_products = product_sales.head(top_n)
            
            chart_col = 'quantity' if 'quantity' in display_products.columns else display_products.columns[1]
            
            fig = visualizer.create_bar_chart(
                data=display_products,
                x_col='product',
                y_col=chart_col,
                title=f"商品销量排行 TOP {top_n}",
                orientation='h'
            )
            st.plotly_chart(fig, use_container_width=True)
            
            st.markdown("#### 📋 商品销量明细")
            st.dataframe(display_products, use_container_width=True, hide_index=True)
        
        else:
            st.info("暂无商品销售数据")
    
    with category_subtab:
        category_sales = analysis.get('category_sales', pd.DataFrame())
        
        if len(category_sales) > 0:
            visualizer = data_service.visualizer
            
            col1, col2 = st.columns(2)
            
            with col1:
                chart_type = st.radio(
                    "图表类型",
                    options=['柱状图', '饼图'],
                    key="category_chart_type"
                )
            
            if chart_type == '柱状图':
                y_col = 'revenue' if 'revenue' in category_sales.columns else category_sales.columns[1]
                
                fig = visualizer.create_bar_chart(
                    data=category_sales,
                    x_col='category',
                    y_col=y_col,
                    title="类别销售分析",
                    orientation='v'
                )
                st.plotly_chart(fig, use_container_width=True)
            else:
                value_col = 'revenue' if 'revenue' in category_sales.columns else category_sales.columns[1]
                
                fig = visualizer.create_pie_chart(
                    data=category_sales,
                    name_col='category',
                    value_col=value_col,
                    title="类别销售占比",
                    top_n=8
                )
                st.plotly_chart(fig, use_container_width=True)
            
            st.markdown("#### 📋 类别销售明细")
            display_category = category_sales.copy()
            if 'revenue' in display_category.columns:
                display_category['revenue'] = display_category['revenue'].apply(lambda x: f"¥{x:,.2f}")
            if 'percentage' in display_category.columns:
                display_category['percentage'] = display_category['percentage'].apply(lambda x: f"{x:.2%}")
            st.dataframe(display_category, use_container_width=True, hide_index=True)
        
        else:
            st.info("暂无类别销售数据")


def render_region_tab(analysis: Dict, data_service: DataService):
    """渲染地区销售分析标签页"""
    st.markdown("### 🌍 地区销售分析")
    
    region_sales = analysis.get('region_sales', pd.DataFrame())
    
    if len(region_sales) > 0:
        visualizer = data_service.visualizer
        
        chart_tab1, chart_tab2, chart_tab3 = st.tabs(["📊 柱状图", "🥧 饼图", "📋 数据明细"])
        
        with chart_tab1:
            y_col = 'revenue' if 'revenue' in region_sales.columns else region_sales.columns[1]
            
            fig = visualizer.create_bar_chart(
                data=region_sales,
                x_col='region',
                y_col=y_col,
                title="地区销售分布",
                orientation='v'
            )
            st.plotly_chart(fig, use_container_width=True)
        
        with chart_tab2:
            value_col = 'revenue' if 'revenue' in region_sales.columns else region_sales.columns[1]
            
            fig = visualizer.create_pie_chart(
                data=region_sales,
                name_col='region',
                value_col=value_col,
                title="地区销售占比",
                top_n=8
            )
            st.plotly_chart(fig, use_container_width=True)
        
        with chart_tab3:
            st.markdown("#### 📋 地区销售明细")
            display_region = region_sales.copy()
            if 'revenue' in display_region.columns:
                display_region['revenue'] = display_region['revenue'].apply(lambda x: f"¥{x:,.2f}")
            if 'percentage' in display_region.columns:
                display_region['percentage'] = display_region['percentage'].apply(lambda x: f"{x:.2%}")
            st.dataframe(display_region, use_container_width=True, hide_index=True)
    
    else:
        st.info("暂无地区销售数据")


def render_customer_tab(analysis: Dict, data_service: DataService):
    """渲染客户分析标签页"""
    st.markdown("### 👥 客户分析")
    
    customer_analysis = analysis.get('customer_analysis', {})
    retention_summary = customer_analysis.get('retention_summary', {})
    customer_distribution = customer_analysis.get('customer_distribution', pd.DataFrame())
    
    if retention_summary:
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            st.metric(
                "总客户数",
                f"{retention_summary.get('total_customers', 0):,}"
            )
        
        with col2:
            st.metric(
                "复购客户",
                f"{retention_summary.get('repeat_customers', 0):,}"
            )
        
        with col3:
            st.metric(
                "复购率",
                f"{retention_summary.get('repeat_rate', 0):.2%}"
            )
        
        with col4:
            st.metric(
                "忠诚客户(≥5次)",
                f"{retention_summary.get('loyal_customers', 0):,}"
            )
    
    if len(customer_distribution) > 0:
        st.markdown("#### 📊 客户购买频次分布")
        
        visualizer = data_service.visualizer
        
        fig = visualizer.create_bar_chart(
            data=customer_distribution,
            x_col='order_count',
            y_col='customer_count',
            title="客户购买频次分布",
            orientation='v'
        )
        st.plotly_chart(fig, use_container_width=True)
        
        st.dataframe(customer_distribution, use_container_width=True, hide_index=True)
    
    if not retention_summary and len(customer_distribution) == 0:
        st.info("需要客户编号字段进行客户分析")


def render_quality_conclusion_tab(analysis: Dict):
    """渲染数据质量与结论标签页"""
    
    quality_tab, conclusion_tab = st.tabs(["🔍 数据质量检查", "💡 智能分析结论"])
    
    with quality_tab:
        validation_report = analysis.get('validation_report', {})
        if validation_report:
            create_validation_report(validation_report)
        else:
            st.info("暂无数据质量报告")
    
    with conclusion_tab:
        conclusions = analysis.get('conclusions', {})
        if conclusions and any(conclusions.values()):
            create_conclusions_section(conclusions)
        else:
            st.info("暂无智能分析结论")


if __name__ == "__main__":
    main()
