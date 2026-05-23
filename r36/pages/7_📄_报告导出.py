import streamlit as st
import pandas as pd
import sys
import os
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core import generate_excel_report, generate_html_report

st.set_page_config(page_title="报告导出", page_icon="📄", layout="wide")

st.title("📄 报告导出")

if not st.session_state.analysis_results:
    st.warning("⚠️ 请先在各分析页面点击'保存分析结果到报告'按钮，收集需要导出的数据")
    
    if st.session_state.merged_df is not None:
        st.info("💡 提示：您已加载数据，可以一键快速生成完整报告")
        if st.button("🚀 一键生成完整分析报告", type="primary", use_container_width=True):
            from core import (
                calculate_kpi_metrics,
                calculate_store_metrics,
                calculate_dish_metrics,
                calculate_category_metrics,
                calculate_rfm,
                calculate_repurchase_rate,
                calculate_promotion_effectiveness,
                calculate_refund_analysis,
                calculate_hourly_trend,
                calculate_dish_combinations,
                detect_anomalous_stores,
            )
            
            with st.spinner("正在生成完整分析报告..."):
                merged_df = st.session_state.merged_df
                cleaned_data = st.session_state.cleaned_data
                refunds_df = cleaned_data.get("refunds", pd.DataFrame())
                
                st.session_state.analysis_results = {
                    "date_range": st.session_state.get("date_range", (
                        merged_df["order_time"].min().strftime("%Y-%m-%d"),
                        merged_df["order_time"].max().strftime("%Y-%m-%d"),
                    )),
                    "kpi_metrics": calculate_kpi_metrics(merged_df),
                    "store_metrics": calculate_store_metrics(merged_df),
                    "dish_metrics": calculate_dish_metrics(merged_df),
                    "category_metrics": calculate_category_metrics(merged_df),
                    "rfm_result": calculate_rfm(merged_df),
                    "repurchase_result": calculate_repurchase_rate(merged_df),
                    "promotion_metrics": calculate_promotion_effectiveness(merged_df),
                    "refund_analysis": calculate_refund_analysis(merged_df, refunds_df),
                    "hourly_trend": calculate_hourly_trend(merged_df),
                    "dish_combinations": calculate_dish_combinations(merged_df),
                    "anomaly_stores": detect_anomalous_stores(merged_df),
                }
                st.success("✅ 完整报告数据已生成！")
                st.rerun()
    st.stop()

analysis_results = st.session_state.analysis_results

st.markdown("### 📊 已收集的分析数据")

available_sections = []
section_mapping = {
    "kpi_metrics": "📈 核心经营指标",
    "store_metrics": "🏪 门店经营分析",
    "dish_metrics": "🍜 菜品销售分析",
    "category_metrics": "🥡 品类销售分析",
    "rfm_result": "👥 会员RFM分析",
    "repurchase_result": "🔄 会员复购分析",
    "promotion_metrics": "🎁 促销活动分析",
    "refund_analysis": "💸 退款分析",
    "hourly_trend": "🕒 营业时段分析",
    "dish_combinations": "🍱 菜品组合分析",
    "anomaly_stores": "⚠️ 门店异常检测",
}

for key, label in section_mapping.items():
    if key in analysis_results and analysis_results[key] is not None:
        if isinstance(analysis_results[key], pd.DataFrame):
            if not analysis_results[key].empty:
                available_sections.append((key, label))
        elif isinstance(analysis_results[key], dict):
            if analysis_results[key]:
                available_sections.append((key, label))
        else:
            available_sections.append((key, label))

if not available_sections:
    st.info("ℹ️ 暂无可用的分析数据")
    st.stop()

st.success(f"✅ 已收集 {len(available_sections)} 个分析模块的数据")

col1, col2 = st.columns([2, 1])

with col1:
    st.markdown("### 📋 选择报告章节")
    
    selected_sections = {}
    for key, label in available_sections:
        selected_sections[key] = st.checkbox(label, value=True, key=f"section_{key}")

with col2:
    st.markdown("### ⚙️ 报告设置")
    
    report_format = st.radio(
        "报告格式",
        options=["Excel (.xlsx)", "HTML (.html)"],
        index=0,
        horizontal=True,
    )
    
    report_name = st.text_input("报告名称", value=f"餐饮数据分析报告_{datetime.now().strftime('%Y%m%d')}")
    
    include_date = st.checkbox("在文件名中包含日期", value=True)
    
    if include_date:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{report_name}_{timestamp}"
    else:
        filename = report_name
    
    if report_format == "Excel (.xlsx)":
        filename += ".xlsx"
    else:
        filename += ".html"
    
    st.info(f"📄 输出文件名: `{filename}`")

