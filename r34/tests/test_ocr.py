import pytest
from pathlib import Path
from datetime import datetime

from doc_auto_processor.ocr import (
    OCREngine,
    OCRConfig,
    OCRResult,
    pytesseract_available,
    pdf2image_available,
)
from doc_auto_processor.models import FileType, OCRStatus, DocumentInfo, DocumentMetadata, ProcessingStatus


class TestOCRConfig:
    def test_default_config(self):
        config = OCRConfig()
        assert config.enabled is True
        assert config.languages == "chi_sim+eng"
        assert config.confidence_threshold == 60

    def test_custom_config(self):
        config = OCRConfig(
            enabled=False,
            languages="eng",
            confidence_threshold=80,
            pdf_dpi=200,
        )
        assert config.enabled is False
        assert config.languages == "eng"
        assert config.confidence_threshold == 80


class TestOCRResult:
    def test_result_creation(self):
        result = OCRResult(
            success=True,
            text="Extracted text content",
            confidence=85.5,
            status=OCRStatus.SUCCESS,
        )
        assert result.success is True
        assert result.text == "Extracted text content"
        assert result.confidence == 85.5
        assert result.status == OCRStatus.SUCCESS

    def test_result_failed(self):
        result = OCRResult(
            success=False,
            error_message="Tesseract not found",
            status=OCRStatus.FAILED,
        )
        assert result.success is False
        assert result.error_message == "Tesseract not found"


class TestKeywordExtraction:
    def test_extract_project_code(self):
        engine = OCREngine()

        test_cases = [
            "项目编号 PRJ-1234 合同文档",
            "PROJ_ABC567 项目报告",
            "这是项目 HT-2024-001 合同",
            "没有项目编号的文档",
        ]

        results = [engine._extract_keywords(text) for text in test_cases]

        assert results[0]["project_code"] == "1234"
        assert results[1]["project_code"] == "ABC567"
        assert results[2]["project_code"] is None

    def test_extract_contract_code(self):
        engine = OCREngine()

        test_cases = [
            "合同编号 HT-2024-001 项目文档",
            "合同: HT_ABC123 采购协议",
            "Contract No. CT-2024-0567 销售合同",
            "普通文档无合同号",
        ]

        results = [engine._extract_keywords(text) for text in test_cases]

        assert results[0]["contract_code"] == "2024-001"
        assert results[1]["contract_code"] == "ABC123"
        assert results[3]["contract_code"] is None

    def test_extract_dates(self):
        engine = OCREngine()

        test_cases = [
            "日期：2024-01-15 签订合同",
            "签订日期 20240115",
            "2024年1月15日 项目启动",
            "无日期文档",
        ]

        results = [engine._extract_keywords(text) for text in test_cases]

        assert results[0]["date"] is not None
        assert results[1]["date"] is not None
        assert results[2]["date"] is not None
        assert results[3]["date"] is None


class TestOCREngine:
    def test_engine_disabled(self, mock_ocr_unavailable):
        config = OCRConfig(enabled=True)
        engine = OCREngine(config=config)
        assert engine.available is False

    def test_process_document_not_applicable(self, temp_dir):
        engine = OCREngine()
        doc_path = temp_dir / "test.docx"
        doc_path.write_bytes(b"not a pdf or image")

        metadata = DocumentMetadata(
            file_type=FileType.WORD,
            file_size=4,
            created_date=datetime.now(),
        )
        doc = DocumentInfo(
            source_path=doc_path,
            metadata=metadata,
            status=ProcessingStatus.PENDING,
        )

        result = engine.process_document(doc)
        assert result.status == OCRStatus.NOT_APPLICABLE

    def test_process_document_ocr_disabled(self, temp_dir, mock_ocr_unavailable):
        config = OCRConfig(enabled=False)
        engine = OCREngine(config=config)

        doc_path = temp_dir / "test.pdf"
        doc_path.write_bytes(b"%PDF-1.4")

        metadata = DocumentMetadata(
            file_type=FileType.PDF,
            file_size=8,
            created_date=datetime.now(),
        )
        doc = DocumentInfo(
            source_path=doc_path,
            metadata=metadata,
            status=ProcessingStatus.PENDING,
        )

        result = engine.process_document(doc)
        assert result.status == OCRStatus.DISABLED

    def test_process_image(self, temp_dir, mock_ocr_available, monkeypatch):
        def mock_image_to_string(*args, **kwargs):
            return "项目 PRJ-1234 合同 HT-2024-001"

        monkeypatch.setattr(
            "doc_auto_processor.ocr.pytesseract.image_to_string",
            mock_image_to_string,
        )

        config = OCRConfig(enabled=True)
        engine = OCREngine(config=config)

        from PIL import Image

        img_path = temp_dir / "test.jpg"
        img = Image.new("RGB", (100, 100), color="white")
        img.save(img_path)

        metadata = DocumentMetadata(
            file_type=FileType.IMAGE,
            file_size=img_path.stat().st_size,
            created_date=datetime.now(),
        )
        doc = DocumentInfo(
            source_path=img_path,
            metadata=metadata,
            status=ProcessingStatus.PENDING,
        )

        result = engine.process_document(doc)
        assert result.status == OCRStatus.SUCCESS
        assert "PRJ-1234" in result.text
        assert doc.metadata.ocr_status == OCRStatus.SUCCESS
        assert doc.metadata.project_code == "1234"
        assert doc.metadata.contract_code == "2024-001"
