import streamlit as st
import pandas as pd
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import plotly.express as px
import plotly.graph_objects as go

from core import (
    init_session_state,
    check_data_loaded,
    render_sidebar_filters,
    detect_all_alerts,
    get_alert_summary,
    DEFAULT_THRESHOLDS,
)

st.set_page_config(page_title="智能预警中心", page_icon="⚠️", layout="wide")

init_session_state()

st.title("⚠️ 智能预警中心")

if not check_data_loaded(require_merged=True):
    st.stop()

merged_df = st.session_state.merged_df
cleaned_data = st.session_state.cleaned_data

filtered_df, filter_dict = render_sidebar_filters(merged_df, cleaned_data)

if filtered_df.empty:
    st.warning("⚠️ 所选筛选条件下无数据，请调整筛选条件")
    st.stop()

date_range = (filter_dict["start_date"], filter_dict["end_date"]) if filter_dict["start_date"] and filter_dict["end_date"] else None
if not date_range or len(date_range) != 2:
    st.info("请选择完整的日期范围")
    st.stop()

if "custom_thresholds" not in st.session_state:
    st.session_state.custom_thresholds = DEFAULT_THRESHOLDS.copy()

custom_thresholds = st.session_state.custom_thresholds

alert_report = detect_all_alerts(filtered_df, cleaned_data, custom_thresholds)
st.session_state.alert_report = alert_report

tab_overview, tab_store_health, tab_trend_alerts, tab_config = st.tabs([
    "🔔 预警总览",
    "🏪 门店健康",
    "📉 趋势预警",
    "⚙️ 预警配置",
])

