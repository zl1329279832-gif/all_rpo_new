import logging
import sys
from pathlib import Path
from typing import Optional
from logging.handlers import RotatingFileHandler

from colorama import Fore, Style, init

init(autoreset=True)

LOG_LEVELS = {
    "DEBUG": logging.DEBUG,
    "INFO": logging.INFO,
    "WARNING": logging.WARNING,
    "ERROR": logging.ERROR,
    "CRITICAL": logging.CRITICAL,
}


class ColoredFormatter(logging.Formatter):
    _LEVEL_COLORS = {
        logging.DEBUG: Fore.CYAN,
        logging.INFO: Fore.GREEN,
        logging.WARNING: Fore.YELLOW,
        logging.ERROR: Fore.RED,
        logging.CRITICAL: Fore.RED + Style.BRIGHT,
    }

    def format(self, record: logging.LogRecord) -> str:
        log_color = self._LEVEL_COLORS.get(record.levelno, "")
        level_name = record.levelname
        colored_level = f"{log_color}{level_name:<8}{Style.RESET_ALL}"

        message = super().format(record)
        return message.replace(level_name, colored_level, 1)


class LoggerManager:
    _instance: Optional["LoggerManager"] = None
    _initialized = False

    def __new__(cls) -> "LoggerManager":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self) -> None:
        if self._initialized:
            return
        self._initialized = True
        self._log_dir: Optional[Path] = None
        self._file_handler: Optional[RotatingFileHandler] = None
        self._console_handler: Optional[logging.StreamHandler] = None
        self.logger = logging.getLogger("doc_auto_processor")
        self.logger.setLevel(logging.INFO)
        self.logger.propagate = False

    def setup(
        self,
        log_level: str = "INFO",
        log_dir: Optional[Path] = None,
        log_file: str = "doc_processor.log",
    ) -> None:
        for handler in list(self.logger.handlers):
            self.logger.removeHandler(handler)

        level = LOG_LEVELS.get(log_level.upper(), logging.INFO)
        self.logger.setLevel(level)

        console_format = "%(asctime)s | %(levelname)-8s | %(message)s"
        console_formatter = ColoredFormatter(
            console_format, datefmt="%Y-%m-%d %H:%M:%S"
        )
        self._console_handler = logging.StreamHandler(sys.stdout)
        self._console_handler.setLevel(level)
        self._console_handler.setFormatter(console_formatter)
        self.logger.addHandler(self._console_handler)

        if log_dir is not None:
            self._log_dir = Path(log_dir)
            self._log_dir.mkdir(parents=True, exist_ok=True)
            log_path = self._log_dir / log_file

            file_format = (
                "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
            )
            file_formatter = logging.Formatter(
                file_format, datefmt="%Y-%m-%d %H:%M:%S"
            )
            self._file_handler = RotatingFileHandler(
                log_path,
                maxBytes=10 * 1024 * 1024,
                backupCount=5,
                encoding="utf-8",
            )
            self._file_handler.setLevel(level)
            self._file_handler.setFormatter(file_formatter)
            self.logger.addHandler(self._file_handler)

    def get_logger(self) -> logging.Logger:
        return self.logger

    def set_level(self, log_level: str) -> None:
        level = LOG_LEVELS.get(log_level.upper(), logging.INFO)
        self.logger.setLevel(level)
        if self._console_handler is not None:
            self._console_handler.setLevel(level)
        if self._file_handler is not None:
            self._file_handler.setLevel(level)

    def close(self) -> None:
        for handler in list(self.logger.handlers):
            handler.close()
            self.logger.removeHandler(handler)
        self._file_handler = None
        self._console_handler = None


def get_logger() -> logging.Logger:
    return LoggerManager().get_logger()


def setup_logger(
    log_level: str = "INFO",
    log_dir: Optional[Path] = None,
    log_file: str = "doc_processor.log",
) -> None:
    LoggerManager().setup(log_level=log_level, log_dir=log_dir, log_file=log_file)


def close_logger() -> None:
    LoggerManager().close()
