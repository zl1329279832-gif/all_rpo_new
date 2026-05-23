"""
连锁餐饮数据分析平台 - 示例数据生成脚本
支持生成正常数据（≥1200条订单）和异常测试数据
"""
import os
import random
from datetime import datetime, timedelta
import pandas as pd
import numpy as np

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ANOMALY_DIR = os.path.join(BASE_DIR, "anomaly")

STORE_NAMES = [
    "北京王府井店", "上海南京路店", "广州天河店", "深圳南山店",
    "杭州西湖店", "成都春熙店", "武汉江汉店", "西安雁塔店",
    "南京新街口店", "重庆解放碑店"
]

STORE_CITIES = ["北京", "上海", "广州", "深圳", "杭州", "成都", "武汉", "西安", "南京", "重庆"]
STORE_AREAS = [80, 120, 150, 90, 110, 130, 100, 140, 95, 125]
STORE_STAFF = [12, 18, 22, 14, 16, 20, 15, 24, 13, 19]
STORE_OPEN_DATE = [
    "2022-01-15", "2022-03-20", "2022-05-10", "2022-07-01", "2022-08-15",
    "2022-10-01", "2022-11-20", "2023-01-10", "2023-03-15", "2023-05-01"
]

DISH_CATEGORIES = ["热菜", "凉菜", "主食", "汤品", "饮品", "甜品"]
DISH_NAMES = {
    "热菜": ["宫保鸡丁", "鱼香肉丝", "麻婆豆腐", "红烧肉", "糖醋排骨", "水煮鱼", "回锅肉", "小炒黄牛肉"],
    "凉菜": ["凉拌黄瓜", "口水鸡", "夫妻肺片", "拍黄瓜", "凉拌木耳", "蒜泥白肉"],
    "主食": ["米饭", "面条", "炒饭", "包子", "饺子", "馒头", "葱油饼"],
    "汤品": ["番茄蛋汤", "紫菜蛋花汤", "酸辣汤", "排骨汤", "鸡汤", "豆腐汤"],
    "饮品": ["可乐", "雪碧", "橙汁", "奶茶", "咖啡", "柠檬水"],
    "甜品": ["冰淇淋", "蛋糕", "布丁", "西米露", "双皮奶", "红豆沙"]
}

PROMOTION_TYPES = ["满减", "折扣", "优惠券", "套餐", "买赠"]
PROMOTION_NAMES = ["新店开业优惠", "周末特惠", "会员专享", "节日促销", "周年庆典", "夏日清凉", "冬日暖锅"]

MEMBER_NAMES = ["张三", "李四", "王五", "赵六", "钱七", "孙八", "周九", "吴十", "郑十一", "王十二",
                "陈十三", "刘十四", "杨十五", "黄十六", "朱十七", "林十八", "何十九", "高二十",
                "马二十一", "李二十二", "张二十三", "王二十四", "刘二十五", "陈二十六"]

REFUND_REASONS = ["菜品质量问题", "上菜太慢", "价格争议", "服务态度", "口味不符", "其他"]

TIME_SLOTS = ["10:00-12:00", "12:00-14:00", "14:00-16:00", "16:00-18:00", "18:00-20:00", "20:00-22:00"]


def set_seed(seed):
    """设置随机种子"""
    random.seed(seed)
    np.random.seed(seed)


def generate_stores():
    """生成门店数据"""
    stores = []
    for i in range(10):
        stores.append({
            "store_id": f"S{i+1:03d}",
            "store_name": STORE_NAMES[i],
            "city": STORE_CITIES[i],
            "address": f"{STORE_CITIES[i]}市{random.choice(['朝阳区', '海淀区', '天河区', '南山区'])}某某路{i+1}号",
            "area": STORE_AREAS[i],
            "staff_count": STORE_STAFF[i],
            "manager": f"经理{i+1}",
            "open_date": STORE_OPEN_DATE[i],
            "status": random.choice(["营业中", "营业中", "营业中", "装修中"])
        })
    return pd.DataFrame(stores)


def generate_dishes():
    """生成菜品数据"""
    dishes = []
    dish_id = 1
    for category in DISH_CATEGORIES:
        for dish_name in DISH_NAMES[category]:
            base_price = round(random.uniform(8, 88), 2)
            cost = round(base_price * random.uniform(0.25, 0.45), 2)
            dishes.append({
                "dish_id": f"D{dish_id:04d}",
                "dish_name": dish_name,
                "category": category,
                "price": base_price,
                "cost": cost,
                "unit": "份",
                "spicy_level": random.choice(["不辣", "微辣", "中辣", "特辣"]) if category == "热菜" else "不辣",
                "is_recommended": random.choice([True, True, False]),
                "description": f"美味的{dish_name}，新鲜食材制作"
            })
            dish_id += 1
    return pd.DataFrame(dishes)