with tab_overview:
    st.subheader("📊 预警概览仪表盘")
    
    kpi_cols = st.columns(4)
    
    overall_score = alert_report.overall_health_score
    score_color = "#2ecc71" if overall_score >= 80 else "#f39c12" if overall_score >= 60 else "#e74c3c"
    
    with kpi_cols[0]:
        st.metric(
            label="🔔 总预警数",
            value=str(alert_report.total_alerts),
            delta=f"严重: {alert_report.critical_alerts}" if alert_report.critical_alerts > 0 else "无严重预警",
            delta_color="inverse" if alert_report.critical_alerts > 0 else "normal",
        )
    
    with kpi_cols[1]:
        st.metric(
            label="🔴 严重预警",
            value=str(alert_report.critical_alerts),
            delta="需立即处理" if alert_report.critical_alerts > 0 else "正常",
            delta_color="inverse" if alert_report.critical_alerts > 0 else "normal",
        )
    
    with kpi_cols[2]:
        st.metric(
            label="🟡 警告预警",
            value=str(alert_report.warning_alerts),
            delta="需关注" if alert_report.warning_alerts > 0 else "正常",
            delta_color="inverse" if alert_report.warning_alerts > 0 else "normal",
        )
    
    with kpi_cols[3]:
        st.metric(
            label="🌟 整体健康评分",
            value=f"{overall_score:.1f}/100",
            delta=f"{alert_report.info_alerts} 个提示",
            delta_color="off" if overall_score >= 80 else "inverse",
        )
    
    st.markdown("---")
    
    col1, col2 = st.columns([1, 2])
    
    with col1:
        st.markdown("#### 🥧 预警类型分布")
        alert_summary = get_alert_summary(alert_report)
        if not alert_summary.empty:
            pie_fig = px.pie(
                alert_summary,
                values="预警数量",
                names="预警类型",
                color_discrete_sequence=["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd"],
                hole=0.4,
            )
            pie_fig.update_traces(
                textposition="inside",
                textinfo="percent+label",
                hovertemplate="%{label}<br>数量: %{value}<br>占比: %{percent}",
            )
            pie_fig.update_layout(
                showlegend=False,
                margin=dict(l=0, r=0, t=0, b=0),
                height=350,
            )
            st.plotly_chart(pie_fig, use_container_width=True)
        else:
            st.info("✅ 暂无预警数据")
    
    with col2:
        st.markdown("#### 📋 预警列表")
        
        severity_filter = st.multiselect(
            "按严重程度筛选",
            options=["🔴 严重", "🟡 警告", "🔵 提示"],
            default=["🔴 严重", "🟡 警告", "🔵 提示"],
            key="overview_severity_filter",
        )
        
        alerts_df = alert_report.to_dataframe()
        if not alerts_df.empty and severity_filter:
            filtered_alerts = alerts_df[alerts_df["严重程度"].isin(severity_filter)]
            
            st.dataframe(
                filtered_alerts,
                use_container_width=True,
                hide_index=True,
                column_config={
                    "严重程度": st.column_config.TextColumn("严重程度", width="small"),
                    "预警类型": st.column_config.TextColumn("预警类型", width="medium"),
                    "预警标题": st.column_config.TextColumn("预警标题", width="medium"),
                    "实体类型": st.column_config.TextColumn("实体类型", width="small"),
                    "实体名称": st.column_config.TextColumn("实体名称", width="medium"),
                    "当前值": st.column_config.TextColumn("当前值", width="small"),
                    "阈值": st.column_config.TextColumn("阈值", width="small"),
                    "变化幅度": st.column_config.TextColumn("变化幅度", width="small"),
                    "触发原因": st.column_config.TextColumn("触发原因", width="large"),
                    "检测时间": st.column_config.TextColumn("检测时间", width="medium"),
                },
            )
        else:
            st.info("✅ 暂无符合条件的预警")
    
    st.markdown("---")
    
    if alert_report.total_alerts > 0:
        st.markdown("#### ⚡ 最近预警")
        recent_alerts = sorted(alert_report.alerts, key=lambda x: {"critical": 0, "warning": 1, "info": 2}[x.severity])[:5]
        for alert in recent_alerts:
            severity_icon = {"critical": "🔴", "warning": "🟡", "info": "🔵"}.get(alert.severity, "⚪")
            severity_label = {"critical": "严重", "warning": "警告", "info": "提示"}.get(alert.severity, alert.severity)
            
            if alert.severity == "critical":
                st.error(
                    f"{severity_icon} **{alert.title}** - {alert.affected_entity}\n\n"
                    f"📝 {alert.message}\n\n"
                    f"🔍 触发原因: {alert.trigger_reason}\n\n"
                    f"⏰ {alert.detected_at}",
                    icon="🚨",
                )
            elif alert.severity == "warning":
                st.warning(
                    f"{severity_icon} **{alert.title}** - {alert.affected_entity}\n\n"
                    f"📝 {alert.message}\n\n"
                    f"🔍 触发原因: {alert.trigger_reason}\n\n"
                    f"⏰ {alert.detected_at}",
                    icon="⚠️",
                )
            else:
                st.info(
                    f"{severity_icon} **{alert.title}** - {alert.affected_entity}\n\n"
                    f"📝 {alert.message}\n\n"
                    f"🔍 触发原因: {alert.trigger_reason}\n\n"
                    f"⏰ {alert.detected_at}",
                    icon="ℹ️",
                )

