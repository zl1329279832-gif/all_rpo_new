from pathlib import Path
from typing import List, Optional, Set

import typer
from rich.console import Console
from rich.progress import (
    BarColumn,
    Progress,
    SpinnerColumn,
    TextColumn,
    TimeElapsedColumn,
)
from rich.table import Table
from rich.tree import Tree
from typing_extensions import Annotated

from .analyzer import analyze_project, analyze_file
from .exporter import export_csv, export_json
from .models import ProjectStats


app = typer.Typer(
    name="code-analyzer",
    help="项目代码行数统计与文件分析 CLI 工具",
    add_completion=False,
)
console = Console()


def _parse_ignore_dirs(ignore_dirs: Optional[List[str]]) -> Set[str]:
    return set(ignore_dirs) if ignore_dirs else set()


def _parse_ignore_patterns(ignore_patterns: Optional[List[str]]) -> Set[str]:
    return set(ignore_patterns) if ignore_patterns else set()


def _parse_extensions(extensions: Optional[List[str]]) -> Optional[Set[str]]:
    if not extensions:
        return None
    normalized = []
    for ext in extensions:
        if not ext.startswith("."):
            ext = f".{ext}"
        normalized.append(ext.lower())
    return set(normalized)


def _display_summary(stats: ProjectStats) -> None:
    console.rule("[bold blue]项目代码统计摘要[/bold blue]")
    console.print()

    overview_table = Table(title="总览统计", show_header=True, header_style="bold magenta")
    overview_table.add_column("指标", style="cyan", no_wrap=True)
    overview_table.add_column("数值", style="green", justify="right")
    overview_table.add_row("项目路径", str(stats.project_path))
    overview_table.add_row("文件总数", f"{stats.total_files:,}")
    overview_table.add_row("总行数", f"{stats.total_lines:,}")
    overview_table.add_row("代码行数", f"{stats.code_lines:,}")
    overview_table.add_row("注释行数", f"{stats.comment_lines:,}")
    overview_table.add_row("空行数", f"{stats.blank_lines:,}")
    overview_table.add_row("总大小", f"{stats.total_size_kb} KB")
    console.print(overview_table)
    console.print()

    ratio_table = Table(title="代码比例", show_header=True, header_style="bold magenta")
    ratio_table.add_column("类型", style="cyan")
    ratio_table.add_column("比例", style="green")
    ratio_table.add_column("进度条")
    
    code_ratio = stats.get_code_ratio()
    comment_ratio = stats.get_comment_ratio()
    blank_ratio = stats.get_blank_ratio()

    def _make_bar(ratio: float, color: str) -> str:
        total = 40
        filled = int(ratio / 100 * total)
        empty = total - filled
        bar = f"[{color}]{'#' * filled}[/]{'-' * empty}"
        return f"{bar} {ratio}%"

    ratio_table.add_row("代码", f"{code_ratio}%", _make_bar(code_ratio, "green"))
    ratio_table.add_row("注释", f"{comment_ratio}%", _make_bar(comment_ratio, "blue"))
    ratio_table.add_row("空行", f"{blank_ratio}%", _make_bar(blank_ratio, "yellow"))
    console.print(ratio_table)
    console.print()

    if stats.language_stats:
        lang_table = Table(title="按语言统计", show_header=True, header_style="bold magenta")
        lang_table.add_column("语言", style="cyan")
        lang_table.add_column("文件数", style="green", justify="right")
        lang_table.add_column("总行数", style="green", justify="right")
        lang_table.add_column("代码行", style="green", justify="right")
        lang_table.add_column("注释行", style="blue", justify="right")
        lang_table.add_column("空行", style="yellow", justify="right")
        lang_table.add_column("大小 (KB)", style="magenta", justify="right")
        
        sorted_langs = sorted(
            stats.language_stats.values(),
            key=lambda x: x.total_lines,
            reverse=True,
        )
        for lang in sorted_langs:
            lang_table.add_row(
                lang.language,
                f"{lang.file_count:,}",
                f"{lang.total_lines:,}",
                f"{lang.code_lines:,}",
                f"{lang.comment_lines:,}",
                f"{lang.blank_lines:,}",
                f"{lang.total_size_kb:.2f}",
            )
        console.print(lang_table)
        console.print()

    highlights_table = Table(title="特殊文件", show_header=True, header_style="bold magenta")
    highlights_table.add_column("类别", style="cyan")
    highlights_table.add_column("文件", style="green")
    highlights_table.add_column("详情", style="magenta")

    largest_file = stats.get_largest_file()
    recent_file = stats.get_recently_modified()
    most_lines_file = stats.get_most_lines_file()

    if largest_file:
        highlights_table.add_row(
            "最大文件",
            str(largest_file.file_path),
            f"{largest_file.file_size_kb:.2f} KB",
        )
    if recent_file:
        highlights_table.add_row(
            "最近修改",
            str(recent_file.file_path),
            recent_file.last_modified.strftime("%Y-%m-%d %H:%M:%S"),
        )
    if most_lines_file:
        highlights_table.add_row(
            "行数最多",
            str(most_lines_file.file_path),
            f"{most_lines_file.total_lines:,} 行",
        )

    if any([largest_file, recent_file, most_lines_file]):
        console.print(highlights_table)


