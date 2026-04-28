from pathlib import Path
from typing import Dict, List, Any, Optional

from .base_rule import BaseRule, RuleResult, RuleCategory, RuleSeverity
from .rule_registry import register_rule
from utils.hash_utils import find_duplicate_files, HashAlgorithm


@register_rule
class DuplicateFileRule(BaseRule):
    name = "duplicate_file"
    display_name = "重复文件检查"
    description = "检测项目中的重复文件"
    category = RuleCategory.FILE_QUALITY
    default_severity = RuleSeverity.MEDIUM
    
    def execute(self, context: Dict[str, Any]) -> RuleResult:
        all_files = context.get('all_files', [])
        scan_path = context.get('scan_path', '.')
        
        threshold = self.get_config_value('threshold', 3)
        min_size = self.get_config_value('min_size', 0)
        
        full_paths = [str(Path(scan_path) / f) for f in all_files if not self.should_exclude(f)]
        
        duplicates = find_duplicate_files(full_paths, HashAlgorithm.SHA256, min_size)
        
        total_duplicate_groups = 0
        total_duplicate_files = 0
        large_duplicate_groups = 0
        
        for file_hash, paths in duplicates.items():
            if len(paths) >= 2:
                total_duplicate_groups += 1
                total_duplicate_files += len(paths)
                
                relative_paths = []
                for p in paths:
                    try:
                        relative = str(Path(p).relative_to(scan_path))
                        relative_paths.append(relative)
                    except ValueError:
                        relative_paths.append(p)
                
                if len(paths) >= threshold:
                    large_duplicate_groups += 1
                    severity = RuleSeverity.HIGH
                else:
                    severity = RuleSeverity.LOW
                
                self.add_issue(
                    message=f"发现 {len(paths)} 个重复文件",
                    file_path=relative_paths[0] if relative_paths else None,
                    severity_override=severity,
                    suggestion=f"考虑合并重复文件: {', '.join(relative_paths[1:])}",
                    metadata={
                        "file_hash": file_hash,
                        "duplicate_count": len(paths),
                        "duplicate_files": relative_paths
                    }
                )
        
        self.update_stats('duplicate_groups_count', total_duplicate_groups)
        self.update_stats('duplicate_files_count', total_duplicate_files)
        self.update_stats('large_duplicate_groups_count', large_duplicate_groups)
        self.update_stats('threshold', threshold)
        
        passed = total_duplicate_groups == 0
        
        if total_duplicate_groups > 0:
            summary = (f"发现 {total_duplicate_groups} 组重复文件，"
                      f"共 {total_duplicate_files} 个文件，"
                      f"其中 {large_duplicate_groups} 组超过阈值 {threshold} 个")
        else:
            summary = "未发现重复文件"
        
        return self.create_result(
            passed=passed,
            summary=summary
        )
