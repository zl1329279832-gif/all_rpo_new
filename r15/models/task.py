from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
import uuid


class TaskPriority(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class TaskStatus(Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


@dataclass
class Task:
    title: str
    description: str = ""
    priority: TaskPriority = TaskPriority.MEDIUM
    status: TaskStatus = TaskStatus.PENDING
    category_id: Optional[str] = None
    due_date: Optional[datetime] = None
    reminder_enabled: bool = False
    reminder_time: Optional[datetime] = None
    reminder_shown: bool = False
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None
    order: int = 0
    id: str = field(default_factory=lambda: str(uuid.uuid4()))

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "priority": self.priority.value,
            "status": self.status.value,
            "category_id": self.category_id,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "reminder_enabled": self.reminder_enabled,
            "reminder_time": self.reminder_time.isoformat() if self.reminder_time else None,
            "reminder_shown": self.reminder_shown,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "order": self.order,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "Task":
        task = cls(
            id=data.get("id", str(uuid.uuid4())),
            title=data.get("title", ""),
            description=data.get("description", ""),
            priority=TaskPriority(data.get("priority", "medium")),
            status=TaskStatus(data.get("status", "pending")),
            category_id=data.get("category_id"),
            order=data.get("order", 0),
            reminder_enabled=data.get("reminder_enabled", False),
            reminder_shown=data.get("reminder_shown", False),
        )
        
        if data.get("due_date"):
            task.due_date = datetime.fromisoformat(data["due_date"])
        if data.get("reminder_time"):
            task.reminder_time = datetime.fromisoformat(data["reminder_time"])
        if data.get("created_at"):
            task.created_at = datetime.fromisoformat(data["created_at"])
        if data.get("updated_at"):
            task.updated_at = datetime.fromisoformat(data["updated_at"])
        if data.get("completed_at"):
            task.completed_at = datetime.fromisoformat(data["completed_at"])
        
        return task

    def update(self, **kwargs):
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
        self.updated_at = datetime.now()

    def complete(self):
        self.status = TaskStatus.COMPLETED
        self.completed_at = datetime.now()
        self.updated_at = datetime.now()

    def is_overdue(self) -> bool:
        if self.due_date is None:
            return False
        return datetime.now() > self.due_date and self.status != TaskStatus.COMPLETED

    def get_days_remaining(self) -> Optional[int]:
        if self.due_date is None:
            return None
        delta = self.due_date - datetime.now()
        return max(0, delta.days)
