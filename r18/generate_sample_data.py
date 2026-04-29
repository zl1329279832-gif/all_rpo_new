import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os


def generate_sales_data(num_records: int = 5000, output_file: str = None) -> pd.DataFrame:
    """
    生成示例销售数据
    
    Args:
        num_records: 记录数量
        output_file: 输出文件路径（可选）
        
    Returns:
        生成的DataFrame
    """
    print(f"正在生成 {num_records:,} 条销售数据...")
    
    np.random.seed(42)

    start_date = datetime(2023, 1, 1)
    end_date = datetime(2024, 12, 31)
    date_range = pd.date_range(start=start_date, end=end_date, freq='D')

    dates = np.random.choice(date_range, size=num_records)

    products = [
        '智能手机 Pro Max', '笔记本电脑 Air', '平板电脑 Mini', 
        '智能手表 Series', '无线耳机 Pro', '蓝牙音箱',
        '游戏手柄', '移动电源', '充电器套装', '数据线',
        '保护壳', '屏幕保护膜', '机械键盘', '无线鼠标', '4K显示器'
    ]

    categories = ['电子产品', '配件', '外设']
    category_map = {
        '智能手机 Pro Max': '电子产品',
        '笔记本电脑 Air': '电子产品',
        '平板电脑 Mini': '电子产品',
        '智能手表 Series': '电子产品',
        '无线耳机 Pro': '配件',
        '蓝牙音箱': '配件',
        '游戏手柄': '外设',
        '移动电源': '配件',
        '充电器套装': '配件',
        '数据线': '配件',
        '保护壳': '配件',
        '屏幕保护膜': '配件',
        '机械键盘': '外设',
        '无线鼠标': '外设',
        '4K显示器': '外设'
    }

    prices = {
        '智能手机 Pro Max': 5999,
        '笔记本电脑 Air': 7999,
        '平板电脑 Mini': 2999,
        '智能手表 Series': 1999,
        '无线耳机 Pro': 899,
        '蓝牙音箱': 399,
        '游戏手柄': 299,
        '移动电源': 149,
        '充电器套装': 99,
        '数据线': 49,
        '保护壳': 69,
        '屏幕保护膜': 39,
        '机械键盘': 399,
        '无线鼠标': 159,
        '4K显示器': 1999
    }

    regions = ['华东', '华北', '华南', '西南', '西北', '东北', '华中']
    cities = {
        '华东': ['上海', '杭州', '南京', '苏州', '宁波', '合肥'],
        '华北': ['北京', '天津', '石家庄', '太原', '济南'],
        '华南': ['广州', '深圳', '东莞', '佛山', '南宁', '厦门'],
        '西南': ['成都', '重庆', '昆明', '贵阳'],
        '西北': ['西安', '兰州', '银川', '西宁', '乌鲁木齐'],
        '东北': ['沈阳', '大连', '哈尔滨', '长春', '大庆'],
        '华中': ['武汉', '郑州', '长沙', '南昌']
    }

    channels = ['线上商城', '线下门店', '第三方平台', '直播带货', '企业团购']
    payment_methods = ['微信支付', '支付宝', '银行卡', '信用卡', '货到付款']

    product_list = np.random.choice(products, size=num_records)
    
    quantities = []
    for p in product_list:
        if prices[p] > 3000:
            q = np.random.randint(1, 3)
        elif prices[p] > 1000:
            q = np.random.randint(1, 4)
        else:
            q = np.random.randint(1, 6)
        quantities.append(q)
    quantities = np.array(quantities)

    regions_list = np.random.choice(regions, size=num_records)
    cities_list = [np.random.choice(cities[r]) for r in regions_list]

    unit_prices = np.array([prices[p] for p in product_list])
    revenues = quantities * unit_prices
    
    cost_ratios = []
    for p in product_list:
        if prices[p] > 3000:
            ratio = np.random.uniform(0.55, 0.75)
        elif prices[p] > 1000:
            ratio = np.random.uniform(0.50, 0.70)
        else:
            ratio = np.random.uniform(0.40, 0.65)
        cost_ratios.append(ratio)
    cost_ratios = np.array(cost_ratios)
    
    costs = revenues * cost_ratios
    profits = revenues - costs

    customer_ids = [f'C{str(i).zfill(6)}' for i in np.random.randint(1, 2000, size=num_records)]
    order_ids = [f'O{str(i).zfill(8)}' for i in np.random.randint(1, 3000, size=num_records)]

    final_dates = []
    for d in dates:
        hour = np.random.randint(8, 22)
        minute = np.random.randint(0, 60)
        second = np.random.randint(0, 60)
        final_dates.append(d + timedelta(hours=hour, minutes=minute, seconds=second))

    data = {
        '订单日期': final_dates,
        '订单编号': order_ids,
        '客户编号': customer_ids,
        '商品名称': product_list,
        '商品类别': [category_map[p] for p in product_list],
        '销售数量': quantities,
        '销售单价': unit_prices,
        '销售金额': revenues,
        '销售成本': np.round(costs, 2),
        '销售利润': np.round(profits, 2),
        '销售地区': regions_list,
        '销售城市': cities_list,
        '销售渠道': np.random.choice(channels, size=num_records),
        '支付方式': np.random.choice(payment_methods, size=num_records)
    }

    df = pd.DataFrame(data)
    
    print(f"数据生成完成！共 {len(df)} 行，{len(df.columns)} 列")
    print(f"\n数据概览:")
    print(f"  - 时间范围: {df['订单日期'].min().strftime('%Y-%m-%d')} 至 {df['订单日期'].max().strftime('%Y-%m-%d')}")
    print(f"  - 商品数量: {df['商品名称'].nunique()} 种")
    print(f"  - 客户数量: {df['客户编号'].nunique()} 个")
    print(f"  - 订单数量: {df['订单编号'].nunique()} 个")
    print(f"  - 总销售额: ¥{df['销售金额'].sum():,.2f}")
    print(f"  - 总利润: ¥{df['销售利润'].sum():,.2f}")

    if output_file:
        os.makedirs(os.path.dirname(output_file), exist_ok=True)
        df.to_csv(output_file, index=False, encoding='utf-8-sig')
        print(f"\n数据已保存到: {output_file}")
        
        excel_file = output_file.replace('.csv', '.xlsx')
        df.to_excel(excel_file, index=False)
        print(f"Excel格式已保存到: {excel_file}")

    return df


if __name__ == "__main__":
    import sys
    
    num_records = 5000
    if len(sys.argv) > 1:
        try:
            num_records = int(sys.argv[1])
        except ValueError:
            print(f"无效的记录数: {sys.argv[1]}，使用默认值 5000")
    
    output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
    output_file = os.path.join(output_dir, 'sample_sales_data.csv')
    
    generate_sales_data(num_records=num_records, output_file=output_file)
    
    print("\n" + "="*60)
    print("示例数据生成完成！")
    print("="*60)
    print(f"\n使用方法:")
    print(f"1. 运行 streamlit run app.py 启动平台")
    print(f"2. 点击 '加载示例数据' 按钮")
    print(f"3. 或上传生成的 CSV/Excel 文件")
    print(f"\n文件位置: {output_file}")
