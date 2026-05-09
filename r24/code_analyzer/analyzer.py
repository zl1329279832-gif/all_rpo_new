from datetime import datetime
from pathlib import Path
from typing import List, Optional, Set

from .models import FileStats, LanguageStats, ProjectStats
from .scanner import get_language, scan_project


COMMENT_STYLES: dict = {
    "line": {
        "Python": "#",
        "Shell": "#",
        "Ruby": "#",
        "YAML": "#",
        "PowerShell": "#",
    },
    "block": {
        "Python": (None, None),
        "JavaScript": ("/*", "*/"),
        "TypeScript": ("/*", "*/"),
        "Java": ("/*", "*/"),
        "C/C++": ("/*", "*/"),
        "C#": ("/*", "*/"),
        "Go": ("/*", "*/"),
        "Rust": ("/*", "*/"),
        "PHP": ("/*", "*/"),
        "CSS": ("/*", "*/"),
        "Swift": ("/*", "*/"),
        "Kotlin": ("/*", "*/"),
        "SQL": ("/*", "*/"),
    },
    "alternate_line": {
        "HTML": "<!--",
        "XML": "<!--",
        "PHP": "//",
    },
    "alternate_block": {
        "HTML": ("<!--", "-->"),
        "XML": ("<!--", "-->"),
    },
    "py_string": {
        "Python": ['"""', "'''"],
    }
}


def try_get_encoding(file_path: Path) -> Optional[str]:
    encodings = ["utf-8", "utf-8-sig", "gbk", "gb2312", "latin-1"]
    for encoding in encodings:
        try:
            with open(file_path, "r", encoding=encoding) as f:
                f.read(1024)
            return encoding
        except (UnicodeDecodeError, UnicodeError):
            continue
        except (PermissionError, OSError):
            return None
    return None


def analyze_file(file_path: Path) -> Optional[FileStats]:
    try:
        file_stat = file_path.stat()
    except (PermissionError, OSError):
        return None

    language = get_language(file_path)
    file_size_bytes = file_stat.st_size
    last_modified = datetime.fromtimestamp(file_stat.st_mtime)

    encoding = try_get_encoding(file_path)
    if encoding is None:
        return FileStats(
            file_path=file_path,
            language=language,
            total_lines=0,
            code_lines=0,
            comment_lines=0,
            blank_lines=0,
            file_size_bytes=file_size_bytes,
            last_modified=last_modified,
            encoding=None,
        )

    total_lines = 0
    code_lines = 0
    comment_lines = 0
    blank_lines = 0

    try:
        with open(file_path, "r", encoding=encoding) as f:
            lines = f.readlines()
    except (PermissionError, OSError):
        return FileStats(
            file_path=file_path,
            language=language,
            total_lines=0,
            code_lines=0,
            comment_lines=0,
            blank_lines=0,
            file_size_bytes=file_size_bytes,
            last_modified=last_modified,
            encoding=encoding,
        )

    line_comment = COMMENT_STYLES["line"].get(language)
    block_start, block_end = COMMENT_STYLES["block"].get(language, (None, None))
    alt_line_comment = COMMENT_STYLES["alternate_line"].get(language)
    alt_block_start, alt_block_end = COMMENT_STYLES["alternate_block"].get(language, (None, None))
    py_strings = COMMENT_STYLES["py_string"].get(language, [])

    in_block_comment = False
    current_block_start = None
    current_block_end = None
    in_py_string = False
    current_py_string = None

    for line in lines:
        total_lines += 1
        stripped = line.strip()

        if not stripped:
            blank_lines += 1
            continue

        if in_block_comment:
            comment_lines += 1
            if current_block_end and current_block_end in line:
                in_block_comment = False
                current_block_start = None
                current_block_end = None
            continue

        if in_py_string:
            comment_lines += 1
            if current_py_string in line:
                in_py_string = False
                current_py_string = None
            continue

        is_comment = False

        if py_strings:
            for py_str in py_strings:
                if stripped.startswith(py_str):
                    comment_lines += 1
                    if line.count(py_str) < 2:
                        in_py_string = True
                        current_py_string = py_str
                    is_comment = True
                    break

        if is_comment:
            continue

        if block_start and block_start in stripped:
            comment_lines += 1
            if block_end not in line:
                in_block_comment = True
                current_block_start = block_start
                current_block_end = block_end
            is_comment = True

        if not is_comment and alt_block_start and alt_block_start in stripped:
            comment_lines += 1
            if alt_block_end not in line:
                in_block_comment = True
                current_block_start = alt_block_start
                current_block_end = alt_block_end
            is_comment = True

        if not is_comment and line_comment and stripped.startswith(line_comment):
            comment_lines += 1
            is_comment = True

        if not is_comment and alt_line_comment and stripped.startswith(alt_line_comment):
            comment_lines += 1
            is_comment = True

        if not is_comment:
            code_lines += 1

    return FileStats(
        file_path=file_path,
        language=language,
        total_lines=total_lines,
        code_lines=code_lines,
        comment_lines=comment_lines,
        blank_lines=blank_lines,
        file_size_bytes=file_size_bytes,
        last_modified=last_modified,
        encoding=encoding,
    )


def analyze_project(
    project_path: Path,
    ignore_dirs: Set[str] | None = None,
    ignore_patterns: Set[str] | None = None,
    extensions: Set[str] | None = None,
) -> ProjectStats:
    project_stats = ProjectStats(project_path=project_path)
    files = scan_project(
        project_path=project_path,
        ignore_dirs=ignore_dirs,
        ignore_patterns=ignore_patterns,
        extensions=extensions,
    )

    file_stats_list: List[FileStats] = []

    for file_path in files:
        file_stats = analyze_file(file_path)
        if file_stats:
            file_stats_list.append(file_stats)

    language_stats: dict[str, LanguageStats] = {}

    for file_stat in file_stats_list:
        language = file_stat.language
        if language not in language_stats:
            language_stats[language] = LanguageStats(
                language=language,
                file_count=0,
                total_lines=0,
                code_lines=0,
                comment_lines=0,
                blank_lines=0,
                total_size_bytes=0,
            )

        lang_stat = language_stats[language]
        lang_stat.file_count += 1
        lang_stat.total_lines += file_stat.total_lines
        lang_stat.code_lines += file_stat.code_lines
        lang_stat.comment_lines += file_stat.comment_lines
        lang_stat.blank_lines += file_stat.blank_lines
        lang_stat.total_size_bytes += file_stat.file_size_bytes

        project_stats.total_files += 1
        project_stats.total_lines += file_stat.total_lines
        project_stats.code_lines += file_stat.code_lines
        project_stats.comment_lines += file_stat.comment_lines
        project_stats.blank_lines += file_stat.blank_lines
        project_stats.total_size_bytes += file_stat.file_size_bytes

    project_stats.language_stats = language_stats
    project_stats.file_stats = file_stats_list

    return project_stats
