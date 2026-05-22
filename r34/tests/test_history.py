import pytest
import csv
import json
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
from doc_auto_processor.history import HistoryManager
from doc_auto_processor.indexer import DatabaseManager


class TestHistoryManager:
    def test_list_batches(self, temp_db):
        for i in range(5):
            batch_id = DatabaseManager.generate_batch_id()
            batch = BatchInfo(
                batch_id=batch_id,
                status=BatchStatus.COMPLETED,
                source_dir=f"./docs{i}",
                target_dir="./archive",
                start_time=datetime.now(),
                end_time=datetime.now(),
                total_files=i + 1,
                success_count=i + 1,
            )
            temp_db.create_batch(batch)

        manager = HistoryManager()
        batches = manager.list_batches(limit=10)

        assert len(batches) == 5
        assert all(isinstance(b, dict) for b in batches)
        assert "batch_id" in batches[0]

    def test_get_batch(self, temp_db, sample_batch):
        manager = HistoryManager()
        batch_info = manager.get_batch(sample_batch.batch_id)

        assert batch_info is not None
        assert batch_info["batch_id"] == sample_batch.batch_id
        assert "statistics" in batch_info

    def test_get_batch_documents(self, temp_db, sample_batch):
        metadata = DocumentMetadata(
            file_type=FileType.PDF,
            file_size=100,
            created_date=datetime.now(),
        )
        for i in range(3):
            doc = DocumentInfo(
                batch_id=sample_batch.batch_id,
                source_path=Path(f"./doc{i}.pdf"),
                metadata=metadata,
                status=ProcessingStatus.ARCHIVED,
            )
            temp_db.add_document(doc)

        manager = HistoryManager()
        docs = manager.get_batch_documents(sample_batch.batch_id)

        assert len(docs) == 3
        assert all("source_path" in d for d in docs)

    def test_get_failed_documents(self, temp_db, sample_batch):
        metadata = DocumentMetadata(
            file_type=FileType.PDF,
            file_size=100,
            created_date=datetime.now(),
        )
        fail_doc = DocumentInfo(
            batch_id=sample_batch.batch_id,
            source_path=Path("./fail.pdf"),
            metadata=metadata,
            status=ProcessingStatus.FAILED,
            failure_reason="Permission denied",
        )
        success_doc = DocumentInfo(
            batch_id=sample_batch.batch_id,
            source_path=Path("./success.pdf"),
            metadata=metadata,
            status=ProcessingStatus.ARCHIVED,
        )
        temp_db.add_document(fail_doc)
        temp_db.add_document(success_doc)

        manager = HistoryManager()
        failed = manager.get_failed_documents(sample_batch.batch_id)

        assert len(failed) == 1
        assert failed[0]["failure_reason"] == "Permission denied"

    def test_get_batch_statistics(self, temp_db, sample_batch):
        metadata = DocumentMetadata(
            file_type=FileType.PDF,
            file_size=100,
            created_date=datetime.now(),
        )
        for i in range(4):
            doc = DocumentInfo(
                batch_id=sample_batch.batch_id,
                source_path=Path(f"./doc{i}.pdf"),
                metadata=metadata,
                status=ProcessingStatus.ARCHIVED
                if i < 3
                else ProcessingStatus.FAILED,
            )
            temp_db.add_document(doc)

        manager = HistoryManager()
        stats = manager.get_batch_statistics(sample_batch.batch_id)

        assert stats["total"] == 4
        assert stats["archived"] == 3
        assert stats["failed"] == 1

    def test_export_results_json(self, temp_db, sample_batch, temp_dir):
        metadata = DocumentMetadata(
            file_type=FileType.PDF,
            file_size=100,
            created_date=datetime.now(),
        )
        for i in range(2):
            doc = DocumentInfo(
                batch_id=sample_batch.batch_id,
                source_path=Path(f"./doc{i}.pdf"),
                metadata=metadata,
                status=ProcessingStatus.ARCHIVED,
            )
            temp_db.add_document(doc)

        manager = HistoryManager()
        export_path = manager.export_results(
            sample_batch.batch_id, output_dir=temp_dir, format="json"
        )

        assert export_path.exists()
        with open(export_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        assert data["batch_id"] == sample_batch.batch_id
        assert len(data["documents"]) == 2

    def test_export_results_csv(self, temp_db, sample_batch, temp_dir):
        metadata = DocumentMetadata(
            file_type=FileType.PDF,
            file_size=100,
            created_date=datetime.now(),
        )
        for i in range(2):
            doc = DocumentInfo(
                batch_id=sample_batch.batch_id,
                source_path=Path(f"./doc{i}.pdf"),
                metadata=metadata,
                status=ProcessingStatus.ARCHIVED,
            )
            temp_db.add_document(doc)

        manager = HistoryManager()
        export_path = manager.export_results(
            sample_batch.batch_id, output_dir=temp_dir, format="csv"
        )

        assert export_path.exists()
        with open(export_path, "r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            rows = list(reader)
        assert len(rows) == 2

    def test_format_batch_list(self, temp_db):
        batch_id = DatabaseManager.generate_batch_id()
        batch = BatchInfo(
            batch_id=batch_id,
            status=BatchStatus.COMPLETED,
            source_dir="./docs",
            target_dir="./archive",
            start_time=datetime(2024, 1, 1, 10, 0, 0),
            end_time=datetime(2024, 1, 1, 10, 5, 0),
            total_files=10,
            success_count=10,
            failed_count=0,
        )
        temp_db.create_batch(batch)

        manager = HistoryManager()
        batches = manager.list_batches()
        formatted = manager.format_batch_list(batches)

        assert batch_id in formatted
        assert "COMPLETED" in formatted

    def test_format_batch_detail(self, temp_db, sample_batch):
        manager = HistoryManager()
        batch_info = manager.get_batch(sample_batch.batch_id)
        formatted = manager.format_batch_detail(batch_info)

        assert sample_batch.batch_id in formatted
        assert "Statistics" in formatted
