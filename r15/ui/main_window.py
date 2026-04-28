from PySide6.QtWidgets import (
    QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QListWidget, QListWidgetItem, QSplitter, QMenuBar,
    QMenu, QToolBar, QStatusBar, QMessageBox, QFileDialog,
    QInputDialog, QColorDialog, QDialog, QDialogButtonBox,
    QFormLayout, QLineEdit, QLabel, QComboBox, QPushButton
)
from PySide6.QtCore import Qt, QTimer, QSize, QPoint, Signal, QMimeData
from PySide6.QtGui import QAction, QIcon, QKeySequence, QColor, QDragEnterEvent, QDragMoveEvent, QDropEvent
from typing import Optional, List
from datetime import datetime

from models.task import Task, TaskStatus, TaskPriority
from models.category import Category
from config.app_settings import AppSettings, Theme
from widgets.task_item import TaskItemWidget
from widgets.category_item import CategoryItemWidget
from widgets.search_bar import SearchBar
from widgets.task_detail import TaskDetailWidget
from widgets.statistics_panel import StatisticsPanel
from widgets.status_bar import StatusBar
from services.task_service import TaskService
from services.category_service import CategoryService
from services.reminder_service import ReminderService
from services.import_export_service import ImportExportService
from services.log_service import LogService
from utils.logger import get_logger


class TaskListWidget(QListWidget):
    task_reordered = Signal(str, int)

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setAcceptDrops(True)
        self.setDragEnabled(True)
        self.setDropIndicatorShown(True)
        self.setDragDropMode(QListWidget.InternalMove)
        self.setSelectionMode(QListWidget.SingleSelection)

    def dragEnterEvent(self, event: QDragEnterEvent):
        if event.mimeData().hasText():
            event.acceptProposedAction()

    def dragMoveEvent(self, event: QDragMoveEvent):
        if event.mimeData().hasText():
            event.acceptProposedAction()

    def dropEvent(self, event: QDropEvent):
        if event.mimeData().hasText():
            task_id = event.mimeData().text()
            target_index = self.indexAt(event.pos()).row()
            
            if target_index < 0:
                target_index = self.count() - 1
            
            self.task_reordered.emit(task_id, target_index)
            event.acceptProposedAction()


