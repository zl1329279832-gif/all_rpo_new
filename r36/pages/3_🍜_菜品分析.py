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
    calculate_dish_metrics,
    calculate_category_metrics,
    calculate_dish_combinations,
    plot_dish_ranking,
    plot_category_distribution,
    plot_profit_matrix,
    plot_dish_combination,
)

st.set_page_config(page_title="菜品分析", page_icon="🍜", layout="wide")

init_session_state()

st.title("🍜 菜品分析")

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
    key="dish_date_range",
)

stores = get_store_list(merged_df)
store_names = [s["store_name"] for s in stores]
selected_store_names = st.sidebar.multiselect(
    "选择门店",
    options=store_names,
    default=store_names,
    key="dish_stores",
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
    
    dish_metrics = calculate_dish_metrics(filtered_df)
    category_metrics = calculate_category_metrics(filtered_df)
    
    if not dish_metrics.empty:
        st.markdown("### 📊 菜品核心指标")
        col1, col2, col3, col4 = st.columns(4)
        col1.metric("菜品总数", len(dish_metrics))
        col2.metric("有销售菜品数", (dish_metrics["销售数量"] > 0).sum())
        col3.metric("总销售数量", f"{dish_metrics['销售数量'].sum():,.0f}")
        col4.metric("平均毛利率", f"{dish_metrics['毛利率'].mean():.1f}%")
    
    tab1, tab2, tab3, tab4 = st.tabs(["🏆 销售排行", "🥡 品类分析", "📈 利润矩阵", "🍱 组合分析"])
    
    with tab1:
        st.subheader("菜品销售排行")
        
        col_sort, col_topn = st.columns([1, 1])
        with col_sort:
            sort_by = st.selectbox(
                "排序方式",
                options=["销售额", "销售数量", "毛利", "毛利率", "销售额占比", "毛利占比"],
                index=0,
            )
        with col_topn:
            top_n = st.slider("展示数量", min_value=5, max_value=30, value=15)
        
        rank_fig = plot_dish_ranking(dish_metrics, top_n=top_n, sort_by=sort_by)
        st.plotly_chart(rank_fig, use_container_width=True)
        
        st.markdown("### 📋 菜品销售明细")
        
        if "category" in filtered_df.columns:
            categories = ["全部"] + list(filtered_df["category"].dropna().unique())
            selected_category = st.selectbox("筛选品类", options=categories, index=0)
            
            if selected_category != "全部":
                dish_metrics = dish_metrics[dish_metrics["category"] == selected_category]
        
        st.dataframe(
            dish_metrics,
            use_container_width=True,
            hide_index=True,
            column_config={
                "dish_id": st.column_config.TextColumn("菜品ID", width="small"),
                "dish_name": st.column_config.TextColumn("菜品名称", width="medium"),
                "category": st.column_config.TextColumn("品类", width="small"),
                "销售数量": st.column_config.NumberColumn("销售数量", format="%.0f"),
                "销售额": st.column_config.NumberColumn("销售额", format="¥%.2f"),
                "毛利": st.column_config.NumberColumn("毛利", format="¥%.2f"),
                "订单数": st.column_config.NumberColumn("订单数", format="%.0f"),
                "销售额占比": st.column_config.NumberColumn("销售额占比(%)", format="%.2f"),
                "毛利占比": st.column_config.NumberColumn("毛利占比(%)", format="%.2f"),
                "毛利率": st.column_config.NumberColumn("毛利率(%)", format="%.2f"),
                "单次点购量": st.column_config.NumberColumn("单次点购量", format="%.2f"),
            },
        )
    
    with tab2:
        st.subheader("品类销售分析")
        
        if not category_metrics.empty:
            col1, col2 = st.columns([1, 1])
            with col1:
                category_fig = plot_category_distribution(filtered_df)
                st.plotly_chart(category_fig, use_container_width=True)
            
            with col2:
                st.dataframe(
                    category_metrics,
                    use_container_width=True,
                    hide_index=True,
                    column_config={
                        "category": st.column_config.TextColumn("品类"),
                        "销售数量": st.column_config.NumberColumn("销售数量", format="%.0f"),
                        "销售额": st.column_config.NumberColumn("销售额", format="¥%.2f"),
                        "毛利": st.column_config.NumberColumn("毛利", format="¥%.2f"),
                        "菜品数": st.column_config.NumberColumn("菜品数", format="%.0f"),
                        "订单数": st.column_config.NumberColumn("订单数", format="%.0f"),
                        "销售额占比": st.column_config.NumberColumn("销售额占比(%)", format="%.2f"),
                        "毛利率": st.column_config.NumberColumn("毛利率(%)", format="%.2f"),
                    },
                )
    
    with tab3:
        st.subheader("菜品利润矩阵分析")
        st.info("通过销售额和毛利率的组合分析，识别明星菜品、潜力菜品和待优化菜品")
        
        profit_fig = plot_profit_matrix(dish_metrics)
        st.plotly_chart(profit_fig, use_container_width=True)
        
        col1, col2, col3, col4 = st.columns(4)
        
        avg_sales = dish_metrics["销售额"].mean()
        avg_margin = dish_metrics["毛利率"].mean()
        
        star_dishes = dish_metrics[
            (dish_metrics["销售额"] >= avg_sales) & (dish_metrics["毛利率"] >= avg_margin)
        ]
        volume_dishes = dish_metrics[
            (dish_metrics["销售额"] >= avg_sales) & (dish_metrics["毛利率"] < avg_margin)
        ]
        potential_dishes = dish_metrics[
            (dish_metrics["销售额"] < avg_sales) & (dish_metrics["毛利率"] >= avg_margin)
        ]
        weak_dishes = dish_metrics[
            (dish_metrics["销售额"] < avg_sales) & (dish_metrics["毛利率"] < avg_margin)
        ]
        
        with col1:
            st.metric("⭐ 明星菜品", len(star_dishes), help="高销售额高毛利")
        with col2:
            st.metric("📦 薄利多销", len(volume_dishes), help="高销售额低毛利")
        with col3:
            st.metric("💎 潜力菜品", len(potential_dishes), help="低销售额高毛利")
        with col4:
            st.metric("⚠️ 待优化", len(weak_dishes), help="低销售额低毛利")
        
        with st.expander("查看各类菜品明细"):
            st.subheader("⭐ 明星菜品")
            if not star_dishes.empty:
                st.dataframe(star_dishes[["dish_name", "category", "销售额", "毛利率"]], use_container_width=True, hide_index=True)
            
            st.subheader("💎 潜力菜品")
            if not potential_dishes.empty:
                st.dataframe(potential_dishes[["dish_name", "category", "销售额", "毛利率"]], use_container_width=True, hide_index=True)
            
            st.subheader("⚠️ 待优化菜品")
            if not weak_dishes.empty:
                st.dataframe(weak_dishes[["dish_name", "category", "销售额", "毛利率"]], use_container_width=True, hide_index=True)
    
    with tab4:
        st.subheader("热门菜品组合分析")
        st.info("基于关联规则分析，识别经常被一起点购的菜品组合")
        
        min_support = st.slider("最小支持度(%)", min_value=0.5, max_value=10.0, value=1.0, step=0.5)
        
        with st.spinner("正在分析菜品组合..."):
            dish_combinations = calculate_dish_combinations(filtered_df, min_support=min_support / 100)
            
            if not dish_combinations.empty:
                combo_fig = plot_dish_combination(dish_combinations, top_n=15)
                st.plotly_chart(combo_fig, use_container_width=True)
                
                st.subheader("菜品组合明细")
                st.dataframe(
                    dish_combinations,
                    use_container_width=True,
                    hide_index=True,
                    column_config={
                        "菜品组合": st.column_config.TextColumn("菜品组合", width="large"),
                        "菜品1": st.column_config.TextColumn("菜品1"),
                        "菜品2": st.column_config.TextColumn("菜品2"),
                        "共同出现次数": st.column_config.NumberColumn("共同出现次数", format="%.0f"),
                        "支持度": st.column_config.NumberColumn("支持度(%)", format="%.2f"),
                    },
                )
            else:
                st.info("未找到满足条件的菜品组合，请尝试降低最小支持度")
    
    st.markdown("---")
    if st.button("💾 保存分析结果到报告", use_container_width=True):
        st.session_state.analysis_results.update(
            {
                "dish_metrics": dish_metrics,
                "category_metrics": category_metrics,
                "dish_combinations": dish_combinations,
            }
        )
        st.success("✅ 分析结果已保存，可在'报告导出'页面生成报告")
else:
    st.info("请选择完整的日期范围")