st.markdown("---")

st.markdown("### 📑 报告预览")

preview_tab1, preview_tab2 = st.tabs(["📊 数据概览", "📋 详细数据"])

with preview_tab1:
    preview_cols = st.columns(4)
    
    if "kpi_metrics" in analysis_results and analysis_results["kpi_metrics"]:
        kpi = analysis_results["kpi_metrics"]
        preview_cols[0].metric("总营业额", f"¥{kpi.get('总营业额', 0):,.2f}")
        preview_cols[1].metric("总毛利", f"¥{kpi.get('总毛利', 0):,.2f}")
        preview_cols[2].metric("订单数", f"{kpi.get('订单数', 0):,.0f}")
        preview_cols[3].metric("客单价", f"¥{kpi.get('客单价', 0):,.2f}")
    
    st.markdown("#### 包含的章节")
    for key, label in available_sections:
        if selected_sections.get(key, False):
            st.success(f"✅ {label}")

with preview_tab2:
    selected_key = st.selectbox(
        "选择要预览的数据",
        options=[label for key, label in available_sections if selected_sections.get(key, False)],
        index=0,
    )
    
    key_map = {label: key for key, label in available_sections}
    selected_data_key = key_map.get(selected_key)
    
    if selected_data_key:
        data = analysis_results.get(selected_data_key)
        if isinstance(data, pd.DataFrame):
            st.dataframe(data.head(20), use_container_width=True, hide_index=True)
            st.info(f"显示前 20 行，共 {len(data)} 行数据")
        elif isinstance(data, dict):
            if selected_data_key == "kpi_metrics":
                kpi_df = pd.DataFrame([{"指标": k, "数值": v} for k, v in data.items()])
                st.dataframe(kpi_df, use_container_width=True, hide_index=True)
            elif selected_data_key == "repurchase_result":
                for k, v in data.items():
                    if isinstance(v, pd.DataFrame):
                        st.dataframe(v, use_container_width=True, hide_index=True)
                    else:
                        st.write(f"**{k}**: {v}")
            elif selected_data_key == "refund_analysis":
                for k, v in data.items():
                    if isinstance(v, pd.DataFrame):
                        st.dataframe(v, use_container_width=True, hide_index=True)
                    else:
                        st.write(f"**{k}**: {v}")

st.markdown("---")

col1, col2, col3 = st.columns([1, 2, 1])

with col2:
    if st.button("📥 生成并下载报告", type="primary", use_container_width=True, icon="📄"):
        export_data = {
            key: analysis_results[key]
            for key in selected_sections
            if selected_sections.get(key, False) and key in analysis_results
        }
        
        if "date_range" in analysis_results:
            export_data["date_range"] = analysis_results["date_range"]
        elif "date_range" not in export_data:
            export_data["date_range"] = (
                datetime.now().strftime("%Y-%m-%d"),
                datetime.now().strftime("%Y-%m-%d"),
            )
        
        with st.spinner("正在生成报告..."):
            try:
                if report_format == "Excel (.xlsx)":
                    excel_bytes = generate_excel_report(export_data)
                    
                    st.success("✅ Excel 报告生成成功！")
                    
                    st.download_button(
                        label="📥 下载 Excel 报告",
                        data=excel_bytes,
                        file_name=filename,
                        mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                        use_container_width=True,
                        type="secondary",
                    )
                else:
                    html_content = generate_html_report(export_data)
                    
                    st.success("✅ HTML 报告生成成功！")
                    
                    st.download_button(
                        label="📥 下载 HTML 报告",
                        data=html_content,
                        file_name=filename,
                        mime="text/html",
                        use_container_width=True,
                        type="secondary",
                    )
                    
                    with st.expander("👁️ 预览 HTML 报告"):
                        st.components.v1.html(html_content, height=600, scrolling=True)
                
                save_dir = "exports"
                os.makedirs(save_dir, exist_ok=True)
                save_path = os.path.join(save_dir, filename)
                
                if report_format == "Excel (.xlsx)":
                    with open(save_path, "wb") as f:
                        f.write(excel_bytes)
                else:
                    with open(save_path, "w", encoding="utf-8") as f:
                        f.write(html_content)
                
                st.info(f"💾 报告已保存到: `{save_path}`")
                
            except Exception as e:
                st.error(f"❌ 生成报告时出错: {str(e)}")
                st.exception(e)

st.markdown("---")

if st.button("🗑️ 清空已收集的分析数据", use_container_width=True, type="secondary"):
    st.session_state.analysis_results = {}
    st.success("✅ 已清空分析数据")
    st.rerun()
