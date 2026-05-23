import re
import tempfile
from pathlib import Path
from typing import Optional, Dict, List, Tuple
from dataclasses import dataclass
from datetime import datetime

from .logger import get_logger
from .models import DocumentInfo, DocumentMetadata, FileType, OCRStatus

logger = get_logger()


@dataclass
class OCRResult:
    success: bool
    text: Optional[str] = None
    project_code: Optional[str] = None
    contract_code: Optional[str] = None
    document_date: Optional[datetime] = None
    extracted_fields: Dict[str, str] = None
    error_message: Optional[str] = None


@dataclass
class OCRConfig:
    enable_ocr: bool = True
    languages: str = "chi_sim+eng"
    dpi: int = 300
    max_pages: int = 10
    enable_keyword_extraction: bool = True
    project_code_pattern: Optional[str] = None
    contract_code_pattern: Optional[str] = None
    date_patterns: List[str] = None
    temp_dir: Optional[Path] = None

    def __post_init__(self) -> None:
        if self.date_patterns is None:
            self.date_patterns = [
                r"(\d{4})[-/年](\d{1,2})[-/月](\d{1,2})",
                r"(\d{8})",
                r"(\d{4})\.(\d{1,2})\.(\d{1,2})",
            ]


class OCREngine:
    def __init__(self, config: Optional[OCRConfig] = None) -> None:
        self.config = config or OCRConfig()
        self._tesseract_available: Optional[bool] = None
        self._pdf2image_available: Optional[bool] = None

    def _check_tesseract(self) -> bool:
        if self._tesseract_available is not None:
            return self._tesseract_available

        try:
            import pytesseract
            pytesseract.get_tesseract_version()
            self._tesseract_available = True
            logger.debug("Tesseract OCR 可用")
        except (ImportError, pytesseract.TesseractNotFoundError):
            self._tesseract_available = False
            logger.warning("Tesseract OCR 不可用，将跳过 OCR 处理")

        return self._tesseract_available

    def _check_pdf2image(self) -> bool:
        if self._pdf2image_available is not None:
            return self._pdf2image_available

        try:
            from pdf2image import convert_from_path
            self._pdf2image_available = True
            logger.debug("pdf2image 可用")
        except ImportError:
            self._pdf2image_available = False
            logger.warning("pdf2image 不可用，PDF 扫描版 OCR 将被跳过")

        return self._pdf2image_available

    def extract_text_from_image(self, image_path: Path) -> Optional[str]:
        if not self._check_tesseract():
            return None

        try:
            import pytesseract
            from PIL import Image

            with Image.open(image_path) as img:
                text = pytesseract.image_to_string(
                    img,
                    lang=self.config.languages,
                )
                return text.strip() if text else None
        except ImportError as e:
            logger.warning(f"OCR 依赖缺失: {e}")
            return None
        except Exception as e:
            logger.warning(f"图片 OCR 失败 {image_path}: {e}")
            return None

    def extract_text_from_pdf(self, pdf_path: Path) -> Optional[str]:
        if not self._check_tesseract() or not self._check_pdf2image():
            return None

        try:
            import pytesseract
            from pdf2image import convert_from_path

            temp_dir = self.config.temp_dir or Path(tempfile.mkdtemp(prefix="ocr_"))
            temp_dir.mkdir(parents=True, exist_ok=True)

            images = convert_from_path(
                str(pdf_path),
                dpi=self.config.dpi,
                first_page=1,
                last_page=self.config.max_pages,
                output_folder=str(temp_dir),
                fmt="png",
            )

            all_text = []
            for i, image in enumerate(images, 1):
                try:
                    text = pytesseract.image_to_string(
                        image,
                        lang=self.config.languages,
                    )
                    if text.strip():
                        all_text.append(f"--- Page {i} ---\n{text.strip()}")
                except Exception as e:
                    logger.warning(f"PDF 第 {i} 页 OCR 失败: {e}")
                    continue

            for img_file in temp_dir.glob("*.png"):
                try:
                    img_file.unlink()
                except:
                    pass

            return "\n".join(all_text) if all_text else None

        except ImportError as e:
            logger.warning(f"OCR 依赖缺失: {e}")
            return None
        except Exception as e:
            logger.warning(f"PDF OCR 失败 {pdf_path}: {e}")
            return None

    def extract_keywords(self, text: str) -> Dict[str, Optional[str]]:
        result = {
            "project_code": None,
            "contract_code": None,
            "document_date": None,
        }

        if not text:
            return result

        if self.config.project_code_pattern:
            match = re.search(self.config.project_code_pattern, text, re.IGNORECASE)
            if match:
                result["project_code"] = match.group(1) if match.groups() else match.group(0)

        if result["project_code"] is None:
            patterns = [
                r"(?:PRJ|PROJ|项目|工程)[-_\s:：]?([A-Za-z0-9]{4,20})",
                r"(?:NO\.?|编号|号)[-_\s:：]?([A-Za-z0-9-]{4,20})",
            ]
            for pattern in patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    result["project_code"] = match.group(1).upper()
                    break

        if self.config.contract_code_pattern:
            match = re.search(self.config.contract_code_pattern, text, re.IGNORECASE)
            if match:
                result["contract_code"] = match.group(1) if match.groups() else match.group(0)

        if result["contract_code"] is None:
            patterns = [
                r"(?:HT|合同|Contract)[-_\s:：]?([A-Za-z0-9-]{4,20})",
                r"(?:合同编号|合同号)[-_\s:：]?([A-Za-z0-9-]{4,20})",
            ]
            for pattern in patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    result["contract_code"] = match.group(1).upper()
                    break

        for pattern in self.config.date_patterns:
            match = re.search(pattern, text)
            if match:
                try:
                    if len(match.groups()) == 3:
                        year, month, day = int(match.group(1)), int(match.group(2)), int(match.group(3))
                        if 1900 <= year <= 2100 and 1 <= month <= 12 and 1 <= day <= 31:
                            result["document_date"] = datetime(year, month, day)
                            break
                    elif len(match.groups()) == 1:
                        date_str = match.group(1)
                        if len(date_str) == 8:
                            year = int(date_str[:4])
                            month = int(date_str[4:6])
                            day = int(date_str[6:8])
                            if 1900 <= year <= 2100 and 1 <= month <= 12 and 1 <= day <= 31:
                                result["document_date"] = datetime(year, month, day)
                                break
                except (ValueError, TypeError):
                    continue

        return result

    def process_document(
        self,
        doc_info: DocumentInfo,
        dry_run: bool = False,
    ) -> OCRResult:
        file_type = doc_info.metadata.file_type
        source_path = doc_info.source_path

        if not self.config.enable_ocr or dry_run:
            doc_info.metadata.ocr_status = OCRStatus.SKIPPED
            return OCRResult(success=False, error_message="OCR 已禁用或为 dry-run 模式")

        if file_type not in (FileType.PDF, FileType.IMAGE):
            doc_info.metadata.ocr_status = OCRStatus.NOT_APPLICABLE
            return OCRResult(success=False, error_message="文件类型不需要 OCR")

        doc_info.metadata.ocr_status = OCRStatus.PROCESSING
        logger.debug(f"开始 OCR 处理: {source_path.name}")

        try:
            text = None
            if file_type == FileType.IMAGE:
                text = self.extract_text_from_image(source_path)
            elif file_type == FileType.PDF:
                text = self.extract_text_from_pdf(source_path)

            if not text:
                doc_info.metadata.ocr_status = OCRStatus.FAILED
                return OCRResult(success=False, error_message="未能提取到文本内容")

            doc_info.metadata.ocr_text = text[:10000]
            doc_info.metadata.ocr_status = OCRStatus.SUCCESS

            result = OCRResult(success=True, text=text)

            if self.config.enable_keyword_extraction:
                keywords = self.extract_keywords(text)
                result.extracted_fields = keywords
                result.project_code = keywords["project_code"]
                result.contract_code = keywords["contract_code"]
                result.document_date = keywords["document_date"]

                if result.project_code and not doc_info.metadata.project_code:
                    doc_info.metadata.project_code = result.project_code

                if result.contract_code and not doc_info.metadata.contract_code:
                    doc_info.metadata.contract_code = result.contract_code

                if result.document_date and not doc_info.metadata.creation_date:
                    doc_info.metadata.creation_date = result.document_date

            logger.info(f"OCR 处理成功: {source_path.name}")
            return result

        except Exception as e:
            doc_info.metadata.ocr_status = OCRStatus.FAILED
            error_msg = f"OCR 处理失败: {str(e)}"
            logger.warning(f"{error_msg}: {source_path}")
            return OCRResult(success=False, error_message=error_msg)


def create_ocr_config(
    enable_ocr: bool = False,
    languages: str = "chi_sim+eng",
    project_code_pattern: Optional[str] = None,
    contract_code_pattern: Optional[str] = None,
) -> OCRConfig:
    return OCRConfig(
        enable_ocr=enable_ocr,
        languages=languages,
        project_code_pattern=project_code_pattern,
        contract_code_pattern=contract_code_pattern,
    )
