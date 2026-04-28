from pathlib import Path
from typing import Dict, List, Any, Optional

from .base_rule import BaseRule, RuleResult, RuleCategory, RuleSeverity
from .rule_registry import register_rule
from utils.file_utils import match_glob_pattern


@register_rule
class LogFileRule(BaseRule):
    name = "log_file"
    display_name = "日志文件检查"
    description = "检查是否有误提交的日志文件或日志目录"
    category = RuleCategory.GIT
    default_severity = RuleSeverity.HIGH
    
    DEFAULT_LOG_PATTERNS = [
        '**/*.log',
        '**/logs/**',
        '**/*.log.*',
        '**/log-*/**',
        '**/debug.log',
        '**/error.log',
        '**/access.log',
        '**/app.log',
        '**/server.log',
    ]
    
    def execute(self, context: Dict[str, Any]) -> RuleResult:
        all_files = context.get('all_files', [])
        scan_path = context.get('scan_path', '.')
        
        log_patterns = self.get_config_value('log_patterns', self.DEFAULT_LOG_PATTERNS)
        
        found_log_files: List[str] = []
        log_dirs: List[str] = set()
        
        for file_path in all_files:
            if self.should_exclude(file_path):
                continue
            
            for pattern in log_patterns:
                if match_glob_pattern(file_path, pattern):
                    found_log_files.append(file_path)
                    
                    parts = file_path.split('/')
                    for i, part in enumerate(parts[:-1]):
                        if 'log' in part.lower():
                            log_dirs.add('/'.join(parts[:i+1]))
                    break
        
        log_dirs = list(log_dirs)
        
        self.update_stats('log_files_count', len(found_log_files))
        self.update_stats('log_dirs_count', len(log_dirs))
        self.update_stats('log_files', found_log_files[:10])
        
        for log_file in found_log_files:
            self.add_issue(
                message="发现可能误提交的日志文件",
                file_path=log_file,
                severity_override=RuleSeverity.HIGH,
                suggestion="建议从版本控制中移除日志文件，并在 .gitignore 中添加忽略规则"
            )
        
        for log_dir in log_dirs:
            self.add_issue(
                message="发现可能误提交的日志目录",
                file_path=log_dir,
                severity_override=RuleSeverity.HIGH,
                suggestion=f"建议从版本控制中移除日志目录，并在 .gitignore 中添加忽略规则"
            )
        
        passed = len(found_log_files) == 0 and len(log_dirs) == 0
        
        if found_log_files or log_dirs:
            summary = f"发现 {len(found_log_files)} 个日志文件和 {len(log_dirs)} 个日志目录可能被误提交"
        else:
            summary = "未发现误提交的日志文件或日志目录"
        
        return self.create_result(
            passed=passed,
            summary=summary
        )
