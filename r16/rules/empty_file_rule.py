from pathlib import Path
from typing import Dict, List, Any

from .base_rule import BaseRule, RuleResult, RuleCategory, RuleSeverity
from .rule_registry import register_rule
from utils.file_utils import is_empty_file, get_file_size


@register_rule
class EmptyFileRule(BaseRule):
    name = "empty_file"
    display_name = "空文件检查"
    description = "检测项目中的空文件"
    category = RuleCategory.FILE_QUALITY
    default_severity = RuleSeverity.LOW
    
    def execute(self, context: Dict[str, Any]) -> RuleResult:
        all_files = context.get('all_files', [])
        scan_path = context.get('scan_path', '.')
        
        empty_files = []
        zero_size_files = []
        
        for file_path in all_files:
            full_path = str(Path(scan_path) / file_path)
            
            if self.should_exclude(file_path):
                continue
            
            size = get_file_size(full_path)
            if size == 0:
                zero_size_files.append(file_path)
                empty_files.append(file_path)
                self.add_issue(
                    message=f"发现零字节文件",
                    file_path=file_path,
                    severity_override=RuleSeverity.LOW,
                    suggestion="考虑删除或填充此空文件"
                )
            elif is_empty_file(full_path):
                empty_files.append(file_path)
                self.add_issue(
                    message=f"发现空内容文件（仅包含空白字符）",
                    file_path=file_path,
                    severity_override=RuleSeverity.LOW,
                    suggestion="考虑删除或填充此空文件"
                )
        
        self.update_stats('empty_files_count', len(empty_files))
        self.update_stats('zero_size_files_count', len(zero_size_files))
        self.update_stats('empty_files_list', empty_files[:10])
        
        passed = len(empty_files) == 0
        
        if empty_files:
            summary = f"发现 {len(empty_files)} 个空文件，其中 {len(zero_size_files)} 个是零字节文件"
        else:
            summary = "未发现空文件"
        
        return self.create_result(
            passed=passed,
            summary=summary
        )
