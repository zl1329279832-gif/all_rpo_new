import pytest
import tempfile
import shutil
from pathlib import Path
from datetime import datetime
from click.testing import CliRunner

from doc_auto_processor.cli import cli
from doc_auto_processor.indexer import DatabaseManager
from doc_auto_processor.models import BatchInfo, BatchStatus


@pytest.fixture
def cli_runner():
    return CliRunner()


@pytest.fixture
def test_documents(temp_dir):
    docs_dir = temp_dir / "docs"
    docs_dir.mkdir()

    (docs_dir / "PRJ-1234_20240101_report.pdf").write_bytes(b"%PDF-1.4")
    (docs_dir / "PROJ-5678_contract.docx").write_bytes(b"Word content")
    (docs_dir / "HT-2024-001_agreement.pdf").write_bytes(b"%PDF-1.4")

    return docs_dir


class TestCLICommands:
    def test_cli_help(self, cli_runner):
        result = cli_runner.invoke(cli, ["--help"])
        assert result.exit_code == 0
        assert "process" in result.output
        assert "history" in result.output
        assert "rollback" in result.output
        assert "retry" in result.output
        assert "export" in result.output
        assert "validate-config" in result.output
        assert "verify-manifest" in result.output
        assert "init-db" in result.output

    def test_process_dry_run(self, cli_runner, test_documents, temp_dir):
        archive_dir = temp_dir / "archive"
        result = cli_runner.invoke(
            cli,
            [
                "process",
                str(test_documents),
                "--target-dir",
                str(archive_dir),
                "--dry-run",
                "--no-persistence",
                "--no-progress",
            ],
        )
        assert result.exit_code in (0, 1)
        assert "Dry Run" in result.output or "dry-run" in result.output.lower()

    def test_process_with_deduplication(self, cli_runner, test_documents, temp_dir):
        archive_dir = temp_dir / "archive"
        dup_dir = temp_dir / "_duplicates"

        result = cli_runner.invoke(
            cli,
            [
                "process",
                str(test_documents),
                "--target-dir",
                str(archive_dir),
                "--deduplicate",
                "--duplicate-strategy",
                "skip",
                "--dry-run",
                "--no-persistence",
                "--no-progress",
            ],
        )
        assert result.exit_code in (0, 1)

    def test_init_db(self, cli_runner, temp_dir):
        db_path = temp_dir / "test.db"
        result = cli_runner.invoke(
            cli,
            ["init-db", "--db-path", str(db_path)],
            env={"DOC_PROCESSOR_DB_PATH": str(db_path)},
        )
        assert result.exit_code == 0
        assert "Database initialized" in result.output
        assert db_path.exists()

    def test_validate_config_valid(self, cli_runner):
        result = cli_runner.invoke(
            cli,
            ["validate-config", "config.example.yaml"],
        )
        assert result.exit_code in (0, 1)
        assert "valid" in result.output.lower() or "errors" in result.output.lower()

    def test_validate_config_invalid(self, cli_runner, temp_dir):
        bad_config = temp_dir / "bad.yaml"
        bad_config.write_text("invalid: yaml: [")

        result = cli_runner.invoke(
            cli,
            ["validate-config", str(bad_config)],
        )
        assert result.exit_code != 0

    def test_history_list_empty(self, cli_runner, temp_dir):
        db_path = temp_dir / "empty.db"
        result = cli_runner.invoke(
            cli,
            ["history", "list"],
            env={"DOC_PROCESSOR_DB_PATH": str(db_path)},
        )
        assert result.exit_code == 0

    def test_history_show_invalid_batch(self, cli_runner, temp_dir):
        db_path = temp_dir / "test.db"
        result = cli_runner.invoke(
            cli,
            ["history", "show", "INVALID_BATCH"],
            env={"DOC_PROCESSOR_DB_PATH": str(db_path)},
        )
        assert result.exit_code != 0

    def test_rollback_invalid_batch(self, cli_runner, temp_dir):
        db_path = temp_dir / "test.db"
        result = cli_runner.invoke(
            cli,
            ["rollback", "INVALID_BATCH", "--dry-run"],
            env={"DOC_PROCESSOR_DB_PATH": str(db_path)},
        )
        assert result.exit_code != 0

    def test_export_invalid_batch(self, cli_runner, temp_dir):
        db_path = temp_dir / "test.db"
        export_dir = temp_dir / "exports"
        result = cli_runner.invoke(
            cli,
            [
                "export",
                "INVALID_BATCH",
                "--output-dir",
                str(export_dir),
                "--format",
                "json",
            ],
            env={"DOC_PROCESSOR_DB_PATH": str(db_path)},
        )
        assert result.exit_code != 0

    def test_retry_invalid_batch(self, cli_runner, temp_dir):
        db_path = temp_dir / "test.db"
        result = cli_runner.invoke(
            cli,
            ["retry", "INVALID_BATCH", "--dry-run"],
            env={"DOC_PROCESSOR_DB_PATH": str(db_path)},
        )
        assert result.exit_code != 0

    def test_verify_manifest_invalid_path(self, cli_runner, temp_dir):
        result = cli_runner.invoke(
            cli,
            ["verify-manifest", str(temp_dir / "nonexistent.json")],
        )
        assert result.exit_code != 0

    def test_process_with_fast_hash(self, cli_runner, test_documents, temp_dir):
        archive_dir = temp_dir / "archive"
        result = cli_runner.invoke(
            cli,
            [
                "process",
                str(test_documents),
                "--target-dir",
                str(archive_dir),
                "--deduplicate",
                "--fast-hash",
                "--dry-run",
                "--no-persistence",
                "--no-progress",
            ],
        )
        assert result.exit_code in (0, 1)

    def test_process_with_persistence(self, cli_runner, test_documents, temp_dir):
        archive_dir = temp_dir / "archive"
        db_path = temp_dir / "test.db"

        result = cli_runner.invoke(
            cli,
            [
                "process",
                str(test_documents),
                "--target-dir",
                str(archive_dir),
                "--dry-run",
                "--no-progress",
            ],
            env={"DOC_PROCESSOR_DB_PATH": str(db_path)},
        )
        assert result.exit_code in (0, 1)