with tab_store_health:
    st.subheader("🏪 门店健康评分")
    
    if alert_report.store_health_scores:
        store_id_to_name = {}
        if "store_id" in filtered_df.columns and "store_name" in filtered_df.columns:
            store_map = filtered_df[["store_id", "store_name"]].drop_duplicates()
            store_id_to_name = dict(zip(store_map["store_id"].astype(str), store_map["store_name"]))
        
        health_data = []
        for store_id, score in alert_report.store_health_scores.items():
            store_name = store_id_to_name.get(str(store_id), f"门店 {store_id}")
            health_data.append({
                "门店名称": store_name,
                "健康评分": round(score, 1),
            })
        
        health_df = pd.DataFrame(health_data).sort_values("健康评分", ascending=False)
        
        col1, col2 = st.columns([3, 2])
        
        with col1:
            st.markdown("#### 📊 各门店健康评分")
            
            bar_fig = px.bar(
                health_df,
                x="门店名称",
                y="健康评分",
                color="健康评分",
                color_continuous_scale=["#e74c3c", "#f39c12", "#2ecc71"],
                range_color=[0, 100],
                text_auto=".1f",
            )
            bar_fig.update_traces(
                texttemplate="%{y:.1f}",
                textposition="outside",
                hovertemplate="门店: %{x}<br>健康评分: %{y:.1f}/100",
            )
            bar_fig.update_layout(
                xaxis_title="门店名称",
                yaxis_title="健康评分",
                yaxis_range=[0, 110],
                margin=dict(l=0, r=0, t=20, b=0),
                height=450,
                showlegend=False,
            )
            st.plotly_chart(bar_fig, use_container_width=True)
        
        with col2:
            st.markdown("#### 📈 健康评分区间统计")
            
            def get_score_category(score):
                if score >= 80:
                    return "🟢 优秀 (≥80)"
                elif score >= 60:
                    return "🟡 良好 (60-79)"
                elif score >= 40:
                    return "🟠 一般 (40-59)"
                else:
                    return "🔴 较差 (<40)"
            
            health_df["评分区间"] = health_df["健康评分"].apply(get_score_category)
            category_counts = health_df["评分区间"].value_counts().reset_index()
            category_counts.columns = ["评分区间", "门店数量"]
            
            category_order = ["🟢 优秀 (≥80)", "🟡 良好 (60-79)", "🟠 一般 (40-59)", "🔴 较差 (<40)"]
            category_counts["评分区间"] = pd.Categorical(category_counts["评分区间"], categories=category_order, ordered=True)
            category_counts = category_counts.sort_values("评分区间")
            
            if not category_counts.empty:
                category_fig = px.pie(
                    category_counts,
                    values="门店数量",
                    names="评分区间",
                    color_discrete_map={
                        "🟢 优秀 (≥80)": "#2ecc71",
                        "🟡 良好 (60-79)": "#f39c12",
                        "🟠 一般 (40-59)": "#ff7f0e",
                        "🔴 较差 (<40)": "#e74c3c",
                    },
                    hole=0.4,
                )
                category_fig.update_traces(
                    textposition="inside",
                    textinfo="percent+label",
                    hovertemplate="%{label}<br>门店数: %{value}<br>占比: %{percent}",
                )
                category_fig.update_layout(
                    showlegend=True,
                    legend=dict(orientation="h", yanchor="bottom", y=-0.1),
                    margin=dict(l=0, r=0, t=0, b=0),
                    height=350,
                )
                st.plotly_chart(category_fig, use_container_width=True)
            
            avg_score = health_df["健康评分"].mean()
            max_score = health_df["健康评分"].max()
            min_score = health_df["健康评分"].min()
            
            metric_cols = st.columns(3)
            with metric_cols[0]:
                st.metric("📊 平均评分", f"{avg_score:.1f}")
            with metric_cols[1]:
                st.metric("🏆 最高评分", f"{max_score:.1f}")
            with metric_cols[2]:
                st.metric("⚠️ 最低评分", f"{min_score:.1f}", delta_color="inverse")
        
        st.markdown("---")
        
        st.markdown("#### 📋 门店健康评分详情")
        
        sort_by = st.selectbox(
            "排序方式",
            options=["健康评分 (降序)", "健康评分 (升序)", "门店名称"],
            index=0,
            key="health_sort",
        )
        
        if sort_by == "健康评分 (降序)":
            display_df = health_df.sort_values("健康评分", ascending=False)
        elif sort_by == "健康评分 (升序)":
            display_df = health_df.sort_values("健康评分", ascending=True)
        else:
            display_df = health_df.sort_values("门店名称")
        
        def style_health_score(val):
            color = "#2ecc71" if val >= 80 else "#f39c12" if val >= 60 else "#e74c3c"
            return f"color: {color}; font-weight: bold;"
        
        styled_df = display_df.style.applymap(
            style_health_score,
            subset=["健康评分"]
        ).format(
            {"健康评分": "{:.1f}"}
        )
        
        st.dataframe(
            styled_df,
            use_container_width=True,
            hide_index=True,
            column_config={
                "门店名称": st.column_config.TextColumn("门店名称", width="medium"),
                "健康评分": st.column_config.NumberColumn("健康评分", width="small"),
                "评分区间": st.column_config.TextColumn("评分区间", width="medium"),
            },
        )
    else:
        st.info("ℹ️ 暂无门店健康评分数据")

