from enum import Enum
from dataclasses import dataclass
from typing import Dict


class Theme(Enum):
    LIGHT = "light"
    DARK = "dark"
    BLUE = "blue"


@dataclass
class ThemeColors:
    background: str
    background_secondary: str
    text: str
    text_secondary: str
    primary: str
    primary_hover: str
    accent: str
    border: str
    success: str
    warning: str
    danger: str
    info: str


THEME_COLORS: Dict[Theme, ThemeColors] = {
    Theme.LIGHT: ThemeColors(
        background="#ffffff",
        background_secondary="#f5f6fa",
        text="#2c3e50",
        text_secondary="#7f8c8d",
        primary="#3498db",
        primary_hover="#2980b9",
        accent="#e74c3c",
        border="#e0e0e0",
        success="#27ae60",
        warning="#f39c12",
        danger="#e74c3c",
        info="#3498db",
    ),
    Theme.DARK: ThemeColors(
        background="#1e1e2e",
        background_secondary="#28283e",
        text="#e0e0e0",
        text_secondary="#909090",
        primary="#89b4fa",
        primary_hover="#74c7ec",
        accent="#f38ba8",
        border="#45475a",
        success="#a6e3a1",
        warning="#f9e2af",
        danger="#f38ba8",
        info="#89b4fa",
    ),
    Theme.BLUE: ThemeColors(
        background="#ecf0f1",
        background_secondary="#bdc3c7",
        text="#2c3e50",
        text_secondary="#7f8c8d",
        primary="#2980b9",
        primary_hover="#3498db",
        accent="#c0392b",
        border="#95a5a6",
        success="#27ae60",
        warning="#f39c12",
        danger="#c0392b",
        info="#2980b9",
    ),
}


@dataclass
class AppSettings:
    theme: Theme = Theme.LIGHT
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

    def to_dict(self) -> dict:
        return {
            "theme": self.theme.value,
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
        }

    @classmethod
    def from_dict(cls, data: dict) -> "AppSettings":
        settings = cls()
        if "theme" in data:
            settings.theme = Theme(data["theme"])
        if "language" in data:
            settings.language = data["language"]
        if "auto_save_interval" in data:
            settings.auto_save_interval = data["auto_save_interval"]
        if "window_width" in data:
            settings.window_width = data["window_width"]
        if "window_height" in data:
            settings.window_height = data["window_height"]
        if "window_x" in data:
            settings.window_x = data["window_x"]
        if "window_y" in data:
            settings.window_y = data["window_y"]
        if "show_completed_tasks" in data:
            settings.show_completed_tasks = data["show_completed_tasks"]
        if "sort_by" in data:
            settings.sort_by = data["sort_by"]
        if "sort_order" in data:
            settings.sort_order = data["sort_order"]
        if "max_logs_count" in data:
            settings.max_logs_count = data["max_logs_count"]
        if "reminder_check_interval" in data:
            settings.reminder_check_interval = data["reminder_check_interval"]
        return settings

    def get_theme_colors(self) -> ThemeColors:
        return THEME_COLORS.get(self.theme, THEME_COLORS[Theme.LIGHT])
