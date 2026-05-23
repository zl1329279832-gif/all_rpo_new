__version__ = "2.0.0"
__author__ = "Doc Auto Processor Team"
__description__ = "企业文档治理自动化工具"

from .models import (
    DocumentInfo,
    DocumentMetadata,
    ProcessingStatus,
    ProcessingSummary,
    FileType,
    ConflictStrategy,
    ArchiveStrategy,
    BatchInfo,
    BatchStatus,
    DuplicateStrategy,
    OCRStatus,
)
from .logger import get_logger, LoggerManager
from .scanner import FileScanner as DocumentScanner
from .rules import RulesLoader, MetadataExtractor, retry_operation, ProcessingRules
from .executor import DocumentExecutor, FileOperationHelper
from .reporter import ReportGenerator
from .indexer import DatabaseManager
from .deduplicator import HashCalculator, DuplicateDetector
from .ocr import OCREngine, OCRConfig, OCRResult
from .manifest import ManifestGenerator, Manifest, ManifestEntry
from .history import HistoryManager
from .rollback import RollbackManager, RollbackResult

__all__ = [
    "DocumentInfo",
    "DocumentMetadata",
    "ProcessingStatus",
    "ProcessingSummary",
    "FileType",
    "ConflictStrategy",
    "ArchiveStrategy",
    "BatchInfo",
    "BatchStatus",
    "DuplicateStrategy",
    "OCRStatus",
    "ProcessingRules",
    "get_logger",
    "LoggerManager",
    "DocumentScanner",
    "RulesLoader",
    "MetadataExtractor",
    "retry_operation",
    "DocumentExecutor",
    "FileOperationHelper",
    "ReportGenerator",
    "DatabaseManager",
    "HashCalculator",
    "DuplicateDetector",
    "OCREngine",
    "OCRConfig",
    "OCRResult",
    "ManifestGenerator",
    "Manifest",
    "ManifestEntry",
    "HistoryManager",
    "RollbackManager",
    "RollbackResult",
]