def _display_file_tree(stats: ProjectStats, limit: int = 50) -> None:
    console.rule("[bold blue]文件列表[/bold blue]")
    console.print()

    sorted_files = sorted(
        stats.file_stats,
        key=lambda f: f.total_lines,
        reverse=True,
    )

    tree = Tree(f"[bold]{stats.project_path}[/bold] (共 {stats.total_files} 个文件)")

    lang_nodes: dict = {}
    for language in sorted(stats.language_stats.keys()):
        lang_nodes[language] = tree.add(f"[cyan]{language}[/cyan]")

    for file_stat in sorted_files[:limit]:
        lang_node = lang_nodes.get(file_stat.language, tree)
        display_path = str(file_stat.file_path)
        if len(display_path) > 60:
            display_path = "..." + display_path[-57:]
        lang_node.add(
            f"[green]{display_path}[/green] "
            f"[dim]({file_stat.total_lines} 行, {file_stat.file_size_kb:.1f} KB)[/dim]"
        )

    if len(sorted_files) > limit:
        tree.add(f"[dim]... 及其他 {len(sorted_files) - limit} 个文件[/dim]")

    console.print(tree)
    console.print()


def _run_scan(
    project_path: Path,
    ignore_dirs: Optional[List[str]],
    ignore_patterns: Optional[List[str]],
    extensions: Optional[List[str]],
    show_progress: bool = True,
) -> ProjectStats:
    parsed_ignore_dirs = _parse_ignore_dirs(ignore_dirs)
    parsed_ignore_patterns = _parse_ignore_patterns(ignore_patterns)
    parsed_extensions = _parse_extensions(extensions)

    if show_progress:
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            TextColumn("[progress.percentage]{task.percentage:>3.0f}%"),
            TimeElapsedColumn(),
            console=console,
        ) as progress:
            scan_task = progress.add_task("扫描项目...", total=None)
            stats = analyze_project(
                project_path=project_path,
                ignore_dirs=parsed_ignore_dirs,
                ignore_patterns=parsed_ignore_patterns,
                extensions=parsed_extensions,
            )
            progress.update(scan_task, total=1, completed=1)
    else:
        stats = analyze_project(
            project_path=project_path,
            ignore_dirs=parsed_ignore_dirs,
            ignore_patterns=parsed_ignore_patterns,
            extensions=parsed_extensions,
        )

    return stats


@app.command("scan")
def scan(
    project_path: Annotated[
        Path,
        typer.Argument(
            exists=True,
            file_okay=False,
            dir_okay=True,
            readable=True,
            help="要分析的项目路径",
        ),
    ],
    ignore_dirs: Annotated[
        Optional[List[str]],
        typer.Option(
            "--ignore-dir",
            "-i",
            help="额外忽略的目录名称（可多次指定）",
        ),
    ] = None,
    ignore_patterns: Annotated[
        Optional[List[str]],
        typer.Option(
            "--ignore-pattern",
            "-p",
            help="额外忽略的文件匹配模式（可多次指定）",
        ),
    ] = None,
    extensions: Annotated[
        Optional[List[str]],
        typer.Option(
            "--ext",
            "-e",
            help="仅分析指定扩展名的文件（可多次指定）",
        ),
    ] = None,
    quiet: Annotated[
        bool,
        typer.Option("--quiet", "-q", help="静默模式，不显示进度条"),
    ] = False,
    show_files: Annotated[
        bool,
        typer.Option("--files", "-f", help="显示文件列表"),
    ] = False,
    file_limit: Annotated[
        int,
        typer.Option("--limit", "-n", help="文件列表显示数量限制"),
    ] = 50,
) -> None:
    """扫描项目并显示完整分析结果。"""
    stats = _run_scan(
        project_path=project_path,
        ignore_dirs=ignore_dirs,
        ignore_patterns=ignore_patterns,
        extensions=extensions,
        show_progress=not quiet,
    )

    if stats.total_files == 0:
        console.print("[yellow]未找到任何可分析的文件[/yellow]")
        raise typer.Exit(code=0)

    _display_summary(stats)

    if show_files:
        _display_file_tree(stats, limit=file_limit)


