import os
import re
from pathlib import Path
from typing import List, Iterator, Optional, Set, Callable
from fnmatch import fnmatchcase


def get_file_size(file_path: str) -> int:
    try:
        return os.path.getsize(file_path)
    except (OSError, PermissionError):
        return 0


def is_text_file(file_path: str) -> bool:
    text_extensions = {
        '.py', '.js', '.ts', '.jsx', '.tsx', '.java', '.c', '.cpp', '.h', '.hpp',
        '.go', '.rs', '.rb', '.php', '.swift', '.kt', '.scala',
        '.html', '.css', '.scss', '.sass', '.less',
        '.json', '.xml', '.yaml', '.yml', '.toml', '.ini',
        '.md', '.rst', '.txt', '.log',
        '.sh', '.bat', '.ps1',
        '.sql', '.graphql',
        '.vue', '.svelte', '.astro'
    }
    ext = get_file_extension(file_path).lower()
    if ext in text_extensions:
        return True
    
    try:
        with open(file_path, 'rb') as f:
            chunk = f.read(1024)
            if not chunk:
                return True
            if b'\x00' in chunk:
                return False
            try:
                chunk.decode('utf-8')
                return True
            except UnicodeDecodeError:
                try:
                    chunk.decode('latin-1')
                    return True
                except UnicodeDecodeError:
                    return False
    except (OSError, PermissionError):
        return False
    return False


def get_file_extension(file_path: str) -> str:
    return Path(file_path).suffix


def normalize_path(file_path: str) -> str:
    normalized = Path(file_path).as_posix()
    if normalized.startswith('./'):
        normalized = normalized[2:]
    elif normalized.startswith('.\\'):
        normalized = normalized[2:]
    return normalized


def match_glob_pattern(path: str, pattern: str) -> bool:
    normalized = normalize_path(path)
    
    if pattern.startswith('**/'):
        pattern = pattern[3:]
        for i in range(len(normalized.split('/'))):
            test_path = '/'.join(normalized.split('/')[i:])
            if fnmatchcase(test_path, pattern) or fnmatchcase(normalized, pattern):
                return True
    elif pattern.endswith('/**'):
        prefix = pattern[:-3]
        if normalized == prefix or normalized.startswith(prefix + '/'):
            return True
    elif pattern.startswith('**'):
        pattern = pattern[2:]
        if normalized.endswith(pattern):
            return True
    
    if fnmatchcase(normalized, pattern):
        return True
    
    path_parts = normalized.split('/')
    for i in range(len(path_parts)):
        partial = '/'.join(path_parts[:i+1])
        if fnmatchcase(partial, pattern):
            return True
    
    return False


def should_ignore_path(path: str, ignore_patterns: List[str]) -> bool:
    normalized = normalize_path(path)
    
    for pattern in ignore_patterns:
        if match_glob_pattern(normalized, pattern):
            return True
        
        path_parts = normalized.split('/')
        for i in range(len(path_parts)):
            partial = '/'.join(path_parts[:i+1])
            if match_glob_pattern(partial, pattern):
                return True
    
    return False


def walk_directory(
    root_path: str,
    ignore_patterns: List[str],
    include_dirs: bool = False
) -> Iterator[str]:
    root = Path(root_path)
    if not root.exists():
        raise FileNotFoundError(f"Directory not found: {root_path}")
    
    for dirpath, dirnames, filenames in os.walk(root, followlinks=False):
        dirs_to_remove = []
        for dirname in dirnames:
            full_path = os.path.join(dirpath, dirname)
            relative = os.path.relpath(full_path, root)
            if should_ignore_path(relative, ignore_patterns):
                dirs_to_remove.append(dirname)
        
        for d in dirs_to_remove:
            dirnames.remove(d)
        
        if include_dirs:
            for dirname in dirnames:
                full_path = os.path.join(dirpath, dirname)
                relative = os.path.relpath(full_path, root)
                if not should_ignore_path(relative, ignore_patterns):
                    yield normalize_path(full_path)
        
        for filename in filenames:
            full_path = os.path.join(dirpath, filename)
            relative = os.path.relpath(full_path, root)
            if not should_ignore_path(relative, ignore_patterns):
                yield normalize_path(full_path)


def get_file_lines(file_path: str, encoding: str = 'utf-8') -> List[str]:
    try:
        with open(file_path, 'r', encoding=encoding) as f:
            return f.readlines()
    except (OSError, PermissionError, UnicodeDecodeError):
        try:
            with open(file_path, 'r', encoding='latin-1') as f:
                return f.readlines()
        except (OSError, PermissionError, UnicodeDecodeError):
            return []


def count_file_lines(file_path: str) -> int:
    lines = get_file_lines(file_path)
    return len(lines)


def is_empty_file(file_path: str) -> bool:
    try:
        size = get_file_size(file_path)
        if size == 0:
            return True
        lines = get_file_lines(file_path)
        for line in lines:
            if line.strip():
                return False
        return True
    except (OSError, PermissionError):
        return False


def get_common_directory(paths: List[str]) -> str:
    if not paths:
        return ""
    
    normalized_paths = [normalize_path(p) for p in paths]
    split_paths = [p.split('/') for p in normalized_paths]
    
    min_length = min(len(p) for p in split_paths)
    common_parts = []
    
    for i in range(min_length):
        parts = {p[i] for p in split_paths}
        if len(parts) == 1:
            common_parts.append(next(iter(parts)))
        else:
            break
    
    return '/'.join(common_parts)
