import os
import sys
import shutil
import signal
from pathlib import Path
from typing import List, Optional, Set
from datetime import datetime
from tqdm import tqdm

from .logger import get_logger
from .models import (
    DocumentInfo, ProcessingStatus, ProcessingSummary,
    ConflictStrategy, ArchiveStrategy,
)
from .rules import (
    ProcessingRules, RuleEngine, MetadataExtractor,
    retry_operation,
)

logger = get_logger()


class InterruptHandler:
    def __init__(self) -> None:
        self.interrupted = False
        self._original_sigint = signal.getsignal(signal.SIGINT)
        self._original_sigterm = signal.getsignal(signal.SIGTERM)

    def __enter__(self) -> "InterruptHandler":
        signal.signal(signal.SIGINT, self._handle_signal)
        signal.signal(signal.SIGTERM, self._handle_signal)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        signal.signal(signal.SIGINT, self._original_sigint)
        signal.signal(signal.SIGTERM, self._original_sigterm)

    def _handle_signal(self, signum, frame) -> None:
        self.interrupted = True
        logger.warning(f"收到中断信号 {signum}，正在安全退出...")
        print("\n检测到中断信号，正在安全退出，请勿强制关闭...", file=sys.stderr)


class FileOperationHelper:
    @staticmethod
    def is_file_locked(file_path: Path) -> bool:
        try:
            with open(file_path, "r+b"):
                pass
            return False
        except PermissionError:
            return True
        except OSError as e:
            if e.errno in (13, 32):
                return True
            return False
        except Exception:
            return False

    @staticmethod
    def check_write_permission(dir_path: Path) -> bool:
        try:
            test_file = dir_path / ".write_test.tmp"
            test_file.touch()
            test_file.unlink()
            return True
        except (PermissionError, OSError):
            return False

    @staticmethod
    def safe_copy(src: Path, dst: Path, max_retries: int = 3) -> None:
        def _do_copy():
            shutil.copy2(src, dst)
            if not dst.exists() or dst.stat().st_size != src.stat().st_size:
                raise OSError(f"文件复制不完整: {src} -> {dst}")
            return True

        retry_operation(_do_copy, max_retries=max_retries)

    @staticmethod
    def safe_create_dir(dir_path: Path, max_retries: int = 3) -> None:
        def _do_create():
            dir_path.mkdir(parents=True, exist_ok=True)
            if not dir_path.is_dir():
                raise OSError(f"创建目录失败: {dir_path}")
            return True

        retry_operation(_do_create, max_retries=max_retries)


class ConflictResolver:
    def __init__(self, strategy: ConflictStrategy) -> None:
        self.strategy = strategy

    def resolve(self, target_path: Path, used_paths: Optional[Set[Path]] = None) -> Optional[Path]:
        used_paths = used_paths or set()

        if not target_path.exists() and target_path not in used_paths:
            return target_path

        if self.strategy == ConflictStrategy.SKIP:
            logger.info(f"文件已存在，跳过: {target_path}")
            return None

        elif self.strategy == ConflictStrategy.OVERWRITE:
            logger.warning(f"文件已存在，将被覆盖: {target_path}")
            return target_path

        elif self.strategy == ConflictStrategy.RENAME:
            base = target_path.stem
            suffix = target_path.suffix
            parent = target_path.parent
            counter = 1

            while True:
                new_name = f"{base}_{counter}{suffix}"
                new_path = parent / new_name
                if not new_path.exists() and new_path not in used_paths:
                    logger.info(f"文件已存在，重命名为: {new_path.name}")
                    return new_path
                counter += 1
                if counter > 9999:
                    raise RuntimeError(f"无法生成唯一文件名，已尝试 {counter} 次: {target_path}")

        return None


