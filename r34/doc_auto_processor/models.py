from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, List


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
    mime_type: Optional[str] = None
    extra: Dict[str, str] = field(default_factory=dict)


@dataclass
class DocumentInfo:
    source_path: Path
    metadata: DocumentMetadata = field(default_factory=DocumentMetadata)
    target_name: Optional[str] = None
    target_path: Optional[Path] = None
    archive_path: Optional[Path] = None
    status: ProcessingStatus = ProcessingStatus.PENDING
    error_message: Optional[str] = None
    retry_count: int = 0
    warnings: List[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)
    processed_at: Optional[datetime] = None


@dataclass
class ProcessingSummary:
    total_files: int = 0
    scanned: int = 0
    renamed: int = 0
    archived: int = 0
    skipped: int = 0
    failed: int = 0
    total_size: int = 0
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
