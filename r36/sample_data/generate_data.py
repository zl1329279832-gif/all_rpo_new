"""
连锁餐饮数据分析平台 - 示例数据生成脚本
生成9张表的测试数据，订单主表约1000条
"""
import os
import random
from datetime import datetime, timedelta
import pandas as pd
import numpy as np

random.seed(42)
np.random.seed(42)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

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

def generate_orders_and_items(stores_df, members_df, promotions_df, dishes_df):
    """生成订单和订单明细数据（1000条订单）"""
    orders = []
    order_items = []
    order_id = 1000
    
    for _ in range(1000):
        store = stores_df.sample(1).iloc[0]
        date = datetime(2024, 1, 1) + timedelta(days=random.randint(0, 180), 
                                                hours=random.randint(10, 21),
                                                minutes=random.randint(0, 59))
        time_slot_idx = min((date.hour - 10) // 2, 5)
        time_slot = TIME_SLOTS[time_slot_idx]
        
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
        
        total_amount = round(max(subtotal - discount_amount, 0), 2)
        
        payment_method = random.choice(["微信支付", "支付宝", "现金", "银行卡", "会员余额"])
        if member is not None and member["balance"] > total_amount:
            payment_method = random.choice(["微信支付", "支付宝", "会员余额"])
        
        orders.append({
            "order_id": f"O{order_id:06d}",
            "store_id": store["store_id"],
            "store_name": store["store_name"],
            "member_id": member["member_id"] if member is not None else None,
            "member_name": member["member_name"] if member is not None else None,
            "order_datetime": date.strftime("%Y-%m-%d %H:%M:%S"),
            "order_date": date.strftime("%Y-%m-%d"),
            "time_slot": time_slot,
            "weekday": date.strftime("%A"),
            "people_count": random.randint(1, 8),
            "dish_count": num_dishes,
            "subtotal": round(subtotal, 2),
            "discount_amount": round(discount_amount, 2),
            "total_amount": total_amount,
            "payment_method": payment_method,
            "promotion_id": promotion["promotion_id"] if promotion is not None else None,
            "promotion_name": promotion["promotion_name"] if promotion is not None else None,
            "order_status": random.choice(["已完成", "已完成", "已完成", "已完成", "已取消"])
        })
        
        order_id += 1
    
    return pd.DataFrame(orders), pd.DataFrame(order_items)

def generate_refunds(orders_df, order_items_df):
    """生成退款数据"""
    refunds = []
    refund_id = 1
    
    completed_orders = orders_df[orders_df["order_status"] == "已完成"]
    refund_orders = completed_orders.sample(frac=0.08)
    
    for _, order in refund_orders.iterrows():
        items = order_items_df[order_items_df["order_id"] == order["order_id"]]
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

def main():
    print("开始生成示例数据...")
    
    stores_df = generate_stores()
    dishes_df = generate_dishes()
    members_df = generate_members()
    promotions_df = generate_promotions()
    orders_df, order_items_df = generate_orders_and_items(stores_df, members_df, promotions_df, dishes_df)
    refunds_df = generate_refunds(orders_df, order_items_df)
    business_hours_df = generate_business_hours(stores_df)
    ingredient_costs_df = generate_ingredient_costs(dishes_df)
    
    print(f"门店数据: {len(stores_df)} 条")
    print(f"菜品数据: {len(dishes_df)} 条")
    print(f"会员数据: {len(members_df)} 条")
    print(f"优惠活动: {len(promotions_df)} 条")
    print(f"订单数据: {len(orders_df)} 条")
    print(f"订单明细: {len(order_items_df)} 条")
    print(f"退款数据: {len(refunds_df)} 条")
    print(f"营业时段: {len(business_hours_df)} 条")
    print(f"原料成本: {len(ingredient_costs_df)} 条")
    
    stores_df.to_csv(os.path.join(BASE_DIR, "stores.csv"), index=False, encoding="utf-8-sig")
    dishes_df.to_csv(os.path.join(BASE_DIR, "dishes.csv"), index=False, encoding="utf-8-sig")
    members_df.to_csv(os.path.join(BASE_DIR, "members.csv"), index=False, encoding="utf-8-sig")
    promotions_df.to_csv(os.path.join(BASE_DIR, "promotions.csv"), index=False, encoding="utf-8-sig")
    orders_df.to_csv(os.path.join(BASE_DIR, "orders.csv"), index=False, encoding="utf-8-sig")
    order_items_df.to_csv(os.path.join(BASE_DIR, "order_items.csv"), index=False, encoding="utf-8-sig")
    refunds_df.to_csv(os.path.join(BASE_DIR, "refunds.csv"), index=False, encoding="utf-8-sig")
    business_hours_df.to_csv(os.path.join(BASE_DIR, "business_hours.csv"), index=False, encoding="utf-8-sig")
    ingredient_costs_df.to_csv(os.path.join(BASE_DIR, "ingredient_costs.csv"), index=False, encoding="utf-8-sig")
    
    print("\n所有CSV文件已生成到 sample_data 目录！")
    print("订单数据共计 1000 条。")

if __name__ == "__main__":
    main()
