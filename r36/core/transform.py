import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Optional
from datetime import datetime, timedelta


def clean_data(data_dict: Dict[str, pd.DataFrame]) -> Dict[str, pd.DataFrame]:
    cleaned = {}
    for name, df in data_dict.items():
        cleaned_df = _clean_single_dataframe(df, name)
        cleaned[name] = cleaned_df
    return cleaned


def _clean_single_dataframe(df: pd.DataFrame, name: str) -> pd.DataFrame:
    df = df.copy()

    df.columns = df.columns.str.strip()

    for col in df.columns:
        if df[col].dtype == "object":
            df[col] = df[col].astype(str).str.strip()
            df[col] = df[col].replace(["nan", "NaN", "None", "NULL", ""], pd.NA)

    if name == "orders":
        df = _clean_orders(df)
    elif name == "order_items":
        df = _clean_order_items(df)
    elif name == "members":
        df = _clean_members(df)
    elif name == "dishes":
        df = _clean_dishes(df)
    elif name == "stores":
        df = _clean_stores(df)
    elif name == "promotions":
        df = _clean_promotions(df)
    elif name == "refunds":
        df = _clean_refunds(df)
    elif name == "ingredient_costs":
        df = _clean_ingredient_costs(df)

    return df


def _clean_orders(df: pd.DataFrame) -> pd.DataFrame:
    if "order_time" in df.columns:
        df["order_time"] = pd.to_datetime(df["order_time"], errors="coerce")
        df["order_date"] = df["order_time"].dt.date
        df["order_hour"] = df["order_time"].dt.hour
        df["day_of_week"] = df["order_time"].dt.dayofweek
        df["is_weekend"] = df["day_of_week"].isin([5, 6])

    for col in ["total_amount", "discount_amount", "pay_amount"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

    if "member_id" in df.columns:
        df["is_member"] = df["member_id"].notna() & (df["member_id"] != "")

    return df


def _clean_order_items(df: pd.DataFrame) -> pd.DataFrame:
    for col in ["quantity", "unit_price", "subtotal"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

    if "quantity" in df.columns and "unit_price" in df.columns and "subtotal" in df.columns:
        mask = df["subtotal"] == 0
        df.loc[mask, "subtotal"] = df.loc[mask, "quantity"] * df.loc[mask, "unit_price"]

    return df


def _clean_members(df: pd.DataFrame) -> pd.DataFrame:
    if "register_date" in df.columns:
        df["register_date"] = pd.to_datetime(df["register_date"], errors="coerce")

    if "level" in df.columns:
        df["level"] = df["level"].fillna("普通会员")

    return df


def _clean_dishes(df: pd.DataFrame) -> pd.DataFrame:
    for col in ["price", "cost"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

    if "price" in df.columns and "cost" in df.columns:
        df["gross_margin"] = df["price"] - df["cost"]
        df["gross_margin_rate"] = np.where(
            df["price"] > 0, (df["price"] - df["cost"]) / df["price"] * 100, 0
        )

    if "category" in df.columns:
        df["category"] = df["category"].fillna("未分类")

    return df


def _clean_stores(df: pd.DataFrame) -> pd.DataFrame:
    if "open_date" in df.columns:
        df["open_date"] = pd.to_datetime(df["open_date"], errors="coerce")

    for col in ["city", "area"]:
        if col in df.columns:
            df[col] = df[col].fillna("未知")

    return df


def _clean_promotions(df: pd.DataFrame) -> pd.DataFrame:
    for col in ["start_date", "end_date"]:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col], errors="coerce")

    if "discount_rate" in df.columns:
        df["discount_rate"] = pd.to_numeric(df["discount_rate"], errors="coerce").fillna(1)

    return df


def _clean_refunds(df: pd.DataFrame) -> pd.DataFrame:
    if "refund_time" in df.columns:
        df["refund_time"] = pd.to_datetime(df["refund_time"], errors="coerce")

    if "refund_amount" in df.columns:
        df["refund_amount"] = pd.to_numeric(df["refund_amount"], errors="coerce").fillna(0)

    if "reason" in df.columns:
        df["reason"] = df["reason"].fillna("其他原因")

    return df


def _clean_ingredient_costs(df: pd.DataFrame) -> pd.DataFrame:
    if "cost_date" in df.columns:
        df["cost_date"] = pd.to_datetime(df["cost_date"], errors="coerce")

    for col in ["total_cost", "food_cost_rate"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

    return df


def merge_orders_with_details(data_dict: Dict[str, pd.DataFrame]) -> Optional[pd.DataFrame]:
    if "orders" not in data_dict or "order_items" not in data_dict:
        return None

    orders = data_dict["orders"].copy()
    order_items = data_dict["order_items"].copy()

    if "dishes" in data_dict:
        dishes = data_dict["dishes"].copy()
        order_items = order_items.merge(
            dishes[["dish_id", "dish_name", "category", "cost", "gross_margin", "gross_margin_rate"]],
            on="dish_id",
            how="left",
        )
        order_items["item_cost"] = order_items["quantity"] * order_items["cost"]
        order_items["item_gross_margin"] = order_items["subtotal"] - order_items["item_cost"]

    merged = orders.merge(order_items, on="order_id", how="left")

    if "stores" in data_dict:
        stores = data_dict["stores"].copy()
        merged = merged.merge(
            stores[["store_id", "store_name", "city", "area"]],
            on="store_id",
            how="left",
        )

    if "members" in data_dict:
        members = data_dict["members"].copy()
        merged = merged.merge(
            members[["member_id", "name", "level", "register_date"]],
            on="member_id",
            how="left",
        )

    if "promotions" in data_dict:
        promotions = data_dict["promotions"].copy()
        merged = merged.merge(
            promotions[["promotion_id", "promotion_name", "type", "discount_rate"]],
            on="promotion_id",
            how="left",
        )

    return merged


def filter_by_date_and_store(
    df: pd.DataFrame,
    date_range: Tuple[datetime, datetime],
    store_ids: Optional[List[str]] = None,
    date_column: str = "order_time",
) -> pd.DataFrame:
    if df.empty:
        return df

    filtered = df.copy()

    if date_column in filtered.columns:
        start_date, end_date = date_range
        filtered = filtered[
            (filtered[date_column] >= pd.Timestamp(start_date))
            & (filtered[date_column] <= pd.Timestamp(end_date) + timedelta(days=1))
        ]

    if store_ids and "store_id" in filtered.columns:
        filtered = filtered[filtered["store_id"].isin(store_ids)]

    return filtered


def get_date_range(df: pd.DataFrame, date_column: str = "order_time") -> Tuple[datetime, datetime]:
    if df.empty or date_column not in df.columns:
        today = datetime.now()
        return (today - timedelta(days=30), today)

    min_date = df[date_column].min()
    max_date = df[date_column].max()

    if pd.isna(min_date) or pd.isna(max_date):
        today = datetime.now()
        return (today - timedelta(days=30), today)

    return (min_date.to_pydatetime(), max_date.to_pydatetime())


def get_store_list(df: pd.DataFrame) -> List[Dict[str, str]]:
    if "store_id" not in df.columns or "store_name" not in df.columns:
        return []

    stores = df[["store_id", "store_name"]].drop_duplicates().dropna()
    return [
        {"store_id": row["store_id"], "store_name": row["store_name"]}
        for _, row in stores.iterrows()
    ]
