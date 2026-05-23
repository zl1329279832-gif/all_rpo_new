import hashlib
import shutil
from pathlib import Path
from typing import Optional, Dict, Set, Tuple
from datetime import datetime

from .logger import get_logger
from .models import (
    DocumentInfo, ProcessingStatus, DuplicateStrategy,
    ProcessingSummary,
)
from .indexer import DatabaseManager
from .rules import retry_operation

logger = get_logger()


class HashCalculator:
    _CHUNK_SIZE = 64 * 1024 * 1024

    @staticmethod
    def calculate_sha256(
        file_path: Path,
        max_retries: int = 3,
        dry_run: bool = False,
    ) -> Optional[str]:
        if dry_run:
            logger.debug(f"[DRY-RUN] 跳过哈希计算: {file_path}")
            return None

        if not file_path.exists():
            logger.warning(f"文件不存在，跳过哈希计算: {file_path}")
            return None

        try:
            def _do_calculate() -> str:
                sha256 = hashlib.sha256()
                with open(file_path, "rb") as f:
                    while True:
                        chunk = f.read(HashCalculator._CHUNK_SIZE)
                        if not chunk:
                            break
                        sha256.update(chunk)
                return sha256.hexdigest()

            return retry_operation(_do_calculate, max_retries=max_retries)

        except Exception as e:
            logger.warning(f"计算 SHA-256 哈希失败 {file_path}: {e}")
            return None

    @staticmethod
    def calculate_sha256_fast(
        file_path: Path,
        dry_run: bool = False,
    ) -> Optional[str]:
        if dry_run:
            return None

        try:
            file_size = file_path.stat().st_size
            sample_size = min(file_size, 1 * 1024 * 1024)

            sha256 = hashlib.sha256()
            sha256.update(str(file_size).encode("utf-8"))

            with open(file_path, "rb") as f:
                sha256.update(f.read(sample_size))
                if file_size > sample_size * 2:
                    f.seek(-sample_size, 2)
                    sha256.update(f.read(sample_size))

            return sha256.hexdigest()
        except Exception as e:
            logger.warning(f"快速哈希计算失败 {file_path}: {e}")
            return None


class DuplicateDetector:
    def __init__(
        self,
        strategy: DuplicateStrategy = DuplicateStrategy.SKIP,
        duplicate_area: Optional[Path] = None,
        use_fast_hash: bool = False,
        dry_run: bool = False,
    ) -> None:
        self.strategy = strategy
        self.duplicate_area = Path(duplicate_area) if duplicate_area else Path.cwd() / "_duplicates"
        self.use_fast_hash = use_fast_hash
        self.dry_run = dry_run
        self._hash_cache: Dict[str, str] = {}
        self._seen_hashes: Set[str] = set()
        self._db = DatabaseManager()

    def calculate_hash(
        self,
        doc_info: DocumentInfo,
        max_retries: int = 3,
    ) -> Optional[str]:
        file_path = str(doc_info.source_path)

        if file_path in self._hash_cache:
            return self._hash_cache[file_path]

        if self.use_fast_hash:
            file_hash = HashCalculator.calculate_sha256_fast(
                doc_info.source_path,
                dry_run=self.dry_run,
            )
        else:
            file_hash = HashCalculator.calculate_sha256(
                doc_info.source_path,
                max_retries=max_retries,
                dry_run=self.dry_run,
            )

        if file_hash:
            self._hash_cache[file_path] = file_hash
            doc_info.metadata.sha256_hash = file_hash

        return file_hash

    def check_duplicate(
        self,
        doc_info: DocumentInfo,
        max_retries: int = 3,
    ) -> Tuple[bool, Optional[str]]:
        file_hash = self.calculate_hash(doc_info, max_retries=max_retries)

        if not file_hash:
            return False, None

        if file_hash in self._seen_hashes:
            doc_info.duplicate_of = file_hash
            logger.debug(f"本次批处理内检测到重复文件: {doc_info.source_path}")
            return True, file_hash

        existing_doc = self._db.find_document_by_hash(file_hash)
        if existing_doc:
            doc_info.duplicate_of = file_hash
            logger.debug(f"历史库中检测到重复文件: {doc_info.source_path} -> {existing_doc.source_path}")
            return True, file_hash

        self._seen_hashes.add(file_hash)
        return False, None

    def handle_duplicate(
        self,
        doc_info: DocumentInfo,
        duplicate_hash: str,
        summary: ProcessingSummary,
        max_retries: int = 3,
    ) -> bool:
        summary.deduplicated += 1

        if self.strategy == DuplicateStrategy.SKIP:
            doc_info.status = ProcessingStatus.DEDUPLICATED
            doc_info.error_message = f"重复文件，已跳过 (SHA-256: {duplicate_hash[:16]}...)"
            summary.skipped += 1
            logger.info(f"[去重] 跳过重复文件: {doc_info.source_path.name}")
            return True

        elif self.strategy == DuplicateStrategy.KEEP_COPY:
            if doc_info.target_name:
                base = Path(doc_info.target_name).stem
                suffix = Path(doc_info.target_name).suffix
                doc_info.target_name = f"{base}_copy{suffix}"
                if doc_info.target_path:
                    doc_info.target_path = doc_info.target_path.with_name(doc_info.target_name)

            doc_info.warnings.append(f"重复文件，已保留副本 (SHA-256: {duplicate_hash[:16]}...)")
            logger.info(f"[去重] 保留副本: {doc_info.target_name}")
            return False

        elif self.strategy == DuplicateStrategy.MOVE_TO_DUPLICATE_AREA:
            return self._move_to_duplicate_area(
                doc_info, duplicate_hash, summary, max_retries
            )

        return False

    def _move_to_duplicate_area(
        self,
        doc_info: DocumentInfo,
        duplicate_hash: str,
        summary: ProcessingSummary,
        max_retries: int,
    ) -> bool:
        try:
            if not self.dry_run:
                def _create_dir():
                    self.duplicate_area.mkdir(parents=True, exist_ok=True)
                    return True
                retry_operation(_create_dir, max_retries=max_retries)

            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            hash_prefix = duplicate_hash[:8]
            new_name = f"{timestamp}_{hash_prefix}_{doc_info.source_path.name}"
            target_path = self.duplicate_area / new_name

            if self.dry_run:
                logger.info(f"[DRY-RUN] 将移动重复文件: {doc_info.source_path} -> {target_path}")
                doc_info.status = ProcessingStatus.DEDUPLICATED
                doc_info.target_path = target_path
                doc_info.error_message = f"重复文件，已移至重复区 (SHA-256: {duplicate_hash[:16]}...)"
                summary.skipped += 1
                return True

            def _do_move():
                shutil.copy2(str(doc_info.source_path), str(target_path))
                return True

            retry_operation(_do_move, max_retries=max_retries)

            doc_info.status = ProcessingStatus.DEDUPLICATED
            doc_info.target_path = target_path
            doc_info.error_message = f"重复文件，已移至重复区 (SHA-256: {duplicate_hash[:16]}...)"
            summary.deduplicated += 1
            summary.duplicate_area_path = self.duplicate_area
            logger.info(f"[去重] 已移至重复区: {target_path}")
            return True

        except Exception as e:
            doc_info.status = ProcessingStatus.FAILED
            doc_info.error_message = f"移动重复文件失败: {str(e)}"
            summary.failed += 1
            summary.errors.append(f"{doc_info.source_path}: {doc_info.error_message}")
            logger.error(f"移动重复文件失败 {doc_info.source_path}: {e}")
            return True
