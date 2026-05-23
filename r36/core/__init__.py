from .ingestion import (
    load_csv_files,
    load_sample_data,
    load_data_from_dir,
    get_data_summary,
    detect_file_type,
)


def init_session_state():
    """初始化所有 Streamlit session_state 键，确保页面访问时不会报错"""
    import streamlit as st

    default_values = {
        "data_dict": {},
        "cleaned_data": {},
        "merged_df": None,
        "validation_report": None,
        "date_range": None,
        "selected_stores": None,
        "analysis_results": {},
    }

    for key, default_value in default_values.items():
        if key not in st.session_state:
            st.session_state[key] = default_value


def check_data_loaded(require_merged: bool = True) -> bool:
    """检查数据是否已加载，返回 False 并显示警告时页面应停止"""
    import streamlit as st

    init_session_state()

    if len(st.session_state.data_dict) == 0:
        st.warning("⚠️ 请先在 '数据上传与校验' 页面上传或加载数据")
        st.info("💡 可以使用示例数据快速体验所有功能")
        return False

    if require_merged and st.session_state.merged_df is None:
        st.warning("⚠️ 请先在 '数据上传与校验' 页面点击 '清洗数据并完成分析' 按钮")
        return False

    return True
from .validation import (
    validate_all_datasets,
    get_validation_summary,
    ValidationReport,
    ValidationResult,
    MissingDataReport,
)
from .transform import (
    clean_data,
    merge_orders_with_details,
    filter_by_date_and_store,
    get_date_range,
    get_store_list,
)
from .metrics import (
    calculate_kpi_metrics,
    calculate_period_comparison,
    calculate_dish_metrics,
    calculate_category_metrics,
    calculate_store_metrics,
    calculate_rfm,
    calculate_repurchase_rate,
    calculate_promotion_effectiveness,
    calculate_refund_analysis,
    calculate_hourly_trend,
    calculate_dish_combinations,
    detect_anomalous_stores,
    detect_cost_anomalies,
)
from .visualization import (
    plot_revenue_trend,
    plot_store_comparison,
    plot_dish_ranking,
    plot_category_distribution,
    plot_profit_matrix,
    plot_rfm_scatter,
    plot_customer_segment_bar,
    plot_promotion_roi,
    plot_refund_by_reason,
    plot_hourly_heatmap,
    plot_anomaly_bars,
    plot_dish_combination,
)
from .export import generate_excel_report, generate_html_report

__all__ = [
    "init_session_state",
    "check_data_loaded",
    "load_csv_files",
    "load_sample_data",
    "load_data_from_dir",
    "get_data_summary",
    "detect_file_type",
    "validate_all_datasets",
    "get_validation_summary",
    "ValidationReport",
    "ValidationResult",
    "MissingDataReport",
    "clean_data",
    "merge_orders_with_details",
    "filter_by_date_and_store",
    "get_date_range",
    "get_store_list",
    "calculate_kpi_metrics",
    "calculate_period_comparison",
    "calculate_dish_metrics",
    "calculate_category_metrics",
    "calculate_store_metrics",
    "calculate_rfm",
    "calculate_repurchase_rate",
    "calculate_promotion_effectiveness",
    "calculate_refund_analysis",
    "calculate_hourly_trend",
    "calculate_dish_combinations",
    "detect_anomalous_stores",
    "detect_cost_anomalies",
    "plot_revenue_trend",
    "plot_store_comparison",
    "plot_dish_ranking",
    "plot_category_distribution",
    "plot_profit_matrix",
    "plot_rfm_scatter",
    "plot_customer_segment_bar",
    "plot_promotion_roi",
    "plot_refund_by_reason",
    "plot_hourly_heatmap",
    "plot_anomaly_bars",
    "plot_dish_combination",
    "generate_excel_report",
    "generate_html_report",
]
