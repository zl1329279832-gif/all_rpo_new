import streamlit as st
import pandas as pd
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core import (
    init_session_state,
    check_data_loaded,
    filter_by_date_and_store,
    get_date_range,
    get_store_list,
    calculate_rfm,
    calculate_repurchase_rate,
    plot_rfm_scatter,
    plot_customer_segment_bar,
)

st.set_page_config(page_title="会员与复购", page_icon="👥", layout="wide")

init_session_state()

st.title("👥 会员与复购分析")

if not check_data_loaded(require_merged=True):
    st.stop()

merged_df = st.session_state.merged_df

st.sidebar.markdown("### 🔍 筛选条件")

min_date, max_date = get_date_range(merged_df)
date_range = st.sidebar.date_input(
    "选择日期范围",
    value=(min_date, max_date),
    min_value=min_date,
    max_value=max_date,
    key="member_date_range",
)

stores = get_store_list(merged_df)
store_names = [s["store_name"] for s in stores]
selected_store_names = st.sidebar.multiselect(
    "选择门店",
    options=store_names,
    default=store_names,
    key="member_stores",
)

selected_store_ids = [s["store_id"] for s in stores if s["store_name"] in selected_store_names]

if len(date_range) == 2:
    filtered_df = filter_by_date_and_store(
        merged_df,
        (date_range[0], date_range[1]),
        selected_store_ids,
    )
    
    if filtered_df.empty:
        st.warning("⚠️ 所选筛选条件下无数据，请调整筛选条件")
        st.stop()
    
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
    
    tab1, tab2, tab3 = st.tabs(["📊 RFM 分析", "🔄 复购分析", "💵 客单价分析"])
    
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
    
    with tab3:
        st.subheader("客单价分析")
        
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
    
    st.markdown("---")
    if st.button("💾 保存分析结果到报告", use_container_width=True):
        st.session_state.analysis_results.update(
            {
                "rfm_result": rfm_result,
                "repurchase_result": repurchase_result,
            }
        )
        st.success("✅ 分析结果已保存，可在'报告导出'页面生成报告")
else:
    st.info("请选择完整的日期范围")
