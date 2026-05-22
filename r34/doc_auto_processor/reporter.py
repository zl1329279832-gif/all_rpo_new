import json
import csv
from pathlib import Path
from typing import List, Dict, Any
from datetime import datetime

from .logger import get_logger
from .models import DocumentInfo, ProcessingSummary, ProcessingStatus

logger = get_logger()


class ReportGenerator:
    def __init__(self, output_dir: Path = None) -> None:
        self.output_dir = Path(output_dir) if output_dir else Path.cwd() / "reports"

    def generate(
        self,
        documents: List[DocumentInfo],
        summary: ProcessingSummary,
        format: str = "text",
        report_name: str = None,
    ) -> Path:
        self.output_dir.mkdir(parents=True, exist_ok=True)

        if report_name is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            report_name = f"doc_processing_report_{timestamp}"

        format = format.lower()
        if format == "json":
            return self._generate_json(documents, summary, report_name)
        elif format == "csv":
            return self._generate_csv(documents, summary, report_name)
        elif format == "html":
            return self._generate_html(documents, summary, report_name)
        else:
            return self._generate_text(documents, summary, report_name)

    def _generate_text(
        self,
        documents: List[DocumentInfo],
        summary: ProcessingSummary,
        report_name: str,
    ) -> Path:
        report_path = self.output_dir / f"{report_name}.txt"

        with open(report_path, "w", encoding="utf-8") as f:
            f.write("=" * 80 + "\n")
            f.write("企业文档批处理自动化工具 - 处理报告\n")
            f.write("=" * 80 + "\n\n")

            if summary.start_time:
                f.write(f"开始时间: {summary.start_time.strftime('%Y-%m-%d %H:%M:%S')}\n")
            if summary.end_time:
                f.write(f"结束时间: {summary.end_time.strftime('%Y-%m-%d %H:%M:%S')}\n")
            if summary.start_time and summary.end_time:
                duration = (summary.end_time - summary.start_time).total_seconds()
                f.write(f"总耗时: {duration:.2f} 秒\n")
            f.write("\n")

            f.write("-" * 80 + "\n")
            f.write("处理摘要\n")
            f.write("-" * 80 + "\n")
            f.write(f"总文件数: {summary.total_files}\n")
            f.write(f"总大小: {self._format_size(summary.total_size)}\n")
            f.write(f"成功扫描: {summary.scanned}\n")
            f.write(f"成功重命名: {summary.renamed}\n")
            f.write(f"成功归档: {summary.archived}\n")
            f.write(f"跳过: {summary.skipped}\n")
            f.write(f"失败: {summary.failed}\n\n")

            if summary.warnings:
                f.write("警告信息:\n")
                for warning in summary.warnings:
                    f.write(f"  ! {warning}\n")
                f.write("\n")

            if summary.errors:
                f.write("错误信息:\n")
                for error in summary.errors:
                    f.write(f"  X {error}\n")
                f.write("\n")

            f.write("-" * 80 + "\n")
            f.write("详细处理记录\n")
            f.write("-" * 80 + "\n\n")

            for i, doc in enumerate(documents, 1):
                f.write(f"[{i}] {doc.source_path}\n")
                f.write(f"    状态: {self._format_status(doc.status)}\n")
                f.write(f"    类型: {doc.metadata.file_type.value}\n")
                f.write(f"    大小: {self._format_size(doc.metadata.file_size)}\n")

                if doc.target_name:
                    f.write(f"    重命名为: {doc.target_name}\n")
                if doc.target_path:
                    f.write(f"    目标路径: {doc.target_path}\n")
                if doc.archive_path:
                    f.write(f"    归档路径: {doc.archive_path}\n")

                if doc.metadata.creation_date:
                    f.write(
                        f"    创建日期: {doc.metadata.creation_date.strftime('%Y-%m-%d %H:%M:%S')}\n"
                    )
                if doc.metadata.title:
                    f.write(f"    标题: {doc.metadata.title}\n")
                if doc.metadata.author:
                    f.write(f"    作者: {doc.metadata.author}\n")
                if doc.metadata.project_code:
                    f.write(f"    项目编号: {doc.metadata.project_code}\n")

                if doc.error_message:
                    f.write(f"    错误: {doc.error_message}\n")

                if doc.warnings:
                    for warning in doc.warnings:
                        f.write(f"    警告: {warning}\n")

                f.write("\n")

            f.write("=" * 80 + "\n")
            f.write("报告结束\n")
            f.write("=" * 80 + "\n")

        logger.info(f"文本报告已生成: {report_path}")
        return report_path

    def _generate_json(
        self,
        documents: List[DocumentInfo],
        summary: ProcessingSummary,
        report_name: str,
    ) -> Path:
        report_path = self.output_dir / f"{report_name}.json"

        data = {
            "report_info": {
                "generated_at": datetime.now().isoformat(),
                "version": "1.0.0",
            },
            "summary": self._summary_to_dict(summary),
            "documents": [self._doc_to_dict(doc) for doc in documents],
        }

        with open(report_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2, default=str)

        logger.info(f"JSON 报告已生成: {report_path}")
        return report_path

    def _generate_csv(
        self,
        documents: List[DocumentInfo],
        summary: ProcessingSummary,
        report_name: str,
    ) -> Path:
        report_path = self.output_dir / f"{report_name}.csv"

        fieldnames = [
            "序号", "源文件路径", "状态", "文件类型", "文件大小",
            "目标文件名", "目标路径", "归档路径",
            "创建日期", "修改日期", "标题", "作者", "项目编号",
            "错误信息", "警告信息", "处理时间",
        ]

        with open(report_path, "w", encoding="utf-8-sig", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()

            for i, doc in enumerate(documents, 1):
                row = {
                    "序号": i,
                    "源文件路径": str(doc.source_path),
                    "状态": self._format_status(doc.status),
                    "文件类型": doc.metadata.file_type.value,
                    "文件大小": self._format_size(doc.metadata.file_size),
                    "目标文件名": doc.target_name or "",
                    "目标路径": str(doc.target_path) if doc.target_path else "",
                    "归档路径": str(doc.archive_path) if doc.archive_path else "",
                    "创建日期": doc.metadata.creation_date.strftime("%Y-%m-%d %H:%M:%S") if doc.metadata.creation_date else "",
                    "修改日期": doc.metadata.modification_date.strftime("%Y-%m-%d %H:%M:%S") if doc.metadata.modification_date else "",
                    "标题": doc.metadata.title or "",
                    "作者": doc.metadata.author or "",
                    "项目编号": doc.metadata.project_code or "",
                    "错误信息": doc.error_message or "",
                    "警告信息": "; ".join(doc.warnings),
                    "处理时间": doc.processed_at.strftime("%Y-%m-%d %H:%M:%S") if doc.processed_at else "",
                }
                writer.writerow(row)

            writer.writerow({})
            writer.writerow({"序号": "处理摘要", "源文件路径": f"总文件数: {summary.total_files}"})
            writer.writerow({"序号": "", "源文件路径": f"成功扫描: {summary.scanned}"})
            writer.writerow({"序号": "", "源文件路径": f"成功重命名: {summary.renamed}"})
            writer.writerow({"序号": "", "源文件路径": f"成功归档: {summary.archived}"})
            writer.writerow({"序号": "", "源文件路径": f"跳过: {summary.skipped}"})
            writer.writerow({"序号": "", "源文件路径": f"失败: {summary.failed}"})

        logger.info(f"CSV 报告已生成: {report_path}")
        return report_path

    def _generate_html(
        self,
        documents: List[DocumentInfo],
        summary: ProcessingSummary,
        report_name: str,
    ) -> Path:
        report_path = self.output_dir / f"{report_name}.html"

        html_content = self._build_html(documents, summary)

        with open(report_path, "w", encoding="utf-8") as f:
            f.write(html_content)

        logger.info(f"HTML 报告已生成: {report_path}")
        return report_path

    def _build_html(
        self,
        documents: List[DocumentInfo],
        summary: ProcessingSummary,
    ) -> str:
        status_colors = {
            ProcessingStatus.PENDING: "#9e9e9e",
            ProcessingStatus.SCANNED: "#2196f3",
            ProcessingStatus.RENAMED: "#4caf50",
            ProcessingStatus.ARCHIVED: "#8bc34a",
            ProcessingStatus.SKIPPED: "#ff9800",
            ProcessingStatus.FAILED: "#f44336",
            ProcessingStatus.RETRYING: "#ffc107",
        }

        duration = ""
        if summary.start_time and summary.end_time:
            duration = f"{(summary.end_time - summary.start_time).total_seconds():.2f} 秒"

        rows = []
        for i, doc in enumerate(documents, 1):
            status_color = status_colors.get(doc.status, "#9e9e9e")
            status_text = self._format_status(doc.status)
            row = f"""
            <tr>
                <td>{i}</td>
                <td><code>{doc.source_path}</code></td>
                <td><span style="color:{status_color};font-weight:bold">{status_text}</span></td>
                <td>{doc.metadata.file_type.value}</td>
                <td>{self._format_size(doc.metadata.file_size)}</td>
                <td>{doc.target_name or '-'}</td>
                <td>{doc.metadata.project_code or '-'}</td>
                <td>{doc.error_message or ''}</td>
            </tr>
            """
            rows.append(row)

        html = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>文档处理报告</title>
    <style>
        * {{ box-sizing: border-box; margin: 0; padding: 0; }}
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; padding: 20px; }}
        .container {{ max-width: 1400px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; }}
        .header h1 {{ font-size: 28px; margin-bottom: 10px; }}
        .header .meta {{ opacity: 0.9; font-size: 14px; }}
        .summary {{ padding: 30px; background: #fafafa; border-bottom: 1px solid #eee; }}
        .summary h2 {{ margin-bottom: 20px; color: #333; }}
        .stats {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; }}
        .stat-card {{ background: white; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #e0e0e0; }}
        .stat-card .value {{ font-size: 32px; font-weight: bold; color: #667eea; }}
        .stat-card .label {{ font-size: 13px; color: #666; margin-top: 5px; }}
        .stat-card.failed .value {{ color: #f44336; }}
        .stat-card.skipped .value {{ color: #ff9800; }}
        .details {{ padding: 30px; }}
        .details h2 {{ margin-bottom: 20px; color: #333; }}
        table {{ width: 100%; border-collapse: collapse; font-size: 14px; }}
        th, td {{ padding: 12px; text-align: left; border-bottom: 1px solid #e0e0e0; }}
        th {{ background: #f5f5f5; font-weight: 600; color: #555; }}
        tr:hover {{ background: #fafafa; }}
        code {{ background: #f0f0f0; padding: 2px 6px; border-radius: 3px; font-family: 'Consolas', monospace; font-size: 12px; }}
        .errors {{ padding: 20px 30px; background: #ffebee; }}
        .errors h3 {{ color: #c62828; margin-bottom: 10px; }}
        .errors ul {{ margin-left: 20px; color: #c62828; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>企业文档批处理自动化工具 - 处理报告</h1>
            <div class="meta">
                生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} | 总耗时: {duration}
            </div>
        </div>

        <div class="summary">
            <h2>处理摘要</h2>
            <div class="stats">
                <div class="stat-card"><div class="value">{summary.total_files}</div><div class="label">总文件数</div></div>
                <div class="stat-card"><div class="value">{summary.scanned}</div><div class="label">成功扫描</div></div>
                <div class="stat-card"><div class="value">{summary.renamed}</div><div class="label">成功重命名</div></div>
                <div class="stat-card"><div class="value">{summary.archived}</div><div class="label">成功归档</div></div>
                <div class="stat-card skipped"><div class="value">{summary.skipped}</div><div class="label">跳过</div></div>
                <div class="stat-card failed"><div class="value">{summary.failed}</div><div class="label">失败</div></div>
            </div>
        </div>

        {f'''
        <div class="errors">
            <h3>错误信息 ({len(summary.errors)})</h3>
            <ul>
                {''.join(f'<li>{e}</li>' for e in summary.errors)}
            </ul>
        </div>
        ''' if summary.errors else ''}

        <div class="details">
            <h2>详细记录</h2>
            <table>
                <thead>
                    <tr>
                        <th>序号</th>
                        <th>源文件路径</th>
                        <th>状态</th>
                        <th>类型</th>
                        <th>大小</th>
                        <th>目标文件名</th>
                        <th>项目编号</th>
                        <th>错误信息</th>
                    </tr>
                </thead>
                <tbody>
                    {''.join(rows)}
                </tbody>
            </table>
        </div>
    </div>
</body>
</html>
"""
        return html

    @staticmethod
    def _format_size(size_bytes: int) -> str:
        if size_bytes < 1024:
            return f"{size_bytes} B"
        elif size_bytes < 1024 * 1024:
            return f"{size_bytes / 1024:.2f} KB"
        elif size_bytes < 1024 * 1024 * 1024:
            return f"{size_bytes / (1024 * 1024):.2f} MB"
        else:
            return f"{size_bytes / (1024 * 1024 * 1024):.2f} GB"

    @staticmethod
    def _format_status(status: ProcessingStatus) -> str:
        status_map = {
            ProcessingStatus.PENDING: "待处理",
            ProcessingStatus.SCANNED: "已扫描",
            ProcessingStatus.RENAMED: "已重命名",
            ProcessingStatus.ARCHIVED: "已归档",
            ProcessingStatus.SKIPPED: "已跳过",
            ProcessingStatus.FAILED: "失败",
            ProcessingStatus.RETRYING: "重试中",
        }
        return status_map.get(status, status.value)

    @staticmethod
    def _summary_to_dict(summary: ProcessingSummary) -> Dict[str, Any]:
        return {
            "total_files": summary.total_files,
            "scanned": summary.scanned,
            "renamed": summary.renamed,
            "archived": summary.archived,
            "skipped": summary.skipped,
            "failed": summary.failed,
            "total_size": summary.total_size,
            "start_time": summary.start_time.isoformat() if summary.start_time else None,
            "end_time": summary.end_time.isoformat() if summary.end_time else None,
            "errors": summary.errors,
            "warnings": summary.warnings,
        }

    @staticmethod
    def _doc_to_dict(doc: DocumentInfo) -> Dict[str, Any]:
        return {
            "source_path": str(doc.source_path),
            "target_name": doc.target_name,
            "target_path": str(doc.target_path) if doc.target_path else None,
            "archive_path": str(doc.archive_path) if doc.archive_path else None,
            "status": doc.status.value,
            "error_message": doc.error_message,
            "retry_count": doc.retry_count,
            "warnings": doc.warnings,
            "processed_at": doc.processed_at.isoformat() if doc.processed_at else None,
            "metadata": {
                "file_type": doc.metadata.file_type.value,
                "title": doc.metadata.title,
                "author": doc.metadata.author,
                "creation_date": doc.metadata.creation_date.isoformat() if doc.metadata.creation_date else None,
                "modification_date": doc.metadata.modification_date.isoformat() if doc.metadata.modification_date else None,
                "file_size": doc.metadata.file_size,
                "page_count": doc.metadata.page_count,
                "project_code": doc.metadata.project_code,
                "mime_type": doc.metadata.mime_type,
                "extra": doc.metadata.extra,
            },
        }
