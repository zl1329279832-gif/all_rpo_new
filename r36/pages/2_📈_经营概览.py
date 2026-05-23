import streamlit as st
import pandas as pd
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import plotly.express as px

from core import (
    init_session_state,
    check_data_loaded,
    calculate_kpi_metrics,
    calculate_period_comparison,
    calculate_store_metrics,
    calculate_hourly_trend,
    plot_revenue_trend,
    plot_store_comparison,
    plot_hourly_heatmap,
    render_sidebar_filters,
    calculate_store_ranking,
    calculate_meal_period_performance,
    detect_all_alerts,
    get_alert_summary,
)

st.set_page_config(page_title="经营概览", page_icon="📈", layout="wide")

init_session_state()

st.title("📈 经营概览")

if not check_data_loaded(require_merged=True):
    st.stop()

merged_df = st.session_state.merged_df

filtered_df, filter_dict = render_sidebar_filters(merged_df, st.session_state.cleaned_data)

if filtered_df.empty:
    st.warning("⚠️ 所选筛选条件下无数据，请调整筛选条件")
    st.stop()

date_range = (filter_dict["start_date"], filter_dict["end_date"]) if filter_dict["start_date"] and filter_dict["end_date"] else None
if not date_range or len(date_range) != 2:
    st.info("请选择完整的日期范围")
    st.stop()

alert_report = detect_all_alerts(filtered_df, st.session_state.cleaned_data)
st.session_state.alert_report = alert_report

st.markdown("### 🏥 门店健康评分")
health_cols = st.columns(4)

with health_cols[0]:
    overall_score = alert_report.overall_health_score
    score_color = "#2ecc71" if overall_score >= 80 else "#f39c12" if overall_score >= 60 else "#e74c3c"
    st.metric(
        label="🌟 整体健康评分",
        value=f"{overall_score:.1f}/100",
        delta=f"{alert_report.total_alerts} 个预警",
        delta_color="inverse",
    )

with health_cols[1]:
    critical_count = alert_report.critical_alerts
    st.metric(
        label="🔴 严重预警",
        value=str(critical_count),
        delta="需立即处理" if critical_count > 0 else "正常",
        delta_color="inverse" if critical_count > 0 else "normal",
    )

with health_cols[2]:
    warning_count = alert_report.warning_alerts
    st.metric(
        label="🟡 警告预警",
        value=str(warning_count),
        delta="需关注" if warning_count > 0 else "正常",
        delta_color="inverse" if warning_count > 0 else "normal",
    )

with health_cols[3]:
    info_count = alert_report.info_alerts
    st.metric(
        label="🔵 提示预警",
        value=str(info_count),
        delta="建议查看" if info_count > 0 else "正常",
        delta_color="off" if info_count == 0 else "normal",
    )

if alert_report.store_health_scores:
    with st.expander("📋 各门店健康评分详情", expanded=False):
        store_id_to_name = {}
        if "store_id" in filtered_df.columns and "store_name" in filtered_df.columns:
            store_map = filtered_df[["store_id", "store_name"]].drop_duplicates()
            store_id_to_name = dict(zip(store_map["store_id"].astype(str), store_map["store_name"]))
        
        health_data = []
        for store_id, score in alert_report.store_health_scores.items():
            store_name = store_id_to_name.get(str(store_id), f"门店 {store_id}")
            health_data.append({
                "门店名称": store_name,
                "健康评分": score,
            })
        
        health_df = pd.DataFrame(health_data).sort_values("健康评分", ascending=False)
        st.dataframe(health_df, use_container_width=True, hide_index=True)

st.markdown("---")

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

tab_trend, tab_ranking, tab_meal = st.tabs(["📊 趋势分析", "🏆 门店排名", "🍱 时段分析"])

with tab_trend:
    st.subheader("营业额与毛利趋势")
    
    freq_options = {"按日": "D", "按周": "W", "按月": "M"}
    freq_label = st.selectbox("聚合粒度", options=list(freq_options.keys()), index=0, key="trend_freq")
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
    
    st.markdown("---")
    st.subheader("门店经营对比")
    
    metric_options = ["营业额", "毛利", "订单数", "客单价"]
    selected_metric = st.selectbox("选择对比指标", options=metric_options, index=0, key="store_compare_metric")
    
    store_fig = plot_store_comparison(filtered_df, selected_metric)
    st.plotly_chart(store_fig, use_container_width=True)
    
    st.subheader("门店经营明细")
    store_metrics = calculate_store_metrics(filtered_df)
    if not store_metrics.empty:
        st.dataframe(store_metrics, use_container_width=True, hide_index=True)
    
    st.markdown("---")
    st.subheader("营业时段热力图")
    
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

