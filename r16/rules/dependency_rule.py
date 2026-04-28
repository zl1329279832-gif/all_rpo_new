from pathlib import Path
from typing import Dict, List, Any, Optional

from .base_rule import BaseRule, RuleResult, RuleCategory, RuleSeverity
from .rule_registry import register_rule


@register_rule
class DependencyRule(BaseRule):
    name = "dependency"
    display_name = "依赖文件检查"
    description = "检查项目的依赖配置文件是否存在且合理"
    category = RuleCategory.DEPENDENCY
    default_severity = RuleSeverity.HIGH
    
    DEFAULT_REQUIRED_FILES = [
        'requirements.txt',
        'pyproject.toml',
        'setup.py',
        'Pipfile',
        'package.json',
        'go.mod',
        'Cargo.toml',
        'composer.json',
        'Gemfile'
    ]
    
    def execute(self, context: Dict[str, Any]) -> RuleResult:
        all_files = context.get('all_files', [])
        scan_path = context.get('scan_path', '.')
        
        required_files = self.get_config_value('required_files', self.DEFAULT_REQUIRED_FILES)
        
        root_files = [f.split('/')[-1] for f in all_files if '/' not in f]
        
        self.update_stats('root_files_count', len(root_files))
        
        found_dependency_files: List[str] = []
        dep_file_count = 0
        
        for dep_file in required_files:
            dep_file_lower = dep_file.lower()
            for root_file in root_files:
                if root_file.lower() == dep_file_lower:
                    found_dependency_files.append(root_file)
                    dep_file_count += 1
                    
                    self._validate_dependency_file(scan_path, root_file)
        
        self.update_stats('found_dependency_files', found_dependency_files)
        self.update_stats('dependency_file_count', dep_file_count)
        
        has_py_files = any(f.endswith('.py') for f in all_files)
        has_js_files = any(f.endswith(('.js', '.ts', '.jsx', '.tsx')) for f in all_files)
        has_go_files = any(f.endswith('.go') for f in all_files)
        has_rs_files = any(f.endswith('.rs') for f in all_files)
        
        expected_files_based_on_type = []
        if has_py_files:
            expected_files_based_on_type.extend(['requirements.txt', 'pyproject.toml', 'setup.py', 'Pipfile'])
        if has_js_files:
            expected_files_based_on_type.append('package.json')
        if has_go_files:
            expected_files_based_on_type.append('go.mod')
        if has_rs_files:
            expected_files_based_on_type.append('Cargo.toml')
        
        if expected_files_based_on_type and not found_dependency_files:
            self.add_issue(
                message="未找到依赖配置文件",
                file_path=str(Path(scan_path)),
                severity_override=RuleSeverity.HIGH,
                suggestion=f"根据检测到项目代码文件，建议添加依赖配置文件。推荐: {', '.join(expected_files_based_on_type)}"
            )
        
        passed = len([i for i in self._issues if i.severity in [RuleSeverity.CRITICAL, RuleSeverity.HIGH]]) == 0
        
        if found_dependency_files:
            summary = f"找到 {len(found_dependency_files)} 个依赖配置文件: {', '.join(found_dependency_files)}"
        elif expected_files_based_on_type:
            summary = f"未找到依赖配置文件（检测到需要依赖配置文件需求）"
        else:
            summary = "未检测到需要依赖配置的项目类型"
        
        return self.create_result(
            passed=passed,
            summary=summary
        )
    
    def _validate_dependency_file(self, scan_path: str, filename: str) -> None:
        full_path = Path(scan_path) / filename
        
        if not full_path.exists():
            return
        
        try:
            content = full_path.read_text(encoding='utf-8')
            lines = content.split('\n')
            
            non_empty_lines = [l for l in lines if l.strip()]
            
            self.update_stats(f'{filename}_lines', len(non_empty_lines))
            
            if len(non_empty_lines) == 0:
                self.add_issue(
                    message=f"依赖配置文件 {filename} 为空",
                    file_path=filename,
                    severity_override=RuleSeverity.MEDIUM,
                    suggestion="请添加项目依赖或删除空文件"
                )
            
            pinning_issues = []
            for line in non_empty_lines:
                line_stripped = line.strip()
                if not line_stripped.startswith('#'):
                    if filename == 'requirements.txt':
                        if '==' not in line_stripped and '>=' not in line_stripped and '<=' not in line_stripped and '~=' not in line_stripped:
                            if line_stripped and not line_stripped.startswith('-') and not line_stripped.startswith('git+'):
                                pinning_issues.append(line_stripped)
            
            if pinning_issues:
                self.add_issue(
                    message=f"在 {filename} 中发现未指定版本的依赖",
                    file_path=filename,
                    severity_override=RuleSeverity.LOW,
                    suggestion=f"建议为依赖指定具体版本号以确保构建可重复性"
                )
        
        except (OSError, UnicodeDecodeError):
            pass
