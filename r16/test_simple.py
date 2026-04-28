#!/usr/bin/env python3
"""
简单测试脚本 - 验证导入链
"""

import sys
from pathlib import Path

project_root = Path(__file__).parent.absolute()
sys.path.insert(0, str(project_root))

print(f"项目根目录: {project_root}")
print(f"sys.path[0]: {sys.path[0]}")
print()

print("=" * 60)
print("步骤 1: 测试 utils 模块导入")
print("=" * 60)
try:
    from utils.file_utils import walk_directory, get_file_size, is_text_file
    print("✅ utils.file_utils 导入成功")
except Exception as e:
    print(f"❌ utils.file_utils 导入失败: {e}")

try:
    from utils.hash_utils import calculate_file_hash, find_duplicate_files
    print("✅ utils.hash_utils 导入成功")
except Exception as e:
    print(f"❌ utils.hash_utils 导入失败: {e}")

try:
    from utils.logger import setup_logger, get_logger
    print("✅ utils.logger 导入成功")
except Exception as e:
    print(f"❌ utils.logger 导入失败: {e}")

print()
print("=" * 60)
print("步骤 2: 测试 config 模块导入")
print("=" * 60)
try:
    from config.default_config import ScannerConfig, DEFAULT_CONFIG
    print("✅ config.default_config 导入成功")
    print(f"   - ScannerConfig: {ScannerConfig}")
except Exception as e:
    print(f"❌ config.default_config 导入失败: {e}")

try:
    from config.config_loader import ConfigLoader
    print("✅ config.config_loader 导入成功")
except Exception as e:
    print(f"❌ config.config_loader 导入失败: {e}")

print()
print("=" * 60)
print("步骤 3: 测试 rules 基础模块导入")
print("=" * 60)
try:
    from rules.base_rule import BaseRule, RuleSeverity, RuleCategory, RuleResult
    print("✅ rules.base_rule 导入成功")
    print(f"   - RuleSeverity: {list(RuleSeverity)}")
except Exception as e:
    print(f"❌ rules.base_rule 导入失败: {e}")

try:
    from rules.rule_registry import RuleRegistry, register_rule
    print("✅ rules.rule_registry 导入成功")
except Exception as e:
    print(f"❌ rules.rule_registry 导入失败: {e}")

print()
print("=" * 60)
print("步骤 4: 测试 scanner 模块导入")
print("=" * 60)
try:
    from scanner.file_scanner import FileScanner, FileInfo
    print("✅ scanner.file_scanner 导入成功")
except Exception as e:
    print(f"❌ scanner.file_scanner 导入失败: {e}")

try:
    from scanner.project_scanner import ProjectScanner, ScanResult
    print("✅ scanner.project_scanner 导入成功")
except Exception as e:
    print(f"❌ scanner.project_scanner 导入失败: {e}")
    import traceback
    traceback.print_exc()

print()
print("=" * 60)
print("步骤 5: 测试 reporter 模块导入")
print("=" * 60)
try:
    from reporter.base_reporter import BaseReporter
    print("✅ reporter.base_reporter 导入成功")
except Exception as e:
    print(f"❌ reporter.base_reporter 导入失败: {e}")

try:
    from reporter.markdown_reporter import MarkdownReporter
    print("✅ reporter.markdown_reporter 导入成功")
except Exception as e:
    print(f"❌ reporter.markdown_reporter 导入失败: {e}")

try:
    from reporter.json_reporter import JsonReporter
    print("✅ reporter.json_reporter 导入成功")
except Exception as e:
    print(f"❌ reporter.json_reporter 导入失败: {e}")

try:
    from reporter.report_generator import ReportGenerator, ReportFormat
    print("✅ reporter.report_generator 导入成功")
except Exception as e:
    print(f"❌ reporter.report_generator 导入失败: {e}")

print()
print("=" * 60)
print("步骤 6: 测试规则类导入（通过 rules.__init__.py）")
print("=" * 60)
try:
    from rules import (
        DirectoryStructureRule,
        EmptyFileRule,
        LargeFileRule,
        DuplicateFileRule,
        TodoCommentRule,
        SensitiveInfoRule,
        DependencyRule,
        ReadmeRule,
        GitignoreRule,
        LogFileRule
    )
    print("✅ 所有规则类导入成功")
    print(f"   - DirectoryStructureRule: {DirectoryStructureRule}")
    print(f"   - EmptyFileRule: {EmptyFileRule}")
    print(f"   - LargeFileRule: {LargeFileRule}")
    print(f"   - DuplicateFileRule: {DuplicateFileRule}")
    print(f"   - TodoCommentRule: {TodoCommentRule}")
    print(f"   - SensitiveInfoRule: {SensitiveInfoRule}")
    print(f"   - DependencyRule: {DependencyRule}")
    print(f"   - ReadmeRule: {ReadmeRule}")
    print(f"   - GitignoreRule: {GitignoreRule}")
    print(f"   - LogFileRule: {LogFileRule}")
except Exception as e:
    print(f"❌ 规则类导入失败: {e}")
    import traceback
    traceback.print_exc()

print()
print("=" * 60)
print("测试完成！")
print("=" * 60)
