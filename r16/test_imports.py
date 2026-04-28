#!/usr/bin/env python3
"""
测试导入验证脚本
用于验证项目中的模块是否可以正确导入
"""

import sys
from pathlib import Path

project_root = Path(__file__).parent.absolute()
sys.path.insert(0, str(project_root))

print("=" * 80)
print("开始验证项目导入...")
print("=" * 80)
print()

success = 0
failed = 0

modules = [
    ("config", [
        ("config.default_config", "DEFAULT_CONFIG, RuleSeverity"),
        ("config.config_loader", "ConfigLoader"),
    ]),
    ("utils", [
        ("utils.file_utils", "walk_directory, get_file_size, is_text_file"),
        ("utils.hash_utils", "calculate_file_hash, find_duplicate_files"),
        ("utils.logger", "setup_logger, get_logger"),
    ]),
    ("rules", [
        ("rules.base_rule", "BaseRule, RuleResult, RuleSeverity"),
        ("rules.rule_registry", "RuleRegistry, register_rule"),
        ("rules.directory_structure_rule", "DirectoryStructureRule"),
        ("rules.empty_file_rule", "EmptyFileRule"),
        ("rules.large_file_rule", "LargeFileRule"),
        ("rules.duplicate_file_rule", "DuplicateFileRule"),
        ("rules.todo_comment_rule", "TodoCommentRule"),
        ("rules.sensitive_info_rule", "SensitiveInfoRule"),
        ("rules.dependency_rule", "DependencyRule"),
        ("rules.readme_rule", "ReadmeRule"),
        ("rules.gitignore_rule", "GitignoreRule"),
        ("rules.log_file_rule", "LogFileRule"),
    ]),
    ("scanner", [
        ("scanner.file_scanner", "FileScanner, FileInfo"),
        ("scanner.project_scanner", "ProjectScanner, ScanResult"),
    ]),
    ("reporter", [
        ("reporter.base_reporter", "BaseReporter"),
        ("reporter.markdown_reporter", "MarkdownReporter"),
        ("reporter.json_reporter", "JsonReporter"),
        ("reporter.report_generator", "ReportGenerator, ReportFormat"),
    ]),
]

for group_name, group_modules in modules:
    print(f"【{group_name}】模块组:")
    print("-" * 80)
    
    for module_name, expected_items in group_modules:
        try:
            print(f"  导入 {module_name}...", end=" ")
            module = __import__(module_name, fromlist=['*'])
            print("✅ 成功")
            success += 1
            
            items = expected_items.split(", ")
            for item in items:
                item = item.strip()
                if hasattr(module, item):
                    print(f"      - {item}: ✅ 存在")
                else:
                    print(f"      - {item}: ❌ 缺失")
                    failed += 1
                    
        except Exception as e:
            print(f"❌ 失败: {e}")
            failed += 1
    
    print()

print("=" * 80)
print(f"导入结果: 成功 {success} 个, 失败 {failed} 个")
print("=" * 80)

if failed == 0:
    print("\n所有模块导入成功！")
    sys.exit(0)
else:
    print("\n有模块导入失败！")
    sys.exit(1)
