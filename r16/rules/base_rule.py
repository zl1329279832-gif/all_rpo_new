from abc import ABC, abstractmethod
from enum import Enum
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Type, TypeVar
from pathlib import Path
from datetime import datetime


class RuleSeverity(Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"
    
    def to_score(self) -> int:
        score_map = {
            RuleSeverity.CRITICAL: 100,
            RuleSeverity.HIGH: 50,
            RuleSeverity.MEDIUM: 20,
            RuleSeverity.LOW: 5,
            RuleSeverity.INFO: 1
        }
        return score_map.get(self, 1)
    
    @classmethod
    def from_string(cls, severity_str: str) -> 'RuleSeverity':
        try:
            return cls[severity_str.upper()]
        except KeyError:
            return cls.MEDIUM


class RuleCategory(Enum):
    STRUCTURE = "structure"
    CONTENT = "content"
    SECURITY = "security"
    DEPENDENCY = "dependency"
    DOCUMENTATION = "documentation"
    GIT = "git"
    FILE_QUALITY = "file_quality"


@dataclass
class IssueLocation:
    file_path: str
    line_number: Optional[int] = None
    column: Optional[int] = None
    context: Optional[str] = None
    end_line: Optional[int] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "file_path": self.file_path,
            "line_number": self.line_number,
            "column": self.column,
            "context": self.context,
            "end_line": self.end_line
        }


@dataclass
class Issue:
    rule_name: str
    severity: RuleSeverity
    category: RuleCategory
    message: str
    location: Optional[IssueLocation] = None
    suggestion: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    discovered_at: datetime = field(default_factory=datetime.now)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "rule_name": self.rule_name,
            "severity": self.severity.value,
            "category": self.category.value,
            "message": self.message,
            "location": self.location.to_dict() if self.location else None,
            "suggestion": self.suggestion,
            "metadata": self.metadata,
            "discovered_at": self.discovered_at.isoformat()
        }
    
    def get_score(self) -> int:
        return self.severity.to_score()


@dataclass
class RuleResult:
    rule_name: str
    rule_display_name: str
    category: RuleCategory
    passed: bool
    issues: List[Issue] = field(default_factory=list)
    summary: str = ""
    stats: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "rule_name": self.rule_name,
            "rule_display_name": self.rule_display_name,
            "category": self.category.value,
            "passed": self.passed,
            "issues": [issue.to_dict() for issue in self.issues],
            "summary": self.summary,
            "stats": self.stats,
            "issue_count": len(self.issues)
        }
    
    def get_total_score(self) -> int:
        return sum(issue.get_score() for issue in self.issues)


T = TypeVar('T', bound='BaseRule')


class BaseRule(ABC):
    name: str = "base_rule"
    display_name: str = "Base Rule"
    description: str = "Base rule class"
    category: RuleCategory = RuleCategory.FILE_QUALITY
    default_severity: RuleSeverity = RuleSeverity.MEDIUM
    
    def __init__(
        self,
        enabled: bool = True,
        severity: Optional[RuleSeverity] = None,
        exclude_patterns: List[str] = None,
        extra_config: Dict[str, Any] = None
    ):
        self.enabled = enabled
        self.severity = severity or self.default_severity
        self.exclude_patterns = exclude_patterns or []
        self.extra_config = extra_config or {}
        self._issues: List[Issue] = []
        self._stats: Dict[str, Any] = {}
    
    @abstractmethod
    def execute(self, context: Dict[str, Any]) -> RuleResult:
        pass
    
    def should_exclude(self, file_path: str) -> bool:
        from utils.file_utils import match_glob_pattern
        for pattern in self.exclude_patterns:
            if match_glob_pattern(file_path, pattern):
                return True
        return False
    
    def add_issue(
        self,
        message: str,
        file_path: Optional[str] = None,
        line_number: Optional[int] = None,
        column: Optional[int] = None,
        context: Optional[str] = None,
        suggestion: Optional[str] = None,
        severity_override: Optional[RuleSeverity] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Issue:
        location = None
        if file_path:
            location = IssueLocation(
                file_path=file_path,
                line_number=line_number,
                column=column,
                context=context
            )
        
        issue = Issue(
            rule_name=self.name,
            severity=severity_override or self.severity,
            category=self.category,
            message=message,
            location=location,
            suggestion=suggestion,
            metadata=metadata or {}
        )
        
        self._issues.append(issue)
        return issue
    
    def update_stats(self, key: str, value: Any) -> None:
        self._stats[key] = value
    
    def get_config_value(self, key: str, default: Any = None) -> Any:
        return self.extra_config.get(key, default)
    
    def create_result(
        self,
        passed: bool,
        summary: str = "",
        extra_stats: Optional[Dict[str, Any]] = None
    ) -> RuleResult:
        if extra_stats:
            self._stats.update(extra_stats)
        
        return RuleResult(
            rule_name=self.name,
            rule_display_name=self.display_name,
            category=self.category,
            passed=passed,
            issues=list(self._issues),
            summary=summary,
            stats=dict(self._stats)
        )
    
    def reset(self) -> None:
        self._issues.clear()
        self._stats.clear()
    
    @classmethod
    def from_config(cls: Type[T], rule_config: 'RuleConfig') -> T:
        severity = RuleSeverity.from_string(rule_config.severity)
        return cls(
            enabled=rule_config.enabled,
            severity=severity,
            exclude_patterns=rule_config.exclude_patterns,
            extra_config=rule_config.extra_config
        )
