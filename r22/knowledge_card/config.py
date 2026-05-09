import os
from pathlib import Path

APP_NAME = "个人知识卡片"
APP_VERSION = "1.0.0"

APP_DATA_DIR = os.path.join(os.path.expanduser("~"), ".knowledge_card")
DB_NAME = "knowledge.db"
DB_PATH = os.path.join(APP_DATA_DIR, DB_NAME)

RECENT_VIEW_LIMIT = 10


def ensure_app_data_dir():
    Path(APP_DATA_DIR).mkdir(parents=True, exist_ok=True)
