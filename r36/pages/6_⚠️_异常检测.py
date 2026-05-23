import streamlit as st
import pandas as pd
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core import (
    filter_by_date_and_store,
    get_date_range,
    get_store_list,
    detect_anomalous_stores,
    detect_cost_anomalies,
    calculate_hourly_trend,
    calculate_store_metrics,
    plot_anomaly_bars,
    plot_hourly_heatmap,
)

st.set_page_config(page_title="异常检测", page_icon="⚠️", layout="wide")

st.title("⚠️ 异常检测")

if st.session_state.merged_df is None:
    st.warning("⚠️ 请先在 '数据上传与校验' 页面加载并清洗数据")
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
    key="anomaly_date_range",
)

stores = get_store_list(merged_df)
store_names = [s["store_name"] for s in stores]
selected_store_names = st.sidebar.multiselect(
    "选择门店",
    options=store_names,
    default=store_names,
    key="anomaly_stores",
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
    
    ingredient_costs = cleaned_data.get("ingredient_costs", pd.DataFrame())
    if not ingredient_costs.empty:
        ingredient_costs = filter_by_date_and_store(
            ingredient_costs,
            (date_range[0], date_range[1]),
            selected_store_ids,
            date_column="cost_date",
        )
    
    detection_method = st.sidebar.selectbox(
        "异常检测方法",
        options=["IQR 四分位距法", "Z-score 法"],
        index=0,
    )
    method = "iqr" if detection_method == "IQR 四分位距法" else "zscore"
    
    anomaly_metric = st.sidebar.selectbox(
        "检测指标",
        options=["营业额", "毛利", "订单数", "客单价", "毛利率"],
        index=0,
    )
    
    tab1, tab2, tab3 = st.tabs(["🏪 门店异常检测", "💰 原料成本异常", "⏰ 时段异常分析"])
    
    with tab1:
        st.subheader("门店经营异常检测")
        st.info(
            f"使用 **{detection_method}** 识别各门店 **{anomaly_metric}** 的异常值"
        )
        
        anomaly_stores = detect_anomalous_stores(filtered_df, metric=anomaly_metric, method=method)
        
        if not anomaly_stores.empty:
            anomaly_fig = plot_anomaly_bars(anomaly_stores, metric=anomaly_metric)
            st.plotly_chart(anomaly_fig, use_container_width=True)
            
            st.markdown("### 📋 门店异常详情")
            
            anomaly_count = (anomaly_stores["状态"] != "正常").sum()
            normal_count = (anomaly_stores["状态"] == "正常").sum()
            
            col1, col2, col3 = st.columns(3)
            col1.metric("门店总数", len(anomaly_stores))
            col2.metric("正常门店", normal_count, delta_color="normal")
            
            if anomaly_count > 0:
                col3.metric("异常门店", anomaly_count, delta_color="inverse")
            else:
                col3.metric("异常门店", anomaly_count, delta_color="normal")
            
            display_columns = [
                "store_id", "store_name", "city", "area", 
                anomaly_metric, "状态"
            ]
            if "下限" in anomaly_stores.columns:
                display_columns += ["下限", "上限"]
            if "Z分数" in anomaly_stores.columns:
                display_columns += ["Z分数"]
            
            st.dataframe(
                anomaly_stores[display_columns],
                use_container_width=True,
                hide_index=True,
                column_config={
                    "store_id": st.column_config.TextColumn("门店ID"),
                    "store_name": st.column_config.TextColumn("门店名称", width="medium"),
                    "city": st.column_config.TextColumn("城市"),
                    "area": st.column_config.TextColumn("区域"),
                    anomaly_metric: st.column_config.NumberColumn(
                        anomaly_metric,
                        format="¥%.2f" if anomaly_metric in ["营业额", "毛利", "客单价"] else "%.0f",
                    ),
                    "状态": st.column_config.TextColumn("状态"),
                    "下限": st.column_config.NumberColumn(
                        "异常下限",
                        format="¥%.2f" if anomaly_metric in ["营业额", "毛利", "客单价"] else "%.0f",
                    ),
                    "上限": st.column_config.NumberColumn(
                        "异常上限",
                        format="¥%.2f" if anomaly_metric in ["营业额", "毛利", "客单价"] else "%.0f",
                    ),
                    "Z分数": st.column_config.NumberColumn("Z分数", format="%.2f"),
                },
            )
            
            anomaly_df = anomaly_stores[anomaly_stores["状态"] != "正常"]
            if not anomaly_df.empty:
                st.markdown("### ⚠️ 异常门店预警")
                for _, row in anomaly_df.iterrows():
                    status = row["状态"]
                    if "偏高" in status:
                        st.success(
                            f"🏪 **{row['store_name']}** ({row['city']}{row['area']}) - "
                            f"{anomaly_metric}: ¥{row[anomaly_metric]:,.2f} - {status}"
                        )
                    else:
                        st.error(
                            f"🏪 **{row['store_name']}** ({row['city']}{row['area']}) - "
                            f"{anomaly_metric}: ¥{row[anomaly_metric]:,.2f} - {status}"
                        )
            else:
                st.success("✅ 所有门店经营指标正常，无异常门店")
    
    with tab2:
        st.subheader("原料成本异常检测")
        
        if not ingredient_costs.empty:
            cost_anomalies = detect_cost_anomalies(ingredient_costs)
            
            if not cost_anomalies.empty:
                st.error(
                    f"⚠️ 检测到 {len(cost_anomalies)} 条原料成本异常记录"
                )
                
                store_names_map = dict(zip(stores[0], stores[1])) if stores else {}
                if "store_name" in filtered_df.columns and "store_id" in filtered_df.columns:
                    store_names_map = dict(
                        zip(filtered_df["store_id"].unique(), filtered_df["store_name"].unique())
                    )
                
                cost_anomalies["store_name"] = cost_anomalies["store_id"].map(store_names_map)
                
                col1, col2 = st.columns([3, 1])
                with col1:
                    st.dataframe(
                        cost_anomalies,
                        use_container_width=True,
                        hide_index=True,
                        column_config={
                            "store_id": st.column_config.TextColumn("门店ID"),
                            "store_name": st.column_config.TextColumn("门店名称"),
                            "异常日期": st.column_config.DateColumn("异常日期"),
                            "成本率": st.column_config.NumberColumn("成本率(%)", format="%.2f"),
                            "预期上限": st.column_config.NumberColumn("预期上限(%)", format="%.2f"),
                            "偏离程度": st.column_config.NumberColumn("偏离程度(%)", format="%.2f"),
                        },
                    )
                
                with col2:
                    st.subheader("📊 汇总统计")
                    st.metric("异常记录数", len(cost_anomalies))
                    st.metric("涉及门店数", cost_anomalies["store_id"].nunique())
                    st.metric("平均偏离率", f"{cost_anomalies['偏离程度'].mean():.2f}%")
                    st.metric("最大偏离率", f"{cost_anomalies['偏离程度'].max():.2f}%")
                
                st.markdown("### 💡 成本异常洞察")
                
                by_store = (
                    cost_anomalies.groupby("store_name")["偏离程度"]
                    .agg(["count", "mean", "max"])
                    .reset_index()
                    .sort_values("count", ascending=False)
                )
                by_store.columns = ["门店名称", "异常次数", "平均偏离(%)", "最大偏离(%)"]
                
                st.dataframe(
                    by_store,
                    use_container_width=True,
                    hide_index=True,
                    column_config={
                        "门店名称": st.column_config.TextColumn("门店名称"),
                        "异常次数": st.column_config.NumberColumn("异常次数", format="%.0f"),
                        "平均偏离(%)": st.column_config.NumberColumn("平均偏离(%)", format="%.2f"),
                        "最大偏离(%)": st.column_config.NumberColumn("最大偏离(%)", format="%.2f"),
                    },
                )
            else:
                st.success("✅ 未检测到原料成本异常，所有门店成本率在正常范围内")
                
                avg_cost_rate = ingredient_costs["food_cost_rate"].mean()
                st.info(f"📊 平均原料成本率: {avg_cost_rate:.2f}%")
        else:
            st.info("ℹ️ 无原料成本数据，请上传 ingredient_costs.csv 文件")
    
    with tab3:
        st.subheader("营业时段异常分析")
        
        st.info("分析各时段订单分布，识别异常高峰或低谷时段")
        
        heatmap_fig = plot_hourly_heatmap(filtered_df)
        st.plotly_chart(heatmap_fig, use_container_width=True)
        
        hourly_trend = calculate_hourly_trend(filtered_df)
        
        if not hourly_trend.empty:
            st.markdown("### 📊 时段异常检测")
            
            order_mean = hourly_trend["订单数"].mean()
            order_std = hourly_trend["订单数"].std()
            
            hourly_trend["Z分数"] = (hourly_trend["订单数"] - order_mean) / order_std if order_std > 0 else 0
            hourly_trend["状态"] = hourly_trend["Z分数"].apply(
                lambda x: "异常高峰" if x > 2 else ("异常低谷" if x < -1 else "正常")
            )
            
            col1, col2 = st.columns(2)
            
            with col1:
                peak_hours = hourly_trend[hourly_trend["状态"] == "异常高峰"]
                if not peak_hours.empty:
                    st.success(
                        f"🌞 **异常高峰时段** ({len(peak_hours)} 个): "
                        + ", ".join([f"{int(h)}:00" for h in peak_hours["order_hour"]])
                    )
                else:
                    st.info("ℹ️ 无明显异常高峰时段")
            
            with col2:
                low_hours = hourly_trend[hourly_trend["状态"] == "异常低谷"]
                if not low_hours.empty:
                    st.warning(
                        f"🌙 **异常低谷时段** ({len(low_hours)} 个): "
                        + ", ".join([f"{int(h)}:00" for h in low_hours["order_hour"]])
                    )
                else:
                    st.info("ℹ️ 无明显异常低谷时段")
            
            st.dataframe(
                hourly_trend,
                use_container_width=True,
                hide_index=True,
                column_config={
                    "order_hour": st.column_config.NumberColumn("时段", format="%.0f:00"),
                    "订单数": st.column_config.NumberColumn("订单数", format="%.0f"),
                    "营业额": st.column_config.NumberColumn("营业额", format="¥%.2f"),
                    "毛利": st.column_config.NumberColumn("毛利", format="¥%.2f"),
                    "客单价": st.column_config.NumberColumn("客单价", format="¥%.2f"),
                    "Z分数": st.column_config.NumberColumn("Z分数", format="%.2f"),
                    "状态": st.column_config.TextColumn("状态"),
                },
            )
    
    st.markdown("---")
    if st.button("💾 保存分析结果到报告", use_container_width=True):
        st.session_state.analysis_results.update(
            {
                "anomaly_stores": anomaly_stores,
                "cost_anomalies": cost_anomalies if not ingredient_costs.empty else None,
            }
        )
        st.success("✅ 分析结果已保存，可在'报告导出'页面生成报告")
else:
    st.info("请选择完整的日期范围")
