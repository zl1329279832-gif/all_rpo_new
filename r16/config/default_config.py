from enum import Enum
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field


class RiskLevel(Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


DEFAULT_IGNORE_PATTERNS: List[str] = [
    "**/__pycache__/**",
    "**/.git/**",
    "**/.venv/**",
    "**/venv/**",
    "**/node_modules/**",
    "**/dist/**",
    "**/build/**",
    "**/*.egg-info/**",
    "**/.idea/**",
    "**/.vscode/**",
    "**/*.pyc",
    "**/*.pyo",
    "**/*.pyd",
    "**/*.so",
    "**/*.dll",
    "**/.DS_Store",
    "**/Thumbs.db",
    "**/*.log",
    "**/logs/**",
    "**/.cache/**",
]


@dataclass
class RuleConfig:
    name: str
    enabled: bool = True
    severity: str = "medium"
    threshold: Optional[Any] = None
    exclude_patterns: List[str] = field(default_factory=list)
    extra_config: Dict[str, Any] = field(default_factory=dict)


DEFAULT_RULE_CONFIG: Dict[str, RuleConfig] = {
    "directory_structure": RuleConfig(
        name="directory_structure",
        enabled=True,
        severity="medium",
        extra_config={
            "recommended_dirs": ["src", "tests", "docs", "utils"],
            "expected_files": ["README.md", ".gitignore", "requirements.txt"]
        }
    ),
    "empty_file": RuleConfig(
        name="empty_file",
        enabled=True,
        severity="low"
    ),
    "large_file": RuleConfig(
        name="large_file",
        enabled=True,
        severity="medium",
        threshold=10 * 1024 * 1024,
        extra_config={
            "warning_size": 5 * 1024 * 1024,
            "critical_size": 50 * 1024 * 1024
        }
    ),
    "duplicate_file": RuleConfig(
        name="duplicate_file",
        enabled=True,
        severity="medium",
        threshold=3
    ),
    "todo_comment": RuleConfig(
        name="todo_comment",
        enabled=True,
        severity="low",
        extra_config={
            "keywords": ["TODO", "FIXME", "HACK", "BUG", "XXX", "OPTIMIZE"]
        }
    ),
    "sensitive_info": RuleConfig(
        name="sensitive_info",
        enabled=True,
        severity="critical",
        extra_config={
            "patterns": [
                (r"api[_-]?key\s*[=:]\s*['\"]([A-Za-z0-9]{20,})['\"]", "API Key"),
                (r"password\s*[=:]\s*['\"]([^'\"]+)['\"]", "Password"),
                (r"secret\s*[=:]\s*['\"]([^'\"]+)['\"]", "Secret"),
                (r"token\s*[=:]\s*['\"]([A-Za-z0-9]{20,})['\"]", "Token"),
                (r"aws_access_key_id\s*[=:]\s*['\"]([^'\"]+)['\"]", "AWS Access Key"),
                (r"aws_secret_access_key\s*[=:]\s*['\"]([^'\"]+)['\"]", "AWS Secret Key"),
                (r"-----BEGIN (RSA |EC |DSA |ED25519 )?PRIVATE KEY-----", "Private Key"),
                (r"mysql://\w+:[^@]+@", "MySQL Connection String"),
                (r"postgres://\w+:[^@]+@", "PostgreSQL Connection String"),
                (r"mongodb://\w+:[^@]+@", "MongoDB Connection String"),
            ]
        }
    ),
    "dependency": RuleConfig(
        name="dependency",
        enabled=True,
        severity="high",
        extra_config={
            "required_files": ["requirements.txt", "pyproject.toml", "setup.py", "Pipfile"],
            "check_pipfile": True,
            "check_pyproject": True
        }
    ),
    "readme": RuleConfig(
        name="readme",
        enabled=True,
        severity="medium",
        extra_config={
            "min_lines": 10,
            "required_sections": ["## Installation", "## Usage", "# ", "## ", "### "],
            "preferred_files": ["README.md", "README.rst", "README.txt", "readme.md"]
        }
    ),
    "gitignore": RuleConfig(
        name="gitignore",
        enabled=True,
        severity="medium",
        extra_config={
            "recommended_entries": [
                "__pycache__",
                "*.pyc",
                ".venv",
                "venv",
                "dist",
                "build",
                "*.egg-info",
                ".idea",
                ".vscode",
                "*.log",
                "logs",
                ".DS_Store",
                "Thumbs.db"
            ]
        }
    ),
    "log_file": RuleConfig(
        name="log_file",
        enabled=True,
        severity="high",
        extra_config={
            "log_patterns": ["**/*.log", "**/logs/**", "**/*.log.*", "**/log-*/**"]
        }
    )
}


@dataclass
class ScannerConfig:
    scan_path: str = "."
    output_path: str = "./quality_report"
    report_format: str = "markdown"
    ignore_patterns: List[str] = field(default_factory=lambda: list(DEFAULT_IGNORE_PATTERNS))
    extra_ignore_patterns: List[str] = field(default_factory=list)
    rules_config: Dict[str, RuleConfig] = field(default_factory=lambda: dict(DEFAULT_RULE_CONFIG))
    verbosity: int = 1
    fail_on_severity: Optional[str] = None
    max_workers: int = 4
    scan_timeout: int = 300
    
    def get_all_ignore_patterns(self) -> List[str]:
        return list(set(self.ignore_patterns + self.extra_ignore_patterns))


DEFAULT_CONFIG = ScannerConfig()
