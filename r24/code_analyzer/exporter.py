import csv
import json
from pathlib import Path
from typing import Any

from .models import ProjectStats


def to_dict(stats: ProjectStats) -> dict[str, Any]:
    largest_file = stats.get_largest_file()
    recent_file = stats.get_recently_modified()
    most_lines_file = stats.get_most_lines_file()

    result: dict[str, Any] = {
        "project_path": str(stats.project_path),
        "scan_time": stats.scan_time.isoformat(),
        "summary": {
            "total_files": stats.total_files,
            "total_lines": stats.total_lines,
            "code_lines": stats.code_lines,
            "comment_lines": stats.comment_lines,
            "blank_lines": stats.blank_lines,
            "total_size_bytes": stats.total_size_bytes,
            "total_size_kb": stats.total_size_kb,
            "total_size_mb": stats.total_size_mb,
            "code_ratio": stats.get_code_ratio(),
            "comment_ratio": stats.get_comment_ratio(),
            "blank_ratio": stats.get_blank_ratio(),
        },
        "languages": [],
        "files": [],
        "highlights": {
            "largest_file": {
                "path": str(largest_file.file_path) if largest_file else None,
                "size_bytes": largest_file.file_size_bytes if largest_file else None,
                "size_kb": largest_file.file_size_kb if largest_file else None,
            },
            "recently_modified_file": {
                "path": str(recent_file.file_path) if recent_file else None,
                "last_modified": recent_file.last_modified.isoformat() if recent_file else None,
            },
            "most_lines_file": {
                "path": str(most_lines_file.file_path) if most_lines_file else None,
                "total_lines": most_lines_file.total_lines if most_lines_file else None,
            },
        },
    }

    for language, lang_stats in stats.language_stats.items():
        result["languages"].append({
            "language": language,
            "file_count": lang_stats.file_count,
            "total_lines": lang_stats.total_lines,
            "code_lines": lang_stats.code_lines,
            "comment_lines": lang_stats.comment_lines,
            "blank_lines": lang_stats.blank_lines,
            "total_size_bytes": lang_stats.total_size_bytes,
            "total_size_kb": lang_stats.total_size_kb,
            "avg_lines_per_file": lang_stats.avg_lines_per_file,
        })

    for file_stat in stats.file_stats:
        result["files"].append({
            "path": str(file_stat.file_path),
            "language": file_stat.language,
            "total_lines": file_stat.total_lines,
            "code_lines": file_stat.code_lines,
            "comment_lines": file_stat.comment_lines,
            "blank_lines": file_stat.blank_lines,
            "file_size_bytes": file_stat.file_size_bytes,
            "file_size_kb": file_stat.file_size_kb,
            "last_modified": file_stat.last_modified.isoformat(),
            "encoding": file_stat.encoding,
        })

    return result


def export_json(stats: ProjectStats, output_path: Path) -> None:
    data = to_dict(stats)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def export_csv_summary(stats: ProjectStats, output_path: Path) -> None:
    with open(output_path, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.writer(f)
        
        writer.writerow(["项目摘要"])
        writer.writerow(["项目路径", stats.project_path])
        writer.writerow(["扫描时间", stats.scan_time.strftime("%Y-%m-%d %H:%M:%S")])
        writer.writerow([])
        
        writer.writerow(["总览统计"])
        writer.writerow(["指标", "数值"])
        writer.writerow(["文件总数", stats.total_files])
        writer.writerow(["总行数", stats.total_lines])
        writer.writerow(["代码行数", stats.code_lines])
        writer.writerow(["注释行数", stats.comment_lines])
        writer.writerow(["空行数", stats.blank_lines])
        writer.writerow(["代码占比", f"{stats.get_code_ratio()}%"])
        writer.writerow(["注释占比", f"{stats.get_comment_ratio()}%"])
        writer.writerow(["总大小 (KB)", stats.total_size_kb])
        writer.writerow([])

        writer.writerow(["按语言统计"])
        writer.writerow([
            "语言", "文件数", "总行数", "代码行数", "注释行数",
            "空行数", "总大小 (KB)", "平均每行文件"
        ])
        for language, lang_stats in sorted(stats.language_stats.items()):
            writer.writerow([
                language,
                lang_stats.file_count,
                lang_stats.total_lines,
                lang_stats.code_lines,
                lang_stats.comment_lines,
                lang_stats.blank_lines,
                lang_stats.total_size_kb,
                lang_stats.avg_lines_per_file,
            ])
        writer.writerow([])

        writer.writerow(["特殊文件"])
        largest_file = stats.get_largest_file()
        recent_file = stats.get_recently_modified()
        most_lines_file = stats.get_most_lines_file()

        if largest_file:
            writer.writerow(["最大文件", largest_file.file_path, f"{largest_file.file_size_kb} KB"])
        if recent_file:
            writer.writerow(["最近修改文件", recent_file.file_path, recent_file.last_modified.strftime("%Y-%m-%d %H:%M:%S")])
        if most_lines_file:
            writer.writerow(["行数最多文件", most_lines_file.file_path, f"{most_lines_file.total_lines} 行"])


def export_csv_files(stats: ProjectStats, output_path: Path) -> None:
    with open(output_path, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.writer(f)
        writer.writerow([
            "路径", "语言", "总行数", "代码行数", "注释行数",
            "空行数", "大小 (KB)", "最后修改时间", "编码"
        ])
        for file_stat in sorted(stats.file_stats, key=lambda x: str(x.file_path)):
            writer.writerow([
                str(file_stat.file_path),
                file_stat.language,
                file_stat.total_lines,
                file_stat.code_lines,
                file_stat.comment_lines,
                file_stat.blank_lines,
                file_stat.file_size_kb,
                file_stat.last_modified.strftime("%Y-%m-%d %H:%M:%S"),
                file_stat.encoding or "未知",
            ])


def export_csv(stats: ProjectStats, output_path: Path) -> None:
    summary_path = output_path.with_name(f"{output_path.stem}_summary.csv")
    files_path = output_path.with_name(f"{output_path.stem}_files.csv")
    export_csv_summary(stats, summary_path)
    export_csv_files(stats, files_path)
