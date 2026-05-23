import streamlit as st
import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple, Any
from scipy import stats
from collections import defaultdict
from itertools import combinations


def calculate_kpi_metrics(df: pd.DataFrame) -> Dict[str, float]:
    if df.empty:
        return {}

    order_ids = df["order_id"].unique() if "order_id" in df.columns else []
    order_count = len(order_ids)
    
    order_fields = ["pay_amount", "total_amount", "subtotal"]
    revenue_field = None
    for field in order_fields:
        if field in df.columns:
            revenue_field = field
            break
    
    if revenue_field and "order_id" in df.columns:
        order_revenue = df.drop_duplicates("order_id")[revenue_field].sum()
        total_revenue = order_revenue
    else:
        total_revenue = 0

    if "item_gross_margin" in df.columns:
        total_gross_margin = df["item_gross_margin"].sum()
    elif "subtotal" in df.columns and "item_cost" in df.columns:
        total_gross_margin = (df["subtotal"] - df["item_cost"]).sum()
    else:
        total_gross_margin = 0

    avg_order_value = total_revenue / order_count if order_count > 0 else 0
    customer_count = df["member_id"].nunique() if "member_id" in df.columns else 0
    member_order_count = df[df["is_member"]]["order_id"].nunique() if "is_member" in df.columns else 0
    member_ratio = member_order_count / order_count * 100 if order_count > 0 else 0

    refund_amount = 0
    if "refund_amount" in df.columns:
        refund_amount = df["refund_amount"].sum()

    discount_field = None
    for field in ["discount_amount"]:
        if field in df.columns:
            discount_field = field
            break
    if discount_field and "order_id" in df.columns:
        discount_amount = df.drop_duplicates("order_id")[discount_field].sum()
    else:
        discount_amount = 0

    item_qty = df["quantity"].sum() if "quantity" in df.columns else 0
    items_per_order = item_qty / order_count if order_count > 0 else 0

    gross_margin_rate = (total_gross_margin / total_revenue * 100) if total_revenue > 0 else 0

    return {
        "总营业额": round(total_revenue, 2),
        "总毛利": round(total_gross_margin, 2),
        "毛利率": round(gross_margin_rate, 2),
        "订单数": order_count,
        "客单价": round(avg_order_value, 2),
        "会员顾客数": customer_count,
        "会员订单占比": round(member_ratio, 2),
        "优惠金额": round(discount_amount, 2),
        "退款金额": round(refund_amount, 2),
        "菜品销售数量": item_qty,
        "单均菜品数": round(items_per_order, 2),
    }


def calculate_period_comparison(
    df: pd.DataFrame, current_dates: Tuple[pd.Timestamp, pd.Timestamp]
) -> Dict[str, Dict[str, float]]:
    if df.empty or "order_time" not in df.columns:
        return {}

    start_current, end_current = current_dates
    period_length = end_current - start_current
    start_previous = start_current - period_length
    end_previous = start_current

    current_df = df[
        (df["order_time"] >= start_current) & (df["order_time"] <= end_current)
    ]
    previous_df = df[
        (df["order_time"] >= start_previous) & (df["order_time"] < end_previous)
    ]

    current_metrics = calculate_kpi_metrics(current_df)
    previous_metrics = calculate_kpi_metrics(previous_df)

    comparison = {}
    for key in current_metrics:
        current_val = current_metrics.get(key, 0)
        previous_val = previous_metrics.get(key, 0)
        if previous_val != 0:
            change_pct = (current_val - previous_val) / previous_val * 100
        else:
            change_pct = 100 if current_val > 0 else 0

        comparison[key] = {
            "当前值": current_val,
            "上期值": previous_val,
            "变化值": round(current_val - previous_val, 2),
            "变化率": round(change_pct, 2),
        }

    return comparison


