import sys
from pathlib import Path
from typing import Optional

import click
from colorama import init, Fore, Style

from . import __version__, __description__
from .logger import setup_logger, close_logger, get_logger
from .scanner import FileScanner
from .rules import RulesLoader, ProcessingRules
from .executor import DocumentExecutor
from .reporter import ReportGenerator
from .models import ConflictStrategy, ArchiveStrategy, FileType

init(autoreset=True)

logger = get_logger()


def print_banner() -> None:
    banner = f"""
{Fore.CYAN}{Style.BRIGHT}
╔══════════════════════════════════════════════════════════════╗
║              企业文档批处理自动化工具                        ║
║              Enterprise Document Auto Processor              ║
╠══════════════════════════════════════════════════════════════╣
║  版本: {__version__:>52}  ║
║  {__description__:<58}  ║
╚══════════════════════════════════════════════════════════════╝
{Style.RESET_ALL}
"""
    click.echo(banner)


@click.command(context_settings={"help_option_names": ["-h", "--help"]})
@click.argument(
    "source_dir",
    type=click.Path(exists=True, file_okay=False, dir_okay=True, path_type=Path),
)
@click.option(
    "--config", "-c",
    type=click.Path(exists=True, file_okay=True, dir_okay=False, path_type=Path),
    help="规则配置文件路径 (YAML格式)",
)
@click.option(
    "--target-dir", "-t",
    type=click.Path(file_okay=False, dir_okay=True, path_type=Path),
    help="归档目标目录，覆盖配置文件中的设置",
)
@click.option(
    "--dry-run",
    is_flag=True,
    help="试运行模式，不实际修改文件，默认关闭",
)
@click.option(
    "--safe-preview",
    is_flag=True,
    help="安全预览模式，仅显示处理计划而不执行任何操作",
)
@click.option(
    "--recursive/--no-recursive",
    default=True,
    help="是否递归扫描子目录，默认递归",
)
@click.option(
    "--include-hidden",
    is_flag=True,
    help="包含隐藏文件，默认跳过隐藏文件",
)
@click.option(
    "--conflict",
    type=click.Choice(["skip", "rename", "overwrite"], case_sensitive=False),
    default="rename",
    help="重名冲突处理策略: skip(跳过), rename(自动重命名), overwrite(覆盖)，默认 rename",
)
@click.option(
    "--archive-strategy",
    type=click.Choice(["date", "project", "type", "none"], case_sensitive=False),
    default="date",
    help="归档策略: date(按日期), project(按项目编号), type(按文件类型), none(不归档)，默认 date",
)
@click.option(
    "--max-retries",
    type=int,
    default=3,
    help="失败最大重试次数，默认 3 次",
)
@click.option(
    "--log-level",
    type=click.Choice(["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"], case_sensitive=False),
    default="INFO",
    help="日志级别，默认 INFO",
)
@click.option(
    "--log-dir",
    type=click.Path(file_okay=False, dir_okay=True, path_type=Path),
    default=None,
    help="日志输出目录，不指定则不输出到文件",
)
@click.option(
    "--report-format",
    type=click.Choice(["text", "json", "csv", "html"], case_sensitive=False),
    default="text",
    help="报告输出格式，默认 text",
)
@click.option(
    "--report-dir",
    type=click.Path(file_okay=False, dir_okay=True, path_type=Path),
    default=None,
    help="报告输出目录，默认 ./reports",
)
@click.option(
    "--no-report",
    is_flag=True,
    help="不生成处理报告",
)
@click.option(
    "--file-types",
    type=str,
    default=None,
    help="指定处理的文件类型，用逗号分隔，如: pdf,word,excel,image，默认全部",
)
@click.option(
    "--rename-pattern",
    type=str,
    default=None,
    help="重命名模板，可用变量: {project_code}, {date}, {original_name}, {title}, {file_type}, {timestamp}",
)
@click.option(
    "--preserve-original/--no-preserve-original",
    default=True,
    help="是否保留原始文件（复制而非移动），默认保留",
)
@click.option(
    "--no-progress",
    is_flag=True,
    help="不显示进度条",
)
def main(
    source_dir: Path,
    config: Optional[Path],
    target_dir: Optional[Path],
    dry_run: bool,
    safe_preview: bool,
    recursive: bool,
    include_hidden: bool,
    conflict: str,
    archive_strategy: str,
    max_retries: int,
    log_level: str,
    log_dir: Optional[Path],
    report_format: str,
    report_dir: Optional[Path],
    no_report: bool,
    file_types: Optional[str],
    rename_pattern: Optional[str],
    preserve_original: bool,
    no_progress: bool,
) -> None:
    """
    企业文档批处理自动化工具

    扫描指定目录，识别 PDF、Word、Excel 和图片文件，
    提取基础元数据，按规则重命名，按照日期或项目编号归档，
    并生成处理报告。

    SOURCE_DIR: 要处理的源目录路径
    """

    print_banner()

    try:
        setup_logger(log_level=log_level, log_dir=log_dir)

        logger.info(f"源目录: {source_dir}")
        logger.info(f"命令参数: {sys.argv[1:]}")

        if config:
            logger.info(f"加载规则配置文件: {config}")
            rules = RulesLoader.load_from_file(config)
        else:
            logger.info("使用默认规则")
            rules = RulesLoader.load_default()

        if target_dir:
            rules.target_dir = target_dir

        if rename_pattern:
            rules.rename_pattern = rename_pattern

        rules.preserve_original = preserve_original
        rules.conflict_strategy = ConflictStrategy(conflict.lower())
        rules.archive_strategy = ArchiveStrategy(archive_strategy.lower())

        if file_types:
            types = []
            for t in file_types.split(","):
                t = t.strip().lower()
                try:
                    types.append(FileType(t))
                except ValueError:
                    logger.warning(f"忽略未知的文件类型: {t}")
            if types:
                rules.allowed_file_types = types

        scanner = FileScanner(
            source_dir=source_dir,
            recursive=recursive,
            include_hidden=include_hidden,
            file_types=set(rules.allowed_file_types),
        )

        documents = scanner.scan()

        if not documents:
            logger.warning("未找到任何可处理的文件")
            click.echo("\n未找到任何可处理的文件，程序结束。")
            return

        click.echo(f"\n发现 {len(documents)} 个可处理文件\n")

        executor = DocumentExecutor(
            rules=rules,
            dry_run=dry_run,
            safe_preview=safe_preview,
            max_retries=max_retries,
            show_progress=not no_progress,
        )

        results = executor.process(documents)

        if not no_report:
            reporter = ReportGenerator(output_dir=report_dir)
            report_path = reporter.generate(
                documents=results,
                summary=executor.summary,
                format=report_format,
            )
            click.echo(f"\n{Fore.GREEN}处理报告已生成: {report_path}{Style.RESET_ALL}")

        if executor.summary.failed > 0:
            click.echo(
                f"\n{Fore.YELLOW}处理完成，但有 {executor.summary.failed} 个文件失败。"
                f"请查看日志和报告获取详细信息。{Style.RESET_ALL}"
            )
            sys.exit(1)
        else:
            click.echo(f"\n{Fore.GREEN}处理完成，所有文件处理成功！{Style.RESET_ALL}")
            sys.exit(0)

    except KeyboardInterrupt:
        logger.warning("用户中断操作")
        click.echo(f"\n{Fore.YELLOW}用户中断操作，程序退出。{Style.RESET_ALL}")
        sys.exit(130)
    except Exception as e:
        logger.error(f"程序执行出错: {e}", exc_info=True)
        click.echo(f"\n{Fore.RED}程序执行出错: {e}{Style.RESET_ALL}", err=True)
        sys.exit(1)
    finally:
        close_logger()


if __name__ == "__main__":
    main()
