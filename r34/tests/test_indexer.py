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
)
from doc_auto_processor.indexer import DatabaseManager


class TestDatabaseManager:
    def test_singleton_pattern(self, temp_db):
        db2 = DatabaseManager()
        assert temp_db is db2

    def test_generate_batch_id_format(self):
        batch_id = DatabaseManager.generate_batch_id()
        assert batch_id.startswith("BATCH_")
        parts = batch_id.split("_")
        assert len(parts) == 4
        assert len(parts[1]) == 8
        assert len(parts[2]) == 6
        assert len(parts[3]) == 8

    def test_init_db_creates_tables(self, temp_db):
        cursor = temp_db._conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table'"
        )
        tables = [row[0] for row in cursor.fetchall()]
        assert "batches" in tables
        assert "documents" in tables

    def test_create_and_get_batch(self, temp_db):
        batch_id = DatabaseManager.generate_batch_id()
        batch = BatchInfo(
            batch_id=batch_id,
            status=BatchStatus.RUNNING,
            source_dir="./docs",
            target_dir="./archive",
            start_time=datetime.now(),
            dry_run=False,
            config_hash="abc123",
        )
        temp_db.create_batch(batch)

        retrieved = temp_db.get_batch(batch_id)
        assert retrieved is not None
        assert retrieved.batch_id == batch_id
        assert retrieved.status == BatchStatus.RUNNING
        assert retrieved.config_hash == "abc123"

    def test_update_batch_status(self, temp_db, sample_batch):
        temp_db.update_batch(
            sample_batch.batch_id,
            status=BatchStatus.COMPLETED,
            total_files=10,
            success_count=10,
            failed_count=0,
            end_time=datetime.now(),
        )
        batch = temp_db.get_batch(sample_batch.batch_id)
        assert batch.status == BatchStatus.COMPLETED
        assert batch.total_files == 10
        assert batch.end_time is not None

    def test_list_batches(self, temp_db):
        for i in range(3):
            batch_id = DatabaseManager.generate_batch_id()
            batch = BatchInfo(
                batch_id=batch_id,
                status=BatchStatus.COMPLETED,
                source_dir=f"./docs{i}",
                target_dir="./archive",
                start_time=datetime.now(),
                end_time=datetime.now(),
            )
            temp_db.create_batch(batch)

        batches = temp_db.list_batches(limit=10)
        assert len(batches) == 3

    def test_add_and_get_document(self, temp_db, sample_doc, sample_batch):
        sample_doc.batch_id = sample_batch.batch_id
        doc_id = temp_db.add_document(sample_doc)
        assert doc_id > 0

        docs = temp_db.get_documents(batch_id=sample_batch.batch_id)
        assert len(docs) == 1
        assert docs[0].id == doc_id
        assert docs[0].metadata.sha256_hash == "abc123def456"

    def test_update_document_status(self, temp_db, sample_doc, sample_batch):
        sample_doc.batch_id = sample_batch.batch_id
        doc_id = temp_db.add_document(sample_doc)

        temp_db.update_document(
            doc_id,
            status=ProcessingStatus.ARCHIVED,
            target_path=Path("./archive/test.pdf"),
            failure_reason=None,
        )

        docs = temp_db.get_documents(batch_id=sample_batch.batch_id)
        assert docs[0].status == ProcessingStatus.ARCHIVED
        assert docs[0].target_path == Path("./archive/test.pdf")

    def test_find_document_by_hash(self, temp_db, sample_doc, sample_batch):
        sample_doc.batch_id = sample_batch.batch_id
        temp_db.add_document(sample_doc)

        found = temp_db.find_document_by_hash("abc123def456")
        assert found is not None
        assert found.metadata.sha256_hash == "abc123def456"

        not_found = temp_db.find_document_by_hash("nonexistent")
        assert not_found is None

    def test_get_statistics(self, temp_db, sample_batch):
        metadata = DocumentMetadata(
            file_type=FileType.PDF,
            file_size=100,
            created_date=datetime.now(),
            sha256_hash="hash1",
        )
        for i in range(5):
            doc = DocumentInfo(
                batch_id=sample_batch.batch_id,
                source_path=Path(f"./doc{i}.pdf"),
                metadata=metadata,
                status=ProcessingStatus.ARCHIVED if i < 3 else ProcessingStatus.FAILED,
            )
            temp_db.add_document(doc)

        stats = temp_db.get_statistics(sample_batch.batch_id)
        assert stats["total"] == 5
        assert stats["archived"] == 3
        assert stats["failed"] == 2

    def test_get_failed_documents(self, temp_db, sample_batch):
        metadata = DocumentMetadata(
            file_type=FileType.PDF,
            file_size=100,
            created_date=datetime.now(),
        )
        doc1 = DocumentInfo(
            batch_id=sample_batch.batch_id,
            source_path=Path("./fail1.pdf"),
            metadata=metadata,
            status=ProcessingStatus.FAILED,
            failure_reason="Permission denied",
        )
        doc2 = DocumentInfo(
            batch_id=sample_batch.batch_id,
            source_path=Path("./success.pdf"),
            metadata=metadata,
            status=ProcessingStatus.ARCHIVED,
        )
        temp_db.add_document(doc1)
        temp_db.add_document(doc2)

        failed = temp_db.get_failed_documents(sample_batch.batch_id)
        assert len(failed) == 1
        assert failed[0].failure_reason == "Permission denied"

    def test_transaction_rollback_on_error(self, temp_db, sample_batch):
        try:
            with temp_db.transaction():
                metadata = DocumentMetadata(
                    file_type=FileType.PDF,
                    file_size=100,
                    created_date=datetime.now(),
                )
                doc = DocumentInfo(
                    batch_id=sample_batch.batch_id,
                    source_path=Path("./test.pdf"),
                    metadata=metadata,
                    status=ProcessingStatus.PENDING,
                )
                temp_db.add_document(doc)
                raise ValueError("Simulated error")
        except ValueError:
            pass

        docs = temp_db.get_documents(batch_id=sample_batch.batch_id)
        assert len(docs) == 0
