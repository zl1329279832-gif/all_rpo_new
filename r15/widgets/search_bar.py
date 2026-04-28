from PySide6.QtWidgets import (
    QWidget, QHBoxLayout, QLineEdit, QPushButton, 
    QComboBox, QLabel, QFrame
)
from PySide6.QtCore import Qt, Signal
from typing import Optional
from models.task import TaskStatus, TaskPriority


class SearchBar(QFrame):
    search_changed = Signal(str)
    filter_changed = Signal()
    clear_clicked = Signal()

    def __init__(self, parent=None):
        super().__init__(parent)
        self._init_ui()

    def _init_ui(self):
        self.setFrameStyle(QFrame.StyledPanel)
        self.setProperty("class", "search-bar")
        self.setMaximumHeight(50)
        
        layout = QHBoxLayout(self)
        layout.setContentsMargins(15, 8, 15, 8)
        layout.setSpacing(10)
        
        search_label = QLabel("🔍")
        layout.addWidget(search_label)
        
        self.search_input = QLineEdit()
        self.search_input.setPlaceholderText("搜索任务...")
        self.search_input.setMinimumWidth(300)
        self.search_input.textChanged.connect(self._on_search_changed)
        self.search_input.setClearButtonEnabled(True)
        layout.addWidget(self.search_input)
        
        layout.addSpacing(20)
        
        status_label = QLabel("状态:")
        layout.addWidget(status_label)
        
        self.status_filter = QComboBox()
        self.status_filter.addItem("全部", None)
        self.status_filter.addItem("待处理", TaskStatus.PENDING.value)
        self.status_filter.addItem("进行中", TaskStatus.IN_PROGRESS.value)
        self.status_filter.addItem("已完成", TaskStatus.COMPLETED.value)
        self.status_filter.addItem("已取消", TaskStatus.CANCELLED.value)
        self.status_filter.currentIndexChanged.connect(self._on_filter_changed)
        self.status_filter.setMinimumWidth(100)
        layout.addWidget(self.status_filter)
        
        priority_label = QLabel("优先级:")
        layout.addWidget(priority_label)
        
        self.priority_filter = QComboBox()
        self.priority_filter.addItem("全部", None)
        self.priority_filter.addItem("紧急", TaskPriority.URGENT.value)
        self.priority_filter.addItem("高", TaskPriority.HIGH.value)
        self.priority_filter.addItem("中", TaskPriority.MEDIUM.value)
        self.priority_filter.addItem("低", TaskPriority.LOW.value)
        self.priority_filter.currentIndexChanged.connect(self._on_filter_changed)
        self.priority_filter.setMinimumWidth(80)
        layout.addWidget(self.priority_filter)
        
        overdue_label = QLabel("到期:")
        layout.addWidget(overdue_label)
        
        self.overdue_filter = QComboBox()
        self.overdue_filter.addItem("全部", None)
        self.overdue_filter.addItem("已过期", "overdue")
        self.overdue_filter.addItem("今天", "today")
        self.overdue_filter.addItem("本周", "week")
        self.overdue_filter.currentIndexChanged.connect(self._on_filter_changed)
        self.overdue_filter.setMinimumWidth(80)
        layout.addWidget(self.overdue_filter)
        
        layout.addStretch()
        
        self.clear_button = QPushButton("清除筛选")
        self.clear_button.clicked.connect(self._on_clear_clicked)
        layout.addWidget(self.clear_button)
        
        self.setStyleSheet("""
            QFrame.search-bar {
                background-color: #f8f9fa;
                border-bottom: 1px solid #e0e0e0;
            }
            QLineEdit {
                padding: 6px 10px;
                border: 1px solid #ced4da;
                border-radius: 4px;
            }
            QLineEdit:focus {
                border-color: #80bdff;
            }
            QComboBox {
                padding: 5px 10px;
                border: 1px solid #ced4da;
                border-radius: 4px;
            }
            QPushButton {
                padding: 5px 15px;
                border: 1px solid #ced4da;
                border-radius: 4px;
                background-color: white;
            }
            QPushButton:hover {
                background-color: #e9ecef;
            }
        """)

    def _on_search_changed(self, text):
        self.search_changed.emit(text)

    def _on_filter_changed(self, index):
        self.filter_changed.emit()

    def _on_clear_clicked(self):
        self.search_input.clear()
        self.status_filter.setCurrentIndex(0)
        self.priority_filter.setCurrentIndex(0)
        self.overdue_filter.setCurrentIndex(0)
        self.clear_clicked.emit()

    def get_search_text(self) -> str:
        return self.search_input.text()

    def get_status_filter(self) -> Optional[TaskStatus]:
        data = self.status_filter.currentData()
        if data is None:
            return None
        return TaskStatus(data)

    def get_priority_filter(self) -> Optional[TaskPriority]:
        data = self.priority_filter.currentData()
        if data is None:
            return None
        return TaskPriority(data)

    def get_overdue_filter(self) -> Optional[str]:
        return self.overdue_filter.currentData()

    def set_search_text(self, text: str):
        self.search_input.setText(text)

    def focus_search(self):
        self.search_input.setFocus()