with tab_ranking:
    st.subheader("🏆 门店排名")
    
    ranking_metric_options = ["营业额", "毛利", "订单数", "客单价", "毛利率"]
    selected_ranking_metric = st.selectbox(
        "选择排名指标",
        options=ranking_metric_options,
        index=0,
        key="ranking_metric",
    )
    
    ranking_df = calculate_store_ranking(filtered_df, selected_ranking_metric)
    
    if not ranking_df.empty:
        col1, col2 = st.columns([3, 2])
        
        with col1:
            st.markdown(f"#### 按{selected_ranking_metric}排名")
            display_cols = [c for c in ranking_df.columns if c not in ["store_id", "city", "area"]]
            st.dataframe(ranking_df[display_cols], use_container_width=True, hide_index=True)
        
        with col2:
            st.markdown(f"#### {selected_ranking_metric}分布图")
            if "store_name" in ranking_df.columns and selected_ranking_metric in ranking_df.columns:
                chart_df = ranking_df.set_index("store_name")[[selected_ranking_metric]].head(15)
                st.bar_chart(chart_df, color="#1f77b4")
    
    with st.expander("📊 完整排名数据"):
        st.dataframe(ranking_df, use_container_width=True, hide_index=True)

with tab_meal:
    st.subheader("🍱 午晚餐表现分析")
    
    meal_period_df = calculate_meal_period_performance(filtered_df)
    
    if not meal_period_df.empty:
        col1, col2 = st.columns([3, 2])
        
        with col1:
            st.markdown("#### 各时段经营指标")
            if "客单价" not in meal_period_df.columns and "营业额" in meal_period_df.columns and "订单数" in meal_period_df.columns:
                meal_period_df["客单价"] = (meal_period_df["营业额"] / meal_period_df["订单数"]).round(2)
            if "毛利率" not in meal_period_df.columns and "毛利" in meal_period_df.columns and "营业额" in meal_period_df.columns:
                meal_period_df["毛利率"] = (meal_period_df["毛利"] / meal_period_df["营业额"] * 100).round(2)
            
            display_cols = ["时段", "订单数", "营业额", "客单价", "毛利率"]
            display_cols = [c for c in display_cols if c in meal_period_df.columns]
            st.dataframe(meal_period_df[display_cols], use_container_width=True, hide_index=True)
        
        with col2:
            st.markdown("#### 营业额占比")
            if "时段" in meal_period_df.columns and "营业额" in meal_period_df.columns:
                pie_fig = px.pie(
                    meal_period_df,
                    values="营业额",
                    names="时段",
                    color_discrete_sequence=["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b"],
                )
                pie_fig.update_traces(
                    textposition="inside",
                    textinfo="percent+label",
                    hovertemplate="%{label}<br>营业额: ¥%{value:,.2f}<br>占比: %{percent}",
                )
                pie_fig.update_layout(
                    showlegend=False,
                    margin=dict(l=0, r=0, t=0, b=0),
                    height=350,
                )
                st.plotly_chart(pie_fig, use_container_width=True)
        
        st.markdown("---")
        st.markdown("#### 时段关键指标")
        metric_cols = st.columns(5)
        period_order = ["早餐", "午餐", "下午茶", "晚餐", "夜宵"]
        available_periods = [p for p in period_order if p in meal_period_df["时段"].values]
        
        for idx, period in enumerate(available_periods):
            period_data = meal_period_df[meal_period_df["时段"] == period].iloc[0]
            with metric_cols[idx % 5]:
                period_icons = {"早餐": "🌅", "午餐": "☀️", "下午茶": "☕", "晚餐": "🌙", "夜宵": "🍜"}
                icon = period_icons.get(period, "🍽️")
                revenue = period_data.get("营业额", 0)
                orders = period_data.get("订单数", 0)
                st.metric(
                    label=f"{icon} {period}",
                    value=f"¥{revenue:,.0f}",
                    delta=f"{orders:,.0f} 单",
                    delta_color="off",
                )

st.markdown("---")

if st.button("💾 保存分析结果到报告", use_container_width=True):
    st.session_state.analysis_results.update(
        {
            "date_range": (date_range[0], date_range[1]),
            "kpi_metrics": kpi_metrics,
            "store_metrics": calculate_store_metrics(filtered_df),
            "hourly_trend": hourly_trend if 'hourly_trend' in locals() else None,
            "store_ranking": ranking_df if 'ranking_df' in locals() else None,
            "meal_period": meal_period_df if 'meal_period_df' in locals() else None,
        }
    )
    st.success("✅ 分析结果已保存，可在'报告导出'页面生成报告")
