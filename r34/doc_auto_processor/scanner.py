from pathlib import Path
from typing import List, Set, Optional
from datetime import datetime

from .logger import get_logger
from .models import DocumentInfo, DocumentMetadata, FileType

logger = get_logger()

FILE_EXTENSIONS = {
    FileType.PDF: {".pdf"},
    FileType.WORD: {".doc", ".docx", ".docm", ".dotx", ".dotm"},
    FileType.EXCEL: {".xls", ".xlsx", ".xlsm", ".xlsb", ".xltx", ".xltm", ".csv"},
    FileType.IMAGE: {
        ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".tif",
        ".webp", ".svg", ".heic", ".raw", ".psd", ".ai",
    },
}

MIME_TYPES = {
    FileType.PDF: "application/pdf",
    FileType.WORD: "application/msword",
    FileType.EXCEL: "application/vnd.ms-excel",
    FileType.IMAGE: "image/*",
}


class FileScanner:
    def __init__(
        self,
        source_dir: Path,
        recursive: bool = True,
        include_hidden: bool = False,
        follow_symlinks: bool = False,
        file_types: Optional[Set[FileType]] = None,
    ) -> None:
        self.source_dir = Path(source_dir)
        self.recursive = recursive
        self.include_hidden = include_hidden
        self.follow_symlinks = follow_symlinks
        self.file_types = file_types or {
            FileType.PDF, FileType.WORD, FileType.EXCEL, FileType.IMAGE
        }
        self._valid_extensions = self._collect_valid_extensions()

    def _collect_valid_extensions(self) -> Set[str]:
        extensions: Set[str] = set()
        for file_type in self.file_types:
            extensions.update(FILE_EXTENSIONS.get(file_type, set()))
        return extensions

    @staticmethod
    def detect_file_type(file_path: Path) -> FileType:
        ext = file_path.suffix.lower()
        for file_type, extensions in FILE_EXTENSIONS.items():
            if ext in extensions:
                return file_type
        return FileType.UNKNOWN

    @staticmethod
    def is_hidden(file_path: Path) -> bool:
        if file_path.name.startswith("."):
            return True
        try:
            import os
            if os.name == "nt":
                import stat
                file_attrs = file_path.stat().st_file_attributes
                return bool(file_attrs & stat.FILE_ATTRIBUTE_HIDDEN)
        except (AttributeError, OSError):
            pass
        return False

    @staticmethod
    def is_empty_dir(dir_path: Path) -> bool:
        try:
            return not any(dir_path.iterdir())
        except (PermissionError, OSError) as e:
            logger.warning(f"无法检查目录是否为空 {dir_path}: {e}")
            return False

    def _extract_basic_metadata(self, file_path: Path) -> DocumentMetadata:
        file_type = self.detect_file_type(file_path)
        metadata = DocumentMetadata(file_type=file_type)

        try:
            stat_result = file_path.stat()
            metadata.file_size = stat_result.st_size
            metadata.creation_date = datetime.fromtimestamp(stat_result.st_ctime)
            metadata.modification_date = datetime.fromtimestamp(stat_result.st_mtime)
        except (PermissionError, OSError) as e:
            logger.warning(f"无法读取文件 stat {file_path}: {e}")

        metadata.mime_type = MIME_TYPES.get(file_type)
        return metadata

    def _should_process_file(self, file_path: Path) -> bool:
        if not file_path.is_file():
            return False

        if not self.include_hidden and self.is_hidden(file_path):
            logger.debug(f"跳过隐藏文件: {file_path}")
            return False

        ext = file_path.suffix.lower()
        if ext not in self._valid_extensions:
            return False

        return True

    def _iter_directory(self, directory: Path) -> List[DocumentInfo]:
        documents: List[DocumentInfo] = []

        try:
            entries = list(directory.iterdir())
        except PermissionError as e:
            logger.error(f"权限不足，无法访问目录 {directory}: {e}")
            return documents
        except OSError as e:
            logger.error(f"访问目录出错 {directory}: {e}")
            return documents

        for entry in entries:
            try:
                if entry.is_dir():
                    if self.is_empty_dir(entry):
                        logger.debug(f"跳过空目录: {entry}")
                        continue
                    if not self.include_hidden and self.is_hidden(entry):
                        logger.debug(f"跳过隐藏目录: {entry}")
                        continue
                    if not self.follow_symlinks and entry.is_symlink():
                        logger.debug(f"跳过符号链接: {entry}")
                        continue
                    if self.recursive:
                        documents.extend(self._iter_directory(entry))
                elif entry.is_file():
                    if self._should_process_file(entry):
                        try:
                            metadata = self._extract_basic_metadata(entry)
                            doc_info = DocumentInfo(
                                source_path=entry,
                                metadata=metadata,
                            )
                            documents.append(doc_info)
                        except Exception as e:
                            logger.error(f"处理文件出错 {entry}: {e}")
                            doc_info = DocumentInfo(
                                source_path=entry,
                                error_message=str(e),
                            )
                            documents.append(doc_info)
            except PermissionError as e:
                logger.error(f"权限不足，无法访问 {entry}: {e}")
            except OSError as e:
                logger.error(f"访问出错 {entry}: {e}")

        return documents

    def scan(self) -> List[DocumentInfo]:
        if not self.source_dir.exists():
            raise FileNotFoundError(f"源目录不存在: {self.source_dir}")

        if not self.source_dir.is_dir():
            raise NotADirectoryError(f"路径不是目录: {self.source_dir}")

        logger.info(f"开始扫描目录: {self.source_dir}")
        logger.info(f"递归扫描: {'是' if self.recursive else '否'}")
        logger.info(f"包含隐藏文件: {'是' if self.include_hidden else '否'}")
        logger.info(f"文件类型: {', '.join(t.value for t in self.file_types)}")

        documents = self._iter_directory(self.source_dir)

        logger.info(f"扫描完成，共发现 {len(documents)} 个文件")
        return documents
