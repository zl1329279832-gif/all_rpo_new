import sys
import os
from pathlib import Path

from PySide6.QtWidgets import QApplication
from PySide6.QtCore import Qt

from utils.helpers import get_app_data_dir, get_config_dir, get_log_dir, get_data_dir
from utils.logger import setup_logger

from storage.json_storage import JSONStorage
from storage.config_storage import ConfigStorage
from config.app_settings import AppSettings
from services.task_service import TaskService
from services.category_service import CategoryService
from services.reminder_service import ReminderService
from services.import_export_service import ImportExportService
from services.log_service import LogService
from ui.main_window import MainWindow


def main():
    app_data_dir = get_app_data_dir()
    config_dir = get_config_dir()
    log_dir = get_log_dir()
    data_dir = get_data_dir()
    
    logger = setup_logger("TaskManager", log_dir=log_dir)
    logger.info(f"应用数据目录: {app_data_dir}")
    logger.info(f"配置目录: {config_dir}")
    logger.info(f"日志目录: {log_dir}")
    logger.info(f"数据目录: {data_dir}")
    
    task_storage = JSONStorage(data_dir, "tasks.json")
    category_storage = JSONStorage(data_dir, "categories.json")
    log_storage = JSONStorage(data_dir, "logs.json")
    config_storage = ConfigStorage(config_dir)
    
    app_settings = config_storage.load()
    logger.info(f"当前主题: {app_settings.theme.value}")
    logger.info(f"窗口大小: {app_settings.window_width}x{app_settings.window_height}")
    
    task_service = TaskService(task_storage)
    category_service = CategoryService(category_storage)
    reminder_service = ReminderService(task_service)
    import_export_service = ImportExportService(task_service, category_service)
    log_service = LogService(log_storage, app_settings.max_logs_count)
    
    if category_service.get_category_count() == 0:
        logger.info("创建默认分类")
        category_service.create_category("工作", "#3498db")
        category_service.create_category("个人", "#27ae60")
        category_service.create_category("学习", "#9b59b6")
    
    app = QApplication(sys.argv)
    app.setApplicationName("本地任务管理")
    app.setApplicationDisplayName("本地任务管理")
    app.setApplicationVersion("1.0.0")
    app.setOrganizationName("TaskManager")
    app.setOrganizationDomain("taskmanager.local")
    
    if hasattr(Qt, 'AA_EnableHighDpiScaling'):
        app.setAttribute(Qt.AA_EnableHighDpiScaling)
    if hasattr(Qt, 'AA_UseHighDpiPixmaps'):
        app.setAttribute(Qt.AA_UseHighDpiPixmaps)
    
    window = MainWindow(
        task_service=task_service,
        category_service=category_service,
        reminder_service=reminder_service,
        import_export_service=import_export_service,
        log_service=log_service,
        app_settings=app_settings,
    )
    
    window.show()
    
    logger.info("应用启动成功")
    
    exit_code = app.exec()
    
    config_storage.save(app_settings)
    logger.info(f"应用退出，代码: {exit_code}")
    
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
