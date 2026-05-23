import streamlit as st
import pandas as pd
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core import (
    init_session_state,
    load_csv_files,
    load_sample_data,
    get_data_summary,
    validate_all_datasets,
    get_validation_summary,
    clean_data,
    merge_orders_with_details,
)
from config.schemas import REQUIRED_FILES, DATA_SCHEMAS

st.set_page_config(page_title="数据上传与校验", page_icon="📊", layout="wide")

init_session_state()

st.title("📊 数据上传与校验")
st.markdown("上传连锁餐饮业务数据，系统将自动进行字段校验和数据质量评估")

tab1, tab2, tab3 = st.tabs(["📁 上传数据", "🧪 示例数据", "📋 数据校验"])

with tab1:
    st.subheader("上传 CSV 数据文件")
    st.info("请上传所有 9 类业务数据文件，文件名需包含相应关键词（如 orders, dishes, members 等）")
    
    uploaded_files = st.file_uploader(
        "拖拽 CSV 文件到此处，或点击选择文件（支持多选）",
        type=["csv"],
        accept_multiple_files=True,
        help="支持同时上传多份 CSV 文件",
    )
    
    if uploaded_files:
        col1, col2 = st.columns([1, 1])
        with col1:
            st.success(f"✅ 已选择 {len(uploaded_files)} 个文件")
        with col2:
            if st.button("🔄 重置数据", type="secondary"):
                st.session_state.data_dict = {}
                st.session_state.cleaned_data = {}
                st.session_state.merged_df = None
                st.session_state.validation_report = None
                st.rerun()
        
        if st.button("📥 加载并校验数据", type="primary", use_container_width=True):
            with st.spinner("正在加载和校验数据..."):
                data_dict = load_csv_files(uploaded_files)
                st.session_state.data_dict = data_dict
                
                validation_report = validate_all_datasets(data_dict)
                st.session_state.validation_report = validation_report
                
                if validation_report.overall_valid:
                    st.success(f"✅ 数据加载完成，共加载 {len(data_dict)} 份数据")
                else:
                    st.warning(f"⚠️ 数据加载完成，但存在 {len(validation_report.missing_files)} 份缺失文件")
                
                st.rerun()

with tab2:
    st.subheader("使用示例数据")
    st.info("点击下方按钮加载内置的 1000 条示例数据，快速体验系统功能")
    
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        if st.button("🎲 加载示例数据", type="primary", use_container_width=True, icon="📊"):
            with st.spinner("正在加载示例数据..."):
                data_dict = load_sample_data()
                st.session_state.data_dict = data_dict
                
                validation_report = validate_all_datasets(data_dict)
                st.session_state.validation_report = validation_report
                
                st.success(f"✅ 示例数据加载完成，共加载 {len(data_dict)} 份数据（订单 {len(data_dict.get('orders', []))} 条）")
                st.rerun()
    
    if st.session_state.data_dict:
        st.markdown("---")
        st.subheader("数据概览")
        summary_df = get_data_summary(st.session_state.data_dict)
        if not summary_df.empty:
            st.dataframe(summary_df, use_container_width=True, hide_index=True)

with tab3:
    st.subheader("数据校验报告")
    
    if st.session_state.validation_report:
        report = st.session_state.validation_report
        
        col1, col2, col3 = st.columns(3)
        with col1:
            score_color = "#2E7D32" if report.quality_score >= 80 else "#F57F17" if report.quality_score >= 60 else "#C62828"
            st.markdown(
                f"""
                <div style='background: white; padding: 24px; border-radius: 12px; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.08);'>
                    <p style='font-size: 0.9rem; color: #666; margin-bottom: 8px;'>数据质量评分</p>
                    <p style='font-size: 3rem; font-weight: bold; color: {score_color};'>{report.quality_score:.1f}</p>
                    <p style='font-size: 0.85rem; color: #999;'>/ 100</p>
                </div>
                """,
                unsafe_allow_html=True,
            )
        with col2:
            st.metric("已加载数据表", f"{len(report.results)} / {len(REQUIRED_FILES)}")
        with col3:
            st.metric("整体状态", "✅ 有效" if report.overall_valid else "⚠️ 部分缺失")
        
        if report.missing_files:
            st.warning(
                f"⚠️ 缺失以下数据表：{', '.join(report.missing_files)}。"
                f"部分分析功能可能无法使用。"
            )
        
        st.markdown("---")
        st.subheader("详细校验结果")
        
        validation_summary = get_validation_summary(report)
        if not validation_summary.empty:
            st.dataframe(validation_summary, use_container_width=True, hide_index=True)
        
        with st.expander("查看字段级校验详情"):
            for name, result in report.results.items():
                st.markdown(f"**📄 {name}**")
                
                if result.missing_columns:
                    st.error(f"❌ 缺失字段: {', '.join(result.missing_columns)}")
                
                if result.extra_columns:
                    st.info(f"ℹ️ 额外字段: {', '.join(result.extra_columns)}")
                
                if result.type_mismatches:
                    st.warning(f"⚠️ 类型不匹配: {result.type_mismatches}")
                
                missing_report = report.missing_reports.get(name)
                if missing_report and missing_report.total_missing > 0:
                    st.warning(
                        f"⚠️ 缺失 {missing_report.total_missing} 个值 "
                        f"({missing_report.missing_percentage:.2f}%)，"
                        f"影响 {missing_report.rows_with_missing} 行数据"
                    )
                    with st.expander("查看各字段缺失情况"):
                        missing_df = pd.DataFrame(
                            [{"字段": k, "缺失数": v} for k, v in missing_report.missing_by_column.items() if v > 0]
                        )
                        if not missing_df.empty:
                            st.dataframe(missing_df, use_container_width=True, hide_index=True)
                
                if not result.errors and not result.warnings and missing_report.total_missing == 0:
                    st.success("✅ 数据校验通过，无异常")
                
                st.markdown("---")
        
        if st.button("✨ 清洗数据并开始分析", type="primary", use_container_width=True):
            with st.spinner("正在清洗和处理数据..."):
                cleaned_data = clean_data(st.session_state.data_dict)
                st.session_state.cleaned_data = cleaned_data
                
                merged_df = merge_orders_with_details(cleaned_data)
                st.session_state.merged_df = merged_df
                
                st.success("✅ 数据清洗完成！请在左侧导航栏选择其他页面进行分析")
                st.switch_page("pages/2_📈_经营概览.py")
    else:
        st.info("请先上传数据或加载示例数据，以查看校验报告")

st.markdown("---")
with st.expander("📖 数据字段规范说明"):
    for name, schema in DATA_SCHEMAS.items():
        st.markdown(f"**{name}.csv**")
        schema_df = pd.DataFrame(
            [{"字段名": k, "预期类型": v} for k, v in schema.items()]
        )
        st.dataframe(schema_df, use_container_width=True, hide_index=True)
