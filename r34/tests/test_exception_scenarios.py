import pytest
import os
import stat
import hashlib
from pathlib import Path
from datetime import datetime
from unittest.mock import patch, MagicMock

from doc_auto_processor.models import (
    DocumentInfo,
    DocumentMetadata,
    ProcessingStatus,
    FileType,
    BatchInfo,
    BatchStatus,
    DuplicateStrategy,
)
from doc_auto_processor.deduplicator import HashCalculator, DuplicateDetector
from doc_auto_processor.rollback import RollbackManager
from doc_auto_processor.manifest import ManifestGenerator
from doc_auto_processor.executor import DocumentExecutor
from doc_auto_processor.rules import ProcessingRules


class TestHashExceptionScenarios:
    def test_hash_file_in_use(self, temp_dir):
        test_file = temp_dir / "locked.pdf"
        test_file.write_bytes(b"test content")

        with patch(
            "doc_auto_processor.deduplicator.open",
            side_effect=PermissionError("File is locked"),
        ):
            with pytest.raises(PermissionError):
                HashCalculator.calculate_sha256(test_file)

    def test_hash_corrupted_file(self, temp_dir):
        test_file = temp_dir / "corrupted.pdf"
        test_file.write_bytes(b"%PDF-1.4 corrupted")

        with patch(
            "doc_auto_processor.deduplicator.Path.read_bytes",
            side_effect=IOError("Disk read error"),
        ):
            with pytest.raises(IOError):
                HashCalculator.calculate_sha256(test_file)

    def test_hash_file_deleted_during_processing(self, temp_dir):
        test_file = temp_dir / "deleted.pdf"
        test_file.write_bytes(b"test")

        original_exists = Path.exists

        def mock_exists(path):
            if path == test_file:
                return False
            return original_exists(path)

        with patch.object(Path, "exists", mock_exists):
            with pytest.raises(FileNotFoundError):
                HashCalculator.calculate_sha256(test_file)

    def test_hash_with_retry_success(self, temp_dir):
        test_file = temp_dir / "retry.pdf"
        test_file.write_bytes(b"content")

        call_count = [0]
        original_read = test_file.read_bytes

        def mock_read_bytes():
            call_count[0] += 1
            if call_count[0] < 3:
                raise IOError("Temporary error")
            return original_read()

        with patch.object(Path, "read_bytes", mock_read_bytes):
            result = HashCalculator.calculate_sha256(test_file, max_retries=3)
            assert result is not None
            assert call_count[0] == 3

    def test_hash_with_retry_exhausted(self, temp_dir):
        test_file = temp_dir / "fail_retry.pdf"
        test_file.write_bytes(b"content")

        with patch.object(
            Path, "read_bytes", side_effect=IOError("Persistent error")
        ):
            with pytest.raises(IOError):
                HashCalculator.calculate_sha256(test_file, max_retries=2)


class TestRollbackExceptionScenarios:
    def test_rollback_batch_not_found(self, temp_db):
        rollback = RollbackManager(dry_run=False)
        with pytest.raises(ValueError, match="Batch not found"):
            rollback.rollback("NONEXISTENT_BATCH")

    def test_rollback_already_rolled_back(self, temp_db):
        batch_id = "BATCH_20240101_000000_TEST1234"
        batch = BatchInfo(
            batch_id=batch_id,
            status=BatchStatus.ROLLED_BACK,
            source_dir="./docs",
            target_dir="./archive",
            start_time=datetime.now(),
        )
        temp_db.create_batch(batch)

        rollback = RollbackManager(dry_run=False)
        with pytest.raises(ValueError, match="already rolled back"):
            rollback.rollback(batch_id)

    def test_rollback_permission_denied(self, temp_db, sample_batch, temp_dir):
        source = temp_dir / "docs"
        archive = temp_dir / "archive"
        source.mkdir()
        archive.mkdir()

        content = b"test content"
        file_hash = hashlib.sha256(content).hexdigest()
        archived = archive / "test.pdf"
        archived.write_bytes(content)

        metadata = DocumentMetadata(
            file_type=FileType.PDF,
            file_size=len(content),
            created_date=datetime.now(),
            sha256_hash=file_hash,
        )
        doc = DocumentInfo(
            batch_id=sample_batch.batch_id,
            source_path=source / "test.pdf",
            target_path=archived,
            metadata=metadata,
            status=ProcessingStatus.ARCHIVED,
        )
        doc.id = temp_db.add_document(doc)

        with patch(
            "doc_auto_processor.rollback.shutil.move",
            side_effect=PermissionError("Permission denied"),
        ):
            rollback = RollbackManager(dry_run=False)
            result = rollback.rollback(sample_batch.batch_id, max_retries=1)
            assert len(result.errors) == 1
            assert "Permission denied" in result.errors[0]

    def test_rollback_target_file_missing(self, temp_db, sample_batch, temp_dir):
        source = temp_dir / "docs"
        archive = temp_dir / "archive"
        source.mkdir()
        archive.mkdir()

        content = b"test"
        file_hash = hashlib.sha256(content).hexdigest()
        archived = archive / "test.pdf"

        metadata = DocumentMetadata(
            file_type=FileType.PDF,
            file_size=len(content),
            created_date=datetime.now(),
            sha256_hash=file_hash,
        )
        doc = DocumentInfo(
            batch_id=sample_batch.batch_id,
            source_path=source / "test.pdf",
            target_path=archived,
            metadata=metadata,
            status=ProcessingStatus.ARCHIVED,
        )
        doc.id = temp_db.add_document(doc)

        rollback = RollbackManager(dry_run=False)
        result = rollback.rollback(sample_batch.batch_id, max_retries=1)
        assert result.skipped == 1
        assert any("does not exist" in e for e in result.errors)


