from enum import Enum
from typing import Dict, List, Any, Optional, Type
from pathlib import Path

from .base_reporter import BaseReporter
from .markdown_reporter import MarkdownReporter
from .json_reporter import JsonReporter
from scanner.project_scanner import ScanResult


class ReportFormat(Enum):
    MARKDOWN = "markdown"
    JSON = "json"
    BOTH = "both"


class ReportGenerator:
    _reporters: Dict[ReportFormat, Type[BaseReporter]] = {
        ReportFormat.MARKDOWN: MarkdownReporter,
        ReportFormat.JSON: JsonReporter
    }
    
    _extensions: Dict[ReportFormat, str] = {
        ReportFormat.MARKDOWN: ".md",
        ReportFormat.JSON: ".json"
    }
    
    def __init__(
        self,
        output_path: Optional[str] = None,
        format: ReportFormat = ReportFormat.MARKDOWN
    ):
        self.output_path = output_path
        self.format = format
    
    def generate(
        self,
        scan_result: ScanResult,
        output_path: Optional[str] = None,
        format: Optional[ReportFormat] = None
    ) -> List[str]:
        output_path = output_path or self.output_path
        format = format or self.format
        
        generated_files: List[str] = []
        
        if format == ReportFormat.BOTH:
            formats_to_generate = [ReportFormat.MARKDOWN, ReportFormat.JSON]
        else:
            formats_to_generate = [format]
        
        for fmt in formats_to_generate:
            reporter_class = self._reporters.get(fmt)
            if not reporter_class:
                continue
            
            reporter = reporter_class()
            
            content = reporter.generate(scan_result)
            
            if output_path:
                file_path = self._prepare_output_path(output_path, fmt)
                saved_path = reporter.save(content, file_path)
                generated_files.append(saved_path)
        
        return generated_files
    
    def generate_content(
        self,
        scan_result: ScanResult,
        format: Optional[ReportFormat] = None
    ) -> Dict[ReportFormat, str]:
        format = format or self.format
        
        contents: Dict[ReportFormat, str] = {}
        
        if format == ReportFormat.BOTH:
            formats_to_generate = [ReportFormat.MARKDOWN, ReportFormat.JSON]
        else:
            formats_to_generate = [format]
        
        for fmt in formats_to_generate:
            reporter_class = self._reporters.get(fmt)
            if reporter_class:
                reporter = reporter_class()
                contents[fmt] = reporter.generate(scan_result)
        
        return contents
    
    def _prepare_output_path(
        self,
        base_path: str,
        format: ReportFormat
    ) -> str:
        path = Path(base_path)
        
        if path.suffix:
            return str(path)
        
        extension = self._extensions.get(format, "")
        timestamp = ""
        
        if base_path.endswith('/') or base_path.endswith('\\'):
            path = path / f"quality_report{timestamp}{extension}"
        else:
            path = path.parent / f"{path.name}{timestamp}{extension}"
        
        return str(path)
    
    @classmethod
    def get_supported_formats(cls) -> List[str]:
        return [fmt.value for fmt in ReportFormat]
    
    @classmethod
    def get_format_extension(cls, format: ReportFormat) -> str:
        return cls._extensions.get(format, "")
    
    @staticmethod
    def format_from_string(format_str: str) -> ReportFormat:
        try:
            return ReportFormat(format_str.lower())
        except ValueError:
            return ReportFormat.MARKDOWN
