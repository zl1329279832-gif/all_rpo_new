import os
import time
from pathlib import Path
from typing import Dict, List, Any, Optional, Set
from dataclasses import dataclass, field

from utils.file_utils import (
    walk_directory,
    normalize_path,
    get_file_extension,
    get_file_size,
    is_text_file,
    count_file_lines
)
from utils.logger import get_logger


@dataclass
class FileInfo:
    path: str
    relative_path: str
    name: str
    extension: str
    size: int
    is_text: bool
    line_count: int
    discovered_at: float = field(default_factory=time.time)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "path": self.path,
            "relative_path": self.relative_path,
            "name": self.name,
            "extension": self.extension,
            "size": self.size,
            "is_text": self.is_text,
            "line_count": self.line_count,
            "discovered_at": self.discovered_at
        }


@dataclass
class DirectoryInfo:
    path: str
    relative_path: str
    name: str
    file_count: int = 0
    subdir_count: int = 0
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "path": self.path,
            "relative_path": self.relative_path,
            "name": self.name,
            "file_count": self.file_count,
            "subdir_count": self.subdir_count
        }


class FileScanner:
    def __init__(
        self,
        scan_path: str,
        ignore_patterns: List[str] = None,
        logger=None
    ):
        self.scan_path = Path(scan_path).absolute()
        self.ignore_patterns = ignore_patterns or []
        self.logger = logger or get_logger()
        
        self._files: List[FileInfo] = []
        self._directories: List[DirectoryInfo] = []
        self._extensions: Dict[str, int] = {}
        self._total_size: int = 0
        self._total_lines: int = 0
        self._scan_time: float = 0.0
    
    def scan(self) -> Dict[str, Any]:
        start_time = time.time()
        
        self.logger.info(f"开始扫描目录: {self.scan_path}")
        
        if not self.scan_path.exists():
            raise FileNotFoundError(f"扫描路径不存在: {self.scan_path}")
        
        if not self.scan_path.is_dir():
            raise NotADirectoryError(f"扫描路径不是目录: {self.scan_path}")
        
        all_file_paths: List[str] = []
        all_dir_paths: List[str] = []
        
        self.logger.debug(f"忽略规则: {self.ignore_patterns}")
        
        for item_path in walk_directory(
            str(self.scan_path),
            self.ignore_patterns,
            include_dirs=True
        ):
            full_path = self.scan_path / item_path
            
            if full_path.is_file():
                all_file_paths.append(str(full_path))
            elif full_path.is_dir():
                all_dir_paths.append(str(full_path))
        
        self.logger.info(f"发现 {len(all_file_paths)} 个文件, {len(all_dir_paths)} 个目录")
        
        for file_path in all_file_paths:
            try:
                file_info = self._process_file(file_path)
                if file_info:
                    self._files.append(file_info)
                    
                    ext = file_info.extension.lower()
                    if ext:
                        self._extensions[ext] = self._extensions.get(ext, 0) + 1
                    else:
                        self._extensions['(no extension)'] = self._extensions.get('(no extension)', 0) + 1
                    
                    self._total_size += file_info.size
                    self._total_lines += file_info.line_count
            except Exception as e:
                self.logger.warning(f"处理文件时出错 {file_path}: {e}")
        
        for dir_path in all_dir_paths:
            try:
                dir_info = self._process_directory(dir_path)
                if dir_info:
                    self._directories.append(dir_info)
            except Exception as e:
                self.logger.warning(f"处理目录时出错 {dir_path}: {e}")
        
        self._scan_time = time.time() - start_time
        
        self.logger.info(f"扫描完成，耗时 {self._scan_time:.2f} 秒")
        self.logger.info(f"总文件数: {len(self._files)}, 总大小: {self._format_size(self._total_size)}")
        
        return self.get_scan_summary()
    
    def _process_file(self, file_path: str) -> Optional[FileInfo]:
        path_obj = Path(file_path)
        
        try:
            relative_path = str(path_obj.relative_to(self.scan_path))
            relative_path = normalize_path(relative_path)
            
            is_text = is_text_file(file_path)
            size = get_file_size(file_path)
            
            line_count = 0
            if is_text:
                line_count = count_file_lines(file_path)
            
            return FileInfo(
                path=str(path_obj),
                relative_path=relative_path,
                name=path_obj.name,
                extension=path_obj.suffix,
                size=size,
                is_text=is_text,
                line_count=line_count
            )
        except Exception:
            return None
    
    def _process_directory(self, dir_path: str) -> Optional[DirectoryInfo]:
        path_obj = Path(dir_path)
        
        try:
            relative_path = str(path_obj.relative_to(self.scan_path))
            relative_path = normalize_path(relative_path)
            
            file_count = 0
            subdir_count = 0
            
            try:
                for item in path_obj.iterdir():
                    if item.is_file():
                        file_count += 1
                    elif item.is_dir():
                        subdir_count += 1
            except (OSError, PermissionError):
                pass
            
            return DirectoryInfo(
                path=str(path_obj),
                relative_path=relative_path,
                name=path_obj.name,
                file_count=file_count,
                subdir_count=subdir_count
            )
        except Exception:
            return None
    
    def get_scan_summary(self) -> Dict[str, Any]:
        sorted_extensions = sorted(
            self._extensions.items(),
            key=lambda x: x[1],
            reverse=True
        )
        top_extensions = dict(sorted_extensions[:10])
        
        return {
            "scan_path": str(self.scan_path),
            "scan_time_seconds": self._scan_time,
            "total_files": len(self._files),
            "total_directories": len(self._directories),
            "total_size_bytes": self._total_size,
            "total_size_formatted": self._format_size(self._total_size),
            "total_lines": self._total_lines,
            "extensions": self._extensions,
            "top_extensions": top_extensions,
            "text_files_count": sum(1 for f in self._files if f.is_text),
            "binary_files_count": sum(1 for f in self._files if not f.is_text),
        }
    
    def get_files(self) -> List[FileInfo]:
        return self._files
    
    def get_relative_file_paths(self) -> List[str]:
        return [f.relative_path for f in self._files]
    
    def get_relative_directory_paths(self) -> List[str]:
        return [d.relative_path for d in self._directories]
    
    def _format_size(self, size_bytes: int) -> str:
        for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
            if size_bytes < 1024:
                return f"{size_bytes:.2f} {unit}"
            size_bytes /= 1024
        return f"{size_bytes:.2f} PB"
