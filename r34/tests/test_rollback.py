import pytest
import hashlib
from pathlib import Path
from datetime import datetime

from doc_auto_processor.models import (
    DocumentInfo,
    DocumentMetadata,
    ProcessingStatus,
    FileType,
    BatchInfo,
    BatchStatus,
)
from doc_auto_processor.rollback import RollbackManager
from doc_auto_processor.manifest import ManifestGenerator, ManifestEntry
from doc_auto_processor.indexer import DatabaseManager


class TestRollbackManager:
    def test_check_conflict_same_content(self, temp_db, sample_batch, temp_dir):
        source = temp_dir / "original.pdf"
        content = b"test content"
        source.write_bytes(content)
        file_hash = hashlib.sha256(content).hexdigest()

        metadata = DocumentMetadata(
            file_type=FileType.PDF,
            file_size=len(content),
            created_date=datetime.now(),
            sha256_hash=file_hash,
        )
        doc = DocumentInfo(
            batch_id=sample_batch.batch_id,
            source_path=source,
            target_path=temp_dir / "archive" / "moved.pdf",
            metadata=metadata,
            status=ProcessingStatus.ARCHIVED,
        )
        doc.id = temp_db.add_document(doc)

        source.write_bytes(content)

        rollback = RollbackManager(dry_run=True)
        conflict = rollback._check_conflict(doc, source)

        assert conflict is not None
        assert conflict["type"] == "same_content"

    def test_check_conflict_different_content(
        self, temp_db, sample_batch, temp_dir
    ):
        source = temp_dir / "original.pdf"
        original_content = b"test content"
        source.write_bytes(original_content)
        file_hash = hashlib.sha256(original_content).hexdigest()

        metadata = DocumentMetadata(
            file_type=FileType.PDF,
            file_size=len(original_content),
            created_date=datetime.now(),
            sha256_hash=file_hash,
        )
        doc = DocumentInfo(
            batch_id=sample_batch.batch_id,
            source_path=source,
            target_path=temp_dir / "archive" / "moved.pdf",
            metadata=metadata,
            status=ProcessingStatus.ARCHIVED,
        )
        doc.id = temp_db.add_document(doc)

        source.write_bytes(b"modified content")

        rollback = RollbackManager(dry_run=True)
        conflict = rollback._check_conflict(doc, source)

        assert conflict is not None
        assert conflict["type"] == "different_content"

    def test_check_conflict_no_conflict(self, temp_db, sample_batch, temp_dir):
        source = temp_dir / "original.pdf"
        metadata = DocumentMetadata(
            file_type=FileType.PDF,
            file_size=100,
            created_date=datetime.now(),
            sha256_hash="abc123",
        )
        doc = DocumentInfo(
            batch_id=sample_batch.batch_id,
            source_path=source,
            target_path=temp_dir / "archive" / "moved.pdf",
            metadata=metadata,
            status=ProcessingStatus.ARCHIVED,
        )
        doc.id = temp_db.add_document(doc)

        rollback = RollbackManager(dry_run=True)
        conflict = rollback._check_conflict(doc, source)

        assert conflict is None

    def test_rollback_dry_run(self, temp_db, sample_batch, temp_dir):
        source = temp_dir / "docs"
        archive = temp_dir / "archive"
        source.mkdir()
        archive.mkdir()

        original = source / "test.pdf"
        content = b"pdf content"
        original.write_bytes(content)
        file_hash = hashlib.sha256(content).hexdigest()

        archived = archive / "test.pdf"
        archived.write_bytes(content)
        original.unlink()

        metadata = DocumentMetadata(
            file_type=FileType.PDF,
            file_size=len(content),
            created_date=datetime.now(),
            sha256_hash=file_hash,
        )
        doc = DocumentInfo(
            batch_id=sample_batch.batch_id,
            source_path=original,
            target_path=archived,
            metadata=metadata,
            status=ProcessingStatus.ARCHIVED,
        )
        doc.id = temp_db.add_document(doc)

        rollback = RollbackManager(dry_run=True)
        result = rollback.rollback(sample_batch.batch_id, max_retries=1)

        assert result.batch_id == sample_batch.batch_id
        assert result.total_files == 1
        assert result.restored == 1
        assert result.skipped == 0
        assert archived.exists()
        assert not original.exists()

    def test_rollback_actual_restore(self, temp_db, sample_batch, temp_dir):
        source = temp_dir / "docs"
        archive = temp_dir / "archive"
        source.mkdir()
        archive.mkdir()

        original = source / "test.pdf"
        content = b"pdf content"
        original.write_bytes(content)
        file_hash = hashlib.sha256(content).hexdigest()

        archived = archive / "test.pdf"
        archived.write_bytes(content)
        original.unlink()

        metadata = DocumentMetadata(
            file_type=FileType.PDF,
            file_size=len(content),
            created_date=datetime.now(),
            sha256_hash=file_hash,
        )
        doc = DocumentInfo(
            batch_id=sample_batch.batch_id,
            source_path=original,
            target_path=archived,
            metadata=metadata,
            status=ProcessingStatus.ARCHIVED,
        )
        doc.id = temp_db.add_document(doc)

        rollback = RollbackManager(dry_run=False)
        result = rollback.rollback(sample_batch.batch_id, max_retries=1)

        assert result.restored == 1
        assert original.exists()
        assert not archived.exists()

        batch = temp_db.get_batch(sample_batch.batch_id)
        assert batch.status == BatchStatus.ROLLED_BACK

    def test_rollback_with_conflicts(self, temp_db, sample_batch, temp_dir):
        source = temp_dir / "docs"
        archive = temp_dir / "archive"
        source.mkdir()
        archive.mkdir()

        original = source / "test.pdf"
        content = b"original content"
        original.write_bytes(content)
        file_hash = hashlib.sha256(content).hexdigest()

        archived = archive / "test.pdf"
        archived.write_bytes(content)
        original.unlink()

        original.write_bytes(b"new different content")

        metadata = DocumentMetadata(
            file_type=FileType.PDF,
            file_size=len(content),
            created_date=datetime.now(),
            sha256_hash=file_hash,
        )
        doc = DocumentInfo(
            batch_id=sample_batch.batch_id,
            source_path=original,
            target_path=archived,
            metadata=metadata,
            status=ProcessingStatus.ARCHIVED,
        )
        doc.id = temp_db.add_document(doc)

        rollback = RollbackManager(dry_run=False)
        result = rollback.rollback(sample_batch.batch_id, max_retries=1)

        assert len(result.conflicts) == 1
        assert result.conflicts[0]["type"] == "different_content"
        assert result.skipped == 1
        assert archived.exists()

    def test_cleanup_empty_dirs(self, temp_dir):
        nested = temp_dir / "a" / "b" / "c"
        nested.mkdir(parents=True)

        rollback = RollbackManager(dry_run=False)
        rollback._cleanup_empty_dirs(temp_dir / "a")

        assert not (temp_dir / "a").exists()

    def test_generate_rollback_report(self, temp_db, sample_batch, temp_dir):
        rollback = RollbackManager(dry_run=False)
        result = rollback._generate_rollback_report(
            batch_id=sample_batch.batch_id,
            restored=[],
            skipped=[],
            conflicts=[
                {
                    "type": "different_content",
                    "source": "/a.pdf",
                    "target": "/b.pdf",
                    "message": "Conflict",
                }
            ],
            errors=[],
            report_dir=temp_dir,
        )

        assert result is not None
        assert result.exists()
        assert "rollback_report" in result.name
