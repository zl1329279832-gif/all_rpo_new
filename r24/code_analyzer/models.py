from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional


@dataclass
class FileStats:
    file_path: Path
    language: str
    total_lines: int
    code_lines: int
    comment_lines: int
    blank_lines: int
    file_size_bytes: int
    last_modified: datetime
    encoding: Optional[str] = None

    @property
    def file_size_kb(self) -> float:
        return round(self.file_size_bytes / 1024, 2)


@dataclass
class LanguageStats:
    language: str
    file_count: int
    total_lines: int
    code_lines: int
    comment_lines: int
    blank_lines: int
    total_size_bytes: int

    @property
    def avg_lines_per_file(self) -> float:
        return round(self.total_lines / self.file_count, 1) if self.file_count > 0 else 0.0

    @property
    def total_size_kb(self) -> float:
        return round(self.total_size_bytes / 1024, 2)


@dataclass
class ProjectStats:
    project_path: Path
    total_files: int = 0
    total_lines: int = 0
    code_lines: int = 0
    comment_lines: int = 0
    blank_lines: int = 0
    total_size_bytes: int = 0
    language_stats: Dict[str, LanguageStats] = field(default_factory=dict)
    file_stats: List[FileStats] = field(default_factory=list)
    scan_time: datetime = field(default_factory=datetime.now)

    def get_largest_file(self) -> Optional[FileStats]:
        if not self.file_stats:
            return None
        return max(self.file_stats, key=lambda f: f.file_size_bytes)

    def get_recently_modified(self) -> Optional[FileStats]:
        if not self.file_stats:
            return None
        return max(self.file_stats, key=lambda f: f.last_modified)

    def get_most_lines_file(self) -> Optional[FileStats]:
        if not self.file_stats:
            return None
        return max(self.file_stats, key=lambda f: f.total_lines)

    def get_code_ratio(self) -> float:
        if self.total_lines == 0:
            return 0.0
        return round((self.code_lines / self.total_lines) * 100, 1)

    def get_comment_ratio(self) -> float:
        if self.total_lines == 0:
            return 0.0
        return round((self.comment_lines / self.total_lines) * 100, 1)

    def get_blank_ratio(self) -> float:
        if self.total_lines == 0:
            return 0.0
        return round((self.blank_lines / self.total_lines) * 100, 1)

    @property
    def total_size_kb(self) -> float:
        return round(self.total_size_bytes / 1024, 2)

    @property
    def total_size_mb(self) -> float:
        return round(self.total_size_bytes / (1024 * 1024), 2)
