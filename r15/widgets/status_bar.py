from PySide6.QtWidgets import QWidget, QHBoxLayout, QLabel, QFrame, QPushButton
from PySide6.QtCore import Qt, QTimer
from PySide6.QtGui import QFont
from datetime import datetime


class StatusBar(QFrame):
    def __init__(self, parent=None):
        super().__init__(parent)
        self._init_ui()
        self._start_clock()

    def _init_ui(self):
        self.setFrameStyle(QFrame.StyledPanel)
        self.setProperty("class", "status-bar")
        self.setMaximumHeight(35)
        
        layout = QHBoxLayout(self)
        layout.setContentsMargins(15, 5, 15, 5)
        layout.setSpacing(20)
        
        self.task_count_label = QLabel("任务: 0 个")
        self.task_count_label.setStyleSheet("color: #666;")
        layout.addWidget(self.task_count_label)
        
        self.overdue_count_label = QLabel("过期: 0 个")
        self.overdue_count_label.setStyleSheet("color: #666;")
        layout.addWidget(self.overdue_count_label)
        
        self.reminder_label = QLabel("")
        self.reminder_label.setStyleSheet("color: #e74c3c; font-weight: bold;")
        layout.addWidget(self.reminder_label)
        
        layout.addStretch()
        
        self.sync_label = QLabel("✓ 已保存")
        self.sync_label.setStyleSheet("color: #27ae60;")
        layout.addWidget(self.sync_label)
        
        self.clock_label = QLabel()
        self.clock_label.setStyleSheet("color: #666;")
        layout.addWidget(self.clock_label)
        
        self.setStyleSheet("""
            QFrame.status-bar {
                background-color: #f5f5f5;
                border-top: 1px solid #e0e0e0;
            }
        """)

    def _start_clock(self):
        self._update_clock()
        self._clock_timer = QTimer(self)
        self._clock_timer.timeout.connect(self._update_clock)
        self._clock_timer.start(1000)

    def _update_clock(self):
        now = datetime.now()
        self.clock_label.setText(now.strftime("%Y-%m-%d %H:%M:%S"))

    def set_task_count(self, count: int):
        self.task_count_label.setText(f"任务: {count} 个")

    def set_overdue_count(self, count: int):
        self.overdue_count_label.setText(f"过期: {count} 个")
        if count > 0:
            self.overdue_count_label.setStyleSheet("color: #e74c3c;")
        else:
            self.overdue_count_label.setStyleSheet("color: #666;")

    def set_reminder_message(self, message: str):
        self.reminder_label.setText(message)

    def set_sync_status(self, status: str, is_error: bool = False):
        self.sync_label.setText(status)
        if is_error:
            self.sync_label.setStyleSheet("color: #e74c3c;")
        else:
            self.sync_label.setStyleSheet("color: #27ae60;")

    def show_saving(self):
        self.set_sync_status("⏳ 保存中...")

    def show_saved(self):
        self.set_sync_status("✓ 已保存")

    def show_error(self, message: str):
        self.set_sync_status(f"✗ {message}", is_error=True)
