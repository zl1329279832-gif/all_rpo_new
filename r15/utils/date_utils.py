from datetime import datetime, date
from typing import Optional


def format_date(dt: Optional[datetime], format_str: str = "%Y-%m-%d %H:%M") -> str:
    if dt is None:
        return ""
    return dt.strftime(format_str)


def format_date_short(dt: Optional[datetime]) -> str:
    if dt is None:
        return ""
    
    today = date.today()
    dt_date = dt.date()
    
    if dt_date == today:
        return dt.strftime("%H:%M")
    elif dt_date == today.replace(day=today.day - 1):
        return f"昨天 {dt.strftime('%H:%M')}"
    elif dt_date.year == today.year:
        return dt.strftime("%m-%d %H:%M")
    else:
        return dt.strftime("%Y-%m-%d")


def is_overdue(due_date: Optional[datetime]) -> bool:
    if due_date is None:
        return False
    return datetime.now() > due_date


def get_days_remaining(due_date: Optional[datetime]) -> Optional[int]:
    if due_date is None:
        return None
    delta = due_date - datetime.now()
    return max(0, delta.days)


def get_urgency_level(due_date: Optional[datetime]) -> str:
    if due_date is None:
        return "normal"
    
    days_remaining = get_days_remaining(due_date)
    
    if is_overdue(due_date):
        return "overdue"
    elif days_remaining == 0:
        return "today"
    elif days_remaining <= 2:
        return "soon"
    else:
        return "normal"


def parse_date(date_str: str) -> Optional[datetime]:
    if not date_str:
        return None
    
    formats = [
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d %H:%M",
        "%Y-%m-%d",
        "%Y/%m/%d %H:%M:%S",
        "%Y/%m/%d %H:%M",
        "%Y/%m/%d",
    ]
    
    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt)
        except (ValueError, TypeError):
            continue
    
    try:
        return datetime.fromisoformat(date_str)
    except (ValueError, TypeError):
        return None
