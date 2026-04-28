import os
import sys
from pathlib import Path
from typing import Optional


def get_app_data_dir() -> Path:
    if sys.platform == "win32":
        app_data = os.environ.get("LOCALAPPDATA", os.environ.get("APPDATA", ""))
        base_dir = Path(app_data) if app_data else Path.home()
    else:
        base_dir = Path.home()
    
    app_data_dir = base_dir / "TaskManager"
    app_data_dir.mkdir(parents=True, exist_ok=True)
    return app_data_dir


def get_config_dir() -> Path:
    config_dir = get_app_data_dir() / "config"
    config_dir.mkdir(parents=True, exist_ok=True)
    return config_dir


def get_log_dir() -> Path:
    log_dir = get_app_data_dir() / "logs"
    log_dir.mkdir(parents=True, exist_ok=True)
    return log_dir


def get_data_dir() -> Path:
    data_dir = get_app_data_dir() / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    return data_dir


def get_temp_dir() -> Path:
    temp_dir = get_app_data_dir() / "temp"
    temp_dir.mkdir(parents=True, exist_ok=True)
    return temp_dir