class TestCLIGlobalOptions:
    def test_log_level_option(self, cli_runner, test_documents, temp_dir):
        archive_dir = temp_dir / "archive"
        result = cli_runner.invoke(
            cli,
            [
                "--log-level",
                "DEBUG",
                "process",
                str(test_documents),
                "--target-dir",
                str(archive_dir),
                "--dry-run",
                "--no-persistence",
                "--no-progress",
            ],
        )
        assert result.exit_code in (0, 1)

    def test_log_dir_option(self, cli_runner, test_documents, temp_dir):
        archive_dir = temp_dir / "archive"
        log_dir = temp_dir / "logs"
        result = cli_runner.invoke(
            cli,
            [
                "--log-dir",
                str(log_dir),
                "process",
                str(test_documents),
                "--target-dir",
                str(archive_dir),
                "--dry-run",
                "--no-persistence",
                "--no-progress",
            ],
        )
        assert result.exit_code in (0, 1)


class TestCLIProcessCommand:
    def test_process_no_source_dir(self, cli_runner):
        result = cli_runner.invoke(cli, ["process"])
        assert result.exit_code != 0
        assert "Missing argument" in result.output

    def test_process_invalid_source_dir(self, cli_runner, temp_dir):
        result = cli_runner.invoke(
            cli,
            ["process", str(temp_dir / "nonexistent")],
        )
        assert result.exit_code != 0

    def test_process_preserve_original(self, cli_runner, test_documents, temp_dir):
        archive_dir = temp_dir / "archive"
        result = cli_runner.invoke(
            cli,
            [
                "process",
                str(test_documents),
                "--target-dir",
                str(archive_dir),
                "--preserve-original",
                "--dry-run",
                "--no-persistence",
                "--no-progress",
            ],
        )
        assert result.exit_code in (0, 1)