def generate_members():
    """生成会员数据"""
    members = []
    for i in range(200):
        member_level = random.choice(["普通会员", "银卡会员", "金卡会员", "钻石会员"])
        balance = round(random.uniform(0, 5000), 2) if member_level != "普通会员" else 0
        points = random.randint(0, 50000)
        register_date = (datetime(2023, 1, 1) + timedelta(days=random.randint(0, 365))).strftime("%Y-%m-%d")
        
        members.append({
            "member_id": f"M{i+1:05d}",
            "member_name": random.choice(MEMBER_NAMES) + str(i+1),
            "phone": f"1{random.choice([3,5,7,8,9])}{''.join([str(random.randint(0,9)) for _ in range(9)])}",
            "gender": random.choice(["男", "女"]),
            "age": random.randint(18, 65),
            "member_level": member_level,
            "balance": balance,
            "points": points,
            "register_date": register_date,
            "is_active": random.choice([True, True, True, False])
        })
    return pd.DataFrame(members)


def generate_promotions():
    """生成优惠活动数据"""
    promotions = []
    for i in range(15):
        start_date = datetime(2024, 1, 1) + timedelta(days=random.randint(0, 150))
        end_date = start_date + timedelta(days=random.randint(7, 60))
        ptype = random.choice(PROMOTION_TYPES)
        
        if ptype == "满减":
            discount_value = random.randint(20, 100)
            min_amount = discount_value * 3
        elif ptype == "折扣":
            discount_value = round(random.uniform(0.7, 0.95), 2)
            min_amount = 0
        elif ptype == "优惠券":
            discount_value = random.randint(10, 50)
            min_amount = discount_value * 2
        else:
            discount_value = random.randint(15, 80)
            min_amount = 50
        
        promotions.append({
            "promotion_id": f"P{i+1:04d}",
            "promotion_name": random.choice(PROMOTION_NAMES) + str(i+1),
            "promotion_type": ptype,
            "discount_value": discount_value,
            "min_amount": min_amount,
            "start_date": start_date.strftime("%Y-%m-%d"),
            "end_date": end_date.strftime("%Y-%m-%d"),
            "store_id": random.choice(["S001", "S002", "S003", "S004", "S005", "S006", "S007", "S008", "S009", "S010", "ALL"]),
            "status": random.choice(["进行中", "已结束", "未开始"]),
            "budget": round(random.uniform(5000, 50000), 2)
        })
    return pd.DataFrame(promotions)


def generate_orders_and_items(stores_df, members_df, promotions_df, dishes_df, order_count=1200):
    """生成订单和订单明细数据"""
    orders = []
    order_items = []
    order_id = 1000
    
    for _ in range(order_count):
        store = stores_df.sample(1).iloc[0]
        date = datetime(2024, 1, 1) + timedelta(days=random.randint(0, 180), 
                                                hours=random.randint(10, 21),
                                                minutes=random.randint(0, 59))
        
        use_member = random.random() > 0.3
        member = members_df.sample(1).iloc[0] if use_member else None
        
        use_promotion = random.random() > 0.6
        promotion = promotions_df[promotions_df["status"] == "进行中"].sample(1).iloc[0] if use_promotion else None
        
        num_dishes = random.randint(1, 6)
        selected_dishes = dishes_df.sample(num_dishes)
        
        subtotal = 0
        for _, dish in selected_dishes.iterrows():
            quantity = random.randint(1, 3)
            item_total = dish["price"] * quantity
            subtotal += item_total
            
            order_items.append({
                "order_item_id": f"OI{order_id:06d}_{len(order_items)+1:03d}",
                "order_id": f"O{order_id:06d}",
                "dish_id": dish["dish_id"],
                "dish_name": dish["dish_name"],
                "quantity": quantity,
                "unit_price": dish["price"],
                "subtotal": round(item_total, 2),
                "cost": round(dish["cost"] * quantity, 2)
            })
        
        discount_amount = 0
        if promotion is not None:
            if promotion["promotion_type"] == "满减" and subtotal >= promotion["min_amount"]:
                discount_amount = promotion["discount_value"]
            elif promotion["promotion_type"] == "折扣":
                discount_amount = round(subtotal * (1 - promotion["discount_value"]), 2)
            elif promotion["promotion_type"] == "优惠券" and subtotal >= promotion["min_amount"]:
                discount_amount = promotion["discount_value"]
        
        total_amount = round(subtotal, 2)
        pay_amount = round(max(subtotal - discount_amount, 0), 2)
        
        payment_method = random.choice(["微信支付", "支付宝", "现金", "银行卡", "会员余额"])
        if member is not None and member["balance"] > pay_amount:
            payment_method = random.choice(["微信支付", "支付宝", "会员余额"])
        
        orders.append({
            "order_id": f"O{order_id:06d}",
            "store_id": store["store_id"],
            "store_name": store["store_name"],
            "member_id": member["member_id"] if member is not None else None,
            "member_name": member["member_name"] if member is not None else None,
            "order_datetime": date.strftime("%Y-%m-%d %H:%M:%S"),
            "total_amount": total_amount,
            "discount_amount": round(discount_amount, 2),
            "pay_amount": pay_amount,
            "payment_method": payment_method,
            "promotion_id": promotion["promotion_id"] if promotion is not None else None,
            "promotion_name": promotion["promotion_name"] if promotion is not None else None,
            "remarks": ""
        })
        
        order_id += 1
    
    return pd.DataFrame(orders), pd.DataFrame(order_items)


