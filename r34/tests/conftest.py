import os
import sys
import tempfile
import shutil
from pathlib import Path
from datetime import datetime
import uuid

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

from doc_auto_processor.models import (
    DocumentInfo,
    DocumentMetadata,
    ProcessingStatus,
    FileType,
    BatchInfo,
    BatchStatus,
    DuplicateStrategy,
)
from doc_auto_processor.indexer import DatabaseManager


@pytest.fixture
def temp_dir():
    tmp = tempfile.mkdtemp(prefix="doc_test_")
    yield Path(tmp)
    shutil.rmtree(tmp, ignore_errors=True)


@pytest.fixture
def sample_doc(temp_dir):
    source_path = temp_dir / "PRJ-1234_20240101_report.pdf"
    source_path.write_bytes(b"%PDF-1.4 test content")
    metadata = DocumentMetadata(
        title="Test Report",
        author="Test Author",
        created_date=datetime(2024, 1, 1),
        file_type=FileType.PDF,
        file_size=1024,
        project_code="1234",
        sha256_hash="abc123def456",
    )
    return DocumentInfo(
        id=None,
        batch_id=None,
        source_path=source_path,
        target_path=None,
        metadata=metadata,
        status=ProcessingStatus.PENDING,
    )


@pytest.fixture
def temp_db(temp_dir):
    db_path = temp_dir / "test_index.db"
    os.environ["DOC_PROCESSOR_DB_PATH"] = str(db_path)
    db = DatabaseManager(db_path=str(db_path))
    db.init_db()
    yield db
    db.close()
    if "DOC_PROCESSOR_DB_PATH" in os.environ:
        del os.environ["DOC_PROCESSOR_DB_PATH"]


@pytest.fixture
def sample_batch(temp_db):
    batch_id = DatabaseManager.generate_batch_id()
    batch = BatchInfo(
        batch_id=batch_id,
        status=BatchStatus.RUNNING,
        source_dir="./test_docs",
        target_dir="./test_archive",
        start_time=datetime.now(),
    )
    temp_db.create_batch(batch)
    return batch


@pytest.fixture
def duplicate_files(temp_dir):
    content = b"duplicate test content 12345"
    file1 = temp_dir / "file_a.pdf"
    file2 = temp_dir / "file_b.pdf"
    file3 = temp_dir / "file_c.txt"
    file1.write_bytes(content)
    file2.write_bytes(content)
    file3.write_bytes(b"different content")
    return [file1, file2, file3]


@pytest.fixture
def mock_ocr_available(monkeypatch):
    monkeypatch.setattr("doc_auto_processor.ocr.pytesseract_available", True)
    monkeypatch.setattr("doc_auto_processor.ocr.pdf2image_available", True)


@pytest.fixture
def mock_ocr_unavailable(monkeypatch):
    monkeypatch.setattr("doc_auto_processor.ocr.pytesseract_available", False)
    monkeypatch.setattr("doc_auto_processor.ocr.pdf2image_available", False)
