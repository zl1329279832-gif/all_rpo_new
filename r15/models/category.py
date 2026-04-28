from dataclasses import dataclass, field
from datetime import datetime
import uuid


@dataclass
class Category:
    name: str
    color: str = "#3498db"
    icon: str = "folder"
    description: str = ""
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    id: str = field(default_factory=lambda: str(uuid.uuid4()))

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "color": self.color,
            "icon": self.icon,
            "description": self.description,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    @classmethod
    def from_dict(cls, data: dict) -> "Category":
        category = cls(
            id=data.get("id", str(uuid.uuid4())),
            name=data.get("name", ""),
            color=data.get("color", "#3498db"),
            icon=data.get("icon", "folder"),
            description=data.get("description", ""),
        )
        
        if data.get("created_at"):
            category.created_at = datetime.fromisoformat(data["created_at"])
        if data.get("updated_at"):
            category.updated_at = datetime.fromisoformat(data["updated_at"])
        
        return category

    def update(self, **kwargs):
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
        self.updated_at = datetime.now()