class MainWindow(QMainWindow):
    def __init__(
        self,
        task_service: TaskService,
        category_service: CategoryService,
        reminder_service: ReminderService,
        import_export_service: ImportExportService,
        log_service: LogService,
        app_settings: AppSettings,
    ):
        super().__init__()
        self.task_service = task_service
        self.category_service = category_service
        self.reminder_service = reminder_service
        self.import_export_service = import_export_service
        self.log_service = log_service
        self.settings = app_settings
        self.logger = get_logger("MainWindow")
        
        self.selected_category_id: Optional[str] = None
        self.selected_task_id: Optional[str] = None
        self.task_widgets: dict = {}
        
        self._init_ui()
        self._init_menu()
        self._init_toolbar()
        self._init_timers()
        self._load_settings()
        self._refresh_all()

    def _init_ui(self):
        self.setWindowTitle("本地任务管理")
        self.setMinimumSize(1000, 700)
        
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        
        main_layout = QVBoxLayout(central_widget)
        main_layout.setContentsMargins(0, 0, 0, 0)
        main_layout.setSpacing(0)
        
        self.search_bar = SearchBar()
        self.search_bar.search_changed.connect(self._on_search_changed)
        self.search_bar.filter_changed.connect(self._on_filter_changed)
        self.search_bar.clear_clicked.connect(self._on_filter_clear)
        main_layout.addWidget(self.search_bar)
        
        self.statistics_panel = StatisticsPanel()
        main_layout.addWidget(self.statistics_panel)
        
        main_splitter = QSplitter(Qt.Horizontal)
        
        left_panel = QWidget()
        left_layout = QVBoxLayout(left_panel)
        left_layout.setContentsMargins(5, 5, 5, 5)
        left_layout.setSpacing(5)
        
        category_header = QLabel("📁 分类")
        category_header.setStyleSheet("font-size: 14px; font-weight: bold; padding: 5px;")
        left_layout.addWidget(category_header)
        
        self.category_list = QListWidget()
        self.category_list.setMinimumWidth(200)
        self.category_list.setMaximumWidth(300)
        left_layout.addWidget(self.category_list)
        
        category_btn_layout = QHBoxLayout()
        
        add_category_btn = QPushButton("+ 新建")
        add_category_btn.clicked.connect(self._on_add_category)
        category_btn_layout.addWidget(add_category_btn)
        
        category_btn_layout.addStretch()
        left_layout.addLayout(category_btn_layout)
        
        main_splitter.addWidget(left_panel)
        
        middle_panel = QWidget()
        middle_layout = QVBoxLayout(middle_panel)
        middle_layout.setContentsMargins(5, 5, 5, 5)
        middle_layout.setSpacing(5)
        
        task_header = QHBoxLayout()
        task_title = QLabel("📋 任务列表")
        task_title.setStyleSheet("font-size: 14px; font-weight: bold;")
        task_header.addWidget(task_title)
        task_header.addStretch()
        
        add_task_btn = QPushButton("+ 新建任务")
        add_task_btn.clicked.connect(self._on_add_task)
        task_header.addWidget(add_task_btn)
        
        middle_layout.addLayout(task_header)
        
        self.task_list = TaskListWidget()
        self.task_list.setMinimumWidth(300)
        self.task_list.setSpacing(5)
        self.task_list.task_reordered.connect(self._on_task_reordered)
        middle_layout.addWidget(self.task_list, stretch=1)
        
        main_splitter.addWidget(middle_panel)
        
        self.task_detail = TaskDetailWidget()
        self.task_detail.task_updated.connect(self._on_task_updated)
        self.task_detail.task_created.connect(self._on_task_created)
        self.task_detail.task_deleted.connect(self._on_task_deleted)
        main_splitter.addWidget(self.task_detail)
        
        main_splitter.setSizes([220, 500, 350])
        main_layout.addWidget(main_splitter, stretch=1)
        
        self.status_bar = StatusBar()
        self.setStatusBar(self.status_bar)
        
        self._apply_theme()

    def _init_menu(self):
        menubar = self.menuBar()
        
        file_menu = menubar.addMenu("文件(&F)")
        
        new_task_action = QAction("新建任务(&N)", self)
        new_task_action.setShortcut(QKeySequence.New)
        new_task_action.triggered.connect(self._on_add_task)
        file_menu.addAction(new_task_action)
        
        new_category_action = QAction("新建分类(&C)", self)
        new_category_action.triggered.connect(self._on_add_category)
        file_menu.addAction(new_category_action)
        
        file_menu.addSeparator()
        
        import_menu = file_menu.addMenu("导入(&I)")
        
        import_json_action = QAction("从 JSON 导入", self)
        import_json_action.triggered.connect(self._on_import_json)
        import_menu.addAction(import_json_action)
        
        export_menu = file_menu.addMenu("导出(&E)")
        
        export_json_action = QAction("导出为 JSON", self)
        export_json_action.triggered.connect(self._on_export_json)
        export_menu.addAction(export_json_action)
        
        export_csv_action = QAction("导出为 CSV", self)
        export_csv_action.triggered.connect(self._on_export_csv)
        export_menu.addAction(export_csv_action)
        
        export_completed_action = QAction("导出已完成任务", self)
        export_completed_action.triggered.connect(self._on_export_completed)
        export_menu.addAction(export_completed_action)
        
        file_menu.addSeparator()
        
        exit_action = QAction("退出(&X)", self)
        exit_action.setShortcut(QKeySequence.Quit)
        exit_action.triggered.connect(self.close)
        file_menu.addAction(exit_action)
        
        edit_menu = menubar.addMenu("编辑(&E)")
        
        undo_action = QAction("撤销(&Z)", self)
        undo_action.setShortcut(QKeySequence.Undo)
        edit_menu.addAction(undo_action)
        
        redo_action = QAction("重做(&Y)", self)
        redo_action.setShortcut(QKeySequence.Redo)
        edit_menu.addAction(redo_action)
        
        view_menu = menubar.addMenu("视图(&V)")
        
        theme_menu = view_menu.addMenu("主题(&T)")
        
        light_theme_action = QAction("浅色主题", self)
        light_theme_action.triggered.connect(lambda: self._on_theme_change(Theme.LIGHT))
        theme_menu.addAction(light_theme_action)
        
        dark_theme_action = QAction("深色主题", self)
        dark_theme_action.triggered.connect(lambda: self._on_theme_change(Theme.DARK))
        theme_menu.addAction(dark_theme_action)
        
        blue_theme_action = QAction("蓝色主题", self)
        blue_theme_action.triggered.connect(lambda: self._on_theme_change(Theme.BLUE))
        theme_menu.addAction(blue_theme_action)
        
        help_menu = menubar.addMenu("帮助(&H)")
        
        about_action = QAction("关于(&A)", self)
        about_action.triggered.connect(self._on_about)
        help_menu.addAction(about_action)

    def _init_toolbar(self):
        toolbar = self.addToolBar("主工具栏")
        toolbar.setMovable(False)
        
        new_task_action = QAction("新建任务", self)
        new_task_action.triggered.connect(self._on_add_task)
        toolbar.addAction(new_task_action)
        
        toolbar.addSeparator()
        
        search_action = QAction("搜索", self)
        search_action.triggered.connect(self.search_bar.focus_search)
        toolbar.addAction(search_action)

    def _init_timers(self):
        self.reminder_timer = QTimer(self)
        self.reminder_timer.timeout.connect(self._check_reminders)
        self.reminder_timer.start(self.settings.reminder_check_interval * 1000)

    def _load_settings(self):
        self.setGeometry(
            self.settings.window_x,
            self.settings.window_y,
            self.settings.window_width,
            self.settings.window_height,
        )

    def _save_settings(self):
        geometry = self.geometry()
        self.settings.window_x = geometry.x()
        self.settings.window_y = geometry.y()
        self.settings.window_width = geometry.width()
        self.settings.window_height = geometry.height()

    def _apply_theme(self):
        colors = self.settings.get_theme_colors()
        
        if self.settings.theme == Theme.DARK:
            self.setStyleSheet(f"""
                QMainWindow {{
                    background-color: {colors.background};
                }}
                QWidget {{
                    background-color: {colors.background};
                    color: {colors.text};
                }}
                QMenuBar {{
                    background-color: {colors.background_secondary};
                }}
                QMenuBar::item:selected {{
                    background-color: {colors.primary};
                }}
                QMenu {{
                    background-color: {colors.background_secondary};
                    border: 1px solid {colors.border};
                }}
                QMenu::item:selected {{
                    background-color: {colors.primary};
                }}
                QToolBar {{
                    background-color: {colors.background_secondary};
                    border-bottom: 1px solid {colors.border};
                }}
                QPushButton {{
                    background-color: {colors.primary};
                    color: white;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 4px;
                }}
                QPushButton:hover {{
                    background-color: {colors.primary_hover};
                }}
                QLineEdit, QTextEdit, QComboBox, QDateTimeEdit {{
                    background-color: {colors.background_secondary};
                    border: 1px solid {colors.border};
                    color: {colors.text};
                    padding: 5px;
                    border-radius: 4px;
                }}
                QListWidget {{
                    background-color: {colors.background};
                    border: 1px solid {colors.border};
                }}
                QScrollBar:vertical {{
                    background-color: {colors.background_secondary};
                    width: 12px;
                }}
                QScrollBar::handle:vertical {{
                    background-color: {colors.primary};
                    border-radius: 6px;
                    min-height: 20px;
                }}
                QGroupBox {{
                    border: 1px solid {colors.border};
                    margin-top: 16px;
                    padding-top: 10px;
                }}
                QGroupBox::title {{
                    subcontrol-origin: margin;
                    left: 10px;
                    padding: 0 5px;
                    color: {colors.text_secondary};
                }}
            """)
        else:
            self.setStyleSheet("""
                QMainWindow {
                    background-color: #f5f6fa;
                }
                QMenuBar {
                    background-color: white;
                    border-bottom: 1px solid #e0e0e0;
                }
                QMenuBar::item {
                    padding: 5px 10px;
                    background-color: transparent;
                }
                QMenuBar::item:selected {
                    background-color: #e3f2fd;
                }
                QMenu {
                    background-color: white;
                    border: 1px solid #e0e0e0;
                }
                QMenu::item {
                    padding: 5px 30px;
                }
                QMenu::item:selected {
                    background-color: #e3f2fd;
                }
                QToolBar {
                    background-color: white;
                    border-bottom: 1px solid #e0e0e0;
                    padding: 5px;
                }
                QSplitter::handle {
                    background-color: #e0e0e0;
                }
                QListWidget {
                    background-color: #fafafa;
                    border: 1px solid #e0e0e0;
                    border-radius: 6px;
                }
            """)

    def _refresh_all(self):
        self._refresh_categories()
        self._refresh_tasks()
        self._refresh_statistics()
        self.task_detail.set_categories(self.category_service.get_all_categories())

    def _refresh_categories(self):
        self.category_list.clear()
        
        all_item = QListWidgetItem("📋 全部任务")
        all_item.setData(Qt.UserRole, None)
        self.category_list.addItem(all_item)
        
        categories = self.category_service.get_all_categories()
        all_tasks = self.task_service.get_all_tasks()
        
        for category in categories:
            task_count = len([t for t in all_tasks if t.category_id == category.id])
            
            category_widget = CategoryItemWidget(category)
            category_widget.set_task_count(task_count)
            category_widget.clicked.connect(self._on_category_clicked)
            category_widget.edited.connect(self._on_edit_category)
            category_widget.deleted.connect(self._on_delete_category)
            
            item = QListWidgetItem()
            item.setData(Qt.UserRole, category.id)
            item.setSizeHint(category_widget.sizeHint())
            
            self.category_list.addItem(item)
            self.category_list.setItemWidget(item, category_widget)
        
        if self.selected_category_id is None:
            self.category_list.setCurrentRow(0)

    def _refresh_tasks(self):
        self.task_list.clear()
        self.task_widgets.clear()
        
        tasks = self._get_filtered_tasks()
        
        if self.settings.sort_by == "order":
            tasks.sort(key=lambda t: t.order)
        elif self.settings.sort_by == "due_date":
            tasks.sort(key=lambda t: t.due_date or datetime.max)
        elif self.settings.sort_by == "priority":
            priority_order = {
                TaskPriority.URGENT: 0,
                TaskPriority.HIGH: 1,
                TaskPriority.MEDIUM: 2,
                TaskPriority.LOW: 3,
            }
            tasks.sort(key=lambda t: priority_order.get(t.priority, 3))
        elif self.settings.sort_by == "created_at":
            tasks.sort(key=lambda t: t.created_at, reverse=True)
        
        if self.settings.sort_order == "desc":
            tasks.reverse()
        
        for task in tasks:
            task_widget = TaskItemWidget(task)
            task_widget.clicked.connect(self._on_task_clicked)
            task_widget.completed_changed.connect(self._on_task_completed)
            task_widget.deleted.connect(self._on_task_deleted)
            task_widget.edited.connect(self._on_task_edited)
            
            item = QListWidgetItem()
            item.setData(Qt.UserRole, task.id)
            item.setSizeHint(task_widget.sizeHint())
            
            self.task_list.addItem(item)
            self.task_list.setItemWidget(item, task_widget)
            self.task_widgets[task.id] = (item, task_widget)
        
        task_count = len(tasks)
        overdue_count = len([t for t in tasks if t.is_overdue()])
        self.status_bar.set_task_count(task_count)
        self.status_bar.set_overdue_count(overdue_count)

    def _get_filtered_tasks(self) -> List[Task]:
        if self.selected_category_id is not None:
            tasks = self.task_service.get_tasks_by_category(self.selected_category_id)
        else:
            tasks = self.task_service.get_all_tasks()
        
        search_text = self.search_bar.get_search_text()
        if search_text:
            search_lower = search_text.lower()
            tasks = [
                t for t in tasks
                if search_lower in t.title.lower() or search_lower in t.description.lower()
            ]
        
        status_filter = self.search_bar.get_status_filter()
        if status_filter is not None:
            tasks = [t for t in tasks if t.status == status_filter]
        
        priority_filter = self.search_bar.get_priority_filter()
        if priority_filter is not None:
            tasks = [t for t in tasks if t.priority == priority_filter]
        
        overdue_filter = self.search_bar.get_overdue_filter()
        if overdue_filter:
            now = datetime.now()
            if overdue_filter == "overdue":
                tasks = [t for t in tasks if t.is_overdue()]
            elif overdue_filter == "today":
                tasks = [
                    t for t in tasks
                    if t.due_date and t.due_date.date() == now.date()
                ]
            elif overdue_filter == "week":
                from datetime import timedelta
                week_end = now + timedelta(days=7)
                tasks = [
                    t for t in tasks
                    if t.due_date and now <= t.due_date <= week_end
                ]
        
        if not self.settings.show_completed_tasks:
            tasks = [t for t in tasks if t.status != TaskStatus.COMPLETED]
        
        return tasks

    def _refresh_statistics(self):
        stats = self.task_service.get_statistics()
        self.statistics_panel.update_statistics(stats)

    def _on_category_clicked(self, category_id: str):
        self.selected_category_id = category_id
        
        for i in range(self.category_list.count()):
            item = self.category_list.item(i)
            widget = self.category_list.itemWidget(item)
            if widget:
                item_category_id = item.data(Qt.UserRole)
                widget.set_selected(item_category_id == category_id)
        
        self._refresh_tasks()

    def _on_task_clicked(self, task_id: str):
        task = self.task_service.get_task_by_id(task_id)
        if task:
            self.selected_task_id = task_id
            self.task_detail.set_task(task, is_new=False)
            
            for tid, (item, widget) in self.task_widgets.items():
                widget.set_selected(tid == task_id)

    def _on_task_completed(self, task_id: str, is_completed: bool):
        task = self.task_service.get_task_by_id(task_id)
        if task:
            if is_completed:
                self.task_service.update_task_status(task, TaskStatus.COMPLETED)
                self.log_service.log_task_complete(task_id, task.title)
            else:
                self.task_service.update_task_status(task, TaskStatus.PENDING)
                self.log_service.log_task_update(task_id, task.title, "标记为未完成")
            
            self._refresh_tasks()
            self._refresh_statistics()
            self.status_bar.show_saved()

    def _on_task_edited(self, task_id: str):
        self._on_task_clicked(task_id)

    def _on_task_updated(self, task_id: str):
        task = self.task_service.get_task_by_id(task_id)
        if task:
            task_data = self.task_detail.get_task_data()
            self.task_service.update_task(task, **task_data)
            self.log_service.log_task_update(task_id, task.title, "更新任务")
            self._refresh_all()
            self.status_bar.show_saved()
            QMessageBox.information(self, "成功", "任务已更新")

    def _on_task_created(self):
        task_data = self.task_detail.get_task_data()
        
        if not task_data["title"].strip():
            QMessageBox.warning(self, "警告", "任务标题不能为空")
            return
        
        task = self.task_service.create_task(
            title=task_data["title"],
            description=task_data["description"],
            priority=task_data["priority"],
            category_id=task_data["category_id"],
            due_date=task_data["due_date"],
            reminder_enabled=task_data["reminder_enabled"],
            reminder_time=task_data["reminder_time"],
        )
        
        if task:
            task.status = task_data["status"]
            self.task_service.update_task(task)
            self.log_service.log_task_create(task.id, task.title)
            self._refresh_all()
            self.status_bar.show_saved()
            QMessageBox.information(self, "成功", "任务已创建")
            self.task_detail.clear()
        else:
            QMessageBox.warning(self, "错误", "创建任务失败")

    def _on_task_deleted(self, task_id: str):
        task = self.task_service.get_task_by_id(task_id)
        if task:
            reply = QMessageBox.question(
                self, "确认删除",
                f"确定要删除任务 \"{task.title}\" 吗？",
                QMessageBox.Yes | QMessageBox.No
            )
            
            if reply == QMessageBox.Yes:
                self.task_service.delete_task(task_id)
                self.log_service.log_task_delete(task_id, task.title)
                self._refresh_all()
                self.task_detail.clear()
                self.status_bar.show_saved()

    def _on_task_reordered(self, task_id: str, new_index: int):
        task = self.task_service.get_task_by_id(task_id)
        if task:
            self.task_service.move_task(task, new_index)
            self.log_service.log_task_update(task_id, task.title, "调整排序")
            self._refresh_tasks()
            self.status_bar.show_saved()

    def _on_search_changed(self, text):
        self._refresh_tasks()

    def _on_filter_changed(self):
        self._refresh_tasks()

    def _on_filter_clear(self):
        self._refresh_tasks()

    def _on_add_task(self):
        from models.task import Task
        task = Task(
            title="",
            description="",
        )
        self.task_detail.set_task(task, is_new=True)

    def _on_add_category(self):
        name, ok = QInputDialog.getText(self, "新建分类", "分类名称:")
        if ok and name.strip():
            color = QColorDialog.getColor(QColor("#3498db"), self, "选择分类颜色")
            
            if color.isValid():
                category = self.category_service.create_category(
                    name=name.strip(),
                    color=color.name(),
                )
                
                if category:
                    self.log_service.log_category_create(category.id, category.name)
                    self._refresh_all()
                    self.status_bar.show_saved()
                else:
                    QMessageBox.warning(self, "错误", "创建分类失败，名称可能已存在")

    def _on_edit_category(self, category_id: str):
        category = self.category_service.get_category_by_id(category_id)
        if category:
            dialog = QDialog(self)
            dialog.setWindowTitle("编辑分类")
            dialog.setMinimumWidth(300)
            
            layout = QVBoxLayout(dialog)
            form = QFormLayout()
            
            name_input = QLineEdit(category.name)
            form.addRow("名称:", name_input)
            
            color_combo = QComboBox()
            colors = [
                ("蓝色", "#3498db"),
                ("绿色", "#27ae60"),
                ("红色", "#e74c3c"),
                ("橙色", "#f39c12"),
                ("紫色", "#9b59b6"),
                ("青色", "#1abc9c"),
            ]
            for name, color in colors:
                color_combo.addItem(f"■ {name}", color)
            
            index = color_combo.findData(category.color)
            if index >= 0:
                color_combo.setCurrentIndex(index)
            form.addRow("颜色:", color_combo)
            
            layout.addLayout(form)
            
            buttons = QDialogButtonBox(QDialogButtonBox.Ok | QDialogButtonBox.Cancel)
            buttons.accepted.connect(dialog.accept)
            buttons.rejected.connect(dialog.reject)
            layout.addWidget(buttons)
            
            if dialog.exec() == QDialog.Accepted:
                new_name = name_input.text().strip()
                new_color = color_combo.currentData()
                
                if new_name:
                    self.category_service.update_category(
                        category,
                        name=new_name,
                        color=new_color,
                    )
                    self.log_service.log_category_update(category.id, category.name, "更新分类")
                    self._refresh_all()
                    self.status_bar.show_saved()

    def _on_delete_category(self, category_id: str):
        category = self.category_service.get_category_by_id(category_id)
        if category:
            tasks = self.task_service.get_tasks_by_category(category_id)
            
            if tasks:
                reply = QMessageBox.question(
                    self, "确认删除",
                    f"分类 \"{category.name}\" 下有 {len(tasks)} 个任务。\n"
                    "删除分类后，这些任务将变成无分类。\n"
                    "确定要删除吗？",
                    QMessageBox.Yes | QMessageBox.No
                )
            else:
                reply = QMessageBox.question(
                    self, "确认删除",
                    f"确定要删除分类 \"{category.name}\" 吗？",
                    QMessageBox.Yes | QMessageBox.No
                )
            
            if reply == QMessageBox.Yes:
                for task in tasks:
                    task.category_id = None
                    self.task_service.update_task(task)
                
                self.category_service.delete_category(category_id)
                self.log_service.log_category_delete(category_id, category.name)
                
                if self.selected_category_id == category_id:
                    self.selected_category_id = None
                
                self._refresh_all()
                self.status_bar.show_saved()

    def _on_theme_change(self, theme: Theme):
        self.settings.theme = theme
        self._apply_theme()

    def _on_import_json(self):
        file_path, _ = QFileDialog.getOpenFileName(
            self, "导入 JSON 文件", "", "JSON 文件 (*.json);;所有文件 (*)"
        )
        
        if file_path:
            success, categories_count, tasks_count = self.import_export_service.import_from_json(
                file_path, clear_existing=False
            )
            
            if success:
                self.log_service.log_import(categories_count, tasks_count)
                self._refresh_all()
                self.status_bar.show_saved()
                QMessageBox.information(
                    self, "导入成功",
                    f"成功导入 {categories_count} 个分类和 {tasks_count} 个任务"
                )
            else:
                QMessageBox.warning(self, "导入失败", "导入数据失败，请检查文件格式")

    def _on_export_json(self):
        file_path, _ = QFileDialog.getSaveFileName(
            self, "导出为 JSON", "tasks.json", "JSON 文件 (*.json)"
        )
        
        if file_path:
            if self.import_export_service.export_to_json(file_path, include_categories=True):
                total_count = self.task_service.task_service.storage.count() if hasattr(self.task_service, 'task_service') else 0
                self.log_service.log_export("JSON", total_count)
                self.status_bar.show_saved()
                QMessageBox.information(self, "导出成功", f"数据已导出到:\n{file_path}")
            else:
                QMessageBox.warning(self, "导出失败", "导出数据失败")

    def _on_export_csv(self):
        file_path, _ = QFileDialog.getSaveFileName(
            self, "导出为 CSV", "tasks.csv", "CSV 文件 (*.csv)"
        )
        
        if file_path:
            if self.import_export_service.export_to_csv(file_path):
                self.status_bar.show_saved()
                QMessageBox.information(self, "导出成功", f"数据已导出到:\n{file_path}")
            else:
                QMessageBox.warning(self, "导出失败", "导出数据失败")

    def _on_export_completed(self):
        file_path, _ = QFileDialog.getSaveFileName(
            self, "导出已完成任务", "completed_tasks.json", "JSON 文件 (*.json);;CSV 文件 (*.csv)"
        )
        
        if file_path:
            format = "csv" if file_path.endswith(".csv") else "json"
            if self.import_export_service.export_completed_tasks(file_path, format=format):
                self.status_bar.show_saved()
                QMessageBox.information(self, "导出成功", f"已完成任务已导出到:\n{file_path}")
            else:
                QMessageBox.warning(self, "导出失败", "导出数据失败")

    def _on_about(self):
        QMessageBox.about(
            self, "关于本地任务管理",
            "<h3>本地任务管理 v1.0</h3>"
            "<p>一款功能强大的桌面任务管理软件</p>"
            "<p>使用 Python + PySide6 开发</p>"
            "<p><b>主要功能:</b></p>"
            "<ul>"
            "<li>任务新增、编辑、删除</li>"
            "<li>完成状态切换</li>"
            "<li>任务分类管理</li>"
            "<li>优先级设置</li>"
            "<li>截止时间和提醒</li>"
            "<li>搜索和筛选</li>"
            "<li>任务拖拽排序</li>"
            "<li>数据导入导出</li>"
            "<li>操作日志</li>"
            "<li>主题切换</li>"
            "</ul>"
        )

    def _check_reminders(self):
        tasks = self.reminder_service.check_reminders()
        
        for task in tasks:
            QMessageBox.information(
                self, "⏰ 任务提醒",
                f"<b>{task.title}</b><br><br>"
                f"优先级: {task.priority.value}<br>"
                f"截止时间: {task.due_date}<br>" if task.due_date else ""
            )
            self.status_bar.set_reminder_message(f"提醒: {task.title}")
        
        if tasks:
            self._refresh_tasks()

    def closeEvent(self, event):
        self._save_settings()
        self.reminder_timer.stop()
        event.accept()
