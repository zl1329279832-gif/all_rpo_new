import sys
from pathlib import Path
from typing import Optional, List, Dict, Any

import click
from colorama import init, Fore, Style

from . import __version__, __description__
from .logger import setup_logger, close_logger, get_logger
from .scanner import FileScanner
from .rules import RulesLoader, ProcessingRules, DuplicateStrategy
from .executor import DocumentExecutor
from .reporter import ReportGenerator
from .models import (
    ConflictStrategy, ArchiveStrategy, FileType,
    BatchStatus, ProcessingStatus,
)
from .indexer import DatabaseManager, create_batch
from .history import HistoryManager, get_history_manager
from .rollback import RollbackManager
from .manifest import ManifestGenerator

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


def _parse_file_types(file_types_str: Optional[str]) -> Optional[List[FileType]]:
    if not file_types_str:
        return None
    types = []
    for t in file_types_str.split(","):
        t = t.strip().lower()
        try:
            types.append(FileType(t))
        except ValueError:
            logger.warning(f"忽略未知的文件类型: {t}")
    return types if types else None


def _load_rules(
    config_path: Optional[Path],
    target_dir: Optional[Path],
    rename_pattern: Optional[str],
    preserve_original: bool,
    conflict_strategy: str,
    archive_strategy: str,
    file_types: Optional[str],
    enable_deduplication: bool = False,
    duplicate_strategy: str = "skip",
    enable_ocr: bool = False,
    enable_persistence: bool = True,
) -> ProcessingRules:
    if config_path:
        logger.info(f"加载规则配置文件: {config_path}")
        rules = RulesLoader.load_from_file(config_path)
    else:
        logger.info("使用默认规则")
        rules = RulesLoader.load_default()

    if target_dir:
        rules.target_dir = target_dir
    if rename_pattern:
        rules.rename_pattern = rename_pattern

    rules.preserve_original = preserve_original
    rules.conflict_strategy = ConflictStrategy(conflict_strategy.lower())
    rules.archive_strategy = ArchiveStrategy(archive_strategy.lower())

    parsed_types = _parse_file_types(file_types)
    if parsed_types:
        rules.allowed_file_types = parsed_types

    rules.enable_deduplication = enable_deduplication
    rules.duplicate_strategy = DuplicateStrategy(duplicate_strategy.lower())
    rules.enable_ocr = enable_ocr
    rules.enable_persistence = enable_persistence

    return rules


@click.group(
    context_settings={"help_option_names": ["-h", "--help"]},
    invoke_without_command=True,
)
@click.version_option(version=__version__, prog_name="doc-processor")
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
@click.pass_context
def cli(ctx: click.Context, log_level: str, log_dir: Optional[Path]) -> None:
    """企业文档批处理自动化工具 - 可追踪、可恢复、智能识别文档治理程序"""
    ctx.ensure_object(dict)
    ctx.obj["log_level"] = log_level
    ctx.obj["log_dir"] = log_dir

    if ctx.invoked_subcommand is None:
        print_banner()
        click.echo(ctx.get_help())
        return

    setup_logger(log_level=log_level, log_dir=log_dir)


