from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, 
    QCheckBox, QPushButton, QFrame, QMenu
)
from PySide6.QtCore import Qt, Signal, QMimeData, QPoint
from PySide6.QtGui import QDrag, QCursor, QAction
from typing import Optional
from models.task import Task, TaskStatus, TaskPriority
from utils.date_utils import format_date_short, is_overdue, get_days_remaining


class TaskItemWidget(QFrame):
    clicked = Signal(str)
    completed_changed = Signal(str, bool)
    deleted = Signal(str)
    edited = Signal(str)

    def __init__(self, task: Task, parent=None):
        super().__init__(parent)
        self.task = task
        self._is_dragging = False
        self._drag_start_pos = None
        self._init_ui()
        self._update_display()
        self.setMouseTracking(True)

    def _init_ui(self):
        self.setFrameStyle(QFrame.StyledPanel)
        self.setProperty("class", "task-item")
        
        layout = QHBoxLayout(self)
        layout.setContentsMargins(10, 8, 10, 8)
        layout.setSpacing(10)
        
        self.complete_checkbox = QCheckBox()
        self.complete_checkbox.setFixedSize(20, 20)
        self.complete_checkbox.stateChanged.connect(self._on_complete_changed)
        layout.addWidget(self.complete_checkbox)
        
        priority_indicator = QLabel()
        priority_indicator.setFixedSize(6, 40)
        priority_indicator.setObjectName("priority-indicator")
        self.priority_indicator = priority_indicator
        layout.addWidget(priority_indicator)
        
        text_layout = QVBoxLayout()
        text_layout.setSpacing(2)
        
        self.title_label = QLabel()
        self.title_label.setObjectName("task-title")
        self.title_label.setWordWrap(True)
        text_layout.addWidget(self.title_label)
        
        info_layout = QHBoxLayout()
        info_layout.setSpacing(15)
        
        self.status_label = QLabel()
        self.status_label.setObjectName("task-status")
        info_layout.addWidget(self.status_label)
        
        self.due_date_label = QLabel()
        self.due_date_label.setObjectName("task-due-date")
        info_layout.addWidget(self.due_date_label)
        
        info_layout.addStretch()
        
        self.reminder_label = QLabel()
        self.reminder_label.setObjectName("task-reminder")
        info_layout.addWidget(self.reminder_label)
        
        text_layout.addLayout(info_layout)
        text_layout.addStretch()
        
        layout.addLayout(text_layout, stretch=1)
        
        self.edit_button = QPushButton("编辑")
        self.edit_button.setFixedSize(60, 28)
        self.edit_button.clicked.connect(self._on_edit_clicked)
        
        self.delete_button = QPushButton("删除")
        self.delete_button.setFixedSize(60, 28)
        self.delete_button.clicked.connect(self._on_delete_clicked)
        
        layout.addWidget(self.edit_button)
        layout.addWidget(self.delete_button)

    def _update_display(self):
        task = self.task
        
        self.complete_checkbox.setChecked(task.status == TaskStatus.COMPLETED)
        
        self.title_label.setText(task.title)
        if task.status == TaskStatus.COMPLETED:
            self.title_label.setStyleSheet("text-decoration: line-through; color: #888;")
        else:
            self.title_label.setStyleSheet("")
        
        priority_colors = {
            TaskPriority.LOW: "#95a5a6",
            TaskPriority.MEDIUM: "#3498db",
            TaskPriority.HIGH: "#f39c12",
            TaskPriority.URGENT: "#e74c3c",
        }
        color = priority_colors.get(task.priority, "#95a5a6")
        self.priority_indicator.setStyleSheet(
            f"background-color: {color}; border-radius: 3px;"
        )
        
        status_texts = {
            TaskStatus.PENDING: "待处理",
            TaskStatus.IN_PROGRESS: "进行中",
            TaskStatus.COMPLETED: "已完成",
            TaskStatus.CANCELLED: "已取消",
        }
        self.status_label.setText(status_texts.get(task.status, "未知"))
        
        if task.due_date:
            overdue = is_overdue(task.due_date)
            days_remaining = get_days_remaining(task.due_date)
            
            if overdue and task.status != TaskStatus.COMPLETED:
                self.due_date_label.setText(f"已过期: {format_date_short(task.due_date)}")
                self.due_date_label.setStyleSheet("color: #e74c3c;")
            elif days_remaining == 0:
                self.due_date_label.setText(f"今天截止: {format_date_short(task.due_date)}")
                self.due_date_label.setStyleSheet("color: #f39c12;")
            else:
                self.due_date_label.setText(f"截止: {format_date_short(task.due_date)}")
                self.due_date_label.setStyleSheet("")
        else:
            self.due_date_label.setText("")
            self.due_date_label.setStyleSheet("")
        
        if task.reminder_enabled and task.reminder_time:
            if task.reminder_shown:
                self.reminder_label.setText("🔔 已提醒")
                self.reminder_label.setStyleSheet("color: #95a5a6;")
            else:
                self.reminder_label.setText("🔔")
                self.reminder_label.setStyleSheet("color: #e74c3c;")
        else:
            self.reminder_label.setText("")

    def _on_complete_changed(self, state):
        is_checked = state == Qt.Checked
        self.completed_changed.emit(self.task.id, is_checked)

    def _on_edit_clicked(self):
        self.edited.emit(self.task.id)

    def _on_delete_clicked(self):
        self.deleted.emit(self.task.id)

    def update_task(self, task: Task):
        self.task = task
        self._update_display()

    def set_selected(self, selected: bool):
        if selected:
            self.setStyleSheet("""
                QFrame.task-item {
                    background-color: #e3f2fd;
                    border: 1px solid #2196f3;
                    border-radius: 6px;
                }
            """)
        else:
            self.setStyleSheet("""
                QFrame.task-item {
                    background-color: white;
                    border: 1px solid #e0e0e0;
                    border-radius: 6px;
                }
                QFrame.task-item:hover {
                    background-color: #f5f5f5;
                    border-color: #bdbdbd;
                }
            """)

    def mousePressEvent(self, event):
        if event.button() == Qt.LeftButton:
            self._drag_start_pos = event.pos()
            self._is_dragging = False
        super().mousePressEvent(event)

    def mouseMoveEvent(self, event):
        if not (event.buttons() & Qt.LeftButton):
            return
        
        if self._drag_start_pos is None:
            return
        
        distance = (event.pos() - self._drag_start_pos).manhattanLength()
        if distance > 10 and not self._is_dragging:
            self._is_dragging = True
            drag = QDrag(self)
            mime_data = QMimeData()
            mime_data.setText(self.task.id)
            drag.setMimeData(mime_data)
            drag.exec_(Qt.MoveAction)
        
        super().mouseMoveEvent(event)

    def mouseReleaseEvent(self, event):
        if event.button() == Qt.LeftButton and not self._is_dragging:
            self.clicked.emit(self.task.id)
        self._is_dragging = False
        super().mouseReleaseEvent(event)

    def contextMenuEvent(self, event):
        menu = QMenu(self)
        
        edit_action = QAction("编辑任务", self)
        edit_action.triggered.connect(lambda: self.edited.emit(self.task.id))
        menu.addAction(edit_action)
        
        if self.task.status != TaskStatus.COMPLETED:
            complete_action = QAction("标记完成", self)
            complete_action.triggered.connect(
                lambda: self.completed_changed.emit(self.task.id, True)
            )
            menu.addAction(complete_action)
        else:
            incomplete_action = QAction("标记未完成", self)
            incomplete_action.triggered.connect(
                lambda: self.completed_changed.emit(self.task.id, False)
            )
            menu.addAction(incomplete_action)
        
        menu.addSeparator()
        
        delete_action = QAction("删除任务", self)
        delete_action.triggered.connect(lambda: self.deleted.emit(self.task.id))
        menu.addAction(delete_action)
        
        menu.exec_(event.globalPos())
