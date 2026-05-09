from pathlib import Path
from typing import List, Set


DEFAULT_IGNORE_DIRS: Set[str] = {
    ".venv", "venv", "__pycache__", "dist", "build", ".git",
    ".idea", ".vscode", "node_modules", "target", ".eggs",
    ".pytest_cache", ".mypy_cache", ".tox", "logs",
}

DEFAULT_IGNORE_PATTERNS: Set[str] = {
    "*.egg-info", "*.pyc", "*.pyo", "*.pyd", ".Python", "*.egg",
    "*.json", "*.csv", "*.log", "*.egg-info/", "*.swp", "*.swo",
}


LANGUAGE_EXTENSIONS: dict = {
    "Python": {".py", ".pyw"},
    "JavaScript": {".js", ".jsx"},
    "TypeScript": {".ts", ".tsx"},
    "HTML": {".html", ".htm"},
    "CSS": {".css", ".scss", ".sass", ".less"},
    "Java": {".java"},
    "C/C++": {".c", ".cpp", ".cc", ".h", ".hpp", ".hh"},
    "C#": {".cs"},
    "Go": {".go"},
    "Rust": {".rs"},
    "PHP": {".php"},
    "Ruby": {".rb"},
    "Swift": {".swift"},
    "Kotlin": {".kt", ".kts"},
    "Shell": {".sh", ".bash", ".zsh"},
    "PowerShell": {".ps1", ".psm1", ".psd1"},
    "SQL": {".sql"},
    "YAML": {".yaml", ".yml"},
    "JSON": {".json"},
    "XML": {".xml"},
    "Markdown": {".md", ".markdown"},
    "Text": {".txt"},
    "Other": set(),
}


def get_language(file_path: Path) -> str:
    extension = file_path.suffix.lower()
    for language, extensions in LANGUAGE_EXTENSIONS.items():
        if extension in extensions:
            return language
    if extension:
        return "Other"
    return "Other"


def should_ignore_dir(dir_name: str, ignore_dirs: Set[str]) -> bool:
    return dir_name in ignore_dirs


def should_ignore_pattern(path: Path, patterns: Set[str]) -> bool:
    import fnmatch
    path_str = str(path)
    name = path.name
    for pattern in patterns:
        if fnmatch.fnmatch(name, pattern) or fnmatch.fnmatch(path_str, pattern):
            return True
    return False


def scan_project(
    project_path: Path,
    ignore_dirs: Set[str] | None = None,
    ignore_patterns: Set[str] | None = None,
    extensions: Set[str] | None = None,
) -> List[Path]:
    if not project_path.exists():
        raise FileNotFoundError(f"项目路径不存在: {project_path}")

    if not project_path.is_dir():
        raise NotADirectoryError(f"路径不是目录: {project_path}")

    actual_ignore_dirs = DEFAULT_IGNORE_DIRS.union(ignore_dirs or set())
    actual_ignore_patterns = DEFAULT_IGNORE_PATTERNS.union(ignore_patterns or set())

    files: List[Path] = []

    def walk_directory(current_path: Path):
        try:
            for item in current_path.iterdir():
                if item.is_dir():
                    if not should_ignore_dir(item.name, actual_ignore_dirs):
                        walk_directory(item)
                elif item.is_file():
                    if should_ignore_pattern(item, actual_ignore_patterns):
                        continue
                    if extensions:
                        if item.suffix.lower() in extensions:
                            files.append(item)
                    else:
                        files.append(item)
        except (PermissionError, OSError):
            pass

    walk_directory(project_path)
    return files
