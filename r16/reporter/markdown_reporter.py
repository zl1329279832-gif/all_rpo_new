from typing import Dict, List, Any, Optional
from datetime import datetime

from .base_reporter import BaseReporter
from scanner.project_scanner import ScanResult


class MarkdownReporter(BaseReporter):
    def get_format(self) -> str:
        return "markdown"
    
    def generate(self, scan_result: ScanResult) -> str:
        lines: List[str] = []
        
        lines.extend(self._generate_header(scan_result))
        lines.append("")
        
        lines.extend(self._generate_summary(scan_result))
        lines.append("")
        
        lines.extend(self._generate_risk_assessment(scan_result))
        lines.append("")
        
        lines.extend(self._generate_scan_summary(scan_result))
        lines.append("")
        
        lines.extend(self._generate_rule_results(scan_result))
        lines.append("")
        
        lines.extend(self._generate_errors(scan_result))
        lines.append("")
        
        lines.extend(self._generate_footer())
        
        return "\n".join(lines)
    
    def _generate_header(self, scan_result: ScanResult) -> List[str]:
        lines = [
            "# 项目质量检查报告",
            "",
            "---",
            "",
            "| 项目 | 信息 |",
            "|------|------|",
            f"| 扫描路径 | `{scan_result.scan_path}` |",
            f"| 扫描时间 | {scan_result.scan_timestamp.strftime('%Y-%m-%d %H:%M:%S')} |",
            f"| 扫描耗时 | {scan_result.scan_duration_seconds:.2f} 秒 |",
        ]
        return lines
    
    def _generate_summary(self, scan_result: ScanResult) -> List[str]:
        lines = [
            "## 执行摘要",
            "",
        ]
        
        total_issues = scan_result.get_total_issues()
        passed = scan_result.get_passed_rules_count()
        failed = scan_result.get_failed_rules_count()
        total_rules = passed + failed
        
        if scan_result.risk_assessment:
            risk_level = scan_result.risk_assessment.risk_level
            risk_name = self._get_risk_level_name(risk_level)
            
            lines.append(f"**风险等级**: {self._get_severity_icon(risk_level)} {risk_name}")
            lines.append("")
        
        lines.append(f"- 检查规则: {total_rules} 个")
        lines.append(f"- 通过规则: {passed} 个")
        lines.append(f"- 失败规则: {failed} 个")
        lines.append(f"- 发现问题: {total_issues} 个")
        
        if scan_result.risk_assessment:
            breakdown = scan_result.risk_assessment.issue_breakdown
            if any(breakdown.values()):
                lines.append("")
                lines.append("**问题分布**:")
                lines.append("")
                for severity, count in breakdown.items():
                    if count > 0:
                        icon = self._get_severity_icon(severity)
                        name = self._get_severity_name(severity)
                        lines.append(f"- {icon} {name}: {count} 个")
        
        return lines
    
    def _generate_risk_assessment(self, scan_result: ScanResult) -> List[str]:
        lines = [
            "## 风险评估",
            "",
        ]
        
        if not scan_result.risk_assessment:
            lines.append("无风险评估数据")
            return lines
        
        risk = scan_result.risk_assessment
        risk_name = self._get_risk_level_name(risk.risk_level)
        icon = self._get_severity_icon(risk.risk_level)
        
        lines.append(f"| 指标 | 值 |")
        lines.append(f"|------|-----|")
        lines.append(f"| 风险等级 | {icon} {risk_name} |")
        lines.append(f"| 风险分数 | {risk.total_score} |")
        
        if risk.issue_breakdown:
            lines.append("")
            lines.append("### 问题严重程度分布")
            lines.append("")
            lines.append("| 严重程度 | 数量 |")
            lines.append("|----------|------|")
            
            severity_order = ["critical", "high", "medium", "low", "info"]
            for severity in severity_order:
                count = risk.issue_breakdown.get(severity, 0)
                if count > 0:
                    icon = self._get_severity_icon(severity)
                    name = self._get_severity_name(severity)
                    lines.append(f"| {icon} {name} | {count} |")
        
        return lines
    
    def _generate_scan_summary(self, scan_result: ScanResult) -> List[str]:
        lines = [
            "## 扫描统计",
            "",
        ]
        
        summary = scan_result.scan_summary
        if not summary:
            lines.append("无扫描统计数据")
            return lines
        
        lines.append("| 指标 | 值 |")
        lines.append("|------|-----|")
        lines.append(f"| 总文件数 | {summary.get('total_files', 0)} |")
        lines.append(f"| 总目录数 | {summary.get('total_directories', 0)} |")
        lines.append(f"| 总大小 | {summary.get('total_size_formatted', '0 B')} |")
        lines.append(f"| 总行数 | {summary.get('total_lines', 0)} |")
        lines.append(f"| 文本文件 | {summary.get('text_files_count', 0)} |")
        lines.append(f"| 二进制文件 | {summary.get('binary_files_count', 0)} |")
        
        top_extensions = summary.get('top_extensions', {})
        if top_extensions:
            lines.append("")
            lines.append("### 主要文件类型")
            lines.append("")
            lines.append("| 扩展名 | 文件数 |")
            lines.append("|--------|--------|")
            for ext, count in top_extensions.items():
                lines.append(f"| `{ext}` | {count} |")
        
        return lines
    
    def _generate_rule_results(self, scan_result: ScanResult) -> List[str]:
        lines = [
            "## 检查结果详情",
            "",
        ]
        
        if not scan_result.rule_results:
            lines.append("无检查结果")
            return lines
        
        rules_with_issues = []
        rules_passed = []
        
        for rule_result in scan_result.rule_results:
            if rule_result.issues:
                rules_with_issues.append(rule_result)
            else:
                rules_passed.append(rule_result)
        
        if rules_with_issues:
            lines.append("### 发现问题的规则")
            lines.append("")
            
            for rule_result in rules_with_issues:
                lines.append(f"#### {rule_result.rule_display_name}")
                lines.append("")
                
                if rule_result.summary:
                    lines.append(f"{rule_result.summary}")
                    lines.append("")
                
                if rule_result.stats:
                    lines.append("| 统计项 | 值 |")
                    lines.append("|--------|-----|")
                    for key, value in rule_result.stats.items():
                        if isinstance(value, (int, float, str)):
                            lines.append(f"| {key} | {value} |")
                    lines.append("")
                
                lines.append("**问题列表:**")
                lines.append("")
                
                for i, issue in enumerate(rule_result.issues, 1):
                    icon = self._get_severity_icon(issue.severity.value)
                    severity_name = self._get_severity_name(issue.severity.value)
                    
                    lines.append(f"**{i}. {icon} {severity_name}: {issue.message}**")
                    lines.append("")
                    
                    if issue.location:
                        location_parts = []
                        if issue.location.file_path:
                            location_parts.append(f"文件: `{issue.location.file_path}`")
                        if issue.location.line_number:
                            location_parts.append(f"行号: {issue.location.line_number}")
                        if location_parts:
                            lines.append(f"   - 位置: {', '.join(location_parts)}")
                        
                        if issue.location.context:
                            lines.append(f"   - 上下文: `{issue.location.context}`")
                    
                    if issue.suggestion:
                        lines.append(f"   - 💡 建议: {issue.suggestion}")
                    
                    lines.append("")
        
        if rules_passed:
            lines.append("### 通过检查的规则")
            lines.append("")
            lines.append("| 规则名称 | 状态 |")
            lines.append("|----------|------|")
            for rule_result in rules_passed:
                lines.append(f"| {rule_result.rule_display_name} | ✅ 通过 |")
        
        return lines
    
    def _generate_errors(self, scan_result: ScanResult) -> List[str]:
        if not scan_result.errors:
            return []
        
        lines = [
            "## 扫描错误",
            "",
        ]
        
        for error in scan_result.errors:
            lines.append(f"- ❌ {error}")
        
        return lines
    
    def _generate_footer(self) -> List[str]:
        lines = [
            "---",
            "",
            f"*报告生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*",
        ]
        return lines