def generate_refunds(orders_df, order_items_df):
    """生成退款数据"""
    refunds = []
    refund_id = 1
    
    completed_orders = orders_df.copy()
    refund_orders = completed_orders.sample(frac=0.08)
    
    for _, order in refund_orders.iterrows():
        items = order_items_df[order_items_df["order_id"] == order["order_id"]]
        if len(items) == 0:
            continue
        item = items.sample(1).iloc[0]
        reason = random.choice(REFUND_REASONS)
        refund_amount = round(item["subtotal"] * random.uniform(0.5, 1.0), 2)
        
        refunds.append({
            "refund_id": f"R{refund_id:05d}",
            "order_id": order["order_id"],
            "store_id": order["store_id"],
            "order_item_id": item["order_item_id"],
            "dish_id": item["dish_id"],
            "dish_name": item["dish_name"],
            "refund_amount": refund_amount,
            "refund_reason": reason,
            "refund_time": (pd.to_datetime(order["order_datetime"]) + timedelta(minutes=random.randint(10, 120))).strftime("%Y-%m-%d %H:%M:%S"),
            "is_full_refund": random.choice([True, False]),
            "handled_by": f"客服{random.randint(1, 10)}"
        })
        refund_id += 1
    
    return pd.DataFrame(refunds)


def generate_business_hours(stores_df):
    """生成营业时段数据"""
    business_hours = []
    for _, store in stores_df.iterrows():
        for slot in TIME_SLOTS:
            is_peak = slot in ["12:00-14:00", "18:00-20:00"]
            business_hours.append({
                "store_id": store["store_id"],
                "time_slot": slot,
                "is_peak_hour": is_peak,
                "avg_wait_time": random.randint(5, 25) if is_peak else random.randint(2, 10),
                "avg_table_turnover": round(random.uniform(1.5, 4.0), 1) if is_peak else round(random.uniform(0.8, 2.0), 1),
                "target_revenue": random.randint(3000, 8000) if is_peak else random.randint(500, 3000)
            })
    return pd.DataFrame(business_hours)


def generate_ingredient_costs(dishes_df):
    """生成原料成本数据"""
    ingredients = ["鸡肉", "猪肉", "牛肉", "鱼肉", "蔬菜", "米面", "调料", "食用油", "蛋", "海鲜"]
    ingredient_costs = []
    
    for i in range(90):
        date = (datetime(2024, 1, 1) + timedelta(days=random.randint(0, 180))).strftime("%Y-%m-%d")
        ingredient = random.choice(ingredients)
        dish = dishes_df.sample(1).iloc[0]
        
        base_price_map = {
            "鸡肉": 25, "猪肉": 35, "牛肉": 70, "鱼肉": 45, "蔬菜": 8,
            "米面": 5, "调料": 15, "食用油": 20, "蛋": 12, "海鲜": 80
        }
        base_price = base_price_map.get(ingredient, 20)
        price = round(base_price * (1 + random.uniform(-0.15, 0.2)), 2)
        
        ingredient_costs.append({
            "cost_id": f"C{i+1:05d}",
            "date": date,
            "ingredient_name": ingredient,
            "dish_id": dish["dish_id"],
            "dish_name": dish["dish_name"],
            "unit": "斤",
            "unit_price": price,
            "quantity": round(random.uniform(5, 50), 1),
            "total_cost": round(price * random.uniform(5, 50), 2),
            "supplier": f"供应商{random.randint(1, 8)}"
        })
    
    return pd.DataFrame(ingredient_costs)


