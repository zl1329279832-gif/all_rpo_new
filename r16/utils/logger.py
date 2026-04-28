import sys
import logging
from enum import Enum
from typing import Optional, Dict, Any
from datetime import datetime
from pathlib import Path


class LogLevel(Enum):
    DEBUG = logging.DEBUG
    INFO = logging.INFO
    WARNING = logging.WARNING
    ERROR = logging.ERROR
    CRITICAL = logging.CRITICAL


class ColoredFormatter(logging.Formatter):
    COLORS = {
        'DEBUG': '\033[94m',
        'INFO': '\033[92m',
        'WARNING': '\033[93m',
        'ERROR': '\033[91m',
        'CRITICAL': '\033[95m',
        'RESET': '\033[0m'
    }
    
    def format(self, record):
        level_name = record.levelname
        if sys.stdout.isatty() or 'colored' in str(getattr(sys.stdout, '__class__', '')):
            color = self.COLORS.get(level_name, self.COLORS['INFO'])
            reset = self.COLORS['RESET']
            record.levelname = f"{color}{level_name}{reset}"
            
            message = super().format(record)
            if record.levelno >= logging.WARNING:
                message = f"{color}{message}{reset}"
            return message
        return super().format(record)


_loggers: Dict[str, logging.Logger] = {}
_default_logger: Optional[logging.Logger] = None
_configured: bool = False


def setup_logger(
    name: str = "quality_scanner",
    level: int = logging.INFO,
    log_file: Optional[str] = None,
    format_string: Optional[str] = None,
    colored: bool = True
) -> logging.Logger:
    global _default_logger, _configured
    
    if _configured and name in _loggers:
        return _loggers[name]
    
    logger = logging.getLogger(name)
    logger.setLevel(level)
    logger.handlers.clear()
    
    if format_string is None:
        format_string = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(level)
    
    if colored:
        console_handler.setFormatter(ColoredFormatter(format_string))
    else:
        console_handler.setFormatter(logging.Formatter(format_string))
    
    logger.addHandler(console_handler)
    
    if log_file:
        log_path = Path(log_file)
        log_path.parent.mkdir(parents=True, exist_ok=True)
        
        file_handler = logging.FileHandler(log_file, encoding='utf-8')
        file_handler.setLevel(level)
        file_handler.setFormatter(logging.Formatter(format_string))
        logger.addHandler(file_handler)
    
    _loggers[name] = logger
    
    if _default_logger is None:
        _default_logger = logger
    
    _configured = True
    
    return logger


def get_logger(name: Optional[str] = None) -> logging.Logger:
    global _default_logger
    
    if name is None:
        if _default_logger is None:
            _default_logger = setup_logger()
        return _default_logger
    
    if name in _loggers:
        return _loggers[name]
    
    logger = setup_logger(name)
    return logger


def set_log_level(level: int) -> None:
    for logger in _loggers.values():
        logger.setLevel(level)
        for handler in logger.handlers:
            handler.setLevel(level)


def verbosity_to_level(verbosity: int) -> int:
    if verbosity <= 0:
        return logging.ERROR
    elif verbosity == 1:
        return logging.WARNING
    elif verbosity == 2:
        return logging.INFO
    elif verbosity >= 3:
        return logging.DEBUG
    return logging.INFO


def get_scan_stats_summary(
    files_scanned: int,
    issues_found: int,
    scan_time: float,
    errors: int = 0
) -> str:
    return (
        f"Scan completed in {scan_time:.2f}s. "
        f"Files: {files_scanned}, Issues: {issues_found}, Errors: {errors}"
    )
