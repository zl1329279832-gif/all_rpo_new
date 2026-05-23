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
    calculate_promotion_effectiveness,
    calculate_refund_analysis,
    plot_promotion_roi,
    plot_refund_by_reason,
)

st.set_page_config(page_title="活动与退款", page_icon="🎁", layout="wide")

init_session_state()

st.title("🎁 活动与退款分析")

if not check_data_loaded(require_merged=True):
    st.stop()

merged_df = st.session_state.merged_df
cleaned_data = st.session_state.cleaned_data

st.sidebar.markdown("### 🔍 筛选条件")

min_date, max_date = get_date_range(merged_df)
date_range = st.sidebar.date_input(
    "选择日期范围",
    value=(min_date, max_date),
    min_value=min_date,
    max_value=max_date,
    key="promo_date_range",
)

stores = get_store_list(merged_df)
store_names = [s["store_name"] for s in stores]
selected_store_names = st.sidebar.multiselect(
    "选择门店",
    options=store_names,
    default=store_names,
    key="promo_stores",
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
    
    refunds_df = cleaned_data.get("refunds", pd.DataFrame())
    if not refunds_df.empty:
        refunds_df = filter_by_date_and_store(
            refunds_df,
            (date_range[0], date_range[1]),
            selected_store_ids,
            date_column="refund_time",
        )
    
    promotion_metrics = calculate_promotion_effectiveness(filtered_df)
    refund_analysis = calculate_refund_analysis(filtered_df, refunds_df)
    
    tab1, tab2 = st.tabs(["🎁 促销活动分析", "💸 退款分析"])
    
    with tab1:
        st.subheader("促销活动效果分析")
        
        promo_count = len(promotion_metrics) if not promotion_metrics.empty else 0
        total_discount = promotion_metrics["优惠金额"].sum() if not promotion_metrics.empty else 0
        total_revenue_from_promo = promotion_metrics["实际收入"].sum() if not promotion_metrics.empty else 0
        
        col1, col2, col3, col4 = st.columns(4)
        col1.metric("活动数量", f"{promo_count} 个")
        col2.metric("优惠总投入", f"¥{total_discount:,.2f}")
        col3.metric("活动带来收入", f"¥{total_revenue_from_promo:,.2f}")
        
        if total_discount > 0:
            overall_roi = (total_revenue_from_promo - total_discount) / total_discount
            col4.metric("整体 ROI", f"{overall_roi:.2f}")
        else:
            col4.metric("整体 ROI", "N/A")
        
        st.markdown("---")
        
        if not promotion_metrics.empty:
            col1, col2 = st.columns([3, 2])
            
            with col1:
                roi_fig = plot_promotion_roi(promotion_metrics)
                st.plotly_chart(roi_fig, use_container_width=True)
            
            with col2:
                st.subheader("活动 ROI 排名")
                
                promo_ranking = promotion_metrics.sort_values("ROI", ascending=False).reset_index(drop=True)
                promo_ranking["排名"] = promo_ranking.index + 1
                
                def get_roi_status(roi):
                    if roi >= 3:
                        return "✅ 优秀"
                    elif roi >= 1:
                        return "⚠️ 一般"
                    else:
                        return "❌ 亏损"
                
                promo_ranking["状态"] = promo_ranking["ROI"].apply(get_roi_status)
                
                st.dataframe(
                    promo_ranking[["排名", "promotion_name", "type", "使用订单数", "优惠金额", "实际收入", "ROI", "客单价", "状态"]],
                    use_container_width=True,
                    hide_index=True,
                    column_config={
                        "排名": st.column_config.NumberColumn("#", format="%.0f"),
                        "promotion_name": st.column_config.TextColumn("活动名称", width="medium"),
                        "type": st.column_config.TextColumn("类型"),
                        "使用订单数": st.column_config.NumberColumn("使用订单数", format="%.0f"),
                        "优惠金额": st.column_config.NumberColumn("优惠金额", format="¥%.2f"),
                        "实际收入": st.column_config.NumberColumn("实际收入", format="¥%.2f"),
                        "ROI": st.column_config.NumberColumn("ROI", format="%.2f"),
                        "客单价": st.column_config.NumberColumn("客单价", format="¥%.2f"),
                        "状态": st.column_config.TextColumn("状态"),
                    },
                )
            
            st.markdown("---")
            
            st.subheader("📋 活动类型分析")
            
            if "type" in promotion_metrics.columns:
                type_analysis = (
                    promotion_metrics.groupby("type")
                    .agg(
                        活动数=("promotion_id", "nunique"),
                        使用订单数=("使用订单数", "sum"),
                        优惠金额=("优惠金额", "sum"),
                        实际收入=("实际收入", "sum"),
                        参与顾客数=("参与顾客数", "sum"),
                    )
                    .reset_index()
                )
                type_analysis["ROI"] = (
                    (type_analysis["实际收入"] - type_analysis["优惠金额"]) / type_analysis["优惠金额"]
                ).round(2)
                type_analysis = type_analysis.sort_values("实际收入", ascending=False)
                
                st.dataframe(
                    type_analysis,
                    use_container_width=True,
                    hide_index=True,
                    column_config={
                        "type": st.column_config.TextColumn("活动类型"),
                        "活动数": st.column_config.NumberColumn("活动数", format="%.0f"),
                        "使用订单数": st.column_config.NumberColumn("使用订单数", format="%.0f"),
                        "优惠金额": st.column_config.NumberColumn("优惠金额", format="¥%.2f"),
                        "实际收入": st.column_config.NumberColumn("实际收入", format="¥%.2f"),
                        "参与顾客数": st.column_config.NumberColumn("参与顾客数", format="%.0f"),
                        "ROI": st.column_config.NumberColumn("ROI", format="%.2f"),
                    },
                )
        else:
            st.info("ℹ️ 当前筛选条件下无促销活动数据")
    
    with tab2:
        st.subheader("退款分析")
        
        total_refund = refund_analysis.get("总退款金额", 0)
        refund_count = refund_analysis.get("退款次数", 0)
        refund_rate = refund_analysis.get("退款率", 0)
        
        col1, col2, col3, col4 = st.columns(4)
        col1.metric("退款总金额", f"¥{total_refund:,.2f}")
        col2.metric("退款次数", f"{refund_count:,} 次")
        col3.metric("退款率", f"{refund_rate:.2f}%")
        
        total_orders = filtered_df["order_id"].nunique() if not filtered_df.empty else 0
        if total_orders > 0:
            col4.metric("每单平均退款", f"¥{total_refund/total_orders:.2f}")
        else:
            col4.metric("每单平均退款", "N/A")
        
        st.markdown("---")
        
        refund_by_reason = refund_analysis.get("退款原因分布", pd.DataFrame())
        
        if not refund_by_reason.empty:
            col1, col2 = st.columns([2, 1])
            
            with col1:
                refund_fig = plot_refund_by_reason(refund_by_reason)
                st.plotly_chart(refund_fig, use_container_width=True)
            
            with col2:
                st.subheader("退款原因明细")
                refund_by_reason["占比"] = (
                    refund_by_reason["退款金额"] / refund_by_reason["退款金额"].sum() * 100
                ).round(2)
                
                st.dataframe(
                    refund_by_reason,
                    use_container_width=True,
                    hide_index=True,
                    column_config={
                        "reason": st.column_config.TextColumn("退款原因"),
                        "退款金额": st.column_config.NumberColumn("退款金额", format="¥%.2f"),
                        "退款次数": st.column_config.NumberColumn("退款次数", format="%.0f"),
                        "占比": st.column_config.NumberColumn("占比(%)", format="%.2f"),
                    },
                )
            
            if refund_count > 0:
                st.markdown("### 💡 退款分析洞察")
                
                top_reason = refund_by_reason.iloc[0]["reason"]
                top_reason_amount = refund_by_reason.iloc[0]["退款金额"]
                top_reason_pct = top_reason_amount / total_refund * 100 if total_refund > 0 else 0
                
                col1, col2 = st.columns(2)
                with col1:
                    st.warning(
                        f"**主要退款原因**: {top_reason}，"
                        f"占总退款金额的 {top_reason_pct:.1f}% (¥{top_reason_amount:,.2f})"
                    )
                with col2:
                    if refund_rate > 5:
                        st.error(
                            f"⚠️ 退款率偏高 ({refund_rate:.2f}%)，"
                            f"建议关注菜品质量和服务流程"
                        )
                    elif refund_rate > 2:
                        st.warning(
                            f"⚠️ 退款率略高 ({refund_rate:.2f}%)，"
                            f"建议关注顾客反馈"
                        )
                    else:
                        st.success(
                            f"✅ 退款率处于健康水平 ({refund_rate:.2f}%)"
                        )
        else:
            st.info("ℹ️ 当前筛选条件下无退款数据")
    
    st.markdown("---")
    if st.button("💾 保存分析结果到报告", use_container_width=True):
        st.session_state.analysis_results.update(
            {
                "promotion_metrics": promotion_metrics,
                "refund_analysis": refund_analysis,
            }
        )
        st.success("✅ 分析结果已保存，可在'报告导出'页面生成报告")
else:
    st.info("请选择完整的日期范围")
