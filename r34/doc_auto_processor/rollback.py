import os
import shutil
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from datetime import datetime
from dataclasses import dataclass

from .logger import get_logger
from .models import BatchInfo, DocumentInfo, ProcessingStatus, BatchStatus
from .indexer import DatabaseManager
from .manifest import ManifestGenerator, Manifest
from .rules import retry_operation

logger = get_logger()


@dataclass
class RollbackResult:
    batch_id: str
    total_files: int
    restored: int
    skipped: int
    conflicts: List[Dict[str, str]]
    errors: List[str]
    report_path: Optional[Path] = None


class RollbackManager:
    def __init__(self, dry_run: bool = False) -> None:
        self.dry_run = dry_run
        self._db = DatabaseManager()
        self._manifest_gen = ManifestGenerator()

    def _get_batch_documents(self, batch_id: str) -> List[DocumentInfo]:
        docs = self._db.get_documents(batch_id=batch_id)
        return [
            doc
            for doc in docs
            if doc.status
            in (ProcessingStatus.ARCHIVED, ProcessingStatus.RENAMED, ProcessingStatus.DEDUPLICATED)
        ]

    def _check_conflict(
        self,
        doc: DocumentInfo,
        source_path: Path,
    ) -> Optional[Dict[str, str]]:
        if source_path.exists():
            try:
                import hashlib
                existing_hash = hashlib.sha256(source_path.read_bytes()).hexdigest()
                target_hash = doc.metadata.sha256_hash

                if existing_hash == target_hash:
                    return {
                        "type": "same_content",
                        "source": str(doc.target_path),
                        "target": str(source_path),
                        "message": "目标位置已存在相同内容的文件，将跳过",
                    }
                else:
                    return {
                        "type": "different_content",
                        "source": str(doc.target_path),
                        "target": str(source_path),
                        "message": "目标位置已存在不同内容的文件，禁止覆盖",
                    }
            except Exception as e:
                return {
                    "type": "check_error",
                    "source": str(doc.target_path),
                    "target": str(source_path),
                    "message": f"检查冲突时出错: {e}",
                }

        return None

    def _restore_file(
        self,
        doc: DocumentInfo,
        max_retries: int = 3,
    ) -> Tuple[bool, Optional[str]]:
        if not doc.target_path or not doc.target_path.exists():
            return False, f"目标文件不存在: {doc.target_path}"

        source_path = doc.source_path

        conflict = self._check_conflict(doc, source_path)
        if conflict:
            if conflict["type"] == "same_content":
                logger.info(f"目标已存在相同文件，跳过: {source_path}")
                return True, "跳过（目标已存在相同文件）"
            else:
                return False, f"冲突: {conflict['message']}"

        try:
            if self.dry_run:
                logger.info(f"[DRY-RUN] 将恢复: {doc.target_path} -> {source_path}")
                return True, None

            source_path.parent.mkdir(parents=True, exist_ok=True)

            def _do_restore():
                shutil.copy2(str(doc.target_path), str(source_path))
                if doc.target_path != source_path:
                    doc.target_path.unlink()
                return True

            retry_operation(_do_restore, max_retries=max_retries)

            doc.status = ProcessingStatus.ROLLED_BACK
            logger.info(f"已恢复: {doc.target_path.name} -> {source_path}")
            return True, None

        except Exception as e:
            error_msg = f"恢复失败: {str(e)}"
            logger.error(f"{error_msg}: {doc.target_path}")
            return False, error_msg

    def _cleanup_empty_dirs(self, base_dir: Path) -> None:
        if self.dry_run or not base_dir.exists():
            return

        try:
            for dirpath, dirnames, filenames in os.walk(str(base_dir), topdown=False):
                dir_path = Path(dirpath)
                if dir_path == base_dir:
                    continue
                try:
                    if not any(dir_path.iterdir()):
                        dir_path.rmdir()
                        logger.debug(f"已清理空目录: {dir_path}")
                except (PermissionError, OSError):
                    continue
        except Exception as e:
            logger.warning(f"清理空目录失败: {e}")

    def _generate_rollback_report(
        self,
        batch_id: str,
        results: List[Tuple[DocumentInfo, bool, Optional[str]]],
        conflicts: List[Dict[str, str]],
        errors: List[str],
    ) -> Path:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_dir = Path.cwd() / "reports" / "rollback"
        report_dir.mkdir(parents=True, exist_ok=True)
        report_path = report_dir / f"rollback_{batch_id}_{timestamp}.txt"

        restored = sum(1 for _, success, _ in results if success)
        skipped = sum(1 for _, success, msg in results if not success and "跳过" in str(msg))

        with open(report_path, "w", encoding="utf-8") as f:
            f.write("=" * 80 + "\n")
            f.write(f"批次回滚报告 - {batch_id}\n")
            f.write("=" * 80 + "\n\n")
            f.write(f"回滚时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"总文件数: {len(results)}\n")
            f.write(f"成功恢复: {restored}\n")
            f.write(f"跳过: {skipped}\n")
            f.write(f"失败: {len(errors)}\n")
            f.write(f"冲突数: {len(conflicts)}\n\n")

            if conflicts:
                f.write("-" * 80 + "\n")
                f.write("冲突详情:\n")
                f.write("-" * 80 + "\n")
                for i, c in enumerate(conflicts, 1):
                    f.write(f"[{i}] 类型: {c['type']}\n")
                    f.write(f"    源: {c['source']}\n")
                    f.write(f"    目标: {c['target']}\n")
                    f.write(f"    说明: {c['message']}\n\n")

            if errors:
                f.write("-" * 80 + "\n")
                f.write("错误详情:\n")
                f.write("-" * 80 + "\n")
                for i, e in enumerate(errors, 1):
                    f.write(f"[{i}] {e}\n")
                f.write("\n")

            f.write("-" * 80 + "\n")
            f.write("处理详情:\n")
            f.write("-" * 80 + "\n")
            for i, (doc, success, msg) in enumerate(results, 1):
                status = "✓" if success else "✗"
                target = str(doc.target_path) if doc.target_path else "N/A"
                f.write(f"[{i}] {status} {doc.source_path}\n")
                f.write(f"    从: {target}\n")
                if msg:
                    f.write(f"    状态: {msg}\n")
                f.write("\n")

            f.write("=" * 80 + "\n")
            f.write("报告结束\n")
            f.write("=" * 80 + "\n")

        return report_path

    def rollback(
        self,
        batch_id: str,
        max_retries: int = 3,
    ) -> RollbackResult:
        batch = self._db.get_batch(batch_id)
        if not batch:
            raise ValueError(f"批次不存在: {batch_id}")

        if batch.status == BatchStatus.ROLLED_BACK:
            logger.warning(f"批次已回滚过: {batch_id}")

        documents = self._get_batch_documents(batch_id)
        if not documents:
            logger.warning(f"批次 {batch_id} 没有需要回滚的文件")
            return RollbackResult(
                batch_id=batch_id,
                total_files=0,
                restored=0,
                skipped=0,
                conflicts=[],
                errors=[],
            )

        logger.info(f"开始回滚批次: {batch_id}，共 {len(documents)} 个文件")
        logger.info("=" * 60)

        results: List[Tuple[DocumentInfo, bool, Optional[str]]] = []
        conflicts: List[Dict[str, str]] = []
        errors: List[str] = []

        for doc in documents:
            conflict = self._check_conflict(doc, doc.source_path)
            if conflict:
                conflicts.append(conflict)
                if conflict["type"] == "same_content":
                    results.append((doc, True, f"跳过（{conflict['message']}）"))
                else:
                    results.append((doc, False, conflict["message"]))
                    errors.append(f"{doc.source_path}: {conflict['message']}")
                continue

            success, error = self._restore_file(doc, max_retries=max_retries)
            results.append((doc, success, error))

            if not success and error:
                errors.append(f"{doc.source_path}: {error}")

            try:
                self._db.update_document(doc)
            except Exception as e:
                logger.warning(f"更新数据库失败: {e}")

        restored = sum(1 for _, success, _ in results if success)
        skipped = sum(1 for _, success, msg in results if not success and "跳过" in str(msg))

        if batch.target_dir and not self.dry_run:
            self._cleanup_empty_dirs(batch.target_dir)

        batch.status = BatchStatus.ROLLED_BACK
        batch.end_time = datetime.now()
        self._db.update_batch(batch)

        report_path = self._generate_rollback_report(
            batch_id, results, conflicts, errors
        )

        logger.info("=" * 60)
        logger.info(f"回滚完成: 成功 {restored}，跳过 {skipped}，失败 {len(errors)}，冲突 {len(conflicts)}")
        logger.info(f"回滚报告: {report_path}")

        return RollbackResult(
            batch_id=batch_id,
            total_files=len(results),
            restored=restored,
            skipped=skipped,
            conflicts=conflicts,
            errors=errors,
            report_path=report_path,
        )

    def simulate(self, batch_id: str) -> RollbackResult:
        logger.info(f"[模拟] 回滚批次: {batch_id}")
        original_dry_run = self.dry_run
        self.dry_run = True

        try:
            return self.rollback(batch_id)
        finally:
            self.dry_run = original_dry_run
