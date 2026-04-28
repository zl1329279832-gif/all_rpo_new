import json
import os
from pathlib import Path
from typing import Optional
from models.config import AppConfig


class ConfigStorage:
    def __init__(self, config_dir: str, file_name: str = "config.json"):
        self.config_dir = Path(config_dir)
        self.file_path = self.config_dir / file_name
        self._ensure_config_dir()

    def _ensure_config_dir(self):
        self.config_dir.mkdir(parents=True, exist_ok=True)

    def load(self) -> AppConfig:
        if not self.file_path.exists():
            return AppConfig()
        try:
            with open(self.file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return AppConfig.from_dict(data)
        except (json.JSONDecodeError, IOError):
            return AppConfig()

    def save(self, config: AppConfig) -> bool:
        self._ensure_config_dir()
        try:
            with open(self.file_path, 'w', encoding='utf-8') as f:
                json.dump(config.to_dict(), f, ensure_ascii=False, indent=2)
            return True
        except IOError:
            return False

    def reset(self) -> bool:
        default_config = AppConfig()
        return self.save(default_config)
