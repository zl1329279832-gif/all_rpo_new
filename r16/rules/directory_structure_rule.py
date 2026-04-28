import os
from pathlib import Path
from typing import Dict, List, Any, Optional

from .base_rule import BaseRule, RuleResult, RuleCategory, RuleSeverity
from .rule_registry import register_rule


@register_rule
class DirectoryStructureRule(BaseRule):
    name = "directory_structure"
    display_name = "目录结构检查"
    description = "检查项目目录结构是否符合最佳实践"
    category = RuleCategory.STRUCTURE
    default_severity = RuleSeverity.MEDIUM
    
    def execute(self, context: Dict[str, Any]) -> RuleResult:
        scan_path = context.get('scan_path', '.')
        all_files = context.get('all_files', [])
        all_dirs = context.get('all_dirs', [])
        
        scan_path_obj = Path(scan_path)
        root_items = list(scan_path_obj.iterdir())
        root_dirs = [item.name for item in root_items if item.is_dir()]
        root_files = [item.name for item in root_items if item.is_file()]
        
        recommended_dirs = self.get_config_value('recommended_dirs', ['src', 'tests', 'docs', 'utils'])
        expected_files = self.get_config_value('expected_files', ['README.md', '.gitignore', 'requirements.txt'])
        
        self.update_stats('root_directories_count', len(root_dirs))
        self.update_stats('root_files_count', len(root_files))
        self.update_stats('total_files_scanned', len(all_files))
        self.update_stats('total_dirs_scanned', len(all_dirs))
        
        for rec_dir in recommended_dirs:
            if rec_dir not in root_dirs:
                self.add_issue(
                    message=f"推荐的目录 '{rec_dir}' 不存在于项目根目录",
                    file_path=str(scan_path),
                    suggestion=f"考虑添加 '{rec_dir}' 目录以保持标准项目结构"
                )
        
        for exp_file in expected_files:
            if exp_file not in root_files:
                self.add_issue(
                    message=f"期望的文件 '{exp_file}' 不存在于项目根目录",
                    file_path=str(scan_path),
                    severity_override=RuleSeverity.LOW,
                    suggestion=f"考虑添加 '{exp_file}' 文件"
                )
        
        has_py_files = any(f.endswith('.py') for f in all_files)
        has_js_files = any(f.endswith(('.js', '.ts', '.jsx', '.tsx')) for f in all_files)
        
        project_type = []
        if has_py_files:
            project_type.append('Python')
        if has_js_files:
            project_type.append('JavaScript/TypeScript')
        
        self.update_stats('detected_project_types', project_type)
        
        for root_dir in root_dirs:
            if root_dir.startswith('.') and root_dir not in ['.git', '.github', '.idea', '.vscode']:
                self.add_issue(
                    message=f"发现隐藏目录 '{root_dir}'，请确认是否需要包含在版本控制中",
                    file_path=str(Path(scan_path) / root_dir),
                    severity_override=RuleSeverity.INFO
                )
        
        passed = len([i for i in self._issues if i.severity in [RuleSeverity.CRITICAL, RuleSeverity.HIGH]]) == 0
        
        summary = f"项目根目录包含 {len(root_dirs)} 个子目录和 {len(root_files)} 个文件"
        if project_type:
            summary += f"，检测到项目类型: {', '.join(project_type)}"
        
        return self.create_result(
            passed=passed,
            summary=summary
        )
