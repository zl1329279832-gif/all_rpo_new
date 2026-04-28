from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional
import uuid


@dataclass
class OperationLog:
    operation: str
    target_type: str
    target_id: str
    target_name: str
    details: str = ""
    timestamp: datetime = field(default_factory=datetime.now)
    id: str = field(default_factory=lambda: str(uuid.uuid4()))

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "operation": self.operation,
            "target_type": self.target_type,
            "target_id": self.target_id,
            "target_name": self.target_name,
            "details": self.details,
            "timestamp": self.timestamp.isoformat(),
        }

    @classmethod
    def from_dict(cls, data: dict) -> "OperationLog":
        log = cls(
            id=data.get("id", str(uuid.uuid4())),
            operation=data.get("operation", ""),
            target_type=data.get("target_type", ""),
            target_id=data.get("target_id", ""),
            target_name=data.get("target_name", ""),
            details=data.get("details", ""),
        )
        
        if data.get("timestamp"):
            log.timestamp = datetime.fromisoformat(data["timestamp"])
        
        return log


@dataclass
class AppConfig:
    theme: str = "light"
    language: str = "zh_CN"
    auto_save_interval: int = 30
    window_width: int = 1200
    window_height: int = 800
    window_x: int = 100
    window_y: int = 100
    show_completed_tasks: bool = True
    sort_by: str = "order"
    sort_order: str = "asc"
    max_logs_count: int = 1000
    reminder_check_interval: int = 60
    last_reminder_check: Optional[datetime] = None

    def to_dict(self) -> dict:
        return {
            "theme": self.theme,
            "language": self.language,
            "auto_save_interval": self.auto_save_interval,
            "window_width": self.window_width,
            "window_height": self.window_height,
            "window_x": self.window_x,
            "window_y": self.window_y,
            "show_completed_tasks": self.show_completed_tasks,
            "sort_by": self.sort_by,
            "sort_order": self.sort_order,
            "max_logs_count": self.max_logs_count,
            "reminder_check_interval": self.reminder_check_interval,
            "last_reminder_check": self.last_reminder_check.isoformat() if self.last_reminder_check else None,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "AppConfig":
        config = cls()
        for key, value in data.items():
            if hasattr(config, key):
                if key == "last_reminder_check" and value:
                    config.last_reminder_check = datetime.fromisoformat(value)
                else:
                    setattr(config, key, value)
        return config
