import json
import os
from pathlib import Path
from typing import List, Optional, TypeVar, Generic
from datetime import datetime

T = TypeVar('T')


class JSONStorage(Generic[T]):
    def __init__(self, data_dir: str, file_name: str):
        self.data_dir = Path(data_dir)
        self.file_path = self.data_dir / file_name
        self._ensure_data_dir()

    def _ensure_data_dir(self):
        self.data_dir.mkdir(parents=True, exist_ok=True)

    def _load_all(self) -> List[dict]:
        if not self.file_path.exists():
            return []
        try:
            with open(self.file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if not isinstance(data, list):
                    return []
                return data
        except (json.JSONDecodeError, IOError):
            return []

    def _save_all(self, items: List[dict]):
        self._ensure_data_dir()
        with open(self.file_path, 'w', encoding='utf-8') as f:
            json.dump(items, f, ensure_ascii=False, indent=2)

    def get_all(self, cls) -> List[T]:
        items_data = self._load_all()
        return [cls.from_dict(item) for item in items_data]

    def get_by_id(self, cls, item_id: str) -> Optional[T]:
        items_data = self._load_all()
        for item_data in items_data:
            if item_data.get("id") == item_id:
                return cls.from_dict(item_data)
        return None

    def add(self, item: T) -> bool:
        items_data = self._load_all()
        items_data.append(item.to_dict())
        self._save_all(items_data)
        return True

    def update(self, item: T) -> bool:
        items_data = self._load_all()
        for i, item_data in enumerate(items_data):
            if item_data.get("id") == item.id:
                items_data[i] = item.to_dict()
                self._save_all(items_data)
                return True
        return False

    def delete(self, item_id: str) -> bool:
        items_data = self._load_all()
        new_items = [item for item in items_data if item.get("id") != item_id]
        if len(new_items) != len(items_data):
            self._save_all(new_items)
            return True
        return False

    def delete_all(self) -> bool:
        self._save_all([])
        return True

    def count(self) -> int:
        return len(self._load_all())
