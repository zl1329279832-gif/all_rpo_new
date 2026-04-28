import json
from typing import Dict, List, Any, Optional
from datetime import datetime

from .base_reporter import BaseReporter
from scanner.project_scanner import ScanResult


class JsonReporter(BaseReporter):
    def get_format(self) -> str:
        return "json"
    
    def generate(self, scan_result: ScanResult) -> str:
        result_dict = self._convert_to_dict(scan_result)
        return json.dumps(result_dict, indent=2, ensure_ascii=False, default=str)
    
    def _convert_to_dict(self, scan_result: ScanResult) -> Dict[str, Any]:
        return {
            "version": "1.0",
            "report_type": "code_quality_scan",
            "scan_info": {
                "path": scan_result.scan_path,
                "timestamp": scan_result.scan_timestamp.isoformat(),
                "duration_seconds": scan_result.scan_duration_seconds
            },
            "summary": {
                "total_rules": len(scan_result.rule_results),
                "passed_rules": scan_result.get_passed_rules_count(),
                "failed_rules": scan_result.get_failed_rules_count(),
                "total_issues": scan_result.get_total_issues()
            },
            "risk_assessment": self._risk_assessment_to_dict(scan_result),
            "scan_statistics": scan_result.scan_summary,
            "rule_results": self._rule_results_to_dict(scan_result),
            "errors": scan_result.errors,
            "generated_at": datetime.now().isoformat()
        }
    
    def _risk_assessment_to_dict(self, scan_result: ScanResult) -> Optional[Dict[str, Any]]:
        if not scan_result.risk_assessment:
            return None
        
        return {
            "total_score": scan_result.risk_assessment.total_score,
            "max_score": scan_result.risk_assessment.max_score,
            "risk_level": scan_result.risk_assessment.risk_level,
            "risk_level_name": self._get_risk_level_name(scan_result.risk_assessment.risk_level),
            "issue_breakdown": scan_result.risk_assessment.issue_breakdown,
            "issue_breakdown_with_names": {
                severity: {
                    "count": count,
                    "name": self._get_severity_name(severity)
                }
                for severity, count in scan_result.risk_assessment.issue_breakdown.items()
                if count > 0
            }
        }
    
    def _rule_results_to_dict(self, scan_result: ScanResult) -> List[Dict[str, Any]]:
        results = []
        
        for rule_result in scan_result.rule_results:
            rule_dict = {
                "rule_name": rule_result.rule_name,
                "rule_display_name": rule_result.rule_display_name,
                "category": rule_result.category.value,
                "passed": rule_result.passed,
                "issue_count": len(rule_result.issues),
                "summary": rule_result.summary,
                "stats": rule_result.stats,
                "issues": []
            }
            
            for issue in rule_result.issues:
                issue_dict = {
                    "rule_name": issue.rule_name,
                    "severity": issue.severity.value,
                    "severity_name": self._get_severity_name(issue.severity.value),
                    "category": issue.category.value,
                    "message": issue.message,
                    "suggestion": issue.suggestion,
                    "metadata": issue.metadata,
                    "discovered_at": issue.discovered_at.isoformat() if issue.discovered_at else None
                }
                
                if issue.location:
                    issue_dict["location"] = {
                        "file_path": issue.location.file_path,
                        "line_number": issue.location.line_number,
                        "column": issue.location.column,
                        "context": issue.location.context,
                        "end_line": issue.location.end_line
                    }
                
                rule_dict["issues"].append(issue_dict)
            
            results.append(rule_dict)
        
        return results
    
    def generate_summary_json(self, scan_result: ScanResult) -> str:
        summary = {
            "scan_path": scan_result.scan_path,
            "scan_timestamp": scan_result.scan_timestamp.isoformat(),
            "total_issues": scan_result.get_total_issues(),
            "passed_rules": scan_result.get_passed_rules_count(),
            "failed_rules": scan_result.get_failed_rules_count(),
            "risk_level": scan_result.risk_assessment.risk_level if scan_result.risk_assessment else None,
            "has_errors": len(scan_result.errors) > 0
        }
        return json.dumps(summary, indent=2, ensure_ascii=False)
    
    def generate_issues_only_json(self, scan_result: ScanResult) -> str:
        all_issues = []
        
        for rule_result in scan_result.rule_results:
            for issue in rule_result.issues:
                issue_dict = {
                    "rule": rule_result.rule_name,
                    "severity": issue.severity.value,
                    "message": issue.message,
                    "file": issue.location.file_path if issue.location else None,
                    "line": issue.location.line_number if issue.location else None
                }
                all_issues.append(issue_dict)
        
        return json.dumps(all_issues, indent=2, ensure_ascii=False)
