import hashlib
from enum import Enum
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from collections import defaultdict


class HashAlgorithm(Enum):
    MD5 = "md5"
    SHA1 = "sha1"
    SHA256 = "sha256"
    SHA512 = "sha512"


def calculate_file_hash(
    file_path: str,
    algorithm: HashAlgorithm = HashAlgorithm.SHA256,
    chunk_size: int = 8192
) -> str:
    hash_obj = _get_hash_object(algorithm)
    
    try:
        with open(file_path, 'rb') as f:
            while chunk := f.read(chunk_size):
                hash_obj.update(chunk)
        return hash_obj.hexdigest()
    except (OSError, PermissionError):
        return ""


def calculate_content_hash(
    content: bytes,
    algorithm: HashAlgorithm = HashAlgorithm.SHA256
) -> str:
    hash_obj = _get_hash_object(algorithm)
    hash_obj.update(content)
    return hash_obj.hexdigest()


def calculate_string_hash(
    text: str,
    algorithm: HashAlgorithm = HashAlgorithm.SHA256,
    encoding: str = 'utf-8'
) -> str:
    content = text.encode(encoding)
    return calculate_content_hash(content, algorithm)


def _get_hash_object(algorithm: HashAlgorithm):
    if algorithm == HashAlgorithm.MD5:
        return hashlib.md5()
    elif algorithm == HashAlgorithm.SHA1:
        return hashlib.sha1()
    elif algorithm == HashAlgorithm.SHA256:
        return hashlib.sha256()
    elif algorithm == HashAlgorithm.SHA512:
        return hashlib.sha512()
    else:
        return hashlib.sha256()


def find_duplicate_files(
    file_paths: List[str],
    algorithm: HashAlgorithm = HashAlgorithm.SHA256,
    min_size: int = 0
) -> Dict[str, List[str]]:
    size_groups: Dict[int, List[str]] = defaultdict(list)
    
    for file_path in file_paths:
        try:
            size = Path(file_path).stat().st_size
            if size >= min_size:
                size_groups[size].append(file_path)
        except (OSError, PermissionError):
            continue
    
    size_groups = {k: v for k, v in size_groups.items() if len(v) > 1}
    
    hash_groups: Dict[str, List[str]] = defaultdict(list)
    
    for size, paths in size_groups.items():
        for file_path in paths:
            file_hash = calculate_file_hash(file_path, algorithm)
            if file_hash:
                hash_groups[file_hash].append(file_path)
    
    duplicates = {k: v for k, v in hash_groups.items() if len(v) > 1}
    
    return duplicates


def find_duplicate_files_by_content(
    file_paths: List[str],
    algorithm: HashAlgorithm = HashAlgorithm.SHA256
) -> List[Tuple[str, List[str]]]:
    duplicates = find_duplicate_files(file_paths, algorithm)
    
    result = []
    for file_hash, paths in duplicates.items():
        sorted_paths = sorted(paths)
        result.append((file_hash, sorted_paths))
    
    return result


def get_file_hash_dict(
    file_paths: List[str],
    algorithm: HashAlgorithm = HashAlgorithm.SHA256
) -> Dict[str, str]:
    hash_dict = {}
    for file_path in file_paths:
        file_hash = calculate_file_hash(file_path, algorithm)
        if file_hash:
            hash_dict[file_path] = file_hash
    return hash_dict


def compare_files(file_path1: str, file_path2: str) -> bool:
    try:
        size1 = Path(file_path1).stat().st_size
        size2 = Path(file_path2).stat().st_size
        if size1 != size2:
            return False
        
        hash1 = calculate_file_hash(file_path1)
        hash2 = calculate_file_hash(file_path2)
        
        return hash1 == hash2
    except (OSError, PermissionError):
        return False


def quick_compare_files(file_path1: str, file_path2: str) -> bool:
    try:
        size1 = Path(file_path1).stat().st_size
        size2 = Path(file_path2).stat().st_size
        if size1 != size2:
            return False
        
        chunk_size = 4096
        with open(file_path1, 'rb') as f1, open(file_path2, 'rb') as f2:
            while True:
                chunk1 = f1.read(chunk_size)
                chunk2 = f2.read(chunk_size)
                if chunk1 != chunk2:
                    return False
                if not chunk1:
                    break
        return True
    except (OSError, PermissionError):
        return False
