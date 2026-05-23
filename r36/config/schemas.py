from typing import Dict, List

DATA_SCHEMAS: Dict[str, Dict[str, str]] = {
    "stores": {
        "store_id": "string",
        "store_name": "string",
        "city": "string",
        "area": "string",
        "open_date": "date",
    },
    "dishes": {
        "dish_id": "string",
        "dish_name": "string",
        "category": "string",
        "price": "float",
        "cost": "float",
    },
    "members": {
        "member_id": "string",
        "name": "string",
        "phone": "string",
        "register_date": "date",
        "level": "string",
    },
    "promotions": {
        "promotion_id": "string",
        "promotion_name": "string",
        "start_date": "date",
        "end_date": "date",
        "type": "string",
        "discount_rate": "float",
    },
    "orders": {
        "order_id": "string",
        "store_id": "string",
        "member_id": "string",
        "promotion_id": "string",
        "order_time": "datetime",
        "total_amount": "float",
        "discount_amount": "float",
        "pay_amount": "float",
    },
    "order_items": {
        "item_id": "string",
        "order_id": "string",
        "dish_id": "string",
        "quantity": "int",
        "unit_price": "float",
        "subtotal": "float",
    },
    "refunds": {
        "refund_id": "string",
        "order_id": "string",
        "refund_time": "datetime",
        "refund_amount": "float",
        "reason": "string",
    },
    "business_hours": {
        "hours_id": "string",
        "store_id": "string",
        "day_of_week": "int",
        "open_time": "string",
        "close_time": "string",
    },
    "ingredient_costs": {
        "cost_id": "string",
        "store_id": "string",
        "cost_date": "date",
        "total_cost": "float",
        "food_cost_rate": "float",
    },
}

REQUIRED_FILES: List[str] = [
    "stores",
    "dishes",
    "members",
    "promotions",
    "orders",
    "order_items",
    "refunds",
    "business_hours",
    "ingredient_costs",
]

COLOR_PALETTE: Dict[str, str] = {
    "primary": "#1976D2",
    "secondary": "#FF9800",
    "success": "#4CAF50",
    "warning": "#FFC107",
    "danger": "#F44336",
    "info": "#00BCD4",
    "purple": "#9C27B0",
    "teal": "#009688",
}

CHART_COLORS: List[str] = [
    "#1976D2",
    "#FF9800",
    "#4CAF50",
    "#F44336",
    "#9C27B0",
    "#00BCD4",
    "#FFC107",
    "#009688",
    "#E91E63",
    "#3F51B5",
]