def generate_normal_data(seed=42):
    """生成所有9份正常数据，订单数据不少于1200条"""
    set_seed(seed)
    print("=" * 60)
    print("开始生成正常数据...")
    print("=" * 60)
    
    stores_df = generate_stores()
    dishes_df = generate_dishes()
    members_df = generate_members()
    promotions_df = generate_promotions()
    orders_df, order_items_df = generate_orders_and_items(stores_df, members_df, promotions_df, dishes_df, order_count=1200)
    refunds_df = generate_refunds(orders_df, order_items_df)
    business_hours_df = generate_business_hours(stores_df)
    ingredient_costs_df = generate_ingredient_costs(dishes_df)
    
    dataframes = {
        "stores.csv": stores_df,
        "dishes.csv": dishes_df,
        "members.csv": members_df,
        "promotions.csv": promotions_df,
        "orders.csv": orders_df,
        "order_items.csv": order_items_df,
        "refunds.csv": refunds_df,
        "business_hours.csv": business_hours_df,
        "ingredient_costs.csv": ingredient_costs_df
    }
    
    stats = {}
    for filename, df in dataframes.items():
        filepath = os.path.join(BASE_DIR, filename)
        df.to_csv(filepath, index=False, encoding="utf-8-sig")
        stats[filename] = len(df)
        print(f"[OK] 生成 {filename}: {len(df)} 条")
    
    print(f"\n正常数据生成完成！订单数据: {len(orders_df)} 条")
    return stats


