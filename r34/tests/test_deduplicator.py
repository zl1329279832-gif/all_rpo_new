import pytest
import hashlib
from pathlib import Path
from datetime import datetime

from doc_auto_processor.models import (
    DocumentInfo,
    DocumentMetadata,
    ProcessingStatus,
    FileType,
    DuplicateStrategy,
)
from doc_auto_processor.deduplicator import HashCalculator, DuplicateDetector


class TestHashCalculator:
    def test_calculate_sha256_full(self, temp_dir):
        test_file = temp_dir / "test.pdf"
        content = b"test content for hashing"
        test_file.write_bytes(content)

        expected_hash = hashlib.sha256(content).hexdigest()
        actual_hash = HashCalculator.calculate_sha256(test_file)

        assert actual_hash == expected_hash

    def test_calculate_sha256_fast(self, temp_dir):
        test_file = temp_dir / "large_test.pdf"
        content = b"A" * (2 * 1024 * 1024)
        test_file.write_bytes(content)

        hash1 = HashCalculator.calculate_sha256_fast(test_file, sample_size=1024)
        hash2 = HashCalculator.calculate_sha256_fast(test_file, sample_size=1024)

        assert hash1 == hash2
        assert len(hash1) == 64

    def test_hash_consistency_identical_files(self, duplicate_files):
        hash1 = HashCalculator.calculate_sha256(duplicate_files[0])
        hash2 = HashCalculator.calculate_sha256(duplicate_files[1])
        hash3 = HashCalculator.calculate_sha256(duplicate_files[2])

        assert hash1 == hash2
        assert hash1 != hash3

    def test_hash_empty_file(self, temp_dir):
        empty_file = temp_dir / "empty.txt"
        empty_file.write_bytes(b"")

        hash_result = HashCalculator.calculate_sha256(empty_file)
        expected = hashlib.sha256(b"").hexdigest()
        assert hash_result == expected

    def test_hash_nonexistent_file(self, temp_dir):
        nonexistent = temp_dir / "nonexistent.pdf"
        with pytest.raises(FileNotFoundError):
            HashCalculator.calculate_sha256(nonexistent)


