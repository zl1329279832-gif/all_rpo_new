import streamlit as st
import pandas as pd
import plotly.express as px
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core import (
    init_session_state,
    check_data_loaded,
    calculate_dish_metrics,
    calculate_category_metrics,
    calculate_dish_combinations,
    calculate_dish_margin_contribution,
    calculate_ingredient_cost_volatility,
    plot_dish_ranking,
    plot_category_distribution,
    plot_profit_matrix,
    plot_dish_combination,
    render_sidebar_filters,
)

st.set_page_config(page_title="菜品分析", page_icon="🍜", layout="wide")

init_session_state()

st.title("🍜 菜品分析")

if not check_data_loaded(require_merged=True):
    st.stop()

merged_df = st.session_state.merged_df

filtered_df, filter_dict = render_sidebar_filters(merged_df, st.session_state.cleaned_data)

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

tab1, tab2, tab3, tab4 = st.tabs(["📈 销售排行", "💰 利润矩阵", "💎 毛利贡献", "📊 成本波动"])

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
    
    if "category" in filtered_df.columns and filter_dict["categories"]:
        categories = ["全部"] + filter_dict["categories"]
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
    
    st.markdown("### 🥡 品类销售占比")
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

with tab2:
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

with tab3:
    st.subheader("菜品毛利贡献分析")
    st.info("分析各菜品对整体毛利的贡献程度，识别核心利润来源")
    
    margin_contribution = calculate_dish_margin_contribution(filtered_df, top_n=20)
    
    if not margin_contribution.empty:
        col1, col2, col3, col4 = st.columns(4)
        col1.metric("核心利润菜品", len(margin_contribution[margin_contribution["利润层级"] == "核心利润菜品"]), help="累计毛利贡献前50%")
        col2.metric("重要利润菜品", len(margin_contribution[margin_contribution["利润层级"] == "重要利润菜品"]), help="累计毛利贡献50%-80%")
        col3.metric("补充利润菜品", len(margin_contribution[margin_contribution["利润层级"] == "补充利润菜品"]), help="累计毛利贡献80%-95%")
        col4.metric("低贡献菜品", len(margin_contribution[margin_contribution["利润层级"] == "低贡献菜品"]), help="累计毛利贡献后5%")
        
        top10_margin = margin_contribution.head(10)
        fig = px.bar(
            top10_margin,
            x="毛利贡献度",
            y="dish_name",
            orientation="h",
            title="毛利贡献度Top10",
            color="利润层级",
            color_discrete_map={
                "核心利润菜品": "#FF4B4B",
                "重要利润菜品": "#FF9F43",
                "补充利润菜品": "#00B894",
                "低贡献菜品": "#636E72",
            },
        )
        fig.update_layout(yaxis={"categoryorder": "total ascending"}, xaxis_title="毛利贡献度(%)", yaxis_title="菜品名称")
        st.plotly_chart(fig, use_container_width=True)
        
        st.markdown("### 📋 毛利贡献明细")
        st.dataframe(
            margin_contribution[["dish_name", "category", "销售额", "毛利", "毛利率", "毛利贡献度", "利润层级"]],
            use_container_width=True,
            hide_index=True,
            column_config={
                "dish_name": st.column_config.TextColumn("菜品名称", width="medium"),
                "category": st.column_config.TextColumn("品类", width="small"),
                "销售额": st.column_config.NumberColumn("销售额", format="¥%.2f"),
                "毛利": st.column_config.NumberColumn("毛利", format="¥%.2f"),
                "毛利率": st.column_config.NumberColumn("毛利率(%)", format="%.2f"),
                "毛利贡献度": st.column_config.NumberColumn("毛利贡献度(%)", format="%.2f"),
                "利润层级": st.column_config.TextColumn("利润层级", width="small"),
            },
        )
    else:
        st.info("暂无毛利贡献数据")

with tab4:
    st.subheader("原料成本波动分析")
    st.info("分析各原料价格的波动情况，识别成本风险点")
    
    cleaned_data = st.session_state.cleaned_data
    cost_df = cleaned_data.get("ingredient_costs", pd.DataFrame())
    dishes_df = cleaned_data.get("dishes", pd.DataFrame())
    
    cost_volatility = calculate_ingredient_cost_volatility(cost_df, dishes_df)
    
    if not cost_volatility.empty:
        col1, col2, col3, col4 = st.columns(4)
        col1.metric("剧烈波动原料", len(cost_volatility[cost_volatility["波动等级"] == "剧烈波动（≥30%）"]), help="变异系数≥30%")
        col2.metric("较大波动原料", len(cost_volatility[cost_volatility["波动等级"] == "较大波动（15%-30%）"]), help="变异系数15%-30%")
        col3.metric("轻微波动原料", len(cost_volatility[cost_volatility["波动等级"] == "轻微波动（5%-15%）"]), help="变异系数5%-15%")
        col4.metric("基本稳定原料", len(cost_volatility[cost_volatility["波动等级"] == "基本稳定（<5%）"]), help="变异系数<5%")
        
        top10_volatility = cost_volatility.sort_values("变异系数", ascending=False).head(10)
        fig = px.bar(
            top10_volatility,
            x="变异系数",
            y=top10_volatility.columns[0],
            orientation="h",
            title="变异系数Top10原料",
            color="波动等级",
            color_discrete_map={
                "剧烈波动（≥30%）": "#FF4B4B",
                "较大波动（15%-30%）": "#FF9F43",
                "轻微波动（5%-15%）": "#FDCB6E",
                "基本稳定（<5%）": "#00B894",
            },
        )
        fig.update_layout(yaxis={"categoryorder": "total ascending"}, xaxis_title="变异系数(%)", yaxis_title="原料名称")
        st.plotly_chart(fig, use_container_width=True)
        
        st.markdown("### 📋 成本波动明细")
        display_cols = [cost_volatility.columns[0], "平均价格", "最高价格", "最低价格", "变异系数", "波动等级"]
        if "关联菜品数" in cost_volatility.columns:
            display_cols.append("关联菜品数")
        st.dataframe(
            cost_volatility[display_cols],
            use_container_width=True,
            hide_index=True,
            column_config={
                cost_volatility.columns[0]: st.column_config.TextColumn("原料名称", width="medium"),
                "平均价格": st.column_config.NumberColumn("平均价格", format="¥%.2f"),
                "最高价格": st.column_config.NumberColumn("最高价格", format="¥%.2f"),
                "最低价格": st.column_config.NumberColumn("最低价格", format="¥%.2f"),
                "变异系数": st.column_config.NumberColumn("变异系数(%)", format="%.2f"),
                "波动等级": st.column_config.TextColumn("波动等级", width="small"),
                "关联菜品数": st.column_config.NumberColumn("关联菜品数", format="%.0f"),
            },
        )
    else:
        st.info("暂无原料成本数据或数据格式不支持波动分析")

st.markdown("---")
if st.button("💾 保存分析结果到报告", use_container_width=True):
    st.session_state.analysis_results.update(
        {
            "dish_metrics": dish_metrics,
            "category_metrics": category_metrics,
            "margin_contribution": margin_contribution if "margin_contribution" in locals() else None,
            "cost_volatility": cost_volatility if "cost_volatility" in locals() else None,
        }
    )
    st.success("✅ 分析结果已保存，可在'报告导出'页面生成报告")