def calculate_dish_metrics(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty or "dish_id" not in df.columns:
        return pd.DataFrame()

    dish_metrics = (
        df.groupby(["dish_id", "dish_name", "category"])
        .agg(
            销售数量=("quantity", "sum"),
            销售额=("subtotal", "sum"),
            毛利=("item_gross_margin", "sum"),
            订单数=("order_id", "nunique"),
        )
        .reset_index()
    )

    total_revenue = dish_metrics["销售额"].sum()
    total_margin = dish_metrics["毛利"].sum()

    dish_metrics["销售额占比"] = np.where(
        total_revenue > 0, dish_metrics["销售额"] / total_revenue * 100, 0
    ).round(2)
    dish_metrics["毛利占比"] = np.where(
        total_margin > 0, dish_metrics["毛利"] / total_margin * 100, 0
    ).round(2)
    dish_metrics["毛利率"] = np.where(
        dish_metrics["销售额"] > 0,
        dish_metrics["毛利"] / dish_metrics["销售额"] * 100,
        0,
    ).round(2)
    dish_metrics["单次点购量"] = (
        dish_metrics["销售数量"] / dish_metrics["订单数"]
    ).round(2)

    return dish_metrics.sort_values("销售额", ascending=False).reset_index(drop=True)


def calculate_category_metrics(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty or "category" not in df.columns:
        return pd.DataFrame()

    category_metrics = (
        df.groupby("category")
        .agg(
            销售数量=("quantity", "sum"),
            销售额=("subtotal", "sum"),
            毛利=("item_gross_margin", "sum"),
            菜品数=("dish_id", "nunique"),
            订单数=("order_id", "nunique"),
        )
        .reset_index()
    )

    total_revenue = category_metrics["销售额"].sum()
    category_metrics["销售额占比"] = np.where(
        total_revenue > 0, category_metrics["销售额"] / total_revenue * 100, 0
    ).round(2)
    category_metrics["毛利率"] = np.where(
        category_metrics["销售额"] > 0,
        category_metrics["毛利"] / category_metrics["销售额"] * 100,
        0,
    ).round(2)

    return category_metrics.sort_values("销售额", ascending=False)


def calculate_store_metrics(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty or "store_id" not in df.columns:
        return pd.DataFrame()

    store_metrics = (
        df.groupby(["store_id", "store_name", "city", "area"])
        .agg(
            订单数=("order_id", "nunique"),
            营业额=("pay_amount", "sum"),
            毛利=("item_gross_margin", "sum"),
            顾客数=("member_id", "nunique"),
        )
        .reset_index()
    )

    store_metrics["客单价"] = np.where(
        store_metrics["订单数"] > 0,
        store_metrics["营业额"] / store_metrics["订单数"],
        0,
    ).round(2)
    store_metrics["毛利率"] = np.where(
        store_metrics["营业额"] > 0,
        store_metrics["毛利"] / store_metrics["营业额"] * 100,
        0,
    ).round(2)

    return store_metrics.sort_values("营业额", ascending=False)


def calculate_rfm(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty or "member_id" not in df.columns:
        return pd.DataFrame()

    member_orders = df[df["is_member"]].copy()
    if member_orders.empty:
        return pd.DataFrame()

    analysis_date = member_orders["order_time"].max() + pd.Timedelta(days=1)

    rfm = (
        member_orders.groupby("member_id")
        .agg(
            Recency=("order_time", lambda x: (analysis_date - x.max()).days),
            Frequency=("order_id", "nunique"),
            Monetary=("pay_amount", "sum"),
        )
        .reset_index()
    )

    rfm["R_Score"] = pd.qcut(rfm["Recency"], 5, labels=[5, 4, 3, 2, 1])
    rfm["F_Score"] = pd.qcut(rfm["Frequency"].rank(method="first"), 5, labels=[1, 2, 3, 4, 5])
    rfm["M_Score"] = pd.qcut(rfm["Monetary"].rank(method="first"), 5, labels=[1, 2, 3, 4, 5])

    rfm["R_Score"] = rfm["R_Score"].astype(int)
    rfm["F_Score"] = rfm["F_Score"].astype(int)
    rfm["M_Score"] = rfm["M_Score"].astype(int)

    rfm["RFM_Score"] = rfm["R_Score"] + rfm["F_Score"] + rfm["M_Score"]

    def _segment_customer(row):
        if row["R_Score"] >= 4 and row["F_Score"] >= 4 and row["M_Score"] >= 4:
            return "重要价值客户"
        elif row["R_Score"] >= 4 and row["F_Score"] <= 2 and row["M_Score"] <= 2:
            return "新客户"
        elif row["R_Score"] <= 2 and row["F_Score"] >= 4 and row["M_Score"] >= 4:
            return "重要挽留客户"
        elif row["R_Score"] >= 3 and row["F_Score"] >= 3 and row["M_Score"] >= 3:
            return "重要发展客户"
        elif row["R_Score"] <= 2 and row["F_Score"] <= 2 and row["M_Score"] <= 2:
            return "流失客户"
        elif row["F_Score"] >= 4:
            return "重要保持客户"
        else:
            return "一般客户"

    rfm["客户分层"] = rfm.apply(_segment_customer, axis=1)

    if "name" in df.columns and "level" in df.columns:
        member_info = df[["member_id", "name", "level"]].drop_duplicates()
        rfm = rfm.merge(member_info, on="member_id", how="left")

    return rfm


def calculate_repurchase_rate(df: pd.DataFrame) -> Dict[str, Any]:
    if df.empty or "member_id" not in df.columns:
        return {}

    member_orders = df[df["is_member"]].copy()
    if member_orders.empty:
        return {}

    order_counts = member_orders.groupby("member_id")["order_id"].nunique()
    total_members = len(order_counts)
    repurchase_members = (order_counts >= 2).sum()
    repurchase_rate = repurchase_members / total_members * 100 if total_members > 0 else 0

    distribution = (
        order_counts.value_counts().sort_index().reset_index()
    )
    distribution.columns = ["购买次数", "会员数"]
    distribution["占比"] = (distribution["会员数"] / total_members * 100).round(2)

    return {
        "总会员数": total_members,
        "复购会员数": repurchase_members,
        "复购率": round(repurchase_rate, 2),
        "购买频次分布": distribution,
    }


def calculate_promotion_effectiveness(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty or "promotion_id" not in df.columns:
        return pd.DataFrame()

    promo_df = df[df["promotion_id"].notna()].copy()
    if promo_df.empty:
        return pd.DataFrame()

    promo_metrics = (
        promo_df.groupby(["promotion_id", "promotion_name", "type"])
        .agg(
            使用订单数=("order_id", "nunique"),
            优惠金额=("discount_amount", "sum"),
            实际收入=("pay_amount", "sum"),
            参与顾客数=("member_id", "nunique"),
        )
        .reset_index()
    )

    promo_metrics["ROI"] = np.where(
        promo_metrics["优惠金额"] > 0,
        (promo_metrics["实际收入"] - promo_metrics["优惠金额"]) / promo_metrics["优惠金额"],
        0,
    ).round(2)

    promo_metrics["客单价"] = np.where(
        promo_metrics["使用订单数"] > 0,
        promo_metrics["实际收入"] / promo_metrics["使用订单数"],
        0,
    ).round(2)

    return promo_metrics.sort_values("实际收入", ascending=False)


def calculate_refund_analysis(df: pd.DataFrame, refunds_df: Optional[pd.DataFrame] = None) -> Dict[str, Any]:
    if refunds_df is not None and not refunds_df.empty:
        refund_by_reason = (
            refunds_df.groupby("reason")
            .agg(退款金额=("refund_amount", "sum"), 退款次数=("refund_id", "nunique"))
            .reset_index()
            .sort_values("退款金额", ascending=False)
        )
        total_refund = refunds_df["refund_amount"].sum()
        refund_count = len(refunds_df)
    else:
        refund_by_reason = pd.DataFrame()
        total_refund = 0
        refund_count = 0

    if not df.empty:
        total_revenue = df["pay_amount"].sum()
        refund_rate = (total_refund / total_revenue * 100) if total_revenue > 0 else 0
    else:
        refund_rate = 0

    return {
        "总退款金额": round(total_refund, 2),
        "退款次数": refund_count,
        "退款率": round(refund_rate, 2),
        "退款原因分布": refund_by_reason,
    }


def calculate_hourly_trend(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty or "order_hour" not in df.columns:
        return pd.DataFrame()

    hourly = (
        df.groupby("order_hour")
        .agg(
            订单数=("order_id", "nunique"),
            营业额=("pay_amount", "sum"),
            毛利=("item_gross_margin", "sum"),
        )
        .reset_index()
    )

    hourly["客单价"] = np.where(hourly["订单数"] > 0, hourly["营业额"] / hourly["订单数"], 0).round(2)

    return hourly


def calculate_dish_combinations(df: pd.DataFrame, min_support: float = 0.01) -> pd.DataFrame:
    if df.empty or "order_id" not in df.columns or "dish_name" not in df.columns:
        return pd.DataFrame()

    order_dishes = defaultdict(set)
    for _, row in df.iterrows():
        order_dishes[row["order_id"]].add(row["dish_name"])

    total_orders = len(order_dishes)
    min_count = max(int(total_orders * min_support), 2)

    pair_counts = defaultdict(int)
    for dishes in order_dishes.values():
        if len(dishes) >= 2:
            for pair in combinations(sorted(dishes), 2):
                pair_counts[pair] += 1

    data = []
    for (dish1, dish2), count in pair_counts.items():
        if count >= min_count:
            data.append({
                "菜品组合": f"{dish1} + {dish2}",
                "菜品1": dish1,
                "菜品2": dish2,
                "共同出现次数": count,
                "支持度": round(count / total_orders * 100, 2),
            })

    if not data:
        return pd.DataFrame()

    return pd.DataFrame(data).sort_values("支持度", ascending=False).head(50)


@st.cache_data(ttl=300, show_spinner=False)
def detect_anomalous_stores(
    df: pd.DataFrame, metric: str = "营业额", method: str = "iqr"
) -> pd.DataFrame:
    store_metrics = calculate_store_metrics(df)
    if store_metrics.empty or metric not in store_metrics.columns:
        return pd.DataFrame()

    values = store_metrics[metric].values

    if method == "iqr":
        q1 = np.percentile(values, 25)
        q3 = np.percentile(values, 75)
        iqr = q3 - q1
        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr

        def _get_status(val):
            if val < lower_bound:
                return "异常偏低"
            elif val > upper_bound:
                return "异常偏高"
            else:
                return "正常"

        store_metrics["状态"] = store_metrics[metric].apply(_get_status)
        store_metrics["下限"] = round(lower_bound, 2)
        store_metrics["上限"] = round(upper_bound, 2)

    elif method == "zscore":
        z_scores = np.abs(stats.zscore(values))
        store_metrics["Z分数"] = np.round(z_scores, 2)
        store_metrics["状态"] = np.where(z_scores > 2, "异常", "正常")

    else:
        return store_metrics

    return store_metrics.sort_values(metric, ascending=False)


def detect_cost_anomalies(cost_df: pd.DataFrame) -> pd.DataFrame:
    if cost_df.empty or "food_cost_rate" not in cost_df.columns:
        return pd.DataFrame()

    cost_anomalies = []
    for store_id in cost_df["store_id"].unique():
        store_data = cost_df[cost_df["store_id"] == store_id].copy()
        if len(store_data) < 5:
            continue

        rates = store_data["food_cost_rate"].values
        q1 = np.percentile(rates, 25)
        q3 = np.percentile(rates, 75)
        iqr = q3 - q1
        upper_bound = q3 + 1.5 * iqr

        anomalies = store_data[store_data["food_cost_rate"] > upper_bound]
        for _, row in anomalies.iterrows():
            cost_anomalies.append({
                "store_id": store_id,
                "异常日期": row["cost_date"],
                "成本率": round(row["food_cost_rate"], 2),
                "预期上限": round(upper_bound, 2),
                "偏离程度": round(row["food_cost_rate"] - upper_bound, 2),
            })

    return pd.DataFrame(cost_anomalies)


def calculate_store_ranking(df: pd.DataFrame, metric: str = "营业额") -> pd.DataFrame:
    store_metrics = calculate_store_metrics(df)
    if store_metrics.empty:
        return pd.DataFrame()
    
    valid_metrics = ["营业额", "毛利", "订单数", "客单价", "毛利率"]
    if metric not in valid_metrics:
        metric = "营业额"
    
    ranked = store_metrics.sort_values(metric, ascending=False).copy()
    ranked[f"{metric}排名"] = range(1, len(ranked) + 1)
    ranked[f"{metric}占比"] = (ranked[metric] / ranked[metric].sum() * 100).round(2)
    
    if "area" in ranked.columns:
        area_totals = ranked.groupby("area")[metric].transform("sum")
        ranked[f"区域{metric}占比"] = (ranked[metric] / area_totals * 100).round(2)
    
    cols = [f"{metric}排名", "store_id", "store_name", "city", "area", 
            metric, f"{metric}占比", f"区域{metric}占比" if f"区域{metric}占比" in ranked.columns else None,
            "订单数", "客单价", "毛利率"]
    cols = [c for c in cols if c and c in ranked.columns]
    
    return ranked[cols]


def calculate_meal_period_performance(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty or "order_hour" not in df.columns:
        return pd.DataFrame()
    
    df = df.copy()
    
    def _get_meal_period(hour):
        if 5 <= hour < 10:
            return "早餐"
        elif 10 <= hour < 14:
            return "午餐"
        elif 14 <= hour < 17:
            return "下午茶"
        elif 17 <= hour < 21:
            return "晚餐"
        elif 21 <= hour < 24 or 0 <= hour < 5:
            return "夜宵"
        else:
            return "其他"
    
    df["时段"] = df["order_hour"].apply(_get_meal_period)
    
    order_level = df.drop_duplicates("order_id")
    revenue_field = "pay_amount" if "pay_amount" in order_level.columns else "total_amount"
    
    period_metrics = order_level.groupby("时段").agg(
        订单数=("order_id", "nunique"),
        营业额=(revenue_field, "sum"),
        顾客数=("member_id", "nunique"),
    ).reset_index()
    
    period_order_items = df.groupby("时段").agg(
        菜品销量=("quantity", "sum"),
        毛利=("item_gross_margin", "sum"),
    ).reset_index()
    
    period_metrics = period_metrics.merge(period_order_items, on="时段", how="left")
    
    period_metrics["客单价"] = np.where(
        period_metrics["订单数"] > 0,
        period_metrics["营业额"] / period_metrics["订单数"],
        0
    ).round(2)
    
    period_metrics["毛利率"] = np.where(
        period_metrics["营业额"] > 0,
        period_metrics["毛利"] / period_metrics["营业额"] * 100,
        0
    ).round(2)
    
    period_metrics["单均价"] = np.where(
        period_metrics["订单数"] > 0,
        period_metrics["菜品销量"] / period_metrics["订单数"],
        0
    ).round(2)
    
    period_order = ["早餐", "午餐", "下午茶", "晚餐", "夜宵", "其他"]
    period_metrics["时段"] = pd.Categorical(period_metrics["时段"], categories=period_order, ordered=True)
    period_metrics = period_metrics.sort_values("时段")
    
    total_revenue = period_metrics["营业额"].sum()
    period_metrics["营业额占比"] = np.where(
        total_revenue > 0,
        period_metrics["营业额"] / total_revenue * 100,
        0
    ).round(2)
    
    return period_metrics


def calculate_dish_margin_contribution(df: pd.DataFrame, top_n: int = 20) -> pd.DataFrame:
    if df.empty or "dish_id" not in df.columns:
        return pd.DataFrame()
    
    dish_metrics = df.groupby(["dish_id", "dish_name", "category"]).agg(
        销售数量=("quantity", "sum"),
        销售额=("subtotal", "sum"),
        毛利=("item_gross_margin", "sum"),
        订单数=("order_id", "nunique"),
    ).reset_index()
    
    total_margin = dish_metrics["毛利"].sum()
    total_revenue = dish_metrics["销售额"].sum()
    
    dish_metrics["毛利率"] = np.where(
        dish_metrics["销售额"] > 0,
        dish_metrics["毛利"] / dish_metrics["销售额"] * 100,
        0
    ).round(2)
    
    dish_metrics["毛利贡献度"] = np.where(
        total_margin > 0,
        dish_metrics["毛利"] / total_margin * 100,
        0
    ).round(2)
    
    dish_metrics["销售贡献度"] = np.where(
        total_revenue > 0,
        dish_metrics["销售额"] / total_revenue * 100,
        0
    ).round(2)
    
    dish_metrics["累计毛利贡献"] = dish_metrics.sort_values("毛利贡献度", ascending=False)["毛利贡献度"].cumsum()
    
    dish_metrics = dish_metrics.sort_values("毛利", ascending=False)
    
    def _get_contribution_level(row):
        if row["累计毛利贡献"] <= 50:
            return "核心利润菜品"
        elif row["累计毛利贡献"] <= 80:
            return "重要利润菜品"
        elif row["累计毛利贡献"] <= 95:
            return "补充利润菜品"
        else:
            return "低贡献菜品"
    
    dish_metrics_sorted = dish_metrics.sort_values("毛利", ascending=False)
    dish_metrics_sorted["累计毛利贡献"] = dish_metrics_sorted["毛利贡献度"].cumsum()
    dish_metrics_sorted["利润层级"] = dish_metrics_sorted.apply(_get_contribution_level, axis=1)
    
    return dish_metrics_sorted.head(top_n)


def calculate_member_repurchase_cycle(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty or "member_id" not in df.columns or "order_time" not in df.columns:
        return pd.DataFrame()
    
    member_orders = df[df["is_member"]].copy()
    if member_orders.empty:
        return pd.DataFrame()
    
    member_orders = member_orders.sort_values(["member_id", "order_time"])
    member_orders["prev_order_time"] = member_orders.groupby("member_id")["order_time"].shift(1)
    member_orders["days_since_prev"] = (member_orders["order_time"] - member_orders["prev_order_time"]).dt.total_seconds() / 86400
    
    valid_cycles = member_orders[member_orders["days_since_prev"].notna()]
    
    if valid_cycles.empty:
        return pd.DataFrame()
    
    cycle_stats = valid_cycles.groupby("member_id").agg(
        平均复购周期=("days_since_prev", "mean"),
        最短复购周期=("days_since_prev", "min"),
        最长复购周期=("days_since_prev", "max"),
        复购次数=("days_since_prev", "count"),
    ).reset_index()
    
    if "member_name" in member_orders.columns:
        member_names = member_orders[["member_id", "member_name"]].drop_duplicates()
        cycle_stats = cycle_stats.merge(member_names, on="member_id", how="left")
    
    if "level" in member_orders.columns or "member_level" in member_orders.columns:
        level_col = "level" if "level" in member_orders.columns else "member_level"
        member_levels = member_orders[["member_id", level_col]].drop_duplicates()
        member_levels = member_levels.rename(columns={level_col: "会员等级"})
        cycle_stats = cycle_stats.merge(member_levels, on="member_id", how="left")
    
    cycle_stats["平均复购周期"] = cycle_stats["平均复购周期"].round(1)
    cycle_stats["复购频次_周"] = (7 / cycle_stats["平均复购周期"]).round(2)
    cycle_stats["复购频次_月"] = (30 / cycle_stats["平均复购周期"]).round(2)
    
    def _get_cycle_segment(days):
        if days <= 3:
            return "高频（≤3天）"
        elif days <= 7:
            return "较高频（3-7天）"
        elif days <= 14:
            return "中频（7-14天）"
        elif days <= 30:
            return "较低频（14-30天）"
        else:
            return "低频（>30天）"
    
    cycle_stats["复购分层"] = cycle_stats["平均复购周期"].apply(_get_cycle_segment)
    
    return cycle_stats.sort_values("平均复购周期")


def calculate_promotion_roi(
    df: pd.DataFrame,
    cleaned_data: Dict[str, pd.DataFrame],
) -> pd.DataFrame:
    if df.empty or "promotion_id" not in df.columns:
        return pd.DataFrame()
    
    order_level = df.drop_duplicates("order_id")
    revenue_field = "pay_amount" if "pay_amount" in order_level.columns else "total_amount"
    
    promotion_metrics = order_level[order_level["promotion_id"].notna()].groupby(
        ["promotion_id", "promotion_name"]
    ).agg(
        活动订单数=("order_id", "nunique"),
        活动顾客数=("member_id", "nunique"),
        优惠前金额=("total_amount", "sum"),
        实际收入=(revenue_field, "sum"),
    ).reset_index()
    
    promotion_metrics["优惠金额"] = promotion_metrics["优惠前金额"] - promotion_metrics["实际收入"]
    
    if "promotions" in cleaned_data:
        promo_df = cleaned_data["promotions"]
        budget_col = "budget" if "budget" in promo_df.columns else None
        
        if budget_col:
            promo_budget = promo_df[["promotion_id", budget_col]].drop_duplicates()
            promo_budget = promo_budget.rename(columns={budget_col: "活动预算"})
            promotion_metrics = promotion_metrics.merge(promo_budget, on="promotion_id", how="left")
    
    total_orders = len(order_level)
    total_revenue = order_level[revenue_field].sum()
    
    no_promo_orders = order_level[order_level["promotion_id"].isna()]
    no_promo_aov = no_promo_orders[revenue_field].mean() if len(no_promo_orders) > 0 else 0
    
    promotion_metrics["增量收入"] = np.where(
        no_promo_aov > 0,
        promotion_metrics["实际收入"] - (promotion_metrics["活动订单数"] * no_promo_aov),
        promotion_metrics["实际收入"]
    )
    
    promotion_metrics["投入成本"] = promotion_metrics.get("活动预算", promotion_metrics["优惠金额"])
    
    promotion_metrics["ROI"] = np.where(
        promotion_metrics["投入成本"] > 0,
        (promotion_metrics["增量收入"] - promotion_metrics["投入成本"]) / promotion_metrics["投入成本"] * 100,
        0
    ).round(2)
    
    promotion_metrics["活动订单占比"] = (promotion_metrics["活动订单数"] / total_orders * 100).round(2)
    promotion_metrics["活动收入占比"] = (promotion_metrics["实际收入"] / total_revenue * 100).round(2)
    
    promotion_metrics["活动客单价"] = np.where(
        promotion_metrics["活动订单数"] > 0,
        promotion_metrics["实际收入"] / promotion_metrics["活动订单数"],
        0
    ).round(2)
    
    def _get_roi_level(roi):
        if roi >= 200:
            return "优秀（ROI≥200%）"
        elif roi >= 100:
            return "良好（100%≤ROI<200%）"
        elif roi >= 0:
            return "一般（0≤ROI<100%）"
        else:
            return "亏损（ROI<0）"
    
    promotion_metrics["效果评级"] = promotion_metrics["ROI"].apply(_get_roi_level)
    
    return promotion_metrics.sort_values("ROI", ascending=False)


@st.cache_data(ttl=600, show_spinner=False)
def calculate_ingredient_cost_volatility(
    cost_df: pd.DataFrame,
    dishes_df: Optional[pd.DataFrame] = None,
) -> pd.DataFrame:
    if cost_df.empty:
        return pd.DataFrame()
    
    date_col = None
    for col in ["cost_date", "date", "日期"]:
        if col in cost_df.columns:
            date_col = col
            break
    
    if not date_col:
        return pd.DataFrame()
    
    cost_df[date_col] = pd.to_datetime(cost_df[date_col], errors="coerce")
    
    ingredient_col = None
    for col in ["ingredient_name", "原料名称", "name"]:
        if col in cost_df.columns:
            ingredient_col = col
            break
    
    price_col = None
    for col in ["unit_price", "单价", "price"]:
        if col in cost_df.columns:
            price_col = col
            break
    
    if not ingredient_col or not price_col:
        return pd.DataFrame()
    
    cost_stats = cost_df.groupby(ingredient_col).agg(
        记录数=(price_col, "count"),
        平均价格=(price_col, "mean"),
        最高价格=(price_col, "max"),
        最低价格=(price_col, "min"),
        价格标准差=(price_col, "std"),
        最早日期=(date_col, "min"),
        最晚日期=(date_col, "max"),
    ).reset_index()
    
    cost_stats["价格波动幅度"] = np.where(
        cost_stats["平均价格"] > 0,
        (cost_stats["最高价格"] - cost_stats["最低价格"]) / cost_stats["平均价格"] * 100,
        0
    ).round(2)
    
    cost_stats["变异系数"] = np.where(
        cost_stats["平均价格"] > 0,
        cost_stats["价格标准差"] / cost_stats["平均价格"] * 100,
        0
    ).round(2)
    
    if dishes_df is not None and "dish_id" in cost_df.columns and "dish_id" in dishes_df.columns:
        dish_cols = ["dish_id", "dish_name", "category"]
        dish_cols = [c for c in dish_cols if c in dishes_df.columns]
        dish_info = dishes_df[dish_cols].drop_duplicates()
        cost_df = cost_df.merge(dish_info, on="dish_id", how="left")
        if "category" in cost_df.columns:
            category_stats = cost_df.groupby([ingredient_col, "category"]).agg(
                分类平均价格=(price_col, "mean"),
            ).reset_index()
            cost_stats = cost_stats.merge(
                category_stats.groupby(ingredient_col).agg(
                    关联菜品数=("category", "nunique"),
                ).reset_index(),
                on=ingredient_col,
                how="left",
            )
    
    def _get_volatility_level(cv):
        if cv >= 30:
            return "剧烈波动（≥30%）"
        elif cv >= 15:
            return "较大波动（15%-30%）"
        elif cv >= 5:
            return "轻微波动（5%-15%）"
        else:
            return "基本稳定（<5%）"
    
    cost_stats["波动等级"] = cost_stats["变异系数"].apply(_get_volatility_level)
    
    cost_stats["平均价格"] = cost_stats["平均价格"].round(2)
    cost_stats["最高价格"] = cost_stats["最高价格"].round(2)
    cost_stats["最低价格"] = cost_stats["最低价格"].round(2)
    cost_stats["价格标准差"] = cost_stats["价格标准差"].round(2)
    
    return cost_stats.sort_values("变异系数", ascending=False)


def calculate_refund_reason_distribution(
    refunds_df: pd.DataFrame,
    merged_df: Optional[pd.DataFrame] = None,
) -> pd.DataFrame:
    if refunds_df.empty:
        return pd.DataFrame()
    
    reason_col = None
    for col in ["refund_reason", "reason", "退款原因"]:
        if col in refunds_df.columns:
            reason_col = col
            break
    
    if not reason_col:
        return pd.DataFrame()
    
    amount_col = None
    for col in ["refund_amount", "退款金额", "amount"]:
        if col in refunds_df.columns:
            amount_col = col
            break
    
    reason_stats = refunds_df.groupby(reason_col).agg(
        退款次数=("refund_id", "nunique"),
        退款订单数=("order_id", "nunique"),
    ).reset_index()
    
    if amount_col:
        amount_stats = refunds_df.groupby(reason_col).agg(
            退款金额=(amount_col, "sum"),
        ).reset_index()
        reason_stats = reason_stats.merge(amount_stats, on=reason_col, how="left")
    
    total_refunds = reason_stats["退款次数"].sum()
    reason_stats["占比"] = (reason_stats["退款次数"] / total_refunds * 100).round(2)
    
    if amount_col:
        total_amount = reason_stats["退款金额"].sum()
        reason_stats["金额占比"] = (reason_stats["退款金额"] / total_amount * 100).round(2)
        reason_stats["平均退款金额"] = (reason_stats["退款金额"] / reason_stats["退款次数"]).round(2)
    
    if merged_df is not None and "store_id" in merged_df.columns:
        store_refunds = refunds_df.merge(
            merged_df[["order_id", "store_id", "store_name"]].drop_duplicates(),
            on="order_id",
            how="left",
        )
        if "store_name" in store_refunds.columns:
            top_store = store_refunds.groupby(reason_col)["store_name"].agg(
                lambda x: x.value_counts().index[0] if len(x) > 0 else None
            ).reset_index()
            top_store.columns = [reason_col, "高发门店"]
            reason_stats = reason_stats.merge(top_store, on=reason_col, how="left")
    
    reason_stats.columns = [c.replace(reason_col, "退款原因") for c in reason_stats.columns]
    
    return reason_stats.sort_values("退款次数", ascending=False)