with tab_trend_alerts:
    st.subheader("📉 趋势预警详情")
    
    alerts_by_type = {}
    for alert in alert_report.alerts:
        if alert.alert_type not in alerts_by_type:
            alerts_by_type[alert.alert_type] = []
        alerts_by_type[alert.alert_type].append(alert)
    
    type_config = {
        "revenue_decline": {
            "title": "📉 营业额下降预警",
            "icon": "📉",
            "description": "监控门店营业额较上周的下降幅度",
            "threshold_key": "revenue_decline_percent",
        },
        "high_refund_rate": {
            "title": "💰 退款率过高预警",
            "icon": "💰",
            "description": "监控门店退款率是否超过阈值",
            "threshold_key": "refund_rate_high",
        },
        "low_gross_margin": {
            "title": "📊 毛利率偏低预警",
            "icon": "📊",
            "description": "监控门店毛利率是否低于健康水平",
            "threshold_key": "gross_margin_low",
        },
        "aov_volatility": {
            "title": "💹 客单价波动预警",
            "icon": "💹",
            "description": "监控门店客单价的周度波动幅度",
            "threshold_key": "aov_volatility_percent",
        },
    }
    
    for alert_type_key, config in type_config.items():
        alerts = alerts_by_type.get(alert_type_key, [])
        threshold = custom_thresholds.get(config["threshold_key"], 0)
        
        with st.expander(f"{config['title']} ({len(alerts)} 个预警)", expanded=True):
            st.info(f"{config['description']} | 当前阈值: {threshold:.1f}{'%' if '%' in config['title'] else ''}")
            
            if alerts:
                for alert in alerts:
                    severity_icon = {"critical": "🔴", "warning": "🟡", "info": "🔵"}.get(alert.severity, "⚪")
                    
                    col1, col2, col3 = st.columns([2, 1, 1])
                    
                    with col1:
                        st.markdown(
                            f"{severity_icon} **{alert.affected_entity}**\n\n"
                            f"📝 {alert.message}"
                        )
                    
                    with col2:
                        st.metric(
                            label="当前值",
                            value=f"{alert.current_value:,.2f} {alert.unit}",
                            delta=f"{alert.change_percent:+.1f}%",
                            delta_color="inverse" if alert.severity in ["critical", "warning"] else "normal",
                        )
                    
                    with col3:
                        st.metric(
                            label="预警阈值",
                            value=f"{alert.threshold:,.2f} {alert.unit}",
                            delta="",
                        )
                    
                    st.markdown(f"**🔍 触发原因:** {alert.trigger_reason}")
                    st.markdown(f"**⏰ 检测时间:** {alert.detected_at}")
                    st.markdown("---")
            else:
                st.success("✅ 该类型暂无触发的预警")

