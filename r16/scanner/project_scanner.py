import time
from pathlib import Path
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime

from config.default_config import ScannerConfig
from scanner.file_scanner import FileScanner
from rules.base_rule import BaseRule, RuleResult, Issue
from rules.rule_registry import RuleRegistry
from utils.logger import get_logger


@dataclass
class RiskAssessment:
    total_score: int = 0
    max_score: int = 0
    risk_level: str = "info"
    issue_breakdown: Dict[str, int] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "total_score": self.total_score,
            "max_score": self.max_score,
            "risk_level": self.risk_level,
            "issue_breakdown": self.issue_breakdown
        }


@dataclass
class ScanResult:
    scan_path: str
    scan_timestamp: datetime = field(default_factory=datetime.now)
    scan_duration_seconds: float = 0.0
    scan_summary: Dict[str, Any] = field(default_factory=dict)
    rule_results: List[RuleResult] = field(default_factory=list)
    risk_assessment: Optional[RiskAssessment] = None
    errors: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "scan_path": self.scan_path,
            "scan_timestamp": self.scan_timestamp.isoformat(),
            "scan_duration_seconds": self.scan_duration_seconds,
            "scan_summary": self.scan_summary,
            "rule_results": [r.to_dict() for r in self.rule_results],
            "risk_assessment": self.risk_assessment.to_dict() if self.risk_assessment else None,
            "errors": self.errors,
            "total_issues": self.get_total_issues(),
            "passed_rules": self.get_passed_rules_count(),
            "failed_rules": self.get_failed_rules_count()
        }
    
    def get_total_issues(self) -> int:
        return sum(len(r.issues) for r in self.rule_results)
    
    def get_passed_rules_count(self) -> int:
        return sum(1 for r in self.rule_results if r.passed)
    
    def get_failed_rules_count(self) -> int:
        return sum(1 for r in self.rule_results if not r.passed)
    
    def get_issues_by_severity(self) -> Dict[str, int]:
        breakdown: Dict[str, int] = {
            "critical": 0,
            "high": 0,
            "medium": 0,
            "low": 0,
            "info": 0
        }
        for rule_result in self.rule_results:
            for issue in rule_result.issues:
                severity = issue.severity.value
                if severity in breakdown:
                    breakdown[severity] += 1
        return breakdown


class ProjectScanner:
    def __init__(
        self,
        config: ScannerConfig,
        logger=None
    ):
        self.config = config
        self.logger = logger or get_logger()
        self._rules: Dict[str, BaseRule] = {}
    
    def initialize_rules(self) -> None:
        self.logger.info("初始化检查规则...")
        
        configs: Dict[str, Any] = {}
        for rule_name, rule_config in self.config.rules_config.items():
            configs[rule_name] = {
                "enabled": rule_config.enabled,
                "severity": rule_config.severity,
                "exclude_patterns": rule_config.exclude_patterns,
                "extra_config": rule_config.extra_config
            }
        
        self._rules = RuleRegistry.create_all_rules(configs)
        
        enabled_count = sum(1 for r in self._rules.values() if r.enabled)
        self.logger.info(f"已加载 {len(self._rules)} 个规则，其中 {enabled_count} 个启用")
    
    def scan(self) -> ScanResult:
        start_time = time.time()
        
        scan_result = ScanResult(
            scan_path=self.config.scan_path
        )
        
        try:
            self.logger.info(f"开始项目扫描: {self.config.scan_path}")
            
            if not self._rules:
                self.initialize_rules()
            
            all_ignore_patterns = self.config.get_all_ignore_patterns()
            self.logger.debug(f"忽略模式: {len(all_ignore_patterns)} 条")
            
            file_scanner = FileScanner(
                scan_path=self.config.scan_path,
                ignore_patterns=all_ignore_patterns,
                logger=self.logger
            )
            
            scan_summary = file_scanner.scan()
            scan_result.scan_summary = scan_summary
            
            all_files = file_scanner.get_relative_file_paths()
            all_dirs = file_scanner.get_relative_directory_paths()
            
            scan_context = {
                "scan_path": self.config.scan_path,
                "all_files": all_files,
                "all_dirs": all_dirs,
                "scan_summary": scan_summary,
                "config": self.config
            }
            
            self.logger.info("执行质量检查规则...")
            
            for rule_name, rule in self._rules.items():
                if not rule.enabled:
                    self.logger.debug(f"跳过禁用的规则: {rule_name}")
                    continue
                
                try:
                    self.logger.debug(f"执行规则: {rule.display_name}")
                    rule.reset()
                    
                    rule_result = rule.execute(scan_context)
                    scan_result.rule_results.append(rule_result)
                    
                    issue_count = len(rule_result.issues)
                    if issue_count > 0:
                        self.logger.info(f"  {rule.display_name}: 发现 {issue_count} 个问题")
                    
                except Exception as e:
                    error_msg = f"规则 {rule_name} 执行失败: {str(e)}"
                    self.logger.error(error_msg)
                    scan_result.errors.append(error_msg)
            
            scan_result.risk_assessment = self._calculate_risk(scan_result)
            
            scan_result.scan_duration_seconds = time.time() - start_time
            
            self.logger.info(f"扫描完成，耗时 {scan_result.scan_duration_seconds:.2f} 秒")
            self.logger.info(f"总问题数: {scan_result.get_total_issues()}")
            self.logger.info(f"风险等级: {scan_result.risk_assessment.risk_level}")
            
        except Exception as e:
            error_msg = f"扫描失败: {str(e)}"
            self.logger.error(error_msg)
            scan_result.errors.append(error_msg)
        
        return scan_result
    
    def _calculate_risk(self, scan_result: ScanResult) -> RiskAssessment:
        severity_scores: Dict[str, int] = {
            "critical": 100,
            "high": 50,
            "medium": 20,
            "low": 5,
            "info": 1
        }
        
        total_score = 0
        max_score = 0
        issue_breakdown: Dict[str, int] = {
            "critical": 0,
            "high": 0,
            "medium": 0,
            "low": 0,
            "info": 0
        }
        
        for rule_result in scan_result.rule_results:
            for issue in rule_result.issues:
                severity = issue.severity.value
                score = severity_scores.get(severity, 1)
                total_score += score
                issue_breakdown[severity] += 1
        
        risk_level = "low"
        if total_score >= 200:
            risk_level = "critical"
        elif total_score >= 100:
            risk_level = "high"
        elif total_score >= 30:
            risk_level = "medium"
        elif total_score > 0:
            risk_level = "low"
        else:
            risk_level = "info"
        
        return RiskAssessment(
            total_score=total_score,
            max_score=0,
            risk_level=risk_level,
            issue_breakdown=issue_breakdown
        )
    
    def get_rules(self) -> Dict[str, BaseRule]:
        return self._rules
