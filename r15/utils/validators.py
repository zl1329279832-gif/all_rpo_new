from typing import Optional, Dict, Any
from datetime import datetime
from models.task import TaskPriority, TaskStatus


def validate_task_data(data: Dict[str, Any]) -> tuple[bool, Optional[str]]:
    if not data.get("title"):
        return False, "任务标题不能为空"
    
    title = str(data.get("title", "")).strip()
    if len(title) == 0:
        return False, "任务标题不能为空"
    if len(title) > 200:
        return False, "任务标题不能超过200个字符"
    
    if data.get("priority"):
        priority = data["priority"]
        valid_priorities = [p.value for p in TaskPriority]
        if priority not in valid_priorities:
            return False, f"无效的优先级值，有效值为: {valid_priorities}"
    
    if data.get("status"):
        status = data["status"]
        valid_statuses = [s.value for s in TaskStatus]
        if status not in valid_statuses:
            return False, f"无效的状态值，有效值为: {valid_statuses}"
    
    if data.get("description") and len(str(data["description"])) > 5000:
        return False, "任务描述不能超过5000个字符"
    
    if data.get("due_date"):
        try:
            if isinstance(data["due_date"], str):
                datetime.fromisoformat(data["due_date"])
        except (ValueError, TypeError):
            return False, "无效的截止日期格式"
    
    if data.get("reminder_time"):
        try:
            if isinstance(data["reminder_time"], str):
                datetime.fromisoformat(data["reminder_time"])
        except (ValueError, TypeError):
            return False, "无效的提醒时间格式"
    
    return True, None


def validate_category_data(data: Dict[str, Any]) -> tuple[bool, Optional[str]]:
    if not data.get("name"):
        return False, "分类名称不能为空"
    
    name = str(data.get("name", "")).strip()
    if len(name) == 0:
        return False, "分类名称不能为空"
    if len(name) > 50:
        return False, "分类名称不能超过50个字符"
    
    if data.get("color"):
        color = data["color"]
        if not isinstance(color, str) or not color.startswith("#") or len(color) not in [4, 7, 9]:
            return False, "无效的颜色格式，应为十六进制颜色值"
    
    if data.get("description") and len(str(data["description"])) > 200:
        return False, "分类描述不能超过200个字符"
    
    return True, None


def validate_priority(priority: str) -> bool:
    valid_priorities = [p.value for p in TaskPriority]
    return priority in valid_priorities


def validate_status(status: str) -> bool:
    valid_statuses = [s.value for s in TaskStatus]
    return status in valid_statuses
