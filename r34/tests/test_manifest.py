import pytest
import json
import hashlib
from pathlib import Path
from datetime import datetime

from doc_auto_processor.manifest import (
    ManifestGenerator,
    Manifest,
    ManifestEntry,
)
from doc_auto_processor.models import BatchInfo, BatchStatus


class TestManifestEntry:
    def test_manifest_entry_creation(self):
        entry = ManifestEntry(
            operation="move",
            source_path="/source/file.pdf",
            target_path="/target/file.pdf",
            file_hash="abc123",
            timestamp=datetime(2024, 1, 1, 0, 0, 0),
            status="success",
        )
        assert entry.operation == "move"
        assert entry.file_hash == "abc123"

    def test_manifest_entry_to_dict(self):
        entry = ManifestEntry(
            operation="rename",
            source_path="/a.pdf",
            target_path="/b.pdf",
            file_hash="hash123",
            timestamp=datetime(2024, 1, 1),
            status="success",
        )
        d = entry.to_dict()
        assert d["operation"] == "rename"
        assert "timestamp" in d
        assert isinstance(d["timestamp"], str)


class TestManifest:
    def test_manifest_creation(self):
        entries = [
            ManifestEntry(
                operation="move",
                source_path="/s1.pdf",
                target_path="/t1.pdf",
                file_hash="h1",
                timestamp=datetime.now(),
                status="success",
            )
        ]
        manifest = Manifest(
            batch_id="BATCH_20240101_000000_ABC12345",
            created_at=datetime.now(),
            entries=entries,
            total_files=1,
            dry_run=False,
        )
        assert manifest.batch_id == "BATCH_20240101_000000_ABC12345"
        assert len(manifest.entries) == 1

    def test_manifest_to_dict(self):
        entries = [
            ManifestEntry(
                operation="move",
                source_path="/s1.pdf",
                target_path="/t1.pdf",
                file_hash="h1",
                timestamp=datetime(2024, 1, 1),
                status="success",
            )
        ]
        manifest = Manifest(
            batch_id="BATCH_TEST",
            created_at=datetime(2024, 1, 1),
            entries=entries,
            total_files=1,
            dry_run=False,
        )
        d = manifest.to_dict()
        assert d["batch_id"] == "BATCH_TEST"
        assert d["total_files"] == 1
        assert "entries" in d
        assert "manifest_hash" in d


class TestManifestGenerator:
    def test_generate_manifest(self, temp_dir):
        generator = ManifestGenerator()
        entries = [
            ManifestEntry(
                operation="move",
                source_path=str(temp_dir / "a.pdf"),
                target_path=str(temp_dir / "archive" / "a.pdf"),
                file_hash="abc123",
                timestamp=datetime.now(),
                status="success",
            )
        ]
        batch = BatchInfo(
            batch_id="BATCH_20240101_000000_ABC12345",
            status=BatchStatus.COMPLETED,
            source_dir=str(temp_dir),
            target_dir=str(temp_dir / "archive"),
            start_time=datetime.now(),
            dry_run=False,
        )

        manifest_path = generator.generate(
            batch=batch,
            entries=entries,
            output_dir=temp_dir,
        )

        assert manifest_path.exists()
        assert manifest_path.name.startswith("BATCH_20240101_000000_ABC12345")
        assert manifest_path.suffix == ".json"

    def test_load_manifest(self, temp_dir):
        generator = ManifestGenerator()
        entries = [
            ManifestEntry(
                operation="move",
                source_path="/a.pdf",
                target_path="/b.pdf",
                file_hash="h1",
                timestamp=datetime(2024, 1, 1),
                status="success",
            )
        ]
        batch = BatchInfo(
            batch_id="BATCH_TEST",
            status=BatchStatus.COMPLETED,
            source_dir="/src",
            target_dir="/dst",
            start_time=datetime.now(),
            dry_run=False,
        )
        manifest_path = generator.generate(batch, entries, temp_dir)

        loaded = generator.load(manifest_path)
        assert loaded.batch_id == "BATCH_TEST"
        assert len(loaded.entries) == 1
        assert loaded.entries[0].source_path == "/a.pdf"

    def test_verify_manifest_integrity(self, temp_dir):
        generator = ManifestGenerator()
        entries = [
            ManifestEntry(
                operation="move",
                source_path="/a.pdf",
                target_path="/b.pdf",
                file_hash="h1",
                timestamp=datetime(2024, 1, 1),
                status="success",
            )
        ]
        batch = BatchInfo(
            batch_id="BATCH_VERIFY",
            status=BatchStatus.COMPLETED,
            source_dir="/src",
            target_dir="/dst",
            start_time=datetime.now(),
            dry_run=False,
        )
        manifest_path = generator.generate(batch, entries, temp_dir)

        assert generator.verify(manifest_path) is True

    def test_verify_tampered_manifest(self, temp_dir):
        generator = ManifestGenerator()
        entries = [
            ManifestEntry(
                operation="move",
                source_path="/a.pdf",
                target_path="/b.pdf",
                file_hash="h1",
                timestamp=datetime(2024, 1, 1),
                status="success",
            )
        ]
        batch = BatchInfo(
            batch_id="BATCH_TAMPER",
            status=BatchStatus.COMPLETED,
            source_dir="/src",
            target_dir="/dst",
            start_time=datetime.now(),
            dry_run=False,
        )
        manifest_path = generator.generate(batch, entries, temp_dir)

        with open(manifest_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        data["entries"][0]["target_path"] = "/tampered.pdf"
        with open(manifest_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

        assert generator.verify(manifest_path) is False

    def test_generate_manifest_hash(self, temp_dir):
        generator = ManifestGenerator()
        data = {
            "batch_id": "BATCH_HASH",
            "entries": [
                {"source_path": "/a.pdf", "target_path": "/b.pdf", "file_hash": "h1"}
            ],
        }
        hash1 = generator._generate_manifest_hash(data)
        hash2 = generator._generate_manifest_hash(data)

        assert hash1 == hash2
        assert len(hash1) == 64

    def test_get_manifest_path(self, temp_dir):
        generator = ManifestGenerator()
        path = generator.get_manifest_path("BATCH_2024", temp_dir)
        assert path == temp_dir / "BATCH_2024_manifest.json"
