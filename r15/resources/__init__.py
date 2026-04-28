import os
from pathlib import Path

RESOURCES_DIR = Path(__file__).parent

def get_resource_path(relative_path: str) -> str:
    return str(RESOURCES_DIR / relative_path)

def get_icon_path(icon_name: str) -> str:
    return str(RESOURCES_DIR / "icons" / icon_name)
