APP_CONFIG = {
    'page_title': '销售数据分析与可视化平台',
    'page_icon': '📊',
    'layout': 'wide',
    'initial_sidebar_state': 'auto',
    'menu_items': {
        'About': """
        ## 销售数据分析与可视化平台
        
        一个功能强大的销售数据分析工具，支持：
        - 📁 上传 CSV/Excel 数据文件
        - 🔍 自动字段识别和数据验证
        - 📈 多维度销售分析
        - 📊 丰富的可视化图表
        - 📥 一键导出分析报告
        
        **技术栈**: Python 3.11+ | Pandas | Plotly | Streamlit
        """
    }
}

PAGE_CONFIG = {
    'overview': {
        'title': '📊 概览',
        'icon': '📊',
        'order': 1
    },
    'sales_analysis': {
        'title': '📈 销售分析',
        'icon': '📈',
        'order': 2
    },
    'customer_analysis': {
        'title': '👥 客户分析',
        'icon': '👥',
        'order': 3
    },
    'profit_analysis': {
        'title': '💰 利润分析',
        'icon': '💰',
        'order': 4
    },
    'data_explorer': {
        'title': '🔍 数据探索',
        'icon': '🔍',
        'order': 5
    },
    'report_export': {
        'title': '📥 报告导出',
        'icon': '📥',
        'order': 6
    }
}