class TestDuplicateDetector:
    def test_check_duplicate_within_batch(self, temp_db, sample_batch, duplicate_files):
        detector = DuplicateDetector(
            db=temp_db,
            strategy=DuplicateStrategy.SKIP,
            batch_id=sample_batch.batch_id,
            use_fast_hash=False,
        )

        metadata = DocumentMetadata(
            file_type=FileType.PDF,
            file_size=duplicate_files[0].stat().st_size,
            created_date=datetime.now(),
        )
        doc1 = DocumentInfo(
            source_path=duplicate_files[0],
            metadata=metadata,
            status=ProcessingStatus.PENDING,
            batch_id=sample_batch.batch_id,
        )
        doc2 = DocumentInfo(
            source_path=duplicate_files[1],
            metadata=metadata,
            status=ProcessingStatus.PENDING,
            batch_id=sample_batch.batch_id,
        )

        is_dup1, hash1 = detector.check_duplicate(doc1)
        assert not is_dup1
        detector.mark_processed(doc1, hash1)

        is_dup2, hash2 = detector.check_duplicate(doc2)
        assert is_dup2
        assert hash1 == hash2

    def test_check_duplicate_historical(self, temp_db, sample_batch, sample_doc):
        sample_doc.batch_id = sample_batch.batch_id
        temp_db.add_document(sample_doc)

        detector = DuplicateDetector(
            db=temp_db,
            strategy=DuplicateStrategy.SKIP,
            batch_id=sample_batch.batch_id,
            use_fast_hash=False,
        )

        new_metadata = DocumentMetadata(
            file_type=FileType.PDF,
            file_size=1024,
            created_date=datetime.now(),
            sha256_hash="abc123def456",
        )
        new_doc = DocumentInfo(
            source_path=Path("./new_doc.pdf"),
            metadata=new_metadata,
            status=ProcessingStatus.PENDING,
            batch_id=sample_batch.batch_id,
        )

        is_dup, file_hash = detector.check_duplicate(new_doc)
        assert is_dup
        assert file_hash == "abc123def456"

    def test_handle_duplicate_skip_strategy(
        self, temp_db, sample_batch, duplicate_files
    ):
        detector = DuplicateDetector(
            db=temp_db,
            strategy=DuplicateStrategy.SKIP,
            batch_id=sample_batch.batch_id,
            use_fast_hash=False,
        )

        metadata = DocumentMetadata(
            file_type=FileType.PDF,
            file_size=duplicate_files[0].stat().st_size,
            created_date=datetime.now(),
        )
        doc = DocumentInfo(
            source_path=duplicate_files[1],
            metadata=metadata,
            status=ProcessingStatus.PENDING,
            batch_id=sample_batch.batch_id,
        )

        detector._seen_hashes.add(
            HashCalculator.calculate_sha256(duplicate_files[0])
        )

        result = detector.handle_duplicate(doc)
        assert result["action"] == "skip"
        assert doc.status == ProcessingStatus.DUPLICATE_SKIPPED

    def test_handle_duplicate_keep_copy_strategy(
        self, temp_db, sample_batch, duplicate_files
    ):
        detector = DuplicateDetector(
            db=temp_db,
            strategy=DuplicateStrategy.KEEP_COPY,
            batch_id=sample_batch.batch_id,
            use_fast_hash=False,
        )

        metadata = DocumentMetadata(
            file_type=FileType.PDF,
            file_size=duplicate_files[0].stat().st_size,
            created_date=datetime.now(),
        )
        doc = DocumentInfo(
            source_path=duplicate_files[1],
            target_path=Path("./archive/report.pdf"),
            metadata=metadata,
            status=ProcessingStatus.PENDING,
            batch_id=sample_batch.batch_id,
        )

        original_hash = HashCalculator.calculate_sha256(duplicate_files[0])
        detector._seen_hashes.add(original_hash)

        result = detector.handle_duplicate(doc)
        assert result["action"] == "keep_copy"
        assert "_copy" in str(doc.target_path)

    def test_handle_duplicate_move_strategy(
        self, temp_db, sample_batch, duplicate_files, temp_dir
    ):
        dup_area = temp_dir / "_duplicates"
        detector = DuplicateDetector(
            db=temp_db,
            strategy=DuplicateStrategy.MOVE_TO_DUPLICATE_AREA,
            batch_id=sample_batch.batch_id,
            duplicate_area_dir=dup_area,
            use_fast_hash=False,
        )

        metadata = DocumentMetadata(
            file_type=FileType.PDF,
            file_size=duplicate_files[0].stat().st_size,
            created_date=datetime.now(),
        )
        doc = DocumentInfo(
            source_path=duplicate_files[1],
            metadata=metadata,
            status=ProcessingStatus.PENDING,
            batch_id=sample_batch.batch_id,
        )

        original_hash = HashCalculator.calculate_sha256(duplicate_files[0])
        detector._seen_hashes.add(original_hash)

        result = detector.handle_duplicate(doc)
        assert result["action"] == "move_to_duplicate_area"
        assert doc.duplicate_of == original_hash
        assert str(dup_area) in str(doc.target_path)

    def test_get_duplicate_of(self, temp_db, sample_batch, sample_doc):
        sample_doc.batch_id = sample_batch.batch_id
        doc_id = temp_db.add_document(sample_doc)

        detector = DuplicateDetector(
            db=temp_db,
            strategy=DuplicateStrategy.SKIP,
            batch_id=sample_batch.batch_id,
            use_fast_hash=False,
        )

        original = detector.get_duplicate_of("abc123def456")
        assert original is not None
        assert original.id == doc_id
