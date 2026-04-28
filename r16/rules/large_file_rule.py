from pathlib import Path
from typing import Dict, List, Any

from .base_rule import BaseRule, RuleResult, RuleCategory, RuleSeverity
from .rule_registry import register_rule
from utils.file_utils import get_file_size


def format_file_size(bytes_size: int) -> str:
    for unit in ['B', 'KB', 'MB', 'GB']:
        if bytes_size < 1024:
            return f"{bytes_size:.2f} {unit}"
        bytes_size /= 1024
    return f"{bytes_size:.2f} TB"


@register_rule
class LargeFileRule(BaseRule):
    name = "large_file"
    display_name = "大文件检查"
    description = "检测项目中的超大文件"
    category = RuleCategory.FILE_QUALITY
    default_severity = RuleSeverity.MEDIUM
    
    def execute(self, context: Dict[str, Any]) -> RuleResult:
        all_files = context.get('all_files', [])
        scan_path = context.get('scan_path', '.')
        
        threshold = self.get_config_value('threshold', 10 * 1024 * 1024)
        warning_size = self.get_config_value('warning_size', 5 * 1024 * 1024)
        critical_size = self.get_config_value('critical_size', 50 * 1024 * 1024)
        
        self.update_stats('threshold_size', threshold)
        self.update_stats('warning_size', warning_size)
        self.update_stats('critical_size', critical_size)
        
        large_files = []
        critical_files = []
        warning_files = []
        
        for file_path in all_files:
            full_path = str(Path(scan_path) / file_path)
            
            if self.should_exclude(file_path):
                continue
            
            size = get_file_size(full_path)
            
            if size >= warning_size:
                if size >= critical_size:
                    severity = RuleSeverity.CRITICAL
                    critical_files.append(file_path)
                    suggestion = "此文件非常大，强烈建议从版本控制中移除，考虑使用 Git LFS 或存储在外部"
                elif size >= threshold:
                    severity = RuleSeverity.HIGH
                    large_files.append(file_path)
                    suggestion = "此文件较大，可能影响仓库性能，考虑压缩或使用 Git LFS"
                else:
                    severity = RuleSeverity.LOW
                    warning_files.append(file_path)
                    suggestion = "此文件大小接近阈值，请监控其增长"
                
                self.add_issue(
                    message=f"文件大小为 {format_file_size(size)}，超过警告阈值 {format_file_size(warning_size)}",
                    file_path=file_path,
                    severity_override=severity,
                    suggestion=suggestion,
                    metadata={"size_bytes": size, "size_formatted": format_file_size(size)}
                )
        
        self.update_stats('critical_files_count', len(critical_files))
        self.update_stats('large_files_count', len(large_files))
        self.update_stats('warning_files_count', len(warning_files))
        self.update_stats('total_large_files', len(critical_files) + len(large_files) + len(warning_files))
        
        passed = len(critical_files) == 0 and len(large_files) == 0
        
        summary_parts = []
        if critical_files:
            summary_parts.append(f"{len(critical_files)} 个超大文件")
        if large_files:
            summary_parts.append(f"{len(large_files)} 个大文件")
        if warning_files:
            summary_parts.append(f"{len(warning_files)} 个警告文件")
        
        if summary_parts:
            summary = "发现 " + "、".join(summary_parts)
        else:
            summary = "未发现超过阈值的大文件"
        
        return self.create_result(
            passed=passed,
            summary=summary
        )
