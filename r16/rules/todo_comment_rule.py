import re
from pathlib import Path
from typing import Dict, List, Any, Tuple, Optional

from .base_rule import BaseRule, RuleResult, RuleCategory, RuleSeverity
from .rule_registry import register_rule
from utils.file_utils import is_text_file, get_file_lines


@register_rule
class TodoCommentRule(BaseRule):
    name = "todo_comment"
    display_name = "TODO/FIXME 注释检查"
    description = "检测代码中的 TODO、FIXME、HACK 等待办注释"
    category = RuleCategory.CONTENT
    default_severity = RuleSeverity.LOW
    
    DEFAULT_KEYWORDS = ["TODO", "FIXME", "HACK", "BUG", "XXX", "OPTIMIZE"]
    
    def execute(self, context: Dict[str, Any]) -> RuleResult:
        all_files = context.get('all_files', [])
        scan_path = context.get('scan_path', '.')
        
        keywords = self.get_config_value('keywords', self.DEFAULT_KEYWORDS)
        keywords = [kw.upper() for kw in keywords]
        
        self.update_stats('keywords', keywords)
        
        total_todos = 0
        todo_by_keyword: Dict[str, int] = {kw: 0 for kw in keywords}
        files_with_todos = set()
        
        comment_patterns = self._get_comment_patterns()
        
        for file_path in all_files:
            full_path = str(Path(scan_path) / file_path)
            
            if self.should_exclude(file_path):
                continue
            
            if not is_text_file(full_path):
                continue
            
            lines = get_file_lines(full_path)
            
            for line_num, line in enumerate(lines, 1):
                line_upper = line.upper()
                
                for keyword in keywords:
                    if keyword in line_upper:
                        if self._is_comment(line, line_num, file_path, comment_patterns):
                            todo_by_keyword[keyword] += 1
                            total_todos += 1
                            files_with_todos.add(file_path)
                            
                            severity = self._get_severity_for_keyword(keyword)
                            
                            context = line.strip()
                            if len(context) > 100:
                                context = context[:100] + "..."
                            
                            self.add_issue(
                                message=f"发现 {keyword} 注释",
                                file_path=file_path,
                                line_number=line_num,
                                context=context,
                                severity_override=severity,
                                suggestion=f"完成或移除 {keyword} 注释",
                                metadata={"keyword": keyword, "line_content": line.strip()}
                            )
        
        self.update_stats('total_todos', total_todos)
        self.update_stats('todos_by_keyword', todo_by_keyword)
        self.update_stats('files_with_todos', len(files_with_todos))
        
        passed = total_todos == 0
        
        if total_todos > 0:
            details = ", ".join([f"{k}: {v}" for k, v in todo_by_keyword.items() if v > 0])
            summary = (f"发现 {total_todos} 个待办注释，分布在 {len(files_with_todos)} 个文件中。"
                      f"详情: {details}")
        else:
            summary = "未发现待办注释"
        
        return self.create_result(
            passed=passed,
            summary=summary
        )
    
    def _get_comment_patterns(self) -> Dict[str, List[Tuple[str, bool]]]:
        return {
            '.py': [('#', False), ('"""', True), ("'''", True)],
            '.js': [('//', False), ('/*', True), ('*/', True)],
            '.ts': [('//', False), ('/*', True), ('*/', True)],
            '.jsx': [('//', False), ('/*', True), ('*/', True)],
            '.tsx': [('//', False), ('/*', True), ('*/', True)],
            '.java': [('//', False), ('/*', True), ('*/', True)],
            '.c': [('//', False), ('/*', True), ('*/', True)],
            '.cpp': [('//', False), ('/*', True), ('*/', True)],
            '.h': [('//', False), ('/*', True), ('*/', True)],
            '.hpp': [('//', False), ('/*', True), ('*/', True)],
            '.go': [('//', False), ('/*', True), ('*/', True)],
            '.rs': [('//', False), ('/*', True), ('*/', True)],
            '.rb': [('#', False), ('=begin', True), ('=end', True)],
            '.php': [('//', False), ('/*', True), ('*/', True), ('#', False)],
            '.swift': [('//', False), ('/*', True), ('*/', True)],
            '.kt': [('//', False), ('/*', True), ('*/', True)],
            '.scala': [('//', False), ('/*', True), ('*/', True)],
            '.html': [('<!--', True), ('-->', True)],
            '.css': [('/*', True), ('*/', True)],
            '.scss': [('//', False), ('/*', True), ('*/', True)],
            '.sass': [('//', False), ('/*', True), ('*/', True)],
            '.less': [('//', False), ('/*', True), ('*/', True)],
            '.sql': [('--', False), ('/*', True), ('*/', True)],
            '.sh': [('#', False)],
            '.bat': [('REM', False), ('::', False)],
            '.ps1': [('#', False), ('<#', True), ('#>', True)],
        }
    
    def _is_comment(
        self, 
        line: str, 
        line_num: int, 
        file_path: str,
        patterns: Dict[str, List[Tuple[str, bool]]]
    ) -> bool:
        ext = Path(file_path).suffix.lower()
        
        file_patterns = patterns.get(ext, [('#', False), ('//', False), ('/*', True)])
        
        stripped = line.strip()
        
        for comment_prefix, _ in file_patterns:
            if stripped.startswith(comment_prefix):
                return True
        
        for comment_prefix, _ in file_patterns:
            if comment_prefix in line:
                prefix_idx = line.find(comment_prefix)
                before = line[:prefix_idx].strip()
                if len(before) == 0 or before.isspace():
                    return True
        
        return False
    
    def _get_severity_for_keyword(self, keyword: str) -> RuleSeverity:
        severity_map = {
            'BUG': RuleSeverity.HIGH,
            'FIXME': RuleSeverity.MEDIUM,
            'HACK': RuleSeverity.MEDIUM,
            'TODO': RuleSeverity.LOW,
            'XXX': RuleSeverity.LOW,
            'OPTIMIZE': RuleSeverity.INFO,
        }
        return severity_map.get(keyword, RuleSeverity.LOW)
