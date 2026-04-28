from typing import List, Optional, Callable
from datetime import datetime, timedelta
from models.task import Task, TaskStatus
from services.task_service import TaskService
from utils.logger import get_logger


class ReminderService:
    def __init__(self, task_service: TaskService):
        self.task_service = task_service
        self.logger = get_logger("ReminderService")
        self._reminder_callbacks: List[Callable[[Task], None]] = []
        self._last_check_time: Optional[datetime] = None

    def add_reminder_callback(self, callback: Callable[[Task], None]):
        if callback not in self._reminder_callbacks:
            self._reminder_callbacks.append(callback)

    def remove_reminder_callback(self, callback: Callable[[Task], None]):
        if callback in self._reminder_callbacks:
            self._reminder_callbacks.remove(callback)

    def check_reminders(self) -> List[Task]:
        now = datetime.now()
        self._last_check_time = now
        
        tasks = self.task_service.get_all_tasks()
        tasks_to_remind: List[Task] = []
        
        for task in tasks:
            if task.status == TaskStatus.COMPLETED or task.status == TaskStatus.CANCELLED:
                continue
            
            if not task.reminder_enabled:
                continue
            
            if task.reminder_time is None:
                continue
            
            if task.reminder_shown:
                continue
            
            if now >= task.reminder_time:
                tasks_to_remind.append(task)
                task.reminder_shown = True
                self.task_service.update_task(task)
                self.logger.info(f"触发提醒: {task.title}")
        
        for task in tasks_to_remind:
            for callback in self._reminder_callbacks:
                try:
                    callback(task)
                except Exception as e:
                    self.logger.error(f"提醒回调执行失败: {e}")
        
        return tasks_to_remind

    def check_overdue_tasks(self) -> List[Task]:
        overdue_tasks = self.task_service.get_overdue_tasks()
        active_overdue = [
            task for task in overdue_tasks
            if task.status != TaskStatus.COMPLETED and task.status != TaskStatus.CANCELLED
        ]
        return active_overdue

    def get_upcoming_reminders(self, minutes: int = 60) -> List[Task]:
        now = datetime.now()
        cutoff = now + timedelta(minutes=minutes)
        
        tasks = self.task_service.get_all_tasks()
        upcoming: List[Task] = []
        
        for task in tasks:
            if task.status == TaskStatus.COMPLETED or task.status == TaskStatus.CANCELLED:
                continue
            
            if not task.reminder_enabled:
                continue
            
            if task.reminder_time is None:
                continue
            
            if task.reminder_shown:
                continue
            
            if now <= task.reminder_time <= cutoff:
                upcoming.append(task)
        
        upcoming.sort(key=lambda t: t.reminder_time or datetime.max)
        return upcoming

    def snooze_reminder(self, task: Task, minutes: int = 15) -> bool:
        if not task.reminder_enabled:
            return False
        
        task.reminder_shown = False
        if task.reminder_time:
            task.reminder_time = task.reminder_time + timedelta(minutes=minutes)
        else:
            task.reminder_time = datetime.now() + timedelta(minutes=minutes)
        
        return self.task_service.update_task(task)

    def dismiss_reminder(self, task: Task) -> bool:
        task.reminder_shown = True
        return self.task_service.update_task(task)

    def get_last_check_time(self) -> Optional[datetime]:
        return self._last_check_time