def generate_anomaly_data(seed=99):
    """生成异常测试数据（约500条订单），包含各种数据质量问题"""
    set_seed(seed)
    print("\n" + "=" * 60)
    print("开始生成异常测试数据...")
    print("=" * 60)
    
    os.makedirs(ANOMALY_DIR, exist_ok=True)
    
    stores_df = generate_stores()
    dishes_df = generate_dishes()
    members_df = generate_members()
    promotions_df = generate_promotions()
    orders_df, order_items_df = generate_orders_and_items(stores_df, members_df, promotions_df, dishes_df, order_count=500)
    refunds_df = generate_refunds(orders_df, order_items_df)
    business_hours_df = generate_business_hours(stores_df)
    ingredient_costs_df = generate_ingredient_costs(dishes_df)
    
    print("注入数据异常...")
    
    orders_df = orders_df.copy()
    order_items_df = order_items_df.copy()
    refunds_df = refunds_df.copy()
    
    # 先填充所有原始空值，确保缺失值统计准确
    orders_df["member_id"] = orders_df["member_id"].fillna("M00000")
    orders_df["member_name"] = orders_df["member_name"].fillna("散客")
    orders_df["promotion_id"] = orders_df["promotion_id"].fillna("P0000")
    orders_df["promotion_name"] = orders_df["promotion_name"].fillna("无促销")
    
    total_amount_99 = orders_df["total_amount"].quantile(0.99)
    anomaly_large_value = total_amount_99 * 3
    print(f"  99分位金额: {total_amount_99:.2f}, 异常大值阈值: {anomaly_large_value:.2f}")
    
    order_indices = list(range(len(orders_df)))
    random.shuffle(order_indices)
    
    used_indices = set()
    anomaly_count = 0
    
    # 1. 3个重复主键（order_id）- 创建3对重复，共6条记录
    dup_pair_count = 0
    for i in range(0, len(order_indices), 2):
        if dup_pair_count >= 3 or i + 1 >= len(order_indices):
            break
        idx1 = order_indices[i]
        idx2 = order_indices[i + 1]
        if idx1 in used_indices or idx2 in used_indices:
            continue
        duplicate_id = orders_df.iloc[idx2]["order_id"]
        orders_df.iloc[idx1, orders_df.columns.get_loc("order_id")] = duplicate_id
        used_indices.add(idx1)
        used_indices.add(idx2)
        dup_pair_count += 1
    print(f"  [OK] 注入 3 个重复主键(order_id) - {dup_pair_count} 对重复")
    
    # 2. 5个负数金额（total_amount 为负）
    neg_count = 0
    for idx in order_indices:
        if neg_count >= 5:
            break
        if idx in used_indices:
            continue
        orders_df.iloc[idx, orders_df.columns.get_loc("total_amount")] = -abs(orders_df.iloc[idx]["total_amount"])
        used_indices.add(idx)
        neg_count += 1
    print(f"  [OK] 注入 5 个负数金额(total_amount) - 实际 {neg_count} 个")
    
    # 3. 3个异常大值金额（超过99分位的3倍）
    large_count = 0
    for idx in order_indices:
        if large_count >= 3:
            break
        if idx in used_indices:
            continue
        orders_df.iloc[idx, orders_df.columns.get_loc("total_amount")] = round(anomaly_large_value * random.uniform(1.1, 2.0), 2)
        orders_df.iloc[idx, orders_df.columns.get_loc("pay_amount")] = round(anomaly_large_value * random.uniform(1.1, 2.0) * 0.9, 2)
        used_indices.add(idx)
        large_count += 1
    print(f"  [OK] 注入 3 个异常大值金额(>99分位×3) - 实际 {large_count} 个")
    
    # 4. 2个无效日期
    date_count = 0
    invalid_dates = ['invalid-date', '2024-13-01']
    for idx in order_indices:
        if date_count >= 2:
            break
        if idx in used_indices:
            continue
        orders_df.iloc[idx, orders_df.columns.get_loc("order_datetime")] = invalid_dates[date_count]
        used_indices.add(idx)
        date_count += 1
    print(f"  [OK] 注入 2 个无效日期(order_datetime) - 实际 {date_count} 个")
    
    # 5. 4个不存在的外键
    fk_count = 0
    invalid_fk_configs = [
        ("store_id", "S999"),
        ("member_id", "M9999"),
        ("store_id", "S998"),
        ("member_id", "M9998")
    ]
    for idx in order_indices:
        if fk_count >= 4:
            break
        if idx in used_indices:
            continue
        col, value = invalid_fk_configs[fk_count]
        orders_df.iloc[idx, orders_df.columns.get_loc(col)] = value
        if col == "store_id":
            orders_df.iloc[idx, orders_df.columns.get_loc("store_name")] = "未知门店"
        if col == "member_id":
            orders_df.iloc[idx, orders_df.columns.get_loc("member_name")] = "未知会员"
        used_indices.add(idx)
        fk_count += 1
    print(f"  [OK] 注入 4 个不存在的外键(store_id/member_id) - 实际 {fk_count} 个")
    
    # 6. 3个退款订单号在订单表中不存在
    if len(refunds_df) >= 3:
        refund_indices = list(range(len(refunds_df)))
        random.shuffle(refund_indices)
        invalid_order_ids = ['O999999', 'O999998', 'O999997']
        for i in range(3):
            refunds_df.iloc[refund_indices[i], refunds_df.columns.get_loc("order_id")] = invalid_order_ids[i]
        print(f"  [OK] 注入 3 个不存在的退款订单号")
    
    # 7. 10% 左右的缺失值 - 排除order_id和remarks字段
    exclude_cols = ["order_id", "remarks"]
    exclude_col_indices = [i for i, col in enumerate(orders_df.columns) if col in exclude_cols]
    available_cols = [i for i in range(len(orders_df.columns)) if i not in exclude_col_indices]
    available_col_names = [orders_df.columns[i] for i in available_cols]
    
    all_rows = list(range(len(orders_df)))
    
    # 先统计现有空值数量
    def is_empty(x):
        if pd.isna(x):
            return True
        if isinstance(x, str) and x.strip() == '':
            return True
        return False
    
    existing_missing = 0
    for col in available_col_names:
        existing_missing += orders_df[col].map(is_empty).sum()
    
    # 基于总单元格数（排除order_id和remarks）计算10%
    total_cells = len(all_rows) * len(available_cols)
    target_missing = int(total_cells * 0.1)
    need_inject = max(0, target_missing - existing_missing)
    
    print(f"  现有空值: {existing_missing}, 目标: {target_missing}, 需注入: {need_inject}")
    
    missing_injected = 0
    attempts = 0
    while missing_injected < need_inject and attempts < need_inject * 10:
        row = random.choice(all_rows)
        col = random.choice(available_cols)
        col_name = orders_df.columns[col]
        # 避免覆盖已注入的特殊异常值（负数、大值、无效日期、无效外键）
        if row in used_indices and col_name in ["total_amount", "order_datetime", "store_id", "member_id"]:
            attempts += 1
            continue
        if not is_empty(orders_df.iloc[row, col]):
            orders_df.iloc[row, col] = None
            missing_injected += 1
        attempts += 1
    
    # 在order_items中也注入一些缺失值
    exclude_cols_items = ["order_item_id", "order_id"]
    exclude_col_indices_items = [i for i, col in enumerate(order_items_df.columns) if col in exclude_cols_items]
    available_cols_items = [i for i in range(len(order_items_df.columns)) if i not in exclude_col_indices_items]
    available_rows_items = list(range(len(order_items_df)))
    
    total_cells_items = len(available_rows_items) * len(available_cols_items)
    target_missing_items = int(total_cells_items * 0.05)
    
    existing_missing_items = 0
    for col_idx in available_cols_items:
        col_name = order_items_df.columns[col_idx]
        existing_missing_items += order_items_df[col_name].map(is_empty).sum()
    
    need_inject_items = max(0, target_missing_items - existing_missing_items)
    
    missing_injected_items = 0
    attempts = 0
    while missing_injected_items < need_inject_items and attempts < need_inject_items * 10:
        row = random.choice(available_rows_items)
        col = random.choice(available_cols_items)
        col_name = order_items_df.columns[col]
        if not is_empty(order_items_df.iloc[row, col]):
            order_items_df.iloc[row, col] = None
            missing_injected_items += 1
        attempts += 1
    
    # 计算实际缺失比例（不含remarks字段）
    orders_for_pct = orders_df.drop(columns=['remarks'])
    total_for_pct = len(orders_for_pct) * len(orders_for_pct.columns)
    missing_for_pct = sum(orders_for_pct[col].map(is_empty).sum() for col in orders_for_pct.columns)
    actual_missing_pct = (missing_for_pct / total_for_pct) * 100
    print(f"  [OK] 注入约 10% 缺失值 (orders: 注入{missing_injected}, 总计{missing_for_pct}, {actual_missing_pct:.1f}%, order_items: 注入{missing_injected_items})")
    
    dataframes = {
        "stores.csv": stores_df,
        "dishes.csv": dishes_df,
        "members.csv": members_df,
        "promotions.csv": promotions_df,
        "orders.csv": orders_df,
        "order_items.csv": order_items_df,
        "refunds.csv": refunds_df,
        "business_hours.csv": business_hours_df,
        "ingredient_costs.csv": ingredient_costs_df
    }
    
    stats = {}
    for filename, df in dataframes.items():
        filepath = os.path.join(ANOMALY_DIR, filename)
        df.to_csv(filepath, index=False, encoding="utf-8-sig")
        stats[filename] = len(df)
        print(f"[OK] 生成 anomaly/{filename}: {len(df)} 条")
    
    print(f"\n异常数据生成完成！订单数据: {len(orders_df)} 条")
    return stats


