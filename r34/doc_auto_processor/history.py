import csv
import json
from pathlib import Path
from typing import Optional, List, Dict, Any
from datetime import datetime

from .logger import get_logger
from .models import BatchInfo, DocumentInfo, BatchStatus, ProcessingStatus
from .indexer import DatabaseManager

logger = get_logger()


class HistoryManager:
    def __init__(self) -> None:
        self._db = DatabaseManager()

    def list_batches(
        self,
        status: Optional[BatchStatus] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> List[BatchInfo]:
        return self._db.list_batches(status=status, limit=limit, offset=offset)

    def get_batch(self, batch_id: str) -> Optional[BatchInfo]:
        return self._db.get_batch(batch_id)

    def get_batch_documents(
        self,
        batch_id: str,
        status: Optional[ProcessingStatus] = None,
    ) -> List[DocumentInfo]:
        return self._db.get_documents(batch_id=batch_id, status=status)

    def get_failed_documents(self, batch_id: str) -> List[DocumentInfo]:
        return self._db.get_failed_documents(batch_id=batch_id)

    def get_batch_statistics(self, batch_id: str) -> Dict[str, int]:
        return self._db.get_statistics(batch_id=batch_id)

    def format_batch_list(
        self,
        batches: List[BatchInfo],
        show_details: bool = False,
    ) -> str:
        if not batches:
            return "没有找到批次记录。"

        lines = []
        lines.append("-" * 120)
        header = f"{'批次ID':<30} {'状态':<12} {'文件数':>8} {'成功':>6} {'失败':>6} {'跳过':>6} {'创建时间':<20}"
        lines.append(header)
        lines.append("-" * 120)

        for batch in batches:
            status_color = {
                BatchStatus.COMPLETED: "✓",
                BatchStatus.PARTIAL: "⚠",
                BatchStatus.FAILED: "✗",
                BatchStatus.RUNNING: "●",
                BatchStatus.INTERRUPTED: "⏹",
                BatchStatus.ROLLED_BACK: "↺",
            }.get(batch.status, "?")

            created_at = batch.created_at.strftime("%Y-%m-%d %H:%M:%S")
            line = (
                f"{status_color} {batch.batch_id:<28} "
                f"{batch.status.value:<12} "
                f"{batch.total_files:>8} "
                f"{batch.success_count:>6} "
                f"{batch.failed_count:>6} "
                f"{batch.skipped_count:>6} "
                f"{created_at:<20}"
            )
            lines.append(line)

            if show_details and batch.source_dir:
                lines.append(f"    源目录: {batch.source_dir}")
                if batch.target_dir:
                    lines.append(f"    目标: {batch.target_dir}")
                if batch.error_message:
                    lines.append(f"    错误: {batch.error_message}")

        lines.append("-" * 120)
        return "\n".join(lines)

    def format_batch_detail(self, batch_info: BatchInfo) -> str:
        lines = []
        lines.append("=" * 80)
        lines.append(f"批次详情: {batch_info.batch_id}")
        lines.append("=" * 80)
        lines.append(f"  状态:       {batch_info.status.value}")
        lines.append(f"  创建时间:   {batch_info.created_at.strftime('%Y-%m-%d %H:%M:%S')}")
        if batch_info.start_time:
            lines.append(f"  开始时间:   {batch_info.start_time.strftime('%Y-%m-%d %H:%M:%S')}")
        if batch_info.end_time:
            lines.append(f"  结束时间:   {batch_info.end_time.strftime('%Y-%m-%d %H:%M:%S')}")
        if batch_info.source_dir:
            lines.append(f"  源目录:     {batch_info.source_dir}")
        if batch_info.target_dir:
            lines.append(f"  目标目录:   {batch_info.target_dir}")
        if batch_info.config_file:
            lines.append(f"  配置文件:   {batch_info.config_file}")
        lines.append(f"  总文件数:   {batch_info.total_files}")
        lines.append(f"  成功:       {batch_info.success_count}")
        lines.append(f"  失败:       {batch_info.failed_count}")
        lines.append(f"  跳过:       {batch_info.skipped_count}")
        if batch_info.manifest_path:
            lines.append(f"  清单文件:   {batch_info.manifest_path}")
        if batch_info.error_message:
            lines.append(f"  错误信息:   {batch_info.error_message}")
        if batch_info.command_args:
            lines.append(f"  命令参数:   {batch_info.command_args}")
        lines.append("=" * 80)
        return "\n".join(lines)

    def export_results(
        self,
        batch_id: str,
        output_dir: Path,
        format: str = "json",
        include_ocr: bool = False,
    ) -> Path:
        batch = self._db.get_batch(batch_id)
        if not batch:
            raise ValueError(f"批次不存在: {batch_id}")

        documents = self._db.get_documents(batch_id=batch_id)
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_path = output_dir / f"{batch_id}_export_{timestamp}.{format.lower()}"

        if format.lower() == "json":
            self._export_json(batch, documents, output_path, include_ocr)
        elif format.lower() == "csv":
            self._export_csv(batch, documents, output_path, include_ocr)
        else:
            raise ValueError(f"不支持的导出格式: {format}")

        logger.info(f"处理结果已导出: {output_path}")
        return output_path

    def _export_json(
        self,
        batch: BatchInfo,
        documents: List[DocumentInfo],
        output_path: Path,
        include_ocr: bool = False,
    ) -> None:
        data = {
            "batch": {
                "batch_id": batch.batch_id,
                "status": batch.status.value,
                "created_at": batch.created_at.isoformat(),
                "start_time": batch.start_time.isoformat() if batch.start_time else None,
                "end_time": batch.end_time.isoformat() if batch.end_time else None,
                "source_dir": str(batch.source_dir) if batch.source_dir else None,
                "target_dir": str(batch.target_dir) if batch.target_dir else None,
                "total_files": batch.total_files,
                "success_count": batch.success_count,
                "failed_count": batch.failed_count,
                "skipped_count": batch.skipped_count,
            },
            "documents": [
                self._doc_to_dict(doc, include_ocr)
                for doc in documents
            ],
        }

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    def _doc_to_dict(self, doc: DocumentInfo, include_ocr: bool) -> Dict[str, Any]:
        d = {
            "source_path": str(doc.source_path),
            "target_path": str(doc.target_path) if doc.target_path else None,
            "target_name": doc.target_name,
            "status": doc.status.value,
            "file_type": doc.metadata.file_type.value,
            "file_size": doc.metadata.file_size,
            "sha256_hash": doc.metadata.sha256_hash,
            "project_code": doc.metadata.project_code,
            "contract_code": doc.metadata.contract_code,
            "error_message": doc.error_message,
            "processed_at": doc.processed_at.isoformat() if doc.processed_at else None,
        }
        if include_ocr:
            d["ocr_text"] = doc.metadata.ocr_text
            d["ocr_status"] = doc.metadata.ocr_status.value if doc.metadata.ocr_status else None
        return d

    def _export_csv(
        self,
        batch: BatchInfo,
        documents: List[DocumentInfo],
        output_path: Path,
        include_ocr: bool = False,
    ) -> None:
        fieldnames = [
            "批次ID", "源文件路径", "目标路径", "文件名", "状态", "文件类型",
            "文件大小", "SHA256", "项目编号", "合同编号", "错误信息", "处理时间",
        ]
        if include_ocr:
            fieldnames.extend(["OCR文本", "OCR状态"])

        with open(output_path, "w", encoding="utf-8-sig", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()

            for doc in documents:
                row = {
                    "批次ID": batch.batch_id,
                    "源文件路径": str(doc.source_path),
                    "目标路径": str(doc.target_path) if doc.target_path else "",
                    "文件名": doc.target_name or "",
                    "状态": doc.status.value,
                    "文件类型": doc.metadata.file_type.value,
                    "文件大小": doc.metadata.file_size,
                    "SHA256": doc.metadata.sha256_hash or "",
                    "项目编号": doc.metadata.project_code or "",
                    "合同编号": doc.metadata.contract_code or "",
                    "错误信息": doc.error_message or "",
                    "处理时间": doc.processed_at.strftime("%Y-%m-%d %H:%M:%S") if doc.processed_at else "",
                }
                if include_ocr:
                    row["OCR文本"] = doc.metadata.ocr_text or ""
                    row["OCR状态"] = doc.metadata.ocr_status.value if doc.metadata.ocr_status else ""
                writer.writerow(row)


def get_history_manager() -> HistoryManager:
    return HistoryManager()