class TestManifestExceptionScenarios:
    def test_load_corrupted_manifest(self, temp_dir):
        manifest_file = temp_dir / "corrupted.json"
        manifest_file.write_text("{invalid json: ,,,")

        generator = ManifestGenerator()
        with pytest.raises(ValueError, match="Invalid manifest format"):
            generator.load(manifest_file)

    def test_load_manifest_missing_fields(self, temp_dir):
        manifest_file = temp_dir / "incomplete.json"
        manifest_file.write_text('{"batch_id": "TEST", "entries": []}')

        generator = ManifestGenerator()
        with pytest.raises(ValueError, match="Missing required fields"):
            generator.load(manifest_file)

    def test_verify_nonexistent_manifest(self, temp_dir):
        generator = ManifestGenerator()
        with pytest.raises(FileNotFoundError):
            generator.verify(temp_dir / "nonexistent.json")


class TestDuplicateDetectorExceptionScenarios:
    def test_detect_duplicate_file_deleted(self, temp_db, sample_batch, temp_dir):
        test_file = temp_dir / "test.pdf"
        test_file.write_bytes(b"content")

        metadata = DocumentMetadata(
            file_type=FileType.PDF,
            file_size=7,
            created_date=datetime.now(),
        )
        doc = DocumentInfo(
            source_path=test_file,
            metadata=metadata,
            status=ProcessingStatus.PENDING,
            batch_id=sample_batch.batch_id,
        )

        detector = DuplicateDetector(
            db=temp_db,
            strategy=DuplicateStrategy.SKIP,
            batch_id=sample_batch.batch_id,
        )

        test_file.unlink()
        is_dup, file_hash = detector.check_duplicate(doc, max_retries=1)
        assert is_dup is False
        assert file_hash is None
        assert doc.status == ProcessingStatus.FAILED


class TestDatabaseExceptionScenarios:
    def test_database_locked(self, temp_db, sample_batch):
        with patch(
            "doc_auto_processor.indexer.sqlite3.Connection.execute",
            side_effect=Exception("database is locked"),
        ):
            with pytest.raises(Exception, match="database is locked"):
                temp_db.get_batch(sample_batch.batch_id)


class TestConfigValidationScenarios:
    def test_validate_config_missing_required(self, temp_dir):
        from doc_auto_processor.rules import RulesLoader

        bad_config = temp_dir / "bad_config.yaml"
        bad_config.write_text("general:\n  preserve_original: true")

        loader = RulesLoader()
        with pytest.raises(ValueError, match="Missing required section"):
            loader.validate_config(str(bad_config))

    def test_validate_invalid_duplicate_strategy(self, temp_dir):
        from doc_auto_processor.rules import RulesLoader

        bad_config = temp_dir / "bad_dup.yaml"
        bad_config.write_text(
            """
general:
  preserve_original: true
  allowed_file_types: [pdf]
rename:
  pattern: "{original_name}"
archive:
  strategy: date
  target_dir: ./archive
conflict:
  strategy: skip
deduplication:
  enabled: true
  strategy: invalid_strategy
extraction:
  project_code_default: DEFAULT
"""
        )

        loader = RulesLoader()
        errors = loader.validate_config(str(bad_config))
        assert len(errors) > 0
        assert any("invalid_strategy" in e for e in errors)

    def test_validate_invalid_ocr_config(self, temp_dir):
        from doc_auto_processor.rules import RulesLoader

        bad_config = temp_dir / "bad_ocr.yaml"
        bad_config.write_text(
            """
general:
  preserve_original: true
  allowed_file_types: [pdf]
rename:
  pattern: "{original_name}"
archive:
  strategy: date
  target_dir: ./archive
conflict:
  strategy: skip
ocr:
  enabled: true
  confidence_threshold: 150
extraction:
  project_code_default: DEFAULT
"""
        )

        loader = RulesLoader()
        errors = loader.validate_config(str(bad_config))
        assert len(errors) > 0
        assert any("150" in e for e in errors)
