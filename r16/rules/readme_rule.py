from pathlib import Path
from typing import Dict, List, Any, Optional

from .base_rule import BaseRule, RuleResult, RuleCategory, RuleSeverity
from .rule_registry import register_rule
from utils.file_utils import get_file_lines, get_file_size


@register_rule
class ReadmeRule(BaseRule):
    name = "readme"
    display_name = "README 检查"
    description = "检查 README 文件是否存在且内容是否完整"
    category = RuleCategory.DOCUMENTATION
    default_severity = RuleSeverity.MEDIUM
    
    PREFERRED_FILES = [
        'README.md',
        'readme.md',
        'README.rst',
        'readme.rst',
        'README.txt',
        'readme.txt',
        'README',
        'readme'
    ]
    
    RECOMMENDED_SECTIONS = [
        ('## Installation', '安装说明'),
        ('## Usage', '使用说明'),
        ('## Features', '功能特性'),
        ('## Contributing', '贡献指南'),
        ('## License', '许可证'),
        ('#', '主标题'),
    ]
    
    def execute(self, context: Dict[str, Any]) -> RuleResult:
        all_files = context.get('all_files', [])
        scan_path = context.get('scan_path', '.')
        
        min_lines = self.get_config_value('min_lines', 10)
        preferred_files = self.get_config_value('preferred_files', self.PREFERRED_FILES)
        
        root_files = [f.split('/')[-1] for f in all_files if '/' not in f]
        
        found_readme = None
        for preferred in preferred_files:
            preferred_lower = preferred.lower()
            for root_file in root_files:
                if root_file.lower() == preferred_lower:
                    found_readme = root_file
                    break
            if found_readme:
                break
        
        self.update_stats('readme_found', found_readme is not None)
        self.update_stats('readme_filename', found_readme)
        
        if not found_readme:
            self.add_issue(
                message="项目缺少 README 文件",
                file_path=str(Path(scan_path)),
                severity_override=RuleSeverity.MEDIUM,
                suggestion="建议添加 README.md 文件描述项目"
            )
        else:
            full_path = str(Path(scan_path) / found_readme)
            
            lines = get_file_lines(full_path)
            content_lines = [l for l in lines if l.strip()]
            
            size = get_file_size(full_path)
            
            self.update_stats('readme_lines', len(lines))
            self.update_stats('readme_content_lines', len(content_lines))
            self.update_stats('readme_size_bytes', size)
            
            if len(content_lines) < min_lines:
                self.add_issue(
                    message=f"README 内容较短（{len(content_lines)} 行内容）",
                    file_path=found_readme,
                    severity_override=RuleSeverity.LOW,
                    suggestion=f"建议扩展 README 内容，至少包含 {min_lines} 行"
                )
            
            found_sections = []
            missing_sections = []
            
            content_lower = '\n'.join(lines).lower()
            
            for section_pattern, section_name in self.RECOMMENDED_SECTIONS:
                if section_pattern.lower() in content_lower:
                    found_sections.append(section_name)
                else:
                    if section_pattern != '#':
                        missing_sections.append(section_name)
            
            self.update_stats('readme_found_sections', found_sections)
            self.update_stats('readme_missing_sections', missing_sections)
            
            if found_readme.endswith('.txt') or found_readme == 'README' or found_readme == 'readme':
                self.add_issue(
                    message=f"使用了纯文本 README",
                    file_path=found_readme,
                    severity_override=RuleSeverity.INFO,
                    suggestion="建议使用 Markdown 格式 (README.md) 以获得更好的可读性"
                )
        
        passed = len([i for i in self._issues if i.severity in [RuleSeverity.CRITICAL, RuleSeverity.HIGH, RuleSeverity.MEDIUM]]) == 0
        
        if found_readme:
            summary = f"找到 README 文件: {found_readme}"
        else:
            summary = "未找到 README 文件"
        
        return self.create_result(
            passed=passed,
            summary=summary
        )
