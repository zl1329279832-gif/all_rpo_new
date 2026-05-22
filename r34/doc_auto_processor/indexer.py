import sqlite3
import json
import uuid
from pathlib import Path
from datetime import datetime
from typing import Optional, List, Dict, Any, Iterator, Tuple
from contextlib import contextmanager

from .logger import get_logger
from .models import (
    DocumentInfo, DocumentMetadata, BatchInfo,
    ProcessingStatus, BatchStatus, FileType, OCRStatus,
)

logger = get_logger()


class DatabaseManager:
    _instance: Optional["DatabaseManager"] = None
    _initialized = False

    def __new__(cls, db_path: Optional[Path] = None) -> "DatabaseManager":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self, db_path: Optional[Path] = None) -> None:
        if self._initialized and db_path is None:
            return

        self._initialized = True
        if db_path is None:
            db_path = Path.cwd() / ".doc_processor" / "index.db"

        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_database()

    def _init_database(self) -> None:
        with self._get_connection() as conn:
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS batches (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    batch_id TEXT UNIQUE NOT NULL,
                    status TEXT NOT NULL DEFAULT 'pending',
                    source_dir TEXT,
                    target_dir TEXT,
                    config_file TEXT,
                    command_args TEXT,
                    start_time TEXT,
                    end_time TEXT,
                    total_files INTEGER DEFAULT 0,
                    success_count INTEGER DEFAULT 0,
                    failed_count INTEGER DEFAULT 0,
                    skipped_count INTEGER DEFAULT 0,
                    error_message TEXT,
                    manifest_path TEXT,
                    created_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS documents (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    batch_id TEXT NOT NULL,
                    source_path TEXT NOT NULL,
                    target_path TEXT,
                    target_name TEXT,
                    archive_path TEXT,
                    file_type TEXT NOT NULL,
                    file_size INTEGER DEFAULT 0,
                    sha256_hash TEXT,
                    title TEXT,
                    author TEXT,
                    project_code TEXT,
                    contract_code TEXT,
                    creation_date TEXT,
                    modification_date TEXT,
                    page_count INTEGER,
                    ocr_status TEXT DEFAULT 'not_applicable',
                    ocr_text TEXT,
                    duplicate_of TEXT,
                    status TEXT NOT NULL DEFAULT 'pending',
                    error_message TEXT,
                    retry_count INTEGER DEFAULT 0,
                    warnings TEXT,
                    manifest_entry TEXT,
                    processed_at TEXT,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (batch_id) REFERENCES batches(batch_id)
                );

                CREATE INDEX IF NOT EXISTS idx_documents_batch_id ON documents(batch_id);
                CREATE INDEX IF NOT EXISTS idx_documents_sha256 ON documents(sha256_hash);
                CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
                CREATE INDEX IF NOT EXISTS idx_documents_source ON documents(source_path);
                CREATE INDEX IF NOT EXISTS idx_batches_status ON batches(status);
                CREATE INDEX IF NOT EXISTS idx_batches_created ON batches(created_at);
            """)
            conn.commit()
            logger.debug(f"数据库初始化完成: {self.db_path}")

    @contextmanager
    def _get_connection(self) -> Iterator[sqlite3.Connection]:
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        try:
            yield conn
        finally:
            conn.close()

    @staticmethod
    def generate_batch_id() -> str:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        short_uuid = uuid.uuid4().hex[:8].upper()
        return f"BATCH_{timestamp}_{short_uuid}"

    def create_batch(
        self,
        source_dir: Optional[Path] = None,
        target_dir: Optional[Path] = None,
        config_file: Optional[Path] = None,
        command_args: Optional[str] = None,
    ) -> BatchInfo:
        batch_id = self.generate_batch_id()
        now = datetime.now().isoformat()

        with self._get_connection() as conn:
            conn.execute(
                """
                INSERT INTO batches (
                    batch_id, status, source_dir, target_dir, config_file,
                    command_args, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    batch_id,
                    BatchStatus.PENDING.value,
                    str(source_dir) if source_dir else None,
                    str(target_dir) if target_dir else None,
                    str(config_file) if config_file else None,
                    command_args,
                    now,
                ),
            )
            conn.commit()

        logger.info(f"创建批次: {batch_id}")
        return self.get_batch(batch_id)

    def update_batch(self, batch_info: BatchInfo) -> None:
        with self._get_connection() as conn:
            conn.execute(
                """
                UPDATE batches SET
                    status = ?, source_dir = ?, target_dir = ?, config_file = ?,
                    command_args = ?, start_time = ?, end_time = ?,
                    total_files = ?, success_count = ?, failed_count = ?,
                    skipped_count = ?, error_message = ?, manifest_path = ?
                WHERE batch_id = ?
                """,
                (
                    batch_info.status.value,
                    str(batch_info.source_dir) if batch_info.source_dir else None,
                    str(batch_info.target_dir) if batch_info.target_dir else None,
                    str(batch_info.config_file) if batch_info.config_file else None,
                    batch_info.command_args,
                    batch_info.start_time.isoformat() if batch_info.start_time else None,
                    batch_info.end_time.isoformat() if batch_info.end_time else None,
                    batch_info.total_files,
                    batch_info.success_count,
                    batch_info.failed_count,
                    batch_info.skipped_count,
                    batch_info.error_message,
                    str(batch_info.manifest_path) if batch_info.manifest_path else None,
                    batch_info.batch_id,
                ),
            )
            conn.commit()

    def get_batch(self, batch_id: str) -> Optional[BatchInfo]:
        with self._get_connection() as conn:
            row = conn.execute(
                "SELECT * FROM batches WHERE batch_id = ?",
                (batch_id,),
            ).fetchone()

            if not row:
                return None

            return self._row_to_batch(row)

    def list_batches(
        self,
        status: Optional[BatchStatus] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[BatchInfo]:
        query = "SELECT * FROM batches"
        params: List[Any] = []

        if status:
            query += " WHERE status = ?"
            params.append(status.value)

        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        with self._get_connection() as conn:
            rows = conn.execute(query, params).fetchall()
            return [self._row_to_batch(row) for row in rows]

    def _row_to_batch(self, row: sqlite3.Row) -> BatchInfo:
        return BatchInfo(
            batch_id=row["batch_id"],
            status=BatchStatus(row["status"]),
            source_dir=Path(row["source_dir"]) if row["source_dir"] else None,
            target_dir=Path(row["target_dir"]) if row["target_dir"] else None,
            config_file=Path(row["config_file"]) if row["config_file"] else None,
            command_args=row["command_args"],
            start_time=datetime.fromisoformat(row["start_time"]) if row["start_time"] else None,
            end_time=datetime.fromisoformat(row["end_time"]) if row["end_time"] else None,
            total_files=row["total_files"],
            success_count=row["success_count"],
            failed_count=row["failed_count"],
            skipped_count=row["skipped_count"],
            error_message=row["error_message"],
            manifest_path=Path(row["manifest_path"]) if row["manifest_path"] else None,
            created_at=datetime.fromisoformat(row["created_at"]),
        )

    def add_document(self, batch_id: str, doc_info: DocumentInfo) -> int:
        now = datetime.now().isoformat()
        warnings_json = json.dumps(doc_info.warnings, ensure_ascii=False) if doc_info.warnings else None
        manifest_entry_json = json.dumps(doc_info.manifest_entry, ensure_ascii=False) if doc_info.manifest_entry else None

        meta = doc_info.metadata
        creation_date = meta.creation_date.isoformat() if meta.creation_date else None
        modification_date = meta.modification_date.isoformat() if meta.modification_date else None
        processed_at = doc_info.processed_at.isoformat() if doc_info.processed_at else None

        with self._get_connection() as conn:
            cursor = conn.execute(
                """
                INSERT INTO documents (
                    batch_id, source_path, target_path, target_name, archive_path,
                    file_type, file_size, sha256_hash, title, author, project_code,
                    contract_code, creation_date, modification_date, page_count,
                    ocr_status, ocr_text, duplicate_of, status, error_message,
                    retry_count, warnings, manifest_entry, processed_at, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    batch_id,
                    str(doc_info.source_path),
                    str(doc_info.target_path) if doc_info.target_path else None,
                    doc_info.target_name,
                    str(doc_info.archive_path) if doc_info.archive_path else None,
                    meta.file_type.value,
                    meta.file_size,
                    meta.sha256_hash,
                    meta.title,
                    meta.author,
                    meta.project_code,
                    meta.contract_code,
                    creation_date,
                    modification_date,
                    meta.page_count,
                    meta.ocr_status.value,
                    meta.ocr_text,
                    doc_info.duplicate_of,
                    doc_info.status.value,
                    doc_info.error_message,
                    doc_info.retry_count,
                    warnings_json,
                    manifest_entry_json,
                    processed_at,
                    now,
                ),
            )
            conn.commit()
            doc_info.id = cursor.lastrowid
            doc_info.batch_id = batch_id
            return cursor.lastrowid

    def update_document(self, doc_info: DocumentInfo) -> None:
        if doc_info.id is None:
            raise ValueError("DocumentInfo 没有 id，无法更新")

        warnings_json = json.dumps(doc_info.warnings, ensure_ascii=False) if doc_info.warnings else None
        manifest_entry_json = json.dumps(doc_info.manifest_entry, ensure_ascii=False) if doc_info.manifest_entry else None

        meta = doc_info.metadata
        creation_date = meta.creation_date.isoformat() if meta.creation_date else None
        modification_date = meta.modification_date.isoformat() if meta.modification_date else None
        processed_at = doc_info.processed_at.isoformat() if doc_info.processed_at else None

        with self._get_connection() as conn:
            conn.execute(
                """
                UPDATE documents SET
                    target_path = ?, target_name = ?, archive_path = ?,
                    file_type = ?, file_size = ?, sha256_hash = ?, title = ?,
                    author = ?, project_code = ?, contract_code = ?, creation_date = ?,
                    modification_date = ?, page_count = ?, ocr_status = ?, ocr_text = ?,
                    duplicate_of = ?, status = ?, error_message = ?, retry_count = ?,
                    warnings = ?, manifest_entry = ?, processed_at = ?
                WHERE id = ?
                """,
                (
                    str(doc_info.target_path) if doc_info.target_path else None,
                    doc_info.target_name,
                    str(doc_info.archive_path) if doc_info.archive_path else None,
                    meta.file_type.value,
                    meta.file_size,
                    meta.sha256_hash,
                    meta.title,
                    meta.author,
                    meta.project_code,
                    meta.contract_code,
                    creation_date,
                    modification_date,
                    meta.page_count,
                    meta.ocr_status.value,
                    meta.ocr_text,
                    doc_info.duplicate_of,
                    doc_info.status.value,
                    doc_info.error_message,
                    doc_info.retry_count,
                    warnings_json,
                    manifest_entry_json,
                    processed_at,
                    doc_info.id,
                ),
            )
            conn.commit()

    def get_documents(
        self,
        batch_id: Optional[str] = None,
        status: Optional[ProcessingStatus] = None,
        limit: int = 1000,
    ) -> List[DocumentInfo]:
        query = "SELECT * FROM documents"
        params: List[Any] = []
        conditions = []

        if batch_id:
            conditions.append("batch_id = ?")
            params.append(batch_id)

        if status:
            conditions.append("status = ?")
            params.append(status.value)

        if conditions:
            query += " WHERE " + " AND ".join(conditions)

        query += " ORDER BY id LIMIT ?"
        params.append(limit)

        with self._get_connection() as conn:
            rows = conn.execute(query, params).fetchall()
            return [self._row_to_document(row) for row in rows]

    def get_failed_documents(self, batch_id: str) -> List[DocumentInfo]:
        return self.get_documents(
            batch_id=batch_id,
            status=ProcessingStatus.FAILED,
        )

    def find_document_by_hash(self, sha256_hash: str) -> Optional[DocumentInfo]:
        with self._get_connection() as conn:
            row = conn.execute(
                """
                SELECT * FROM documents
                WHERE sha256_hash = ? AND status IN (?, ?, ?)
                ORDER BY id DESC LIMIT 1
                """,
                (
                    sha256_hash,
                    ProcessingStatus.ARCHIVED.value,
                    ProcessingStatus.RENAMED.value,
                    ProcessingStatus.DEDUPLICATED.value,
                ),
            ).fetchone()

            if not row:
                return None
            return self._row_to_document(row)

    def _row_to_document(self, row: sqlite3.Row) -> DocumentInfo:
        meta = DocumentMetadata(
            file_type=FileType(row["file_type"]),
            title=row["title"],
            author=row["author"],
            creation_date=datetime.fromisoformat(row["creation_date"]) if row["creation_date"] else None,
            modification_date=datetime.fromisoformat(row["modification_date"]) if row["modification_date"] else None,
            file_size=row["file_size"] or 0,
            page_count=row["page_count"],
            project_code=row["project_code"],
            contract_code=row["contract_code"],
            sha256_hash=row["sha256_hash"],
            ocr_text=row["ocr_text"],
            ocr_status=OCRStatus(row["ocr_status"] or OCRStatus.NOT_APPLICABLE),
        )

        warnings = json.loads(row["warnings"]) if row["warnings"] else []
        manifest_entry = json.loads(row["manifest_entry"]) if row["manifest_entry"] else None

        return DocumentInfo(
            id=row["id"],
            source_path=Path(row["source_path"]),
            metadata=meta,
            target_name=row["target_name"],
            target_path=Path(row["target_path"]) if row["target_path"] else None,
            archive_path=Path(row["archive_path"]) if row["archive_path"] else None,
            duplicate_of=row["duplicate_of"],
            status=ProcessingStatus(row["status"]),
            error_message=row["error_message"],
            retry_count=row["retry_count"] or 0,
            warnings=warnings,
            batch_id=row["batch_id"],
            manifest_entry=manifest_entry,
            created_at=datetime.fromisoformat(row["created_at"]),
            processed_at=datetime.fromisoformat(row["processed_at"]) if row["processed_at"] else None,
        )

    def bulk_update_status(
        self,
        doc_ids: List[int],
        status: ProcessingStatus,
        error_message: Optional[str] = None,
    ) -> None:
        if not doc_ids:
            return

        with self._get_connection() as conn:
            placeholders = ",".join("?" * len(doc_ids))
            params = [status.value]
            if error_message:
                params.append(error_message)
            params.extend(doc_ids)

            if error_message:
                query = f"UPDATE documents SET status = ?, error_message = ? WHERE id IN ({placeholders})"
            else:
                query = f"UPDATE documents SET status = ? WHERE id IN ({placeholders})"

            conn.execute(query, params)
            conn.commit()

    def get_statistics(self, batch_id: Optional[str] = None) -> Dict[str, int]:
        query = "SELECT status, COUNT(*) as cnt FROM documents"
        params: List[Any] = []

        if batch_id:
            query += " WHERE batch_id = ?"
            params.append(batch_id)

        query += " GROUP BY status"

        with self._get_connection() as conn:
            rows = conn.execute(query, params).fetchall()
            stats = {row["status"]: row["cnt"] for row in rows}
            stats["total"] = sum(stats.values())
            return stats


def init_database(db_path: Optional[Path] = None) -> DatabaseManager:
    return DatabaseManager(db_path)


def create_batch(
    source_dir: Optional[Path] = None,
    target_dir: Optional[Path] = None,
    config_file: Optional[Path] = None,
    command_args: Optional[str] = None,
) -> BatchInfo:
    return DatabaseManager().create_batch(
        source_dir=source_dir,
        target_dir=target_dir,
        config_file=config_file,
        command_args=command_args,
    )
