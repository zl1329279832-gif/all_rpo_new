import streamlit as st
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

st.set_page_config(
    page_title="连锁餐饮数据分析平台",
    page_icon="🍜",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.markdown(
    """
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    * {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }
    
    .stApp {
        background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    }
    
    .block-container {
        padding-top: 2rem;
        padding-bottom: 3rem;
    }
    
    h1, h2, h3 {
        font-weight: 700;
        color: #1a237e;
    }
    
    .stMetric {
        background: white;
        border-radius: 12px;
        padding: 16px 20px;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
        border-left: 4px solid #1976D2;
    }
    
    div[data-testid="stSidebar"] {
        background: linear-gradient(180deg, #0D47A1 0%, #1565C0 50%, #1976D2 100%);
    }
    
    div[data-testid="stSidebar"] .block-container {
        padding-top: 2rem;
    }
    
    div[data-testid="stSidebar"] span {
        color: white !important;
    }
    
    div[data-testid="stSidebar"] svg {
        color: #FF9800 !important;
    }
    
    .stButton>button {
        background: linear-gradient(135deg, #1976D2 0%, #0D47A1 100%);
        color: white;
        border: none;
        border-radius: 8px;
        padding: 0.5rem 1.5rem;
        font-weight: 600;
        transition: all 0.3s ease;
    }
    
    .stButton>button:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(25,118,210,0.4);
    }
    
    .stDataFrame {
        background: white;
        border-radius: 8px;
        padding: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    
    .stPlotlyChart {
        background: white;
        border-radius: 12px;
        padding: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }
    
    .status-success {
        background: #C8E6C9;
        color: #2E7D32;
        padding: 0.5rem 1rem;
        border-radius: 8px;
        font-weight: 600;
    }
    
    .status-warning {
        background: #FFECB3;
        color: #F57F17;
        padding: 0.5rem 1rem;
        border-radius: 8px;
        font-weight: 600;
    }
    
    .status-error {
        background: #FFCDD2;
        color: #C62828;
        padding: 0.5rem 1rem;
        border-radius: 8px;
        font-weight: 600;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

if "data_dict" not in st.session_state:
    st.session_state.data_dict = {}

if "cleaned_data" not in st.session_state:
    st.session_state.cleaned_data = {}

if "merged_df" not in st.session_state:
    st.session_state.merged_df = None

if "validation_report" not in st.session_state:
    st.session_state.validation_report = None

if "date_range" not in st.session_state:
    st.session_state.date_range = None

if "selected_stores" not in st.session_state:
    st.session_state.selected_stores = None

if "analysis_results" not in st.session_state:
    st.session_state.analysis_results = {}

with st.sidebar:
    st.markdown(
        """
        <div style='text-align: center; padding: 20px 0;'>
            <h1 style='color: white !important; font-size: 1.8rem; margin-bottom: 0.5rem;'>🍜 餐饮分析</h1>
            <p style='color: rgba(255,255,255,0.7); font-size: 0.9rem;'>连锁餐饮数据分析平台</p>
        </div>
        <hr style='border-color: rgba(255,255,255,0.2); margin: 1rem 0;'/>
        """,
        unsafe_allow_html=True,
    )
    
    st.markdown(
        """
        <div style='color: rgba(255,255,255,0.9); padding: 10px 0;'>
            <p style='font-size: 0.85rem; margin-bottom: 0.5rem;'>📊 数据状态</p>
        </div>
        """,
        unsafe_allow_html=True,
    )
    
    data_loaded = len(st.session_state.data_dict) > 0
    if data_loaded:
        st.success(f"✅ 已加载 {len(st.session_state.data_dict)} 份数据")
        if st.session_state.validation_report:
            score = st.session_state.validation_report.quality_score
            if score >= 80:
                st.success(f"📈 数据质量评分: {score:.1f}/100")
            elif score >= 60:
                st.warning(f"📈 数据质量评分: {score:.1f}/100")
            else:
                st.error(f"📈 数据质量评分: {score:.1f}/100")
    else:
        st.warning("⚠️ 请先上传数据或使用示例数据")
    
    st.markdown(
        """
        <hr style='border-color: rgba(255,255,255,0.2); margin: 1rem 0;'/>
        <div style='color: rgba(255,255,255,0.6); font-size: 0.8rem; text-align: center;'>
            <p>© 2024 连锁餐饮数据分析平台</p>
        </div>
        """,
        unsafe_allow_html=True,
    )

st.markdown(
    """
    <div style='text-align: center; padding: 40px 20px;'>
        <h1 style='font-size: 2.5rem; margin-bottom: 1rem;'>🍜 连锁餐饮数据分析平台</h1>
        <p style='font-size: 1.2rem; color: #546E7A; max-width: 800px; margin: 0 auto 2rem;'>
            整合门店、菜品、订单、会员、营销等多维度数据，助力餐饮管理者快速洞察经营状况，优化决策
        </p>
    </div>
    """,
    unsafe_allow_html=True,
)

col1, col2, col3, col4 = st.columns(4)
with col1:
    st.markdown(
        """
        <div style='background: white; padding: 24px; border-radius: 16px; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.08);'>
            <div style='font-size: 2.5rem; margin-bottom: 12px;'>📊</div>
            <h3 style='font-size: 1.1rem; margin-bottom: 8px;'>多维度分析</h3>
            <p style='font-size: 0.85rem; color: #666;'>营业额、毛利、客单价、复购率等核心指标</p>
        </div>
        """,
        unsafe_allow_html=True,
    )

with col2:
    st.markdown(
        """
        <div style='background: white; padding: 24px; border-radius: 16px; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.08);'>
            <div style='font-size: 2.5rem; margin-bottom: 12px;'>📈</div>
            <h3 style='font-size: 1.1rem; margin-bottom: 8px;'>智能可视化</h3>
            <p style='font-size: 0.85rem; color: #666;'>交互式图表，支持钻取、筛选、联动</p>
        </div>
        """,
        unsafe_allow_html=True,
    )

with col3:
    st.markdown(
        """
        <div style='background: white; padding: 24px; border-radius: 16px; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.08);'>
            <div style='font-size: 2.5rem; margin-bottom: 12px;'>⚠️</div>
            <h3 style='font-size: 1.1rem; margin-bottom: 8px;'>异常检测</h3>
            <p style='font-size: 0.85rem; color: #666;'>基于统计方法识别异常门店和经营问题</p>
        </div>
        """,
        unsafe_allow_html=True,
    )

with col4:
    st.markdown(
        """
        <div style='background: white; padding: 24px; border-radius: 16px; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.08);'>
            <div style='font-size: 2.5rem; margin-bottom: 12px;'>📄</div>
            <h3 style='font-size: 1.1rem; margin-bottom: 8px;'>一键报告</h3>
            <p style='font-size: 0.85rem; color: #666;'>支持 Excel 和 HTML 格式报告导出</p>
        </div>
        """,
        unsafe_allow_html=True,
    )

st.markdown("<br/>", unsafe_allow_html=True)

st.subheader("🚀 快速开始")
st.info("👈 请在左侧导航栏选择 **'数据上传与校验'** 页面，上传您的 CSV 数据文件，或直接使用内置的示例数据开始分析。")

with st.expander("📋 支持的数据文件格式"):
    st.markdown(
        """
        系统支持以下 9 类业务数据文件：
        
        | 文件名（包含关键词） | 说明 |
        |----------------------|------|
        | `stores` | 门店信息表 |
        | `dishes` | 菜品信息表 |
        | `members` | 会员信息表 |
        | `promotions` | 优惠活动表 |
        | `orders` | 订单主表 |
        | `order_items` | 订单明细表 |
        | `refunds` | 退款记录表 |
        | `business_hours` | 营业时段表 |
        | `ingredient_costs` | 原料成本表 |
        
        **文件格式要求：**
        - 编码：UTF-8
        - 分隔符：英文逗号
        - 日期格式：YYYY-MM-DD 或 YYYY-MM-DD HH:MM:SS
        """
    )

st.markdown("<br/>", unsafe_allow_html=True)

st.subheader("📊 分析功能概览")
feature_col1, feature_col2 = st.columns(2)

with feature_col1:
    st.markdown(
        """
        **经营分析**
        - ✅ 营业额/毛利趋势分析
        - ✅ 门店经营对比
        - ✅ 同比环比分析
        - ✅ 营业时段热力图
        
        **菜品分析**
        - ✅ 菜品销售排行
        - ✅ 品类销售占比
        - ✅ 菜品利润矩阵
        - ✅ 菜品组合分析
        """
    )

with feature_col2:
    st.markdown(
        """
        **会员分析**
        - ✅ RFM 客户价值分层
        - ✅ 复购率分析
        - ✅ 客单价分析
        - ✅ 购买频次分布
        
        **营销分析**
        - ✅ 促销活动 ROI
        - ✅ 优惠券核销分析
        - ✅ 退款原因分析
        - ✅ 异常门店检测
        """
    )
