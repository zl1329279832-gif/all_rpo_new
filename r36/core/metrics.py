import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple, Any
from scipy import stats
from collections import defaultdict
from itertools import combinations


def calculate_kpi_metrics(df: pd.DataFrame) -> Dict[str, float]:
    if df.empty:
        return {}

    total_revenue = df["pay_amount"].sum() if "pay_amount" in df.columns else 0
    order_count = df["order_id"].nunique() if "order_id" in df.columns else 0

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

    discount_amount = df["discount_amount"].sum() if "discount_amount" in df.columns else 0

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
