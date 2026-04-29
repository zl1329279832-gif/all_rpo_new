FIELD_PATTERNS = {
    'date': {
        'keywords': ['日期', 'date', 'time', '时间', '订单日期', '销售日期', 'transaction_date', 'order_date'],
        'dtypes': ['datetime64', 'object']
    },
    'order_id': {
        'keywords': ['订单号', '订单编号', 'order_id', 'order_no', 'order_number', 'transaction_id', 'invoice_no'],
        'dtypes': ['object', 'int64', 'float64']
    },
    'customer_id': {
        'keywords': ['客户号', '客户编号', 'customer_id', 'customer_no', 'user_id', '会员号'],
        'dtypes': ['object', 'int64', 'float64']
    },
    'product': {
        'keywords': ['商品', '产品', 'product', 'item', '商品名称', '产品名称', 'product_name', 'item_name'],
        'dtypes': ['object']
    },
    'category': {
        'keywords': ['类别', '分类', 'category', 'type', '商品类别', '产品分类', 'product_category'],
        'dtypes': ['object']
    },
    'quantity': {
        'keywords': ['数量', '销量', 'quantity', 'qty', '销售数量', '购买数量'],
        'dtypes': ['int64', 'float64']
    },
    'unit_price': {
        'keywords': ['单价', 'unit_price', 'price', '销售单价', '产品价格'],
        'dtypes': ['int64', 'float64']
    },
    'revenue': {
        'keywords': ['销售额', '收入', 'revenue', 'sales', 'amount', '销售金额', 'total_amount', '总金额'],
        'dtypes': ['int64', 'float64']
    },
    'cost': {
        'keywords': ['成本', 'cost', '销售成本', '产品成本'],
        'dtypes': ['int64', 'float64']
    },
    'profit': {
        'keywords': ['利润', 'profit', '毛利', 'gross_profit'],
        'dtypes': ['int64', 'float64']
    },
    'region': {
        'keywords': ['地区', '区域', 'region', 'area', 'province', 'city', '省份', '城市', '销售地区'],
        'dtypes': ['object']
    },
    'channel': {
        'keywords': ['渠道', 'channel', '销售渠道', '购买渠道'],
        'dtypes': ['object']
    },
    'payment_method': {
        'keywords': ['支付方式', 'payment', 'payment_method', '支付渠道'],
        'dtypes': ['object']
    }
}

DEFAULT_CONFIG = {
    'upload': {
        'max_file_size_mb': 100,
        'allowed_types': ['csv', 'xlsx', 'xls']
    },
    'analysis': {
        'top_n_products': 10,
        'outlier_threshold': 3.0,
        'reorder_threshold_days': 30
    },
    'visualization': {
        'height': 450,
        'width': None,
        'template': 'plotly_white'
    },
    'report': {
        'include_charts': True,
        'include_summary': True,
        'include_raw_data': False
    }
}

COLOR_SCHEMES = {
    'primary': '#1f77b4',
    'success': '#2ca02c',
    'warning': '#ff7f0e',
    'danger': '#d62728',
    'info': '#17becf',
    'sequential': [
        '#1f77b4',
        '#2ca02c',
        '#ff7f0e',
        '#d62728',
        '#9467bd',
        '#8c564b',
        '#e377c2',
        '#7f7f7f',
        '#bcbd22',
        '#17becf'
    ]
}

ANALYSIS_METRICS = {
    'total_revenue': {'name': '总销售额', 'format': '¥{:,.2f}'},
    'total_orders': {'name': '总订单数', 'format': '{:,.0f}'},
    'total_quantity': {'name': '总销量', 'format': '{:,.0f}'},
    'total_customers': {'name': '客户数', 'format': '{:,.0f}'},
    'avg_order_value': {'name': '客单价', 'format': '¥{:,.2f}'},
    'repeat_purchase_rate': {'name': '复购率', 'format': '{:.2%}'},
    'profit_margin': {'name': '利润率', 'format': '{:.2%}'},
    'total_profit': {'name': '总利润', 'format': '¥{:,.2f}'}
}