@cli.command("process")
@click.argument(
    "source_dir",
    type=click.Path(exists=True, file_okay=False, dir_okay=True, path_type=Path),
)
@click.option("--config", "-c", type=click.Path(exists=True, file_okay=True, dir_okay=False, path_type=Path), help="规则配置文件路径")
@click.option("--target-dir", "-t", type=click.Path(file_okay=False, dir_okay=True, path_type=Path), help="归档目标目录")
@click.option("--dry-run", is_flag=True, help="试运行模式，不实际修改文件")
@click.option("--safe-preview", is_flag=True, help="安全预览模式，仅显示处理计划")
@click.option("--recursive/--no-recursive", default=True, help="是否递归扫描子目录")
@click.option("--include-hidden", is_flag=True, help="包含隐藏文件")
@click.option("--conflict", type=click.Choice(["skip", "rename", "overwrite"], case_sensitive=False), default="rename", help="冲突处理策略")
@click.option("--archive-strategy", type=click.Choice(["date", "project", "type", "none"], case_sensitive=False), default="date", help="归档策略")
@click.option("--max-retries", type=int, default=3, help="失败最大重试次数")
@click.option("--report-format", type=click.Choice(["text", "json", "csv", "html"], case_sensitive=False), default="text", help="报告格式")
@click.option("--report-dir", type=click.Path(file_okay=False, dir_okay=True, path_type=Path), default=None, help="报告输出目录")
@click.option("--no-report", is_flag=True, help="不生成处理报告")
@click.option("--file-types", type=str, default=None, help="指定处理的文件类型，逗号分隔")
@click.option("--rename-pattern", type=str, default=None, help="自定义重命名模板")
@click.option("--preserve-original/--no-preserve-original", default=True, help="保留原始文件")
@click.option("--no-progress", is_flag=True, help="不显示进度条")
@click.option("--deduplicate", is_flag=True, help="启用重复文件检测")
@click.option("--duplicate-strategy", type=click.Choice(["skip", "keep_copy", "move_to_duplicate_area"], case_sensitive=False), default="skip", help="重复文件处理策略")
@click.option("--fast-hash", is_flag=True, help="使用快速哈希算法")
@click.option("--enable-ocr", is_flag=True, help="启用 OCR 文本识别")
@click.option("--ocr-languages", type=str, default="chi_sim+eng", help="OCR 识别语言")
@click.option("--no-persistence", is_flag=True, help="禁用数据库持久化")
@click.pass_context
def process_command(
    ctx: click.Context,
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
    report_format: str,
    report_dir: Optional[Path],
    no_report: bool,
    file_types: Optional[str],
    rename_pattern: Optional[str],
    preserve_original: bool,
    no_progress: bool,
    deduplicate: bool,
    duplicate_strategy: str,
    fast_hash: bool,
    enable_ocr: bool,
    ocr_languages: str,
    no_persistence: bool,
) -> None:
    """扫描并处理指定目录的文档"""
    print_banner()

    try:
        logger.info(f"源目录: {source_dir}")
        logger.info(f"命令参数: {sys.argv[1:]}")

        rules = _load_rules(
            config_path=config,
            target_dir=target_dir,
            rename_pattern=rename_pattern,
            preserve_original=preserve_original,
            conflict_strategy=conflict,
            archive_strategy=archive_strategy,
            file_types=file_types,
            enable_deduplication=deduplicate,
            duplicate_strategy=duplicate_strategy,
            enable_ocr=enable_ocr,
            enable_persistence=not no_persistence,
        )
        rules.ocr_languages = ocr_languages
        rules.use_fast_hash = fast_hash

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

        command_args = " ".join(sys.argv[1:])
        executor = DocumentExecutor(
            rules=rules,
            dry_run=dry_run,
            safe_preview=safe_preview,
            max_retries=max_retries,
            show_progress=not no_progress,
            command_args=command_args,
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

        if executor.summary.batch_id:
            click.echo(f"{Fore.CYAN}批次 ID: {executor.summary.batch_id}{Style.RESET_ALL}")

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


@cli.group("history")
def history_group() -> None:
    """查看和管理历史批次"""
    pass


@history_group.command("list")
@click.option("--status", type=click.Choice([s.value for s in BatchStatus], case_sensitive=False), default=None, help="按状态筛选")
@click.option("--limit", type=int, default=20, help="显示数量")
@click.option("--offset", type=int, default=0, help="偏移量")
@click.option("--detail", is_flag=True, help="显示详细信息")
def history_list(status: Optional[str], limit: int, offset: int, detail: bool) -> None:
    """列出历史处理批次"""
    try:
        history = get_history_manager()
        batch_status = BatchStatus(status.lower()) if status else None
        batches = history.list_batches(status=batch_status, limit=limit, offset=offset)
        click.echo(history.format_batch_list(batches, show_details=detail))
        sys.exit(0)
    except Exception as e:
        logger.error(f"查询历史批次失败: {e}", exc_info=True)
        click.echo(f"{Fore.RED}查询失败: {e}{Style.RESET_ALL}", err=True)
        sys.exit(1)
    finally:
        close_logger()


@history_group.command("show")
@click.argument("batch_id")
def history_show(batch_id: str) -> None:
    """显示指定批次的详细信息"""
    try:
        history = get_history_manager()
        batch = history.get_batch(batch_id)
        if not batch:
            click.echo(f"{Fore.RED}批次不存在: {batch_id}{Style.RESET_ALL}")
            sys.exit(1)

        click.echo(history.format_batch_detail(batch))

        docs = history.get_batch_documents(batch_id)
        if docs:
            click.echo(f"\n{Fore.CYAN}文件列表 ({len(docs)} 个文件):{Style.RESET_ALL}")
            for i, doc in enumerate(docs, 1):
                status_color = Fore.GREEN if doc.status.value in ("archived", "renamed") else Fore.RED if doc.status.value == "failed" else Fore.YELLOW
                click.echo(f"  [{i}] {status_color}{doc.status.value:<12}{Style.RESET_ALL} {doc.source_path.name}")
                if doc.target_path:
                    click.echo(f"       -> {doc.target_path}")

        sys.exit(0)
    except Exception as e:
        logger.error(f"查询批次详情失败: {e}", exc_info=True)
        click.echo(f"{Fore.RED}查询失败: {e}{Style.RESET_ALL}", err=True)
        sys.exit(1)
    finally:
        close_logger()


@history_group.command("failed")
@click.argument("batch_id")
def history_failed(batch_id: str) -> None:
    """显示指定批次的失败文件"""
    try:
        history = get_history_manager()
        docs = history.get_failed_documents(batch_id)
        if not docs:
            click.echo(f"{Fore.GREEN}批次 {batch_id} 没有失败的文件{Style.RESET_ALL}")
            sys.exit(0)

        click.echo(f"\n{Fore.RED}批次 {batch_id} 失败文件列表 ({len(docs)} 个):{Style.RESET_ALL}")
        for i, doc in enumerate(docs, 1):
            click.echo(f"  [{i}] {doc.source_path}")
            click.echo(f"     错误: {doc.error_message}")
            if doc.retry_count > 0:
                click.echo(f"     重试次数: {doc.retry_count}")

        sys.exit(0)
    except Exception as e:
        logger.error(f"查询失败文件: {e}", exc_info=True)
        click.echo(f"{Fore.RED}查询失败: {e}{Style.RESET_ALL}", err=True)
        sys.exit(1)
    finally:
        close_logger()


@cli.command("rollback")
@click.argument("batch_id")
@click.option("--dry-run", is_flag=True, help="试运行模式，不实际执行回滚")
@click.option("--simulate", is_flag=True, help="仅模拟回滚操作")
@click.option("--max-retries", type=int, default=3, help="失败最大重试次数")
def rollback_command(batch_id: str, dry_run: bool, simulate: bool, max_retries: int) -> None:
    """按批次安全撤销归档操作"""
    print_banner()

    try:
        if simulate:
            click.echo(f"{Fore.YELLOW}[模拟模式] 正在模拟回滚批次: {batch_id}{Style.RESET_ALL}")
            rollback_mgr = RollbackManager(dry_run=True)
            result = rollback_mgr.rollback(batch_id, max_retries=max_retries)
        else:
            click.echo(f"{Fore.YELLOW}准备回滚批次: {batch_id}{Style.RESET_ALL}")
            if not dry_run:
                click.confirm("确定要执行回滚操作吗？此操作将移动已归档的文件", abort=True)

            rollback_mgr = RollbackManager(dry_run=dry_run)
            result = rollback_mgr.rollback(batch_id, max_retries=max_retries)

        click.echo("\n" + "=" * 60)
        click.echo("回滚完成摘要:")
        click.echo(f"  批次 ID: {result.batch_id}")
        click.echo(f"  总文件数: {result.total_files}")
        click.echo(f"  成功恢复: {result.restored}")
        click.echo(f"  跳过: {result.skipped}")
        click.echo(f"  冲突: {len(result.conflicts)}")
        click.echo(f"  失败: {len(result.errors)}")
        if result.report_path:
            click.echo(f"  回滚报告: {result.report_path}")
        click.echo("=" * 60)

        if result.conflicts:
            click.echo(f"\n{Fore.YELLOW}冲突详情:{Style.RESET_ALL}")
            for i, c in enumerate(result.conflicts, 1):
                click.echo(f"  [{i}] {c['type']}: {c['message']}")
                click.echo(f"     源: {c['source']}")
                click.echo(f"     目标: {c['target']}")

        if result.errors:
            click.echo(f"\n{Fore.RED}错误详情:{Style.RESET_ALL}")
            for i, e in enumerate(result.errors, 1):
                click.echo(f"  [{i}] {e}")

        if result.errors or result.conflicts:
            sys.exit(1)
        else:
            click.echo(f"\n{Fore.GREEN}回滚完成！{Style.RESET_ALL}")
            sys.exit(0)

    except click.Abort:
        click.echo(f"\n{Fore.YELLOW}用户取消操作{Style.RESET_ALL}")
        sys.exit(130)
    except Exception as e:
        logger.error(f"回滚失败: {e}", exc_info=True)
        click.echo(f"\n{Fore.RED}回滚失败: {e}{Style.RESET_ALL}", err=True)
        sys.exit(1)
    finally:
        close_logger()


@cli.command("retry")
@click.argument("batch_id")
@click.option("--max-retries", type=int, default=3, help="失败最大重试次数")
@click.option("--dry-run", is_flag=True, help="试运行模式")
def retry_command(batch_id: str, max_retries: int, dry_run: bool) -> None:
    """重试指定批次的失败任务"""
    print_banner()

    try:
        history = get_history_manager()
        batch = history.get_batch(batch_id)
        if not batch:
            click.echo(f"{Fore.RED}批次不存在: {batch_id}{Style.RESET_ALL}")
            sys.exit(1)

        failed_docs = history.get_failed_documents(batch_id)
        if not failed_docs:
            click.echo(f"{Fore.GREEN}批次 {batch_id} 没有需要重试的失败文件{Style.RESET_ALL}")
            sys.exit(0)

        click.echo(f"{Fore.YELLOW}找到 {len(failed_docs)} 个失败文件，准备重试{Style.RESET_ALL}")

        for doc in failed_docs:
            click.echo(f"  - {doc.source_path.name}: {doc.error_message}")

        if not dry_run:
            click.confirm("确定要重试这些文件吗？", abort=True)

        from .scanner import FileScanner
        rules = RulesLoader.load_default()
        if batch.target_dir:
            rules.target_dir = batch.target_dir

        command_args = f"retry {batch_id}"
        executor = DocumentExecutor(
            rules=rules,
            dry_run=dry_run,
            max_retries=max_retries,
            command_args=command_args,
        )

        results = executor.process(failed_docs)

        failed = sum(1 for r in results if r.status == ProcessingStatus.FAILED)
        if failed > 0:
            click.echo(f"\n{Fore.YELLOW}重试完成，仍有 {failed} 个文件失败{Style.RESET_ALL}")
            sys.exit(1)
        else:
            click.echo(f"\n{Fore.GREEN}所有失败文件重试成功！{Style.RESET_ALL}")
            sys.exit(0)

    except click.Abort:
        click.echo(f"\n{Fore.YELLOW}用户取消操作{Style.RESET_ALL}")
        sys.exit(130)
    except Exception as e:
        logger.error(f"重试失败: {e}", exc_info=True)
        click.echo(f"\n{Fore.RED}重试失败: {e}{Style.RESET_ALL}", err=True)
        sys.exit(1)
    finally:
        close_logger()


@cli.command("export")
@click.argument("batch_id")
@click.option("-o", "--output-dir", "output_dir", type=click.Path(path_type=Path), default=Path("./exports"), help="输出目录")
@click.option("-f", "--format", "fmt", type=click.Choice(["json", "csv"], case_sensitive=False), default="json", help="导出格式")
@click.option("--include-ocr", is_flag=True, help="包含 OCR 识别文本")
def export_command(batch_id: str, output_dir: Path, fmt: str, include_ocr: bool) -> None:
    """导出指定批次的处理结果"""
    try:
        history = get_history_manager()
        output_dir.mkdir(parents=True, exist_ok=True)
        result = history.export_results(batch_id, output_dir=output_dir, format=fmt, include_ocr=include_ocr)
        click.echo(f"{Fore.GREEN}处理结果已导出: {result}{Style.RESET_ALL}")
        sys.exit(0)
    except Exception as e:
        logger.error(f"导出失败: {e}", exc_info=True)
        click.echo(f"{Fore.RED}导出失败: {e}{Style.RESET_ALL}", err=True)
        sys.exit(1)
    finally:
        close_logger()


@cli.command("validate-config")
@click.argument("config_path", type=click.Path(exists=True, file_okay=True, dir_okay=False, path_type=Path))
@click.option("--show", is_flag=True, help="显示解析后的配置")
def validate_config_command(config_path: Path, show: bool) -> None:
    """验证规则配置文件格式"""
    try:
        click.echo(f"正在验证配置文件: {config_path}")

        rules = RulesLoader.load_from_file(config_path)

        click.echo(f"{Fore.GREEN}✓ 配置文件格式正确{Style.RESET_ALL}")

        if show:
            click.echo("\n解析后的配置:")
            click.echo(f"  重命名模板: {rules.rename_pattern}")
            click.echo(f"  日期格式: {rules.date_format}")
            click.echo(f"  归档策略: {rules.archive_strategy.value}")
            click.echo(f"  冲突策略: {rules.conflict_strategy.value}")
            click.echo(f"  保留原始文件: {'是' if rules.preserve_original else '否'}")
            click.echo(f"  去重: {'启用' if rules.enable_deduplication else '禁用'}")
            click.echo(f"  去重策略: {rules.duplicate_strategy.value}")
            click.echo(f"  OCR: {'启用' if rules.enable_ocr else '禁用'}")
            click.echo(f"  持久化: {'启用' if rules.enable_persistence else '禁用'}")
            if rules.target_dir:
                click.echo(f"  目标目录: {rules.target_dir}")
            if rules.allowed_file_types:
                click.echo(f"  文件类型: {', '.join(t.value for t in rules.allowed_file_types)}")

        sys.exit(0)
    except Exception as e:
        logger.error(f"配置验证失败: {e}", exc_info=True)
        click.echo(f"{Fore.RED}✗ 配置文件验证失败: {e}{Style.RESET_ALL}", err=True)
        sys.exit(1)
    finally:
        close_logger()


@cli.command("verify-manifest")
@click.argument("manifest_path", type=click.Path(exists=True, file_okay=True, dir_okay=False, path_type=Path))
def verify_manifest_command(manifest_path: Path) -> None:
    """验证操作清单的完整性"""
    try:
        click.echo(f"正在验证清单: {manifest_path}")

        manifest_gen = ManifestGenerator()
        result = manifest_gen.verify(manifest_path)

        if result:
            click.echo(f"{Fore.GREEN}✓ 清单验证通过{Style.RESET_ALL}")
            sys.exit(0)
        else:
            click.echo(f"{Fore.RED}✗ 清单验证失败{Style.RESET_ALL}")
            sys.exit(1)
    except Exception as e:
        logger.error(f"清单验证失败: {e}", exc_info=True)
        click.echo(f"{Fore.RED}✗ 清单验证失败: {e}{Style.RESET_ALL}", err=True)
        sys.exit(1)
    finally:
        close_logger()


@cli.command("init-db")
@click.option("--db-path", type=click.Path(path_type=Path), default=None, help="数据库路径")
def init_db_command(db_path: Optional[Path]) -> None:
    """初始化数据库"""
    try:
        db = DatabaseManager(db_path)
        click.echo(f"{Fore.GREEN}✓ 数据库初始化完成: {db.db_path}{Style.RESET_ALL}")
        sys.exit(0)
    except Exception as e:
        logger.error(f"数据库初始化失败: {e}", exc_info=True)
        click.echo(f"{Fore.RED}数据库初始化失败: {e}{Style.RESET_ALL}", err=True)
        sys.exit(1)
    finally:
        close_logger()


def main() -> None:
    cli(obj={})


if __name__ == "__main__":
    main()
