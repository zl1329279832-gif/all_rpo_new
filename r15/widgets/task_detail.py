from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, 
    QLineEdit, QTextEdit, QComboBox, QCheckBox,
    QDateTimeEdit, QPushButton, QGroupBox, QFormLayout,
    QScrollArea, QFrame
)
from PySide6.QtCore import Qt, QDateTime, Signal
from typing import Optional
from models.task import Task, TaskStatus, TaskPriority
from models.category import Category
from utils.date_utils import format_date


class TaskDetailWidget(QFrame):
    task_updated = Signal(str)
    task_created = Signal()
    task_deleted = Signal(str)

    def __init__(self, parent=None):
        super().__init__(parent)
        self.current_task: Optional[Task] = None
        self._is_new_task = False
        self._categories: list[Category] = []
        self._init_ui()

    def _init_ui(self):
        self.setFrameStyle(QFrame.StyledPanel)
        self.setProperty("class", "task-detail")
        self.setMinimumWidth(350)
        
        layout = QVBoxLayout(self)
        layout.setContentsMargins(20, 20, 20, 20)
        layout.setSpacing(15)
        
        self.title_label = QLabel("任务详情")
        self.title_label.setStyleSheet("font-size: 18px; font-weight: bold; color: #333;")
        layout.addWidget(self.title_label)
        
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setFrameStyle(QFrame.NoFrame)
        
        content = QWidget()
        content_layout = QVBoxLayout(content)
        content_layout.setSpacing(15)
        
        info_group = QGroupBox("基本信息")
        form_layout = QFormLayout(info_group)
        form_layout.setSpacing(10)
        
        form_layout.addRow(QLabel("标题:"))
        self.title_input = QLineEdit()
        self.title_input.setPlaceholderText("输入任务标题...")
        form_layout.addRow(self.title_input)
        
        form_layout.addRow(QLabel("描述:"))
        self.description_input = QTextEdit()
        self.description_input.setPlaceholderText("输入任务描述...")
        self.description_input.setMinimumHeight(100)
        form_layout.addRow(self.description_input)
        
        form_layout.addRow(QLabel("优先级:"))
        self.priority_combo = QComboBox()
        self.priority_combo.addItem("低", TaskPriority.LOW.value)
        self.priority_combo.addItem("中", TaskPriority.MEDIUM.value)
        self.priority_combo.addItem("高", TaskPriority.HIGH.value)
        self.priority_combo.addItem("紧急", TaskPriority.URGENT.value)
        form_layout.addRow(self.priority_combo)
        
        form_layout.addRow(QLabel("状态:"))
        self.status_combo = QComboBox()
        self.status_combo.addItem("待处理", TaskStatus.PENDING.value)
        self.status_combo.addItem("进行中", TaskStatus.IN_PROGRESS.value)
        self.status_combo.addItem("已完成", TaskStatus.COMPLETED.value)
        self.status_combo.addItem("已取消", TaskStatus.CANCELLED.value)
        form_layout.addRow(self.status_combo)
        
        form_layout.addRow(QLabel("分类:"))
        self.category_combo = QComboBox()
        self.category_combo.addItem("无分类", None)
        form_layout.addRow(self.category_combo)
        
        content_layout.addWidget(info_group)
        
        datetime_group = QGroupBox("时间设置")
        datetime_layout = QFormLayout(datetime_group)
        datetime_layout.setSpacing(10)
        
        due_row = QHBoxLayout()
        self.due_checkbox = QCheckBox("设置截止日期")
        self.due_checkbox.stateChanged.connect(self._on_due_check_changed)
        due_row.addWidget(self.due_checkbox)
        datetime_layout.addRow(due_row)
        
        self.due_datetime = QDateTimeEdit()
        self.due_datetime.setCalendarPopup(True)
        self.due_datetime.setDisplayFormat("yyyy-MM-dd HH:mm")
        self.due_datetime.setEnabled(False)
        self.due_datetime.setMinimumDateTime(QDateTime.currentDateTime())
        datetime_layout.addRow(self.due_datetime)
        
        reminder_row = QHBoxLayout()
        self.reminder_checkbox = QCheckBox("启用提醒")
        self.reminder_checkbox.stateChanged.connect(self._on_reminder_check_changed)
        reminder_row.addWidget(self.reminder_checkbox)
        datetime_layout.addRow(reminder_row)
        
        self.reminder_datetime = QDateTimeEdit()
        self.reminder_datetime.setCalendarPopup(True)
        self.reminder_datetime.setDisplayFormat("yyyy-MM-dd HH:mm")
        self.reminder_datetime.setEnabled(False)
        self.reminder_datetime.setMinimumDateTime(QDateTime.currentDateTime())
        datetime_layout.addRow(self.reminder_datetime)
        
        content_layout.addWidget(datetime_group)
        
        info_group_2 = QGroupBox("任务信息")
        info_layout = QFormLayout(info_group_2)
        info_layout.setSpacing(8)
        
        self.created_label = QLabel("-")
        info_layout.addRow("创建时间:", self.created_label)
        
        self.updated_label = QLabel("-")
        info_layout.addRow("更新时间:", self.updated_label)
        
        self.completed_label = QLabel("-")
        info_layout.addRow("完成时间:", self.completed_label)
        
        self.id_label = QLabel("-")
        info_layout.addRow("任务ID:", self.id_label)
        
        content_layout.addWidget(info_group_2)
        content_layout.addStretch()
        
        scroll.setWidget(content)
        layout.addWidget(scroll, stretch=1)
        
        button_layout = QHBoxLayout()
        button_layout.setSpacing(10)
        
        self.save_button = QPushButton("保存")
        self.save_button.setMinimumHeight(40)
        self.save_button.clicked.connect(self._on_save_clicked)
        self.save_button.setStyleSheet("""
            QPushButton {
                background-color: #2196f3;
                color: white;
                border: none;
                border-radius: 4px;
                font-size: 14px;
                font-weight: bold;
            }
            QPushButton:hover {
                background-color: #1976d2;
            }
        """)
        button_layout.addWidget(self.save_button)
        
        self.delete_button = QPushButton("删除")
        self.delete_button.setMinimumHeight(40)
        self.delete_button.clicked.connect(self._on_delete_clicked)
        self.delete_button.setStyleSheet("""
            QPushButton {
                background-color: #f44336;
                color: white;
                border: none;
                border-radius: 4px;
                font-size: 14px;
                font-weight: bold;
            }
            QPushButton:hover {
                background-color: #d32f2f;
            }
        """)
        button_layout.addWidget(self.delete_button)
        
        layout.addLayout(button_layout)
        
        self.setStyleSheet("""
            QFrame.task-detail {
                background-color: white;
                border-left: 1px solid #e0e0e0;
            }
            QGroupBox {
                font-weight: bold;
                border: 1px solid #e0e0e0;
                border-radius: 6px;
                margin-top: 12px;
                padding-top: 10px;
            }
            QGroupBox::title {
                subcontrol-origin: margin;
                left: 10px;
                padding: 0 5px;
                color: #666;
            }
            QLineEdit, QTextEdit, QComboBox, QDateTimeEdit {
                padding: 6px 10px;
                border: 1px solid #ced4da;
                border-radius: 4px;
            }
            QLineEdit:focus, QTextEdit:focus, QComboBox:focus, QDateTimeEdit:focus {
                border-color: #80bdff;
            }
        """)
        
        self.clear()

    def _on_due_check_changed(self, state):
        self.due_datetime.setEnabled(state == Qt.Checked)
        if state == Qt.Checked:
            self.due_datetime.setDateTime(QDateTime.currentDateTime().addDays(1))

    def _on_reminder_check_changed(self, state):
        self.reminder_datetime.setEnabled(state == Qt.Checked)
        if state == Qt.Checked:
            self.reminder_datetime.setDateTime(QDateTime.currentDateTime().addSecs(3600))

    def _on_save_clicked(self):
        if self.current_task and not self._is_new_task:
            self.task_updated.emit(self.current_task.id)
        else:
            self.task_created.emit()

    def _on_delete_clicked(self):
        if self.current_task:
            self.task_deleted.emit(self.current_task.id)
            self.clear()

    def set_task(self, task: Task, is_new: bool = False):
        self.current_task = task
        self._is_new_task = is_new
        
        if is_new:
            self.title_label.setText("新建任务")
            self.delete_button.hide()
            self.save_button.setText("创建")
        else:
            self.title_label.setText("任务详情")
            self.delete_button.show()
            self.save_button.setText("保存")
        
        self.title_input.setText(task.title)
        self.description_input.setPlainText(task.description)
        
        priority_index = self.priority_combo.findData(task.priority.value)
        if priority_index >= 0:
            self.priority_combo.setCurrentIndex(priority_index)
        
        status_index = self.status_combo.findData(task.status.value)
        if status_index >= 0:
            self.status_combo.setCurrentIndex(status_index)
        
        category_index = self.category_combo.findData(task.category_id)
        if category_index >= 0:
            self.category_combo.setCurrentIndex(category_index)
        else:
            self.category_combo.setCurrentIndex(0)
        
        if task.due_date:
            self.due_checkbox.setChecked(True)
            self.due_datetime.setDateTime(QDateTime(task.due_date))
            self.due_datetime.setEnabled(True)
        else:
            self.due_checkbox.setChecked(False)
            self.due_datetime.setEnabled(False)
        
        if task.reminder_enabled and task.reminder_time:
            self.reminder_checkbox.setChecked(True)
            self.reminder_datetime.setDateTime(QDateTime(task.reminder_time))
            self.reminder_datetime.setEnabled(True)
        else:
            self.reminder_checkbox.setChecked(False)
            self.reminder_datetime.setEnabled(False)
        
        self.created_label.setText(format_date(task.created_at, "%Y-%m-%d %H:%M:%S"))
        self.updated_label.setText(format_date(task.updated_at, "%Y-%m-%d %H:%M:%S"))
        self.completed_label.setText(
            format_date(task.completed_at, "%Y-%m-%d %H:%M:%S") if task.completed_at else "-"
        )
        self.id_label.setText(task.id[:8] + "...")
        
        self.setEnabled(True)

    def clear(self):
        self.current_task = None
        self._is_new_task = False
        self.title_label.setText("选择或创建任务")
        self.title_input.clear()
        self.description_input.clear()
        self.priority_combo.setCurrentIndex(1)
        self.status_combo.setCurrentIndex(0)
        self.category_combo.setCurrentIndex(0)
        self.due_checkbox.setChecked(False)
        self.due_datetime.setEnabled(False)
        self.reminder_checkbox.setChecked(False)
        self.reminder_datetime.setEnabled(False)
        self.created_label.setText("-")
        self.updated_label.setText("-")
        self.completed_label.setText("-")
        self.id_label.setText("-")
        self.setEnabled(False)

    def set_categories(self, categories: list[Category]):
        self._categories = categories
        current_category_id = None
        if self.category_combo.currentIndex() > 0:
            current_category_id = self.category_combo.currentData()
        
        self.category_combo.clear()
        self.category_combo.addItem("无分类", None)
        
        for category in categories:
            self.category_combo.addItem(category.name, category.id)
        
        if current_category_id:
            index = self.category_combo.findData(current_category_id)
            if index >= 0:
                self.category_combo.setCurrentIndex(index)

    def get_task_data(self) -> dict:
        data = {
            "title": self.title_input.text().strip(),
            "description": self.description_input.toPlainText(),
            "priority": TaskPriority(self.priority_combo.currentData()),
            "status": TaskStatus(self.status_combo.currentData()),
            "category_id": self.category_combo.currentData(),
            "reminder_enabled": self.reminder_checkbox.isChecked(),
        }
        
        if self.due_checkbox.isChecked():
            data["due_date"] = self.due_datetime.dateTime().toPython()
        else:
            data["due_date"] = None
        
        if self.reminder_checkbox.isChecked():
            data["reminder_time"] = self.reminder_datetime.dateTime().toPython()
        else:
            data["reminder_time"] = None
        
        return data