with tab_config:
    st.subheader("⚙️ 预警阈值配置")
    
    st.info("调整各预警指标的触发阈值，点击'应用阈值并重新检测'按钮生效")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("#### 📉 营业额预警")
        revenue_threshold = st.slider(
            "营业额下降阈值 (%)",
            min_value=-50.0,
            max_value=0.0,
            value=float(custom_thresholds.get("revenue_decline_percent", -15.0)),
            step=1.0,
            key="config_revenue",
            help="当营业额较上周下降超过该比例时触发预警",
        )
        
        st.markdown("#### 💰 退款率预警")
        refund_threshold = st.slider(
            "退款率过高阈值 (%)",
            min_value=1.0,
            max_value=30.0,
            value=float(custom_thresholds.get("refund_rate_high", 8.0)),
            step=0.5,
            key="config_refund",
            help="当退款率超过该比例时触发预警",
        )
    
    with col2:
        st.markdown("#### 📊 毛利率预警")
        margin_threshold = st.slider(
            "毛利率偏低阈值 (%)",
            min_value=10.0,
            max_value=70.0,
            value=float(custom_thresholds.get("gross_margin_low", 40.0)),
            step=1.0,
            key="config_margin",
            help="当毛利率低于该比例时触发预警",
        )
        
        st.markdown("#### 💹 客单价波动预警")
        aov_threshold = st.slider(
            "客单价波动阈值 (%)",
            min_value=5.0,
            max_value=50.0,
            value=float(custom_thresholds.get("aov_volatility_percent", 20.0)),
            step=1.0,
            key="config_aov",
            help="当客单价周度波动超过该比例时触发预警",
        )
    
    st.markdown("---")
    
    st.markdown("#### 📋 高级阈值设置")
    
    with st.expander("显示高级阈值", expanded=False):
        col3, col4 = st.columns(2)
        
        with col3:
            member_repurchase_threshold = st.slider(
                "会员复购率偏低阈值 (%)",
                min_value=10.0,
                max_value=60.0,
                value=float(custom_thresholds.get("member_repurchase_low", 30.0)),
                step=1.0,
                key="config_member_repurchase",
            )
            
            order_decline_threshold = st.slider(
                "订单数下降阈值 (%)",
                min_value=-50.0,
                max_value=0.0,
                value=float(custom_thresholds.get("order_count_decline_percent", -10.0)),
                step=1.0,
                key="config_order_decline",
            )
        
        with col4:
            healthy_margin_threshold = st.slider(
                "健康毛利率最小值 (%)",
                min_value=30.0,
                max_value=80.0,
                value=float(custom_thresholds.get("healthy_gross_margin_min", 50.0)),
                step=1.0,
                key="config_healthy_margin",
            )
            
            healthy_refund_threshold = st.slider(
                "健康退款率最大值 (%)",
                min_value=0.0,
                max_value=10.0,
                value=float(custom_thresholds.get("healthy_refund_rate_max", 3.0)),
                step=0.5,
                key="config_healthy_refund",
            )
            
            healthy_revenue_threshold = st.slider(
                "健康营业额下降最大值 (%)",
                min_value=-20.0,
                max_value=0.0,
                value=float(custom_thresholds.get("healthy_revenue_decline_max", -5.0)),
                step=1.0,
                key="config_healthy_revenue",
            )
    
    st.markdown("---")
    
    btn_col1, btn_col2 = st.columns(2)
    
    with btn_col1:
        if st.button("🔄 应用阈值并重新检测", use_container_width=True, type="primary"):
            new_thresholds = {
                "revenue_decline_percent": revenue_threshold,
                "refund_rate_high": refund_threshold,
                "gross_margin_low": margin_threshold,
                "aov_volatility_percent": aov_threshold,
                "member_repurchase_low": member_repurchase_threshold,
                "order_count_decline_percent": order_decline_threshold,
                "healthy_gross_margin_min": healthy_margin_threshold,
                "healthy_refund_rate_max": healthy_refund_threshold,
                "healthy_revenue_decline_max": healthy_revenue_threshold,
            }
            
            st.session_state.custom_thresholds = new_thresholds
            
            new_alert_report = detect_all_alerts(filtered_df, cleaned_data, new_thresholds)
            st.session_state.alert_report = new_alert_report
            
            st.success(f"✅ 阈值已应用，重新检测到 {new_alert_report.total_alerts} 个预警")
            st.rerun()
    
    with btn_col2:
        if st.button("↩️ 恢复默认阈值", use_container_width=True):
            st.session_state.custom_thresholds = DEFAULT_THRESHOLDS.copy()
            st.success("✅ 已恢复默认阈值")
            st.rerun()
    
    st.markdown("---")
    
    st.markdown("#### 📊 当前阈值配置")
    
    threshold_display = [
        {"预警类型": "营业额下降", "阈值": f"{revenue_threshold:.1f}%", "说明": "较上周下降幅度"},
        {"预警类型": "退款率过高", "阈值": f"{refund_threshold:.1f}%", "说明": "退款订单占比上限"},
        {"预警类型": "毛利率偏低", "阈值": f"{margin_threshold:.1f}%", "说明": "毛利率下限"},
        {"预警类型": "客单价波动", "阈值": f"{aov_threshold:.1f}%", "说明": "周度波动幅度上限"},
    ]
    
    threshold_df = pd.DataFrame(threshold_display)
    st.table(threshold_df)

st.markdown("---")

if st.button("💾 保存预警分析结果到报告", use_container_width=True):
    st.session_state.analysis_results.update(
        {
            "alert_report": alert_report.to_summary_dict(),
            "alert_dataframe": alert_report.to_dataframe(),
            "thresholds_used": custom_thresholds,
        }
    )
    st.success("✅ 预警分析结果已保存，可在'报告导出'页面生成报告")
