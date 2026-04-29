from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, 
    QFrame, QGridLayout, QSizePolicy
)
from PySide6.QtCore import Qt, QSize
from typing import Dict, Any


class StatisticsPanel(QFrame):
    def __init__(self, parent=None):
        super().__init__(parent)
        self._init_ui()

    def _init_ui(self):
        self.setFrameStyle(QFrame.StyledPanel)
        self.setProperty("class", "statistics-panel")
        self.setMinimumHeight(140)
        self.setMaximumHeight(160)
        
        layout = QVBoxLayout(self)
        layout.setContentsMargins(15, 8, 15, 8)
        layout.setSpacing(8)
        
        title = QLabel("📊 任务统计")
        title.setStyleSheet("font-size: 14px; font-weight: bold; color: #333;")
        layout.addWidget(title)
        
        grid = QGridLayout()
        grid.setSpacing(10)
        grid.setContentsMargins(0, 0, 0, 0)
        
        self.total_label = self._create_stat_item("全部", "0", "#333")
        grid.addWidget(self.total_label, 0, 0)
        
        self.pending_label = self._create_stat_item("待处理", "0", "#2196f3")
        grid.addWidget(self.pending_label, 0, 1)
        
        self.in_progress_label = self._create_stat_item("进行中", "0", "#ff9800")
        grid.addWidget(self.in_progress_label, 0, 2)
        
        self.completed_label = self._create_stat_item("已完成", "0", "#4caf50")
        grid.addWidget(self.completed_label, 0, 3)
        
        self.overdue_label = self._create_stat_item("已过期", "0", "#f44336")
        grid.addWidget(self.overdue_label, 1, 0)
        
        self.today_due_label = self._create_stat_item("今天截止", "0", "#ff9800")
        grid.addWidget(self.today_due_label, 1, 1)
        
        self.high_priority_label = self._create_stat_item("高优先级", "0", "#ff5722")
        grid.addWidget(self.high_priority_label, 1, 2)
        
        self.urgent_label = self._create_stat_item("紧急", "0", "#f44336")
        grid.addWidget(self.urgent_label, 1, 3)
        
        layout.addLayout(grid, stretch=1)
        
        self.setStyleSheet("""
            QFrame.statistics-panel {
                background-color: #f8f9fa;
                border-bottom: 1px solid #e0e0e0;
            }
        """)

    def _create_stat_item(self, label_text: str, value_text: str, color: str) -> QFrame:
        frame = QFrame()
        frame.setMinimumSize(QSize(90, 45))
        frame.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Preferred)
        frame.setStyleSheet(f"""
            QFrame {{
                background-color: white;
                border: 1px solid #e0e0e0;
                border-radius: 6px;
            }}
        """)
        
        layout = QVBoxLayout(frame)
        layout.setContentsMargins(8, 5, 8, 5)
        layout.setSpacing(2)
        
        value_label = QLabel(value_text)
        value_label.setStyleSheet(f"font-size: 20px; font-weight: bold; color: {color};")
        value_label.setAlignment(Qt.AlignCenter)
        value_label.setMinimumHeight(24)
        layout.addWidget(value_label)
        
        label = QLabel(label_text)
        label.setStyleSheet("font-size: 10px; color: #666;")
        label.setAlignment(Qt.AlignCenter)
        layout.addWidget(label)
        
        return frame

    def update_statistics(self, stats: Dict[str, Any]):
        self._update_stat_item(self.total_label, stats.get("total", 0))
        self._update_stat_item(self.pending_label, stats.get("pending", 0))
        self._update_stat_item(self.in_progress_label, stats.get("in_progress", 0))
        self._update_stat_item(self.completed_label, stats.get("completed", 0))
        self._update_stat_item(self.overdue_label, stats.get("overdue", 0))
        self._update_stat_item(self.today_due_label, stats.get("today_due", 0))
        self._update_stat_item(self.high_priority_label, stats.get("priority_high", 0))
        self._update_stat_item(self.urgent_label, stats.get("priority_urgent", 0))

    def _update_stat_item(self, frame: QFrame, value: int):
        layout = frame.layout()
        if layout and layout.count() > 0:
            value_label = layout.itemAt(0).widget()
            if value_label:
                value_label.setText(str(value))
