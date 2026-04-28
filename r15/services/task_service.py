from typing import List, Optional, Dict, Any
from datetime import datetime
from models.task import Task, TaskStatus, TaskPriority
from models.category import Category
from storage.json_storage import JSONStorage
from utils.validators import validate_task_data
from utils.logger import get_logger


class TaskService:
    def __init__(self, storage: JSONStorage):
        self.storage = storage
        self.logger = get_logger("TaskService")

    def get_all_tasks(self) -> List[Task]:
        return self.storage.get_all(Task)

    def get_task_by_id(self, task_id: str) -> Optional[Task]:
        return self.storage.get_by_id(Task, task_id)

    def get_tasks_by_category(self, category_id: Optional[str]) -> List[Task]:
        tasks = self.get_all_tasks()
        if category_id is None:
            return tasks
        return [task for task in tasks if task.category_id == category_id]

    def get_tasks_by_status(self, status: TaskStatus) -> List[Task]:
        tasks = self.get_all_tasks()
        return [task for task in tasks if task.status == status]

    def get_tasks_by_priority(self, priority: TaskPriority) -> List[Task]:
        tasks = self.get_all_tasks()
        return [task for task in tasks if task.priority == priority]

    def get_overdue_tasks(self) -> List[Task]:
        tasks = self.get_all_tasks()
        return [task for task in tasks if task.is_overdue()]

    def search_tasks(self, keyword: str) -> List[Task]:
        if not keyword:
            return self.get_all_tasks()
        
        keyword = keyword.lower()
        tasks = self.get_all_tasks()
        return [
            task for task in tasks
            if keyword in task.title.lower() or keyword in task.description.lower()
        ]

    def create_task(self, title: str, description: str = "", 
                    priority: TaskPriority = TaskPriority.MEDIUM,
                    category_id: Optional[str] = None,
                    due_date: Optional[datetime] = None,
                    reminder_enabled: bool = False,
                    reminder_time: Optional[datetime] = None) -> Optional[Task]:
        data = {
            "title": title,
            "description": description,
            "priority": priority.value,
            "category_id": category_id,
            "due_date": due_date,
            "reminder_enabled": reminder_enabled,
            "reminder_time": reminder_time,
        }
        
        is_valid, error_msg = validate_task_data(data)
        if not is_valid:
            self.logger.error(f"创建任务失败: {error_msg}")
            return None
        
        max_order = max([t.order for t in self.get_all_tasks()], default=-1)
        task = Task(
            title=title,
            description=description,
            priority=priority,
            category_id=category_id,
            due_date=due_date,
            reminder_enabled=reminder_enabled,
            reminder_time=reminder_time,
            order=max_order + 1,
        )
        
        if self.storage.add(task):
            self.logger.info(f"创建任务成功: {task.title}")
            return task
        return None

    def update_task(self, task: Task, **kwargs) -> bool:
        task.update(**kwargs)
        if self.storage.update(task):
            self.logger.info(f"更新任务成功: {task.title}")
            return True
        return False

    def update_task_status(self, task: Task, status: TaskStatus) -> bool:
        if status == TaskStatus.COMPLETED:
            task.complete()
        else:
            task.status = status
            task.updated_at = datetime.now()
        
        if self.storage.update(task):
            self.logger.info(f"任务状态更新: {task.title} -> {status.value}")
            return True
        return False

    def delete_task(self, task_id: str) -> bool:
        task = self.get_task_by_id(task_id)
        if task:
            if self.storage.delete(task_id):
                self.logger.info(f"删除任务: {task.title}")
                return True
        return False

    def move_task(self, task: Task, new_order: int) -> bool:
        tasks = self.get_all_tasks()
        tasks.sort(key=lambda t: t.order)
        
        old_index = next((i for i, t in enumerate(tasks) if t.id == task.id), -1)
        if old_index < 0:
            return False
        
        tasks.remove(task)
        tasks.insert(new_order, task)
        
        for i, t in enumerate(tasks):
            t.order = i
            self.storage.update(t)
        
        self.logger.info(f"移动任务: {task.title} 到位置 {new_order}")
        return True

    def get_statistics(self) -> Dict[str, Any]:
        tasks = self.get_all_tasks()
        now = datetime.now()
        
        stats = {
            "total": len(tasks),
            "completed": 0,
            "pending": 0,
            "in_progress": 0,
            "cancelled": 0,
            "overdue": 0,
            "today_due": 0,
            "priority_high": 0,
            "priority_medium": 0,
            "priority_low": 0,
            "priority_urgent": 0,
        }
        
        for task in tasks:
            if task.status == TaskStatus.COMPLETED:
                stats["completed"] += 1
            elif task.status == TaskStatus.PENDING:
                stats["pending"] += 1
            elif task.status == TaskStatus.IN_PROGRESS:
                stats["in_progress"] += 1
            elif task.status == TaskStatus.CANCELLED:
                stats["cancelled"] += 1
            
            if task.is_overdue():
                stats["overdue"] += 1
            
            if task.due_date:
                if task.due_date.date() == now.date():
                    stats["today_due"] += 1
            
            if task.priority == TaskPriority.HIGH:
                stats["priority_high"] += 1
            elif task.priority == TaskPriority.MEDIUM:
                stats["priority_medium"] += 1
            elif task.priority == TaskPriority.LOW:
                stats["priority_low"] += 1
            elif task.priority == TaskPriority.URGENT:
                stats["priority_urgent"] += 1
        
        return stats
