#!/usr/bin/env python3
"""
代码项目质量检查工具
用于扫描指定项目目录并生成质量报告
"""

import argparse
import sys
import os
from pathlib import Path
from typing import Optional, List, Dict, Any

project_root = Path(__file__).parent.absolute()
sys.path.insert(0, str(project_root))

from config.default_config import ScannerConfig, DEFAULT_CONFIG, DEFAULT_IGNORE_PATTERNS
from config.config_loader import ConfigLoader
from scanner.project_scanner import ProjectScanner, ScanResult
from reporter.report_generator import ReportGenerator, ReportFormat
from rules.rule_registry import RuleRegistry
from utils.logger import setup_logger, get_logger, verbosity_to_level


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="代码项目质量检查工具 - 扫描指定项目目录并生成质量报告",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用示例:
  python main.py --path ./my_project                    # 扫描项目，生成默认报告
  python main.py --path ./demo --format markdown        # 生成 Markdown 格式报告
  python main.py --path ./demo --format json            # 生成 JSON 格式报告
  python main.py --path ./demo --output ./reports       # 指定输出目录
  python main.py --path ./demo --ignore **/temp/**      # 忽略指定目录
  python main.py --path ./demo --config custom.json     # 使用自定义配置
  python main.py --list-rules                            # 列出所有可用规则
  python main.py --create-config example.json            # 创建示例配置文件
        """
    )
    
    parser.add_argument(
        '-p', '--path',
        type=str,
        default='.',
        help='要扫描的项目目录路径 (默认: 当前目录)'
    )
    
    parser.add_argument(
        '-o', '--output',
        type=str,
        default='./quality_report',
        help='输出报告的路径 (默认: ./quality_report)'
    )
    
    parser.add_argument(
        '-f', '--format',
        type=str,
        choices=['markdown', 'json', 'both'],
        default='markdown',
        help='报告格式 (默认: markdown)'
    )
    
    parser.add_argument(
        '-i', '--ignore',
        type=str,
        action='append',
        default=[],
        help='额外的忽略模式 (可多次使用)，例如: --ignore **/temp/** --ignore **/*.log'
    )
    
    parser.add_argument(
        '-c', '--config',
        type=str,
        default=None,
        help='自定义配置文件路径 (JSON格式)'
    )
    
    parser.add_argument(
        '-v', '--verbosity',
        type=int,
        default=1,
        help='日志详细程度 (0: 错误, 1: 警告, 2: 信息, 3: 调试) (默认: 1)'
    )
    
    parser.add_argument(
        '--list-rules',
        action='store_true',
        help='列出所有可用的检查规则'
    )
    
    parser.add_argument(
        '--create-config',
        type=str,
        default=None,
        help='创建示例配置文件到指定路径'
    )
    
    parser.add_argument(
        '--fail-on-severity',
        type=str,
        choices=['critical', 'high', 'medium', 'low'],
        default=None,
        help='当发现指定严重程度的问题时返回非零退出码'
    )
    
    parser.add_argument(
        '--no-color',
        action='store_true',
        help='禁用彩色输出'
    )
    
    return parser.parse_args()


def list_available_rules() -> None:
    from rules.base_rule import RuleCategory
    
    rule_names = RuleRegistry.get_all_rule_names()
    rules = []
    
    for name in rule_names:
        rule = RuleRegistry.get_rule(name)
        if rule:
            rules.append(rule)
    
    if not rules:
        print("没有找到可用的规则")
        return
    
    print("=" * 80)
    print("可用的检查规则")
    print("=" * 80)
    print()
    
    categories: Dict[RuleCategory, List] = {}
    for rule in rules:
        if rule.category not in categories:
            categories[rule.category] = []
        categories[rule.category].append(rule)
    
    category_names = {
        RuleCategory.STRUCTURE: "目录结构",
        RuleCategory.CONTENT: "内容检查",
        RuleCategory.SECURITY: "安全检查",
        RuleCategory.DEPENDENCY: "依赖检查",
        RuleCategory.DOCUMENTATION: "文档检查",
        RuleCategory.GIT: "Git 相关",
        RuleCategory.FILE_QUALITY: "文件质量"
    }
    
    for category, category_rules in categories.items():
        category_name = category_names.get(category, category.value)
        print(f"【{category_name}】")
        print("-" * 80)
        
        for rule in category_rules:
            print(f"  名称: {rule.name}")
            print(f"  显示名: {rule.display_name}")
            print(f"  描述: {rule.description}")
            print(f"  默认严重程度: {rule.default_severity.value}")
            print(f"  状态: {'启用' if rule.enabled else '禁用'}")
            print()
    
    print("=" * 80)
    print(f"总计: {len(rules)} 个规则")
    print()


def create_example_config(output_path: str) -> None:
    try:
        ConfigLoader.create_example_config(output_path)
        print(f"示例配置文件已创建: {output_path}")
        print()
        print("你可以编辑此文件来自定义检查规则，然后使用 --config 参数加载它。")
    except Exception as e:
        print(f"创建配置文件失败: {e}")
        sys.exit(1)


def load_configuration(args: argparse.Namespace) -> ScannerConfig:
    loader = ConfigLoader()
    
    if args.config:
        config = loader.load(args.config)
    else:
        config = ScannerConfig()
    
    if args.path:
        config.scan_path = args.path
    
    if args.output:
        config.output_path = args.output
    
    if args.ignore:
        config.extra_ignore_patterns = args.ignore
    
    if args.fail_on_severity:
        config.fail_on_severity = args.fail_on_severity
    
    config.verbosity = args.verbosity
    
    return config


