from pathlib import Path
from typing import Dict, List, Any, Optional, Set

from .base_rule import BaseRule, RuleResult, RuleCategory, RuleSeverity
from .rule_registry import register_rule
from utils.file_utils import get_file_lines


@register_rule
class GitignoreRule(BaseRule):
    name = "gitignore"
    display_name = ".gitignore 检查"
    description = "检查 .gitignore 文件是否存在且配置合理"
    category = RuleCategory.GIT
    default_severity = RuleSeverity.MEDIUM
    
    RECOMMENDED_ENTRIES = [
        '__pycache__',
        '*.pyc',
        '.venv',
        'venv',
        'dist',
        'build',
        '*.egg-info',
        '.idea',
        '.vscode',
        '*.log',
        'logs',
        '.DS_Store',
        'Thumbs.db',
        'node_modules',
        '.env',
        '.env.local',
        '.pytest_cache',
        '.tox',
        '.mypy_cache',
    ]
    
    def execute(self, context: Dict[str, Any]) -> RuleResult:
        all_files = context.get('all_files', [])
        scan_path = context.get('scan_path', '.')
        
        root_files = [f.split('/')[-1] for f in all_files if '/' not in f]
        
        has_gitignore = '.gitignore' in root_files
        
        self.update_stats('gitignore_exists', has_gitignore)
        
        if not has_gitignore:
            self.add_issue(
                message="项目缺少 .gitignore 文件",
                file_path=str(Path(scan_path)),
                severity_override=RuleSeverity.MEDIUM,
                suggestion="建议添加 .gitignore 文件以忽略不需要提交的文件"
            )
        else:
            full_path = str(Path(scan_path) / '.gitignore')
            lines = get_file_lines(full_path)
            
            entries: Set[str] = set()
            for line in lines:
                stripped = line.strip()
                if stripped and not stripped.startswith('#'):
                    entries.add(stripped)
            
            self.update_stats('gitignore_entries_count', len(entries))
            self.update_stats('gitignore_lines_count', len(lines))
            
            recommended_entries = self.get_config_value('recommended_entries', self.RECOMMENDED_ENTRIES)
            
            missing_entries: List[str] = []
            
            for rec in recommended_entries:
                found = False
                for entry in entries:
                    if rec in entry or entry in rec or rec.lower() in entry.lower() or entry.lower() in rec.lower():
                        found = True
                        break
                if not found:
                    missing_entries.append(rec)
            
            self.update_stats('gitignore_missing_entries', missing_entries[:10])
            self.update_stats('gitignore_missing_count', len(missing_entries))
            
            if missing_entries:
                missing_str = ', '.join(missing_entries[:5])
                if len(missing_entries) > 5:
                    missing_str += f' 等 {len(missing_entries)} 项'
                
                self.add_issue(
                    message=f".gitignore 可能缺少推荐的忽略规则",
                    file_path='.gitignore',
                    severity_override=RuleSeverity.LOW,
                    suggestion=f"考虑添加: {missing_str}"
                )
            
            if len(entries) == 0:
                self.add_issue(
                    message=".gitignore 文件为空",
                    file_path='.gitignore',
                    severity_override=RuleSeverity.MEDIUM,
                    suggestion="请添加忽略规则或删除空文件"
                )
        
        passed = len([i for i in self._issues if i.severity in [RuleSeverity.CRITICAL, RuleSeverity.HIGH]]) == 0
        
        entry_count = self._stats.get('gitignore_entries_count', 0)
        if has_gitignore:
            summary = f"找到 .gitignore 文件，包含 {entry_count} 条规则"
        else:
            summary = "未找到 .gitignore 文件"
        
        return self.create_result(
            passed=passed,
            summary=summary
        )