class DocumentExecutor:
    def __init__(
        self,
        rules: ProcessingRules,
        dry_run: bool = False,
        safe_preview: bool = False,
        max_retries: int = 3,
        show_progress: bool = True,
    ) -> None:
        self.rules = rules
        self.dry_run = dry_run
        self.safe_preview = safe_preview
        self.max_retries = max_retries
        self.show_progress = show_progress
        self.rule_engine = RuleEngine(rules)
        self.conflict_resolver = ConflictResolver(rules.conflict_strategy)
        self._used_paths: Set[Path] = set()
        self.summary = ProcessingSummary()

    def _prepare_target(self, doc_info: DocumentInfo) -> bool:
        try:
            MetadataExtractor.extract_full_metadata(doc_info)

            doc_info.target_name = self.rule_engine.generate_target_name(doc_info)

            archive_path = self.rule_engine.generate_archive_path(doc_info)
            if archive_path:
                doc_info.archive_path = archive_path
                doc_info.target_path = archive_path / doc_info.target_name
            else:
                doc_info.target_path = doc_info.source_path.parent / doc_info.target_name

            resolved = self.conflict_resolver.resolve(
                doc_info.target_path, self._used_paths
            )
            if resolved is None:
                doc_info.status = ProcessingStatus.SKIPPED
                doc_info.error_message = "文件冲突，已跳过"
                self.summary.skipped += 1
                return False

            doc_info.target_path = resolved
            self._used_paths.add(resolved)
            doc_info.status = ProcessingStatus.SCANNED
            self.summary.scanned += 1
            return True

        except Exception as e:
            doc_info.status = ProcessingStatus.FAILED
            doc_info.error_message = f"准备失败: {str(e)}"
            self.summary.failed += 1
            self.summary.errors.append(f"{doc_info.source_path}: {doc_info.error_message}")
            logger.error(f"准备失败 {doc_info.source_path}: {e}")
            return False

    def _rename_file(self, doc_info: DocumentInfo) -> bool:
        if not doc_info.target_path:
            return False

        target = doc_info.target_path
        source = doc_info.source_path

        if source == target:
            doc_info.warnings.append("目标文件与源文件相同，无需重命名")
            doc_info.status = ProcessingStatus.RENAMED
            self.summary.renamed += 1
            return True

        try:
            if target.parent and not self.dry_run and not self.safe_preview:
                FileOperationHelper.safe_create_dir(target.parent, max_retries=self.max_retries)

            if self.dry_run or self.safe_preview:
                logger.info(f"[DRY-RUN] 将重命名: {source.name} -> {target.name}")
                doc_info.status = ProcessingStatus.RENAMED
                self.summary.renamed += 1
                return True

            if self.rules.preserve_original:
                FileOperationHelper.safe_copy(source, target, max_retries=self.max_retries)
                logger.info(f"已复制并重命名: {source.name} -> {target.name}")
            else:
                def _do_rename():
                    source.rename(target)
                    return True
                retry_operation(_do_rename, max_retries=self.max_retries)
                logger.info(f"已重命名: {source.name} -> {target.name}")

            doc_info.status = ProcessingStatus.RENAMED
            self.summary.renamed += 1
            return True

        except Exception as e:
            doc_info.status = ProcessingStatus.FAILED
            doc_info.error_message = f"重命名失败: {str(e)}"
            self.summary.failed += 1
            self.summary.errors.append(f"{doc_info.source_path}: {doc_info.error_message}")
            logger.error(f"重命名失败 {source}: {e}")
            return False

    def _archive_file(self, doc_info: DocumentInfo) -> bool:
        if not doc_info.archive_path or not doc_info.target_path:
            doc_info.status = ProcessingStatus.ARCHIVED
            self.summary.archived += 1
            return True

        if doc_info.target_path.parent == doc_info.archive_path:
            doc_info.status = ProcessingStatus.ARCHIVED
            self.summary.archived += 1
            return True

        try:
            final_target = doc_info.archive_path / doc_info.target_path.name

            if self.dry_run or self.safe_preview:
                logger.info(f"[DRY-RUN] 将归档: {doc_info.target_path} -> {final_target}")
                doc_info.target_path = final_target
                doc_info.status = ProcessingStatus.ARCHIVED
                self.summary.archived += 1
                return True

            FileOperationHelper.safe_create_dir(
                doc_info.archive_path, max_retries=self.max_retries
            )

            if doc_info.status == ProcessingStatus.RENAMED:
                current_path = doc_info.target_path
                def _do_move():
                    shutil.move(str(current_path), str(final_target))
                    return True
                retry_operation(_do_move, max_retries=self.max_retries)
            else:
                source = doc_info.source_path
                FileOperationHelper.safe_copy(
                    source, final_target, max_retries=self.max_retries
                )

            doc_info.target_path = final_target
            doc_info.status = ProcessingStatus.ARCHIVED
            self.summary.archived += 1
            logger.info(f"已归档: {final_target}")
            return True

        except Exception as e:
            doc_info.status = ProcessingStatus.FAILED
            doc_info.error_message = f"归档失败: {str(e)}"
            self.summary.failed += 1
            self.summary.errors.append(f"{doc_info.source_path}: {doc_info.error_message}")
            logger.error(f"归档失败 {doc_info.source_path}: {e}")
            return False

    def _validate_pre_operation(self, doc_info: DocumentInfo) -> bool:
        if FileOperationHelper.is_file_locked(doc_info.source_path):
            doc_info.status = ProcessingStatus.FAILED
            doc_info.error_message = "文件被占用，无法处理"
            self.summary.failed += 1
            self.summary.errors.append(f"{doc_info.source_path}: {doc_info.error_message}")
            logger.error(doc_info.error_message + f": {doc_info.source_path}")
            return False

        if not os.access(doc_info.source_path, os.R_OK):
            doc_info.status = ProcessingStatus.FAILED
            doc_info.error_message = "无读取权限"
            self.summary.failed += 1
            self.summary.errors.append(f"{doc_info.source_path}: {doc_info.error_message}")
            logger.error(doc_info.error_message + f": {doc_info.source_path}")
            return False

        if doc_info.archive_path:
            if not self.dry_run and not self.safe_preview:
                if not doc_info.archive_path.exists():
                    try:
                        FileOperationHelper.safe_create_dir(
                            doc_info.archive_path, max_retries=self.max_retries
                        )
                    except Exception as e:
                        doc_info.status = ProcessingStatus.FAILED
                        doc_info.error_message = f"无法创建归档目录: {e}"
                        self.summary.failed += 1
                        self.summary.errors.append(f"{doc_info.source_path}: {doc_info.error_message}")
                        logger.error(doc_info.error_message)
                        return False

                if not FileOperationHelper.check_write_permission(doc_info.archive_path):
                    doc_info.status = ProcessingStatus.FAILED
                    doc_info.error_message = "归档目录无写入权限"
                    self.summary.failed += 1
                    self.summary.errors.append(f"{doc_info.source_path}: {doc_info.error_message}")
                    logger.error(doc_info.error_message + f": {doc_info.archive_path}")
                    return False

        return True

    def _process_single(self, doc_info: DocumentInfo) -> DocumentInfo:
        self.summary.total_files += 1
        self.summary.total_size += doc_info.metadata.file_size
        doc_info.processed_at = datetime.now()

        if not self._prepare_target(doc_info):
            return doc_info

        if not self._validate_pre_operation(doc_info):
            return doc_info

        if not self._rename_file(doc_info):
            return doc_info

        if not self._archive_file(doc_info):
            return doc_info

        return doc_info

    def process(self, documents: List[DocumentInfo]) -> List[DocumentInfo]:
        self.summary.start_time = datetime.now()
        self._used_paths.clear()

        logger.info("=" * 60)
        if self.dry_run:
            logger.info("DRY-RUN 模式已启用 - 不会实际修改任何文件")
        if self.safe_preview:
            logger.info("安全预览模式已启用 - 仅显示处理计划")
        logger.info(f"冲突处理策略: {self.rules.conflict_strategy.value}")
        logger.info(f"归档策略: {self.rules.archive_strategy.value}")
        logger.info(f"最大重试次数: {self.max_retries}")
        logger.info("=" * 60)

        results: List[DocumentInfo] = []

        with InterruptHandler() as handler:
            iterator = tqdm(
                documents,
                desc="处理文件",
                unit="file",
                disable=not self.show_progress,
            )

            for doc in iterator:
                if handler.interrupted:
                    logger.warning("用户中断，停止处理")
                    doc.status = ProcessingStatus.SKIPPED
                    doc.error_message = "用户中断"
                    self.summary.skipped += 1
                    results.append(doc)
                    break

                if self.safe_preview:
                    self._prepare_target(doc)
                    if doc.status == ProcessingStatus.SCANNED:
                        doc.status = ProcessingStatus.SKIPPED
                        self.summary.skipped += 1
                    results.append(doc)
                    continue

                try:
                    processed = self._process_single(doc)
                    results.append(processed)
                except Exception as e:
                    doc.status = ProcessingStatus.FAILED
                    doc.error_message = f"处理异常: {str(e)}"
                    self.summary.failed += 1
                    self.summary.errors.append(f"{doc.source_path}: {doc.error_message}")
                    logger.error(f"处理异常 {doc.source_path}: {e}")
                    results.append(doc)

            iterator.close()

        self.summary.end_time = datetime.now()
        self._log_summary()

        return results

    def _log_summary(self) -> None:
        duration = 0
        if self.summary.start_time and self.summary.end_time:
            duration = (self.summary.end_time - self.summary.start_time).total_seconds()

        logger.info("=" * 60)
        logger.info("处理完成摘要:")
        logger.info(f"  总文件数: {self.summary.total_files}")
        logger.info(f"  总大小: {self._format_size(self.summary.total_size)}")
        logger.info(f"  成功扫描: {self.summary.scanned}")
        logger.info(f"  成功重命名: {self.summary.renamed}")
        logger.info(f"  成功归档: {self.summary.archived}")
        logger.info(f"  跳过: {self.summary.skipped}")
        logger.info(f"  失败: {self.summary.failed}")
        logger.info(f"  耗时: {duration:.2f} 秒")
        if self.summary.errors:
            logger.warning(f"  错误数: {len(self.summary.errors)}")
        logger.info("=" * 60)

    @staticmethod
    def _format_size(size_bytes: int) -> str:
        if size_bytes < 1024:
            return f"{size_bytes} B"
        elif size_bytes < 1024 * 1024:
            return f"{size_bytes / 1024:.2f} KB"
        elif size_bytes < 1024 * 1024 * 1024:
            return f"{size_bytes / (1024 * 1024):.2f} MB"
        else:
            return f"{size_bytes / (1024 * 1024 * 1024):.2f} GB"
