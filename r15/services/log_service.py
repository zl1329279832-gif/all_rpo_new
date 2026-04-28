from typing import List, Optional
from datetime import datetime
from models.config import OperationLog
from storage.json_storage import JSONStorage
from utils.logger import get_logger


class LogService:
    def __init__(self, storage: JSONStorage, max_logs: int = 1000):
        self.storage = storage
        self.max_logs = max_logs
        self.logger = get_logger("LogService")

    def log(self, operation: str, target_type: str, target_id: str, 
            target_name: str, details: str = "") -> Optional[OperationLog]:
        log = OperationLog(
            operation=operation,
            target_type=target_type,
            target_id=target_id,
            target_name=target_name,
            details=details,
        )
        
        if self.storage.add(log):
            self.logger.debug(f"记录日志: {operation} - {target_name}")
            self._trim_logs_if_needed()
            return log
        return None

    def log_task_create(self, task_id: str, task_title: str):
        return self.log("创建", "任务", task_id, task_title, "创建新任务")

    def log_task_update(self, task_id: str, task_title: str, changes: str = ""):
        details = f"更新任务: {changes}" if changes else "更新任务"
        return self.log("更新", "任务", task_id, task_title, details)

    def log_task_delete(self, task_id: str, task_title: str):
        return self.log("删除", "任务", task_id, task_title, "删除任务")

    def log_task_complete(self, task_id: str, task_title: str):
        return self.log("完成", "任务", task_id, task_title, "任务标记为完成")

    def log_category_create(self, category_id: str, category_name: str):
        return self.log("创建", "分类", category_id, category_name, "创建新分类")

    def log_category_update(self, category_id: str, category_name: str, changes: str = ""):
        details = f"更新分类: {changes}" if changes else "更新分类"
        return self.log("更新", "分类", category_id, category_name, details)

    def log_category_delete(self, category_id: str, category_name: str):
        return self.log("删除", "分类", category_id, category_name, "删除分类")

    def log_import(self, categories_count: int, tasks_count: int):
        return self.log(
            "导入", "数据", "", "数据导入",
            f"导入 {categories_count} 个分类, {tasks_count} 个任务"
        )

    def log_export(self, format: str, items_count: int):
        return self.log(
            "导出", "数据", "", "数据导出",
            f"导出 {items_count} 个项目为 {format} 格式"
        )

    def get_all_logs(self, limit: int = 100) -> List[OperationLog]:
        logs = self.storage.get_all(OperationLog)
        logs.sort(key=lambda l: l.timestamp, reverse=True)
        return logs[:limit]

    def get_logs_by_operation(self, operation: str, limit: int = 100) -> List[OperationLog]:
        logs = self.storage.get_all(OperationLog)
        filtered = [l for l in logs if l.operation == operation]
        filtered.sort(key=lambda l: l.timestamp, reverse=True)
        return filtered[:limit]

    def get_logs_by_target_type(self, target_type: str, limit: int = 100) -> List[OperationLog]:
        logs = self.storage.get_all(OperationLog)
        filtered = [l for l in logs if l.target_type == target_type]
        filtered.sort(key=lambda l: l.timestamp, reverse=True)
        return filtered[:limit]

    def get_logs_by_date_range(self, start_time: datetime, end_time: datetime, 
                                limit: int = 100) -> List[OperationLog]:
        logs = self.storage.get_all(OperationLog)
        filtered = [
            l for l in logs 
            if start_time <= l.timestamp <= end_time
        ]
        filtered.sort(key=lambda l: l.timestamp, reverse=True)
        return filtered[:limit]

    def clear_old_logs(self, keep_days: int = 30) -> int:
        from datetime import timedelta
        cutoff_time = datetime.now() - timedelta(days=keep_days)
        logs = self.storage.get_all(OperationLog)
        
        logs_to_keep = [l for l in logs if l.timestamp >= cutoff_time]
        deleted_count = len(logs) - len(logs_to_keep)
        
        self.storage.delete_all()
        for log in logs_to_keep:
            self.storage.add(log)
        
        if deleted_count > 0:
            self.logger.info(f"清理了 {deleted_count} 条旧日志")
        
        return deleted_count

    def _trim_logs_if_needed(self):
        logs = self.storage.get_all(OperationLog)
        if len(logs) > self.max_logs:
            logs.sort(key=lambda l: l.timestamp, reverse=True)
            logs_to_keep = logs[:self.max_logs]
            
            self.storage.delete_all()
            for log in logs_to_keep:
                self.storage.add(log)
            
            self.logger.info(f"日志数量超过限制，已裁剪到 {self.max_logs} 条")

    def get_log_count(self) -> int:
        return self.storage.count()
