from .file_utils import (
    get_file_size,
    is_text_file,
    get_file_extension,
    normalize_path,
    should_ignore_path,
    match_glob_pattern,
    walk_directory
)
from .hash_utils import (
    calculate_file_hash,
    calculate_content_hash,
    find_duplicate_files,
    HashAlgorithm
)
from .logger import setup_logger, get_logger, LogLevel

__all__ = [
    'get_file_size',
    'is_text_file',
    'get_file_extension',
    'normalize_path',
    'should_ignore_path',
    'match_glob_pattern',
    'walk_directory',
    'calculate_file_hash',
    'calculate_content_hash',
    'find_duplicate_files',
    'HashAlgorithm',
    'setup_logger',
    'get_logger',
    'LogLevel'
]
