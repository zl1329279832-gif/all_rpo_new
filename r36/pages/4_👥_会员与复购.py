import streamlit as st
import pandas as pd
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core import (
    init_session_state,
    check_data_loaded,
    calculate_rfm,
    calculate_repurchase_rate,
    calculate_member_repurchase_cycle,
    plot_rfm_scatter,
    plot_customer_segment_bar,
    render_sidebar_filters,
)

st.set_page_config(page_title="会员与复购", page_icon="👥", layout="wide")

init_session_state()

st.title("👥 会员与复购分析")

if not check_data_loaded(require_merged=True):
    st.stop()

merged_df = st.session_state.merged_df
cleaned_data = st.session_state.cleaned_data

filtered_df, filter_dict = render_sidebar_filters(merged_df, cleaned_data)

if filtered_df.empty:
    st.warning("⚠️ 所选筛选条件下无数据，请调整筛选条件")
    st.stop()

if filter_dict["start_date"] and filter_dict["end_date"]:
    
    member_df = filtered_df[filtered_df["is_member"]].copy() if "is_member" in filtered_df.columns else filtered_df.copy()
    
    if member_df.empty:
        st.info("ℹ️ 当前筛选条件下无会员订单数据")
        st.stop()
    
    rfm_result = calculate_rfm(filtered_df)
    repurchase_result = calculate_repurchase_rate(filtered_df)
    
    st.markdown("### 📊 会员核心指标")
    col1, col2, col3, col4 = st.columns(4)
    
    total_members = repurchase_result.get("总会员数", 0)
    repurchase_members = repurchase_result.get("复购会员数", 0)
    repurchase_rate = repurchase_result.get("复购率", 0)
    
    avg_order_value = filtered_df[filtered_df["is_member"]].groupby("order_id")["pay_amount"].first().mean() if "is_member" in filtered_df.columns else filtered_df.groupby("order_id")["pay_amount"].first().mean()
    avg_frequency = rfm_result["Frequency"].mean() if not rfm_result.empty else 0
    
    col1.metric("活跃会员数", f"{total_members:,}")
    col2.metric("复购会员数", f"{repurchase_members:,}", f"{repurchase_rate:.1f}%")
    col3.metric("会员客单价", f"¥{avg_order_value:,.2f}")
    col4.metric("平均购买频次", f"{avg_frequency:.1f} 次")
    
    st.markdown("---")
    
    repurchase_cycle_result = calculate_member_repurchase_cycle(filtered_df)
    
    tab1, tab2, tab3 = st.tabs(["🧑‍🤝‍🧑 RFM分析", "📊 复购分析", "🔄 复购周期"])
    
    with tab1:
        st.subheader("RFM 客户价值分析")
        
        if not rfm_result.empty:
            col1, col2 = st.columns([2, 1])
            
            with col1:
                rfm_fig = plot_rfm_scatter(rfm_result)
                st.plotly_chart(rfm_fig, use_container_width=True)
            
            with col2:
                segment_fig = plot_customer_segment_bar(rfm_result)
                st.plotly_chart(segment_fig, use_container_width=True)
            
            st.markdown("### 👥 客户分层明细")
            
            segment_summary = (
                rfm_result.groupby("客户分层")
                .agg(
                    会员数=("member_id", "nunique"),
                    平均最近购买=("Recency", "mean"),
                    平均购买频次=("Frequency", "mean"),
                    平均消费金额=("Monetary", "mean"),
                )
                .reset_index()
            )
            segment_summary["平均最近购买"] = segment_summary["平均最近购买"].round(1).astype(str) + " 天"
            segment_summary["平均购买频次"] = segment_summary["平均购买频次"].round(1).astype(str) + " 次"
            segment_summary["平均消费金额"] = "¥" + segment_summary["平均消费金额"].round(2).astype(str)
            
            st.dataframe(segment_summary, use_container_width=True, hide_index=True)
            
            with st.expander("📋 查看 RFM 明细数据"):
                st.dataframe(
                    rfm_result,
                    use_container_width=True,
                    hide_index=True,
                    column_config={
                        "member_id": st.column_config.TextColumn("会员ID"),
                        "name": st.column_config.TextColumn("姓名"),
                        "level": st.column_config.TextColumn("会员等级"),
                        "Recency": st.column_config.NumberColumn("最近购买(天)", format="%.0f"),
                        "Frequency": st.column_config.NumberColumn("购买频次", format="%.0f"),
                        "Monetary": st.column_config.NumberColumn("消费金额", format="¥%.2f"),
                        "R_Score": st.column_config.NumberColumn("R评分", format="%.0f"),
                        "F_Score": st.column_config.NumberColumn("F评分", format="%.0f"),
                        "M_Score": st.column_config.NumberColumn("M评分", format="%.0f"),
                        "RFM_Score": st.column_config.NumberColumn("RFM总分", format="%.0f"),
                        "客户分层": st.column_config.TextColumn("客户分层"),
                    },
                )
    
    with tab2:
        st.subheader("复购率分析")
        
        col1, col2 = st.columns([1, 2])
        
        with col1:
            st.metric("总体复购率", f"{repurchase_rate:.2f}%", delta=None)
            
            if "购买频次分布" in repurchase_result:
                freq_dist = repurchase_result["购买频次分布"]
                
                st.markdown("### 📊 购买频次分布")
                st.dataframe(
                    freq_dist,
                    use_container_width=True,
                    hide_index=True,
                    column_config={
                        "购买次数": st.column_config.NumberColumn("购买次数", format="%.0f"),
                        "会员数": st.column_config.NumberColumn("会员数", format="%.0f"),
                        "占比": st.column_config.NumberColumn("占比(%)", format="%.2f"),
                    },
                )
        
        with col2:
            import plotly.graph_objects as go
            
            if "购买频次分布" in repurchase_result:
                freq_dist = repurchase_result["购买频次分布"]
                fig = go.Figure()
                fig.add_trace(
                    go.Bar(
                        x=freq_dist["购买次数"].astype(str) + " 次",
                        y=freq_dist["会员数"],
                        marker=dict(color="#1976D2"),
                        text=freq_dist["会员数"],
                        textposition="outside",
                        hovertemplate="购买%{x}<br>会员数: %{y}人<extra></extra>",
                    )
                )
                fig.update_layout(
                    title="购买频次分布",
                    xaxis_title="购买次数",
                    yaxis_title="会员数",
                    template="plotly_white",
                )
                st.plotly_chart(fig, use_container_width=True)
        
        st.markdown("### 💡 复购分析洞察")
        col1, col2, col3 = st.columns(3)
        
        if "购买频次分布" in repurchase_result:
            freq_dist = repurchase_result["购买频次分布"]
            
            one_time_buyers = freq_dist[freq_dist["购买次数"] == 1]["会员数"].sum()
            repeat_buyers = freq_dist[freq_dist["购买次数"] >= 2]["会员数"].sum()
            loyal_buyers = freq_dist[freq_dist["购买次数"] >= 5]["会员数"].sum()
            
            total = one_time_buyers + repeat_buyers
            
            with col1:
                st.info(f"**一次性购买者**: {one_time_buyers:,} 人 ({one_time_buyers/total*100:.1f}%)")
            with col2:
                st.success(f"**复购顾客**: {repeat_buyers:,} 人 ({repeat_buyers/total*100:.1f}%)")
            with col3:
                st.warning(f"**忠诚顾客(≥5次)**: {loyal_buyers:,} 人 ({loyal_buyers/total*100:.1f}%)")
        
        st.markdown("---")
        
        st.subheader("客单价分布")
        
        member_orders = filtered_df[filtered_df["is_member"]].copy() if "is_member" in filtered_df.columns else filtered_df.copy()
        non_member_orders = filtered_df[~filtered_df["is_member"]].copy() if "is_member" in filtered_df.columns else pd.DataFrame()
        
        col1, col2 = st.columns(2)
        
        with col1:
            member_order_values = member_orders.groupby("order_id")["pay_amount"].first()
            non_member_order_values = non_member_orders.groupby("order_id")["pay_amount"].first() if not non_member_orders.empty else pd.Series()
            
            price_ranges = [0, 20, 50, 100, 200, 500, float("inf")]
            price_labels = ["¥0-20", "¥20-50", "¥50-100", "¥100-200", "¥200-500", "¥500+"]
            
            member_price_segments = pd.cut(member_order_values, bins=price_ranges, labels=price_labels, include_lowest=True)
            member_price_dist = member_price_segments.value_counts().reset_index()
            member_price_dist.columns = ["客单价区间", "订单数"]
            member_price_dist["占比"] = (member_price_dist["订单数"] / member_price_dist["订单数"].sum() * 100).round(2)
            
            fig = go.Figure()
            fig.add_trace(
                go.Bar(
                    x=member_price_dist["客单价区间"],
                    y=member_price_dist["订单数"],
                    marker=dict(color="#1976D2"),
                    text=member_price_dist.apply(lambda r: f"{r['订单数']} ({r['占比']:.1f}%)", axis=1),
                    textposition="outside",
                    hovertemplate="客单价: %{x}<br>订单数: %{y}<extra></extra>",
                )
            )
            fig.update_layout(
                title="会员客单价分布",
                xaxis_title="客单价区间",
                yaxis_title="订单数",
                template="plotly_white",
            )
            st.plotly_chart(fig, use_container_width=True)
            
            avg_member = member_order_values.mean()
            median_member = member_order_values.median()
            
            st.metric("会员平均客单价", f"¥{avg_member:,.2f}")
            st.metric("会员中位客单价", f"¥{median_member:,.2f}")
        
        with col2:
            if not non_member_order_values.empty:
                non_member_price_segments = pd.cut(non_member_order_values, bins=price_ranges, labels=price_labels, include_lowest=True)
                non_member_price_dist = non_member_price_segments.value_counts().reset_index()
                non_member_price_dist.columns = ["客单价区间", "订单数"]
                non_member_price_dist["占比"] = (non_member_price_dist["订单数"] / non_member_price_dist["订单数"].sum() * 100).round(2)
                
                fig = go.Figure()
                fig.add_trace(
                    go.Bar(
                        x=non_member_price_dist["客单价区间"],
                        y=non_member_price_dist["订单数"],
                        marker=dict(color="#FF9800"),
                        text=non_member_price_dist.apply(lambda r: f"{r['订单数']} ({r['占比']:.1f}%)", axis=1),
                        textposition="outside",
                        hovertemplate="客单价: %{x}<br>订单数: %{y}<extra></extra>",
                    )
                )
                fig.update_layout(
                    title="非会员客单价分布",
                    xaxis_title="客单价区间",
                    yaxis_title="订单数",
                    template="plotly_white",
                )
                st.plotly_chart(fig, use_container_width=True)
                
                avg_non_member = non_member_order_values.mean()
                median_non_member = non_member_order_values.median()
                
                st.metric("非会员平均客单价", f"¥{avg_non_member:,.2f}")
                st.metric("非会员中位客单价", f"¥{median_non_member:,.2f}")
                
                diff = ((avg_member - avg_non_member) / avg_non_member * 100) if avg_non_member > 0 else 0
                st.info(f"会员比非会员客单价高出 {diff:.1f}%")
            else:
                st.info("无散客订单数据")
    
    with tab3:
        st.subheader("复购周期分析")
        
        if not repurchase_cycle_result.empty:
            col1, col2, col3, col4 = st.columns(4)
            
            avg_cycle = repurchase_cycle_result["平均复购周期"].mean()
            median_cycle = repurchase_cycle_result["平均复购周期"].median()
            total_repurchase_members = len(repurchase_cycle_result)
            avg_repurchase_count = repurchase_cycle_result["复购次数"].mean()
            
            col1.metric("平均复购周期", f"{avg_cycle:.1f} 天")
            col2.metric("复购周期中位数", f"{median_cycle:.1f} 天")
            col3.metric("有复购行为会员", f"{total_repurchase_members:,} 人")
            col4.metric("平均复购次数", f"{avg_repurchase_count:.1f} 次")
            
            st.markdown("---")
            
            st.markdown("### 📋 复购周期统计")
            
            display_cols = ["member_id"]
            if "member_name" in repurchase_cycle_result.columns:
                display_cols.append("member_name")
            if "会员等级" in repurchase_cycle_result.columns:
                display_cols.append("会员等级")
            display_cols.extend(["平均复购周期", "最短复购周期", "最长复购周期", "复购次数", "复购分层"])
            
            st.dataframe(
                repurchase_cycle_result[display_cols],
                use_container_width=True,
                hide_index=True,
                column_config={
                    "member_id": st.column_config.TextColumn("会员ID"),
                    "member_name": st.column_config.TextColumn("会员姓名"),
                    "会员等级": st.column_config.TextColumn("会员等级"),
                    "平均复购周期": st.column_config.NumberColumn("平均周期(天)", format="%.1f"),
                    "最短复购周期": st.column_config.NumberColumn("最短周期(天)", format="%.1f"),
                    "最长复购周期": st.column_config.NumberColumn("最长周期(天)", format="%.1f"),
                    "复购次数": st.column_config.NumberColumn("复购次数", format="%.0f"),
                    "复购分层": st.column_config.TextColumn("复购分层"),
                },
            )
            
            st.markdown("---")
            
            col1, col2 = st.columns(2)
            
            with col1:
                st.subheader("复购分层会员分布")
                
                segment_dist = repurchase_cycle_result["复购分层"].value_counts().reset_index()
                segment_dist.columns = ["复购分层", "会员数"]
                
                segment_order = ["高频（≤3天）", "较高频（3-7天）", "中频（7-14天）", "较低频（14-30天）", "低频（>30天）"]
                segment_dist["复购分层"] = pd.Categorical(segment_dist["复购分层"], categories=segment_order, ordered=True)
                segment_dist = segment_dist.sort_values("复购分层")
                
                fig = go.Figure()
                fig.add_trace(
                    go.Bar(
                        x=segment_dist["复购分层"],
                        y=segment_dist["会员数"],
                        marker=dict(color=["#4CAF50", "#8BC34A", "#CDDC39", "#FFC107", "#FF5722"]),
                        text=segment_dist["会员数"],
                        textposition="outside",
                        hovertemplate="%{x}<br>会员数: %{y}人<extra></extra>",
                    )
                )
                fig.update_layout(
                    title="各复购分层会员数量分布",
                    xaxis_title="复购分层",
                    yaxis_title="会员数",
                    template="plotly_white",
                )
                st.plotly_chart(fig, use_container_width=True)
            
            with col2:
                st.subheader("会员等级与复购周期")
                
                if "会员等级" in repurchase_cycle_result.columns:
                    level_cycle = repurchase_cycle_result.groupby("会员等级").agg(
                        平均复购周期=("平均复购周期", "mean"),
                        会员数=("member_id", "nunique"),
                    ).reset_index()
                    
                    fig = go.Figure()
                    fig.add_trace(
                        go.Scatter(
                            x=level_cycle["会员等级"],
                            y=level_cycle["平均复购周期"],
                            mode="lines+markers",
                            marker=dict(size=12, color="#1976D2"),
                            line=dict(width=2, color="#1976D2"),
                            text=level_cycle.apply(lambda r: f"{r['会员等级']}<br>平均周期: {r['平均复购周期']:.1f}天<br>会员数: {r['会员数']}人", axis=1),
                            hoverinfo="text",
                        )
                    )
                    fig.update_layout(
                        title="会员等级与平均复购周期关系",
                        xaxis_title="会员等级",
                        yaxis_title="平均复购周期(天)",
                        template="plotly_white",
                    )
                    st.plotly_chart(fig, use_container_width=True)
                    
                    st.dataframe(
                        level_cycle,
                        use_container_width=True,
                        hide_index=True,
                        column_config={
                            "会员等级": st.column_config.TextColumn("会员等级"),
                            "平均复购周期": st.column_config.NumberColumn("平均周期(天)", format="%.1f"),
                            "会员数": st.column_config.NumberColumn("会员数", format="%.0f"),
                        },
                    )
                else:
                    st.info("ℹ️ 暂无会员等级数据")
            
            st.markdown("---")
            
            st.markdown("### 💡 复购周期洞察")
            
            high_freq = segment_dist[segment_dist["复购分层"] == "高频（≤3天）"]["会员数"].sum() if not segment_dist.empty else 0
            low_freq = segment_dist[segment_dist["复购分层"] == "低频（>30天）"]["会员数"].sum() if not segment_dist.empty else 0
            
            col1, col2 = st.columns(2)
            with col1:
                if high_freq > 0:
                    st.success(f"**高频复购会员（≤3天）**: {high_freq:,} 人 ({high_freq/total_repurchase_members*100:.1f}%)")
            with col2:
                if low_freq > 0:
                    st.warning(f"**低频复购会员（>30天）**: {low_freq:,} 人 ({low_freq/total_repurchase_members*100:.1f}%)，建议开展客户召回活动")
        else:
            st.info("ℹ️ 当前筛选条件下暂无复购周期数据（会员需至少有2次购买记录）")
    
    st.markdown("---")
    if st.button("💾 保存分析结果到报告", use_container_width=True):
        st.session_state.analysis_results.update(
            {
                "rfm_result": rfm_result,
                "repurchase_result": repurchase_result,
                "repurchase_cycle_result": repurchase_cycle_result,
            }
        )
        st.success("✅ 分析结果已保存，可在'报告导出'页面生成报告")
else:
    st.info("请选择完整的日期范围")
