import json
import csv
from typing import List, Dict, Any, Optional
from pathlib import Path
from datetime import datetime
from models.task import Task
from models.category import Category
from services.task_service import TaskService
from services.category_service import CategoryService
from utils.logger import get_logger


class ImportExportService:
    def __init__(self, task_service: TaskService, category_service: CategoryService):
        self.task_service = task_service
        self.category_service = category_service
        self.logger = get_logger("ImportExportService")

    def export_to_json(self, file_path: str, include_categories: bool = True) -> bool:
        try:
            data: Dict[str, Any] = {
                "export_version": "1.0",
                "export_time": datetime.now().isoformat(),
            }
            
            if include_categories:
                categories = self.category_service.get_all_categories()
                data["categories"] = [c.to_dict() for c in categories]
            
            tasks = self.task_service.get_all_tasks()
            data["tasks"] = [t.to_dict() for t in tasks]
            
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            
            self.logger.info(f"导出数据到JSON成功: {file_path}")
            return True
        except Exception as e:
            self.logger.error(f"导出数据到JSON失败: {e}")
            return False

    def import_from_json(self, file_path: str, clear_existing: bool = False) -> tuple[bool, int, int]:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            if clear_existing:
                for task in self.task_service.get_all_tasks():
                    self.task_service.delete_task(task.id)
                for category in self.category_service.get_all_categories():
                    self.category_service.delete_category(category.id)
            
            categories_imported = 0
            if "categories" in data:
                for category_data in data["categories"]:
                    category = Category.from_dict(category_data)
                    if not self.category_service.get_category_by_name(category.name):
                        self.category_service.storage.add(category)
                        categories_imported += 1
            
            tasks_imported = 0
            if "tasks" in data:
                for task_data in data["tasks"]:
                    task = Task.from_dict(task_data)
                    if not self.task_service.get_task_by_id(task.id):
                        self.task_service.storage.add(task)
                        tasks_imported += 1
            
            self.logger.info(f"从JSON导入数据成功: {categories_imported} 个分类, {tasks_imported} 个任务")
            return True, categories_imported, tasks_imported
        except Exception as e:
            self.logger.error(f"从JSON导入数据失败: {e}")
            return False, 0, 0

    def export_to_csv(self, file_path: str) -> bool:
        try:
            tasks = self.task_service.get_all_tasks()
            categories = {c.id: c for c in self.category_service.get_all_categories()}
            
            with open(file_path, 'w', encoding='utf-8-sig', newline='') as f:
                writer = csv.writer(f)
                writer.writerow([
                    'ID', '标题', '描述', '优先级', '状态', '分类',
                    '截止日期', '提醒时间', '创建时间', '完成时间', '排序'
                ])
                
                for task in tasks:
                    category_name = categories[task.category_id].name if task.category_id in categories else ''
                    writer.writerow([
                        task.id,
                        task.title,
                        task.description,
                        task.priority.value,
                        task.status.value,
                        category_name,
                        task.due_date.isoformat() if task.due_date else '',
                        task.reminder_time.isoformat() if task.reminder_time else '',
                        task.created_at.isoformat(),
                        task.completed_at.isoformat() if task.completed_at else '',
                        task.order,
                    ])
            
            self.logger.info(f"导出数据到CSV成功: {file_path}")
            return True
        except Exception as e:
            self.logger.error(f"导出数据到CSV失败: {e}")
            return False

    def export_completed_tasks(self, file_path: str, format: str = "json") -> bool:
        if format.lower() == "json":
            return self._export_completed_to_json(file_path)
        elif format.lower() == "csv":
            return self._export_completed_to_csv(file_path)
        return False

    def _export_completed_to_json(self, file_path: str) -> bool:
        try:
            from models.task import TaskStatus
            all_tasks = self.task_service.get_all_tasks()
            completed_tasks = [t for t in all_tasks if t.status == TaskStatus.COMPLETED]
            
            data = {
                "export_version": "1.0",
                "export_time": datetime.now().isoformat(),
                "tasks": [t.to_dict() for t in completed_tasks],
            }
            
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            
            self.logger.info(f"导出已完成任务到JSON成功: {file_path}")
            return True
        except Exception as e:
            self.logger.error(f"导出已完成任务到JSON失败: {e}")
            return False

    def _export_completed_to_csv(self, file_path: str) -> bool:
        try:
            from models.task import TaskStatus
            all_tasks = self.task_service.get_all_tasks()
            completed_tasks = [t for t in all_tasks if t.status == TaskStatus.COMPLETED]
            categories = {c.id: c for c in self.category_service.get_all_categories()}
            
            with open(file_path, 'w', encoding='utf-8-sig', newline='') as f:
                writer = csv.writer(f)
                writer.writerow([
                    'ID', '标题', '描述', '优先级', '分类',
                    '截止日期', '创建时间', '完成时间'
                ])
                
                for task in completed_tasks:
                    category_name = categories[task.category_id].name if task.category_id in categories else ''
                    writer.writerow([
                        task.id,
                        task.title,
                        task.description,
                        task.priority.value,
                        category_name,
                        task.due_date.isoformat() if task.due_date else '',
                        task.created_at.isoformat(),
                        task.completed_at.isoformat() if task.completed_at else '',
                    ])
            
            self.logger.info(f"导出已完成任务到CSV成功: {file_path}")
            return True
        except Exception as e:
            self.logger.error(f"导出已完成任务到CSV失败: {e}")
            return False