@app.command("summary")
def summary(
    project_path: Annotated[
        Path,
        typer.Argument(
            exists=True,
            file_okay=False,
            dir_okay=True,
            readable=True,
            help="要分析的项目路径",
        ),
    ],
    ignore_dirs: Annotated[
        Optional[List[str]],
        typer.Option(
            "--ignore-dir",
            "-i",
            help="额外忽略的目录名称（可多次指定）",
        ),
    ] = None,
    ignore_patterns: Annotated[
        Optional[List[str]],
        typer.Option(
            "--ignore-pattern",
            "-p",
            help="额外忽略的文件匹配模式（可多次指定）",
        ),
    ] = None,
    extensions: Annotated[
        Optional[List[str]],
        typer.Option(
            "--ext",
            "-e",
            help="仅分析指定扩展名的文件（可多次指定）",
        ),
    ] = None,
    quiet: Annotated[
        bool,
        typer.Option("--quiet", "-q", help="静默模式，不显示进度条"),
    ] = False,
) -> None:
    """仅显示项目统计摘要。"""
    stats = _run_scan(
        project_path=project_path,
        ignore_dirs=ignore_dirs,
        ignore_patterns=ignore_patterns,
        extensions=extensions,
        show_progress=not quiet,
    )

    if stats.total_files == 0:
        console.print("[yellow]未找到任何可分析的文件[/yellow]")
        raise typer.Exit(code=0)

    _display_summary(stats)


@app.command("export")
def export(
    project_path: Annotated[
        Path,
        typer.Argument(
            exists=True,
            file_okay=False,
            dir_okay=True,
            readable=True,
            help="要分析的项目路径",
        ),
    ],
    output: Annotated[
        Path,
        typer.Option(
            "--output",
            "-o",
            help="导出文件路径",
        ),
    ],
    format: Annotated[
        str,
        typer.Option(
            "--format",
            "-f",
            help="导出格式",
            case_sensitive=False,
        ),
    ] = "json",
    ignore_dirs: Annotated[
        Optional[List[str]],
        typer.Option(
            "--ignore-dir",
            "-i",
            help="额外忽略的目录名称（可多次指定）",
        ),
    ] = None,
    ignore_patterns: Annotated[
        Optional[List[str]],
        typer.Option(
            "--ignore-pattern",
            "-p",
            help="额外忽略的文件匹配模式（可多次指定）",
        ),
    ] = None,
    extensions: Annotated[
        Optional[List[str]],
        typer.Option(
            "--ext",
            "-e",
            help="仅分析指定扩展名的文件（可多次指定）",
        ),
    ] = None,
    quiet: Annotated[
        bool,
        typer.Option("--quiet", "-q", help="静默模式，不显示进度条"),
    ] = False,
) -> None:
    """将分析结果导出为 JSON 或 CSV 格式。"""
    stats = _run_scan(
        project_path=project_path,
        ignore_dirs=ignore_dirs,
        ignore_patterns=ignore_patterns,
        extensions=extensions,
        show_progress=not quiet,
    )

    if stats.total_files == 0:
        console.print("[yellow]未找到任何可分析的文件[/yellow]")
        raise typer.Exit(code=0)

    format_lower = format.lower()

    if format_lower == "json":
        if output.suffix != ".json":
            output = output.with_suffix(".json")
        export_json(stats, output)
        console.print(f"[green]OK JSON 数据已导出到:[/green] {output}")
    elif format_lower == "csv":
        if output.suffix != ".csv":
            output = output.with_suffix(".csv")
        export_csv(stats, output)
        console.print(f"[green]OK CSV 数据已导出:[/green]")
        summary_path = output.with_name(f"{output.stem}_summary.csv")
        files_path = output.with_name(f"{output.stem}_files.csv")
        console.print(f"  - 摘要: {summary_path}")
        console.print(f"  - 文件: {files_path}")
    else:
        console.print(f"[red]ERROR 不支持的导出格式: {format}[/red]")
        console.print("[yellow]支持的格式: json, csv[/yellow]")
        raise typer.Exit(code=1)

    _display_summary(stats)


@app.callback(invoke_without_command=False)
def main(
    version: Annotated[
        bool,
        typer.Option("--version", "-v", help="显示版本信息"),
    ] = False,
) -> None:
    """项目代码行数统计与文件分析 CLI 工具。"""
    from . import __version__

    if version:
        console.print(f"[bold]code-analyzer[/bold] v{__version__}")
        raise typer.Exit(code=0)


if __name__ == "__main__":
    app()
