from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, List, Tuple, Any


class FileType(str, Enum):
    PDF = "pdf"
    WORD = "word"
    EXCEL = "excel"
    IMAGE = "image"
    UNKNOWN = "unknown"


class ConflictStrategy(str, Enum):
    SKIP = "skip"
    RENAME = "rename"
    OVERWRITE = "overwrite"


class ArchiveStrategy(str, Enum):
    DATE = "date"
    PROJECT = "project"
    TYPE = "type"
    NONE = "none"


class ProcessingStatus(str, Enum):
    PENDING = "pending"
    SCANNED = "scanned"
    RENAMED = "renamed"
    ARCHIVED = "archived"
    SKIPPED = "skipped"
    FAILED = "failed"
    RETRYING = "retrying"
    DEDUPLICATED = "deduplicated"
    ROLLED_BACK = "rolled_back"


class DuplicateStrategy(str, Enum):
    SKIP = "skip"
    KEEP_COPY = "keep_copy"
    MOVE_TO_DUPLICATE_AREA = "move_to_duplicate_area"


class BatchStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    PARTIAL = "partial"
    FAILED = "failed"
    INTERRUPTED = "interrupted"
    ROLLED_BACK = "rolled_back"


class OCRStatus(str, Enum):
    NOT_APPLICABLE = "not_applicable"
    PENDING = "pending"
    PROCESSING = "processing"
    SUCCESS = "success"
    FAILED = "failed"
    SKIPPED = "skipped"
    DISABLED = "disabled"


@dataclass
class DocumentMetadata:
    file_type: FileType = FileType.UNKNOWN
    title: Optional[str] = None
    author: Optional[str] = None
    creation_date: Optional[datetime] = None
    modification_date: Optional[datetime] = None
    file_size: int = 0
    page_count: Optional[int] = None
    project_code: Optional[str] = None
    contract_code: Optional[str] = None
    mime_type: Optional[str] = None
    sha256_hash: Optional[str] = None
    ocr_text: Optional[str] = None
    ocr_status: OCRStatus = OCRStatus.NOT_APPLICABLE
    extra: Dict[str, str] = field(default_factory=dict)


@dataclass
class DocumentInfo:
    source_path: Path
    metadata: DocumentMetadata = field(default_factory=DocumentMetadata)
    id: Optional[int] = None
    target_name: Optional[str] = None
    target_path: Optional[Path] = None
    archive_path: Optional[Path] = None
    duplicate_of: Optional[str] = None
    status: ProcessingStatus = ProcessingStatus.PENDING
    error_message: Optional[str] = None
    retry_count: int = 0
    warnings: List[str] = field(default_factory=list)
    batch_id: Optional[str] = None
    manifest_entry: Optional[Dict[str, Any]] = None
    created_at: datetime = field(default_factory=datetime.now)
    processed_at: Optional[datetime] = None


@dataclass
class BatchInfo:
    batch_id: str
    status: BatchStatus = BatchStatus.PENDING
    source_dir: Optional[Path] = None
    target_dir: Optional[Path] = None
    config_file: Optional[Path] = None
    command_args: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    total_files: int = 0
    success_count: int = 0
    failed_count: int = 0
    skipped_count: int = 0
    error_message: Optional[str] = None
    manifest_path: Optional[Path] = None
    created_at: datetime = field(default_factory=datetime.now)


@dataclass
class ProcessingSummary:
    batch_id: Optional[str] = None
    total_files: int = 0
    scanned: int = 0
    renamed: int = 0
    archived: int = 0
    skipped: int = 0
    failed: int = 0
    deduplicated: int = 0
    ocr_success: int = 0
    ocr_failed: int = 0
    total_size: int = 0
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    duplicate_area_path: Optional[Path] = None
    manifest_path: Optional[Path] = None