def format_report_path(output_path: str, format_type: str) -> str:
    path = Path(output_path)
    
    if path.suffix:
        return str(path)
    
    path.mkdir(parents=True, exist_ok=True)
    
    from datetime import datetime
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    if format_type == 'markdown':
        return str(path / f"quality_report_{timestamp}.md")
    elif format_type == 'json':
        return str(path / f"quality_report_{timestamp}.json")
    else:
        return str(path / f"quality_report_{timestamp}")


def print_scan_summary(scan_result: ScanResult) -> None:
    print()
    print("=" * 80)
    print("扫描完成摘要")
    print("=" * 80)
    print()
    
    total_issues = scan_result.get_total_issues()
    passed = scan_result.get_passed_rules_count()
    failed = scan_result.get_failed_rules_count()
    
    print(f"扫描路径: {scan_result.scan_path}")
    print(f"扫描耗时: {scan_result.scan_duration_seconds:.2f} 秒")
    print()
    print(f"检查规则: {passed + failed} 个")
    print(f"  - 通过: {passed} 个")
    print(f"  - 失败: {failed} 个")
    print(f"发现问题: {total_issues} 个")
    
    if scan_result.risk_assessment:
        risk_name = {
            "critical": "严重",
            "high": "高",
            "medium": "中",
            "low": "低",
            "info": "良好"
        }.get(scan_result.risk_assessment.risk_level, scan_result.risk_assessment.risk_level)
        
        print()
        print(f"风险等级: {risk_name}")
        print(f"风险分数: {scan_result.risk_assessment.total_score}")
        
        breakdown = scan_result.risk_assessment.issue_breakdown
        if any(breakdown.values()):
            print()
            print("问题分布:")
            severity_names = {
                "critical": "严重",
                "high": "高",
                "medium": "中",
                "low": "低",
                "info": "信息"
            }
            for severity, count in breakdown.items():
                if count > 0:
                    name = severity_names.get(severity, severity)
                    print(f"  - {name}: {count} 个")
    
    if scan_result.errors:
        print()
        print(f"扫描错误: {len(scan_result.errors)} 个")
        for error in scan_result.errors:
            print(f"  - {error}")
    
    print()
    print("=" * 80)
    print()


def main() -> int:
    args = parse_arguments()
    
    log_level = verbosity_to_level(args.verbosity)
    setup_logger(
        level=log_level,
        colored=not args.no_color
    )
    logger = get_logger()
    
    if args.list_rules:
        list_available_rules()
        return 0
    
    if args.create_config:
        create_example_config(args.create_config)
        return 0
    
    try:
        logger.info("代码项目质量检查工具启动")
        logger.debug(f"命令行参数: {vars(args)}")
        
        config = load_configuration(args)
        logger.info(f"扫描路径: {config.scan_path}")
        logger.info(f"输出路径: {config.output_path}")
        logger.info(f"报告格式: {args.format}")
        
        scan_path = Path(config.scan_path).absolute()
        if not scan_path.exists():
            logger.error(f"扫描路径不存在: {scan_path}")
            print(f"错误: 扫描路径不存在: {scan_path}")
            return 1
        
        if not scan_path.is_dir():
            logger.error(f"扫描路径不是目录: {scan_path}")
            print(f"错误: 扫描路径不是目录: {scan_path}")
            return 1
        
        logger.info("初始化扫描器...")
        scanner = ProjectScanner(config, logger=logger)
        scanner.initialize_rules()
        
        logger.info("开始扫描...")
        scan_result = scanner.scan()
        
        print_scan_summary(scan_result)
        
        logger.info("生成报告...")
        report_format = ReportGenerator.format_from_string(args.format)
        
        output_base = format_report_path(config.output_path, args.format)
        logger.debug(f"输出基础路径: {output_base}")
        
        generator = ReportGenerator(output_path=output_base, format=report_format)
        generated_files = generator.generate(scan_result)
        
        if generated_files:
            logger.info("报告生成完成")
            print("生成的报告文件:")
            for file_path in generated_files:
                print(f"  - {file_path}")
            print()
        else:
            logger.warning("未生成报告文件")
        
        if config.fail_on_severity and scan_result.risk_assessment:
            severity_order = {
                "critical": 4,
                "high": 3,
                "medium": 2,
                "low": 1
            }
            
            fail_level = severity_order.get(config.fail_on_severity, 0)
            breakdown = scan_result.risk_assessment.issue_breakdown
            
            for severity, count in breakdown.items():
                if count > 0 and severity_order.get(severity, 0) >= fail_level:
                    logger.warning(f"发现 {config.fail_on_severity} 级别问题，返回非零退出码")
                    return 1
        
        total_issues = scan_result.get_total_issues()
        if total_issues > 0:
            return 0
        else:
            return 0
        
    except KeyboardInterrupt:
        logger.info("用户中断扫描")
        print("\n扫描已取消")
        return 130
    
    except Exception as e:
        logger.error(f"扫描过程中发生错误: {e}", exc_info=True)
        print(f"错误: {e}")
        return 1


if __name__ == '__main__':
    sys.exit(main())