def main():
    print("连锁餐饮数据分析平台 - 数据生成工具")
    print("=" * 60)
    
    normal_stats = generate_normal_data(seed=42)
    anomaly_stats = generate_anomaly_data(seed=99)
    
    print("\n" + "=" * 60)
    print("生成数据统计")
    print("=" * 60)
    print("\n【正常数据】(sample_data/)")
    print("-" * 40)
    normal_total = 0
    for filename, count in normal_stats.items():
        print(f"  {filename:<25} {count:>6} 条")
        normal_total += count
    print(f"  {'-' * 40}")
    print(f"  {'合计':<25} {normal_total:>6} 条")
    
    print("\n【异常数据】(sample_data/anomaly/)")
    print("-" * 40)
    anomaly_total = 0
    for filename, count in anomaly_stats.items():
        print(f"  {filename:<25} {count:>6} 条")
        anomaly_total += count
    print(f"  {'-' * 40}")
    print(f"  {'合计':<25} {anomaly_total:>6} 条")
    
    print("\n" + "=" * 60)
    print("数据生成完成！")
    print(f"正常数据订单量: {normal_stats['orders.csv']} 条")
    print(f"异常数据订单量: {anomaly_stats['orders.csv']} 条")
    print("=" * 60)


if __name__ == "__main__":
    main()
