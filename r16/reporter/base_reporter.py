from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional
from pathlib import Path

from scanner.project_scanner import ScanResult


class BaseReporter(ABC):
    def __init__(self, output_path: Optional[str] = None):
        self.output_path = output_path
    
    @abstractmethod
    def generate(self, scan_result: ScanResult) -> str:
        pass
    
    @abstractmethod
    def get_format(self) -> str:
        pass
    
    def save(self, content: str, output_path: Optional[str] = None) -> str:
        path = output_path or self.output_path
        if not path:
            raise ValueError("未提供输出路径")
        
        file_path = Path(path)
        file_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        return str(file_path)
    
    def _get_severity_icon(self, severity: str) -> str:
        icons = {
            "critical": "🔴",
            "high": "🟠",
            "medium": "🟡",
            "low": "🔵",
            "info": "⚪"
        }
        return icons.get(severity, "⚪")
    
    def _get_severity_color(self, severity: str) -> str:
        colors = {
            "critical": "#dc2626",
            "high": "#ea580c",
            "medium": "#ca8a04",
            "low": "#2563eb",
            "info": "#6b7280"
        }
        return colors.get(severity, "#6b7280")
    
    def _get_severity_name(self, severity: str) -> str:
        names = {
            "critical": "严重",
            "high": "高",
            "medium": "中",
            "low": "低",
            "info": "信息"
        }
        return names.get(severity, severity)
    
    def _get_risk_level_color(self, risk_level: str) -> str:
        colors = {
            "critical": "#dc2626",
            "high": "#ea580c",
            "medium": "#ca8a04",
            "low": "#2563eb",
            "info": "#6b7280"
        }
        return colors.get(risk_level, "#6b7280")
    
    def _get_risk_level_name(self, risk_level: str) -> str:
        names = {
            "critical": "严重",
            "high": "高",
            "medium": "中",
            "low": "低",
            "info": "良好"
        }
        return names.get(risk_level, risk_level)
    
    def _format_file_size(self, size_bytes: int) -> str:
        for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
            if size_bytes < 1024:
                return f"{size_bytes:.2f} {unit}"
            size_bytes /= 1024
        return f"{size_bytes:.2f} PB"
