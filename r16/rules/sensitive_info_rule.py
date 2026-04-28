import re
from pathlib import Path
from typing import Dict, List, Any, Tuple, Optional, Pattern

from .base_rule import BaseRule, RuleResult, RuleCategory, RuleSeverity
from .rule_registry import register_rule
from utils.file_utils import is_text_file, get_file_lines


@register_rule
class SensitiveInfoRule(BaseRule):
    name = "sensitive_info"
    display_name = "敏感信息检查"
    description = "检测代码中是否包含 API 密钥、密码、Token 等敏感信息"
    category = RuleCategory.SECURITY
    default_severity = RuleSeverity.CRITICAL
    
    DEFAULT_PATTERNS: List[Tuple[str, str]] = [
        (r"api[_-]?key\s*[=:]\s*['\"]([A-Za-z0-9]{20,})['\"]", "API Key"),
        (r"api[_-]?key\s*[=:]\s*([A-Za-z0-9]{20,})", "API Key (plain)"),
        (r"password\s*[=:]\s*['\"]([^'\"]{5,})['\"]", "Password"),
        (r"password\s*[=:]\s*([^'\"]{5,})", "Password (plain)"),
        (r"secret\s*[=:]\s*['\"]([^'\"]{8,})['\"]", "Secret"),
        (r"secret\s*[=:]\s*([^'\"]{8,})", "Secret (plain)"),
        (r"token\s*[=:]\s*['\"]([A-Za-z0-9_-]{20,})['\"]", "Token"),
        (r"token\s*[=:]\s*([A-Za-z0-9_-]{20,})", "Token (plain)"),
        (r"aws_access_key_id\s*[=:]\s*['\"]([^'\"]{16,})['\"]", "AWS Access Key"),
        (r"aws_secret_access_key\s*[=:]\s*['\"]([^'\"]{20,})['\"]", "AWS Secret Key"),
        (r"-----BEGIN (RSA |EC |DSA |ED25519 )?PRIVATE KEY-----", "Private Key"),
        (r"mysql://\w+:[^@]+@", "MySQL Connection String"),
        (r"postgres://\w+:[^@]+@", "PostgreSQL Connection String"),
        (r"mongodb://\w+:[^@]+@", "MongoDB Connection String"),
        (r"redis://:\w+@", "Redis Connection String with Password"),
        (r"sk-[a-zA-Z0-9]{20,}", "OpenAI API Key"),
        (r"gh[pous]_[a-zA-Z0-9]{36,}", "GitHub Token"),
        (r"AWS_SECRET_KEY\s*[=:]\s*['\"]?[a-zA-Z0-9/+=]{40,}['\"]?", "AWS Secret Key Pattern"),
    ]
    
    def execute(self, context: Dict[str, Any]) -> RuleResult:
        all_files = context.get('all_files', [])
        scan_path = context.get('scan_path', '.')
        
        patterns_config = self.get_config_value('patterns', None)
        if patterns_config is None:
            patterns_config = self.DEFAULT_PATTERNS
        
        patterns: List[Tuple[Pattern, str]] = []
        for pattern_str, pattern_name in patterns_config:
            try:
                compiled = re.compile(pattern_str, re.IGNORECASE)
                patterns.append((compiled, pattern_name))
            except re.error:
                continue
        
        self.update_stats('patterns_count', len(patterns))
        
        total_issues = 0
        issues_by_type: Dict[str, int] = {}
        files_with_issues = set()
        
        exclude_files = self.get_config_value('exclude_files', [
            '**/test*.py', '**/*test*.py', '**/tests/**',
            '**/example*.py', '**/*example*.py',
            '**/*.sample', '**/*.example'
        ])
        
        for file_path in all_files:
            full_path = str(Path(scan_path) / file_path)
            
            if self.should_exclude(file_path):
                continue
            
            from utils.file_utils import match_glob_pattern
            should_skip = False
            for pattern in exclude_files:
                if match_glob_pattern(file_path, pattern):
                    should_skip = True
                    break
            if should_skip:
                continue
            
            if not is_text_file(full_path):
                continue
            
            lines = get_file_lines(full_path)
            
            for line_num, line in enumerate(lines, 1):
                for pattern, pattern_name in patterns:
                    matches = list(pattern.finditer(line))
                    
                    for match in matches:
                        matched_text = match.group(0)
                        
                        if self._is_false_positive(matched_text, line, file_path):
                            continue
                        
                        if pattern_name not in issues_by_type:
                            issues_by_type[pattern_name] = 0
                        issues_by_type[pattern_name] += 1
                        total_issues += 1
                        files_with_issues.add(file_path)
                        
                        severity = self._get_severity_for_type(pattern_name)
                        
                        masked_text = self._mask_sensitive_info(matched_text)
                        
                        context = line.strip()
                        if len(context) > 80:
                            context = context[:80] + "..."
                        context = self._mask_sensitive_info(context)
                        
                        self.add_issue(
                            message=f"发现潜在的 {pattern_name}",
                            file_path=file_path,
                            line_number=line_num,
                            context=context,
                            severity_override=severity,
                            suggestion=f"请审查并移除硬编码的敏感信息，考虑使用环境变量或密钥管理服务",
                            metadata={
                                "pattern_name": pattern_name,
                                "masked_text": masked_text,
                                "line": line_num
                            }
                        )
        
        self.update_stats('total_sensitive_issues', total_issues)
        self.update_stats('issues_by_type', issues_by_type)
        self.update_stats('files_with_sensitive_issues', len(files_with_issues))
        
        passed = total_issues == 0
        
        if total_issues > 0:
            details = ", ".join([f"{k}: {v}" for k, v in issues_by_type.items()])
            summary = (f"发现 {total_issues} 个潜在敏感信息问题，"
                      f"分布在 {len(files_with_issues)} 个文件中。"
                      f"类型: {details}")
        else:
            summary = "未发现潜在的敏感信息"
        
        return self.create_result(
            passed=passed,
            summary=summary
        )
    
    def _is_false_positive(self, matched_text: str, line: str, file_path: str) -> bool:
        line_lower = line.lower()
        
        if 'example' in line_lower or 'sample' in line_lower or 'test' in line_lower:
            if len(matched_text) < 20:
                return True
        
        if 'placeholder' in line_lower or 'dummy' in line_lower or 'replace' in line_lower:
            return True
        
        if 'your_' in matched_text.lower() or 'replace_' in matched_text.lower():
            return True
        
        if 'xxxx' in matched_text.lower() or '****' in matched_text:
            return True
        
        return False
    
    def _mask_sensitive_info(self, text: str) -> str:
        if len(text) <= 4:
            return '*' * len(text)
        
        show_chars = min(4, len(text) // 4)
        return text[:show_chars] + '*' * (len(text) - show_chars * 2) + text[-show_chars:]
    
    def _get_severity_for_type(self, pattern_name: str) -> RuleSeverity:
        high_severity = [
            'Private Key', 'AWS Secret Key', 'OpenAI API Key', 'GitHub Token'
        ]
        
        if any(hs in pattern_name for hs in high_severity):
            return RuleSeverity.CRITICAL
        
        if 'Connection String' in pattern_name:
            return RuleSeverity.HIGH
        
        if 'Password' in pattern_name:
            return RuleSeverity.HIGH
        
        return RuleSeverity.MEDIUM
