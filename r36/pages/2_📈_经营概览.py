import streamlit as st
import pandas as pd
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core import (
    filter_by_date_and_store,
    get_date_range,
    get_store_list,
    calculate_kpi_metrics,
    calculate_period_comparison,
    calculate_store_metrics,
    calculate_hourly_trend,
    plot_revenue_trend,
    plot_store_comparison,
    plot_hourly_heatmap,
)

st.set_page_config(page_title="经营概览", page_icon="📈", layout="wide")

st.title("📈 经营概览")

if st.session_state.merged_df is None:
    st.warning("⚠️ 请先在 '数据上传与校验' 页面加载并清洗数据")
    st.stop()

merged_df = st.session_state.merged_df

st.sidebar.markdown("### 🔍 筛选条件")

min_date, max_date = get_date_range(merged_df)
date_range = st.sidebar.date_input(
    "选择日期范围",
    value=(min_date, max_date),
    min_value=min_date,
    max_value=max_date,
    key="overview_date_range",
)

stores = get_store_list(merged_df)
store_names = [s["store_name"] for s in stores]
selected_store_names = st.sidebar.multiselect(
    "选择门店",
    options=store_names,
    default=store_names,
    key="overview_stores",
)

selected_store_ids = [s["store_id"] for s in stores if s["store_name"] in selected_store_names]

if len(date_range) == 2:
    filtered_df = filter_by_date_and_store(
        merged_df,
        (date_range[0], date_range[1]),
        selected_store_ids,
    )
    
    st.session_state.date_range = (date_range[0], date_range[1])
    st.session_state.selected_stores = selected_store_ids
    
    if filtered_df.empty:
        st.warning("⚠️ 所选筛选条件下无数据，请调整筛选条件")
        st.stop()
    
    kpi_metrics = calculate_kpi_metrics(filtered_df)
    period_comparison = calculate_period_comparison(
        merged_df, (pd.Timestamp(date_range[0]), pd.Timestamp(date_range[1]))
    )
    
    st.markdown("### 📊 核心指标")
    metric_cols = st.columns(4)
    
    metric_config = [
        ("总营业额", "¥{:,.2f}", "💵"),
        ("总毛利", "¥{:,.2f}", "💰"),
        ("毛利率", "{:.2f}%", "📊"),
        ("订单数", "{:,.0f}", "📋"),
        ("客单价", "¥{:,.2f}", "👤"),
        ("会员订单占比", "{:.2f}%", "🏷️"),
        ("优惠金额", "¥{:,.2f}", "🎁"),
        ("退款金额", "¥{:,.2f}", "💸"),
    ]
    
    for i, (metric_name, format_str, icon) in enumerate(metric_config):
        with metric_cols[i % 4]:
            value = kpi_metrics.get(metric_name, 0)
            delta = None
            if period_comparison and metric_name in period_comparison:
                comp = period_comparison[metric_name]
                change_pct = comp["变化率"]
                delta = f"{change_pct:+.2f}% vs 上期"
            
            st.metric(
                label=f"{icon} {metric_name}",
                value=format_str.format(value),
                delta=delta,
                delta_color="normal" if "退款" not in metric_name else "inverse",
            )
    
    st.markdown("---")
    
    chart_tab1, chart_tab2, chart_tab3 = st.tabs(["📈 趋势分析", "🏪 门店对比", "🕒 时段分析"])
    
    with chart_tab1:
        st.subheader("营业额与毛利趋势")
        
        freq_options = {"按日": "D", "按周": "W", "按月": "M"}
        freq_label = st.selectbox("聚合粒度", options=list(freq_options.keys()), index=0)
        freq = freq_options[freq_label]
        
        trend_fig = plot_revenue_trend(filtered_df, freq)
        st.plotly_chart(trend_fig, use_container_width=True)
        
        with st.expander("📋 查看趋势数据"):
            trend_df = filtered_df.copy()
            trend_df["period"] = trend_df["order_time"].dt.to_period(freq).dt.to_timestamp()
            trend_summary = (
                trend_df.groupby("period")
                .agg(
                    营业额=("pay_amount", "sum"),
                    毛利=("item_gross_margin", "sum"),
                    订单数=("order_id", "nunique"),
                )
                .reset_index()
            )
            st.dataframe(trend_summary, use_container_width=True, hide_index=True)
    
    with chart_tab2:
        st.subheader("门店经营对比")
        
        metric_options = ["营业额", "毛利", "订单数", "客单价"]
        selected_metric = st.selectbox("选择对比指标", options=metric_options, index=0)
        
        store_fig = plot_store_comparison(filtered_df, selected_metric)
        st.plotly_chart(store_fig, use_container_width=True)
        
        st.subheader("门店经营明细")
        store_metrics = calculate_store_metrics(filtered_df)
        if not store_metrics.empty:
            st.dataframe(store_metrics, use_container_width=True, hide_index=True)
    
    with chart_tab3:
        st.subheader("营业时段分析")
        
        heatmap_fig = plot_hourly_heatmap(filtered_df)
        st.plotly_chart(heatmap_fig, use_container_width=True)
        
        st.subheader("时段销售明细")
        hourly_trend = calculate_hourly_trend(filtered_df)
        if not hourly_trend.empty:
            col1, col2 = st.columns(2)
            with col1:
                peak_hour = hourly_trend.loc[hourly_trend["订单数"].idxmax()]
                st.info(f"🕒 订单高峰时段: {peak_hour['order_hour']}:00 ({peak_hour['订单数']} 单)")
            with col2:
                peak_revenue_hour = hourly_trend.loc[hourly_trend["营业额"].idxmax()]
                st.success(f"💰 营收高峰时段: {peak_revenue_hour['order_hour']}:00 (¥{peak_revenue_hour['营业额']:,.0f})")
            
            st.dataframe(hourly_trend, use_container_width=True, hide_index=True)
    
    st.markdown("---")
    
    if st.button("💾 保存分析结果到报告", use_container_width=True):
        st.session_state.analysis_results.update(
            {
                "date_range": (date_range[0], date_range[1]),
                "kpi_metrics": kpi_metrics,
                "store_metrics": calculate_store_metrics(filtered_df),
                "hourly_trend": hourly_trend,
            }
        )
        st.success("✅ 分析结果已保存，可在'报告导出'页面生成报告")
else:
    st.info("请选择完整的日期范围")
