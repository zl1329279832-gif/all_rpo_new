import pytest
from datetime import datetime
from pathlib import Path

from doc_auto_processor.models import (
    DocumentInfo,
    DocumentMetadata,
    ProcessingStatus,
    FileType,
    BatchInfo,
    BatchStatus,
    DuplicateStrategy,
    OCRStatus,
    ProcessingSummary,
)


class TestEnums:
    def test_duplicate_strategy_values(self):
        assert DuplicateStrategy.SKIP == "skip"
        assert DuplicateStrategy.KEEP_COPY == "keep_copy"
        assert DuplicateStrategy.MOVE_TO_DUPLICATE_AREA == "move_to_duplicate_area"

    def test_batch_status_values(self):
        assert BatchStatus.PENDING == "pending"
        assert BatchStatus.RUNNING == "running"
        assert BatchStatus.COMPLETED == "completed"
        assert BatchStatus.PARTIAL == "partial"
        assert BatchStatus.FAILED == "failed"
        assert BatchStatus.INTERRUPTED == "interrupted"
        assert BatchStatus.ROLLED_BACK == "rolled_back"

    def test_ocr_status_values(self):
        assert OCRStatus.NOT_APPLICABLE == "not_applicable"
        assert OCRStatus.PENDING == "pending"
        assert OCRStatus.SUCCESS == "success"
        assert OCRStatus.FAILED == "failed"
        assert OCRStatus.DISABLED == "disabled"


class TestDocumentMetadata:
    def test_metadata_with_ocr_fields(self):
        metadata = DocumentMetadata(
            title="Test",
            file_type=FileType.PDF,
            file_size=1024,
            created_date=datetime.now(),
            sha256_hash="abc123",
            ocr_text="Extracted text",
            contract_code="HT-2024-001",
            ocr_status=OCRStatus.SUCCESS,
        )
        assert metadata.sha256_hash == "abc123"
        assert metadata.ocr_text == "Extracted text"
        assert metadata.contract_code == "HT-2024-001"
        assert metadata.ocr_status == OCRStatus.SUCCESS

    def test_metadata_defaults(self):
        metadata = DocumentMetadata(
            file_type=FileType.PDF,
            file_size=1024,
            created_date=datetime.now(),
        )
        assert metadata.sha256_hash is None
        assert metadata.ocr_text is None
        assert metadata.contract_code is None
        assert metadata.ocr_status == OCRStatus.NOT_APPLICABLE


class TestDocumentInfo:
    def test_document_info_with_new_fields(self, temp_dir):
        source = temp_dir / "test.pdf"
        source.write_bytes(b"test")
        metadata = DocumentMetadata(
            file_type=FileType.PDF,
            file_size=4,
            created_date=datetime.now(),
            sha256_hash="hash123",
        )
        doc = DocumentInfo(
            id=1,
            batch_id="BATCH_20240101_000000_ABC12345",
            source_path=source,
            target_path=temp_dir / "archive" / "test.pdf",
            metadata=metadata,
            status=ProcessingStatus.ARCHIVED,
            duplicate_of="hash456",
            manifest_entry={"op": "move", "from": "a", "to": "b"},
        )
        assert doc.id == 1
        assert doc.batch_id == "BATCH_20240101_000000_ABC12345"
        assert doc.duplicate_of == "hash456"
        assert doc.manifest_entry is not None
        assert doc.metadata.sha256_hash == "hash123"


class TestBatchInfo:
    def test_batch_info_creation(self):
        batch = BatchInfo(
            batch_id="BATCH_20240101_000000_ABC12345",
            status=BatchStatus.RUNNING,
            source_dir="./docs",
            target_dir="./archive",
            start_time=datetime(2024, 1, 1, 0, 0, 0),
        )
        assert batch.batch_id == "BATCH_20240101_000000_ABC12345"
        assert batch.status == BatchStatus.RUNNING
        assert batch.source_dir == "./docs"
        assert batch.end_time is None
        assert batch.total_files == 0

    def test_batch_info_completion(self):
        batch = BatchInfo(
            batch_id="BATCH_20240101_000000_ABC12345",
            status=BatchStatus.RUNNING,
            source_dir="./docs",
            target_dir="./archive",
            start_time=datetime(2024, 1, 1, 0, 0, 0),
        )
        batch.status = BatchStatus.COMPLETED
        batch.end_time = datetime(2024, 1, 1, 0, 5, 0)
        batch.total_files = 10
        batch.success_count = 9
        batch.failed_count = 1
        assert batch.end_time is not None
        assert batch.duration == 300.0


class TestProcessingSummary:
    def test_summary_with_new_fields(self):
        summary = ProcessingSummary(
            batch_id="BATCH_20240101_000000_ABC12345",
            total=100,
            success=95,
            failed=3,
            skipped=2,
            deduplicated=10,
            ocr_success=5,
            ocr_failed=1,
            duplicate_area_path=Path("./_duplicates"),
            manifest_path=Path("./manifests/BATCH_XXX.json"),
        )
        assert summary.batch_id == "BATCH_20240101_000000_ABC12345"
        assert summary.deduplicated == 10
        assert summary.ocr_success == 5
        assert summary.ocr_failed == 1
        assert summary.duplicate_area_path is not None
        assert summary.manifest_path is not None
