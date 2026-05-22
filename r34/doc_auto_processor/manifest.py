import json
import hashlib
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, asdict

from .logger import get_logger
from .models import DocumentInfo, BatchInfo

logger = get_logger()


@dataclass
class ManifestEntry:
    id: int
    source_path: str
    target_path: Optional[str]
    target_name: Optional[str]
    archive_path: Optional[str]
    file_type: str
    file_size: int
    sha256_hash: Optional[str]
    status: str
    error_message: Optional[str]
    operation_type: str
    timestamp: str
    project_code: Optional[str] = None
    contract_code: Optional[str] = None
    batch_id: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class Manifest:
    batch_id: str
    created_at: str
    total_files: int
    success_count: int
    failed_count: int
    skipped_count: int
    entries: List[ManifestEntry]
    manifest_hash: Optional[str] = None
    signature: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "batch_id": self.batch_id,
            "created_at": self.created_at,
            "total_files": self.total_files,
            "success_count": self.success_count,
            "failed_count": self.failed_count,
            "skipped_count": self.skipped_count,
            "manifest_hash": self.manifest_hash,
            "signature": self.signature,
            "entries": [entry.to_dict() for entry in self.entries],
        }


class ManifestGenerator:
    def __init__(self, output_dir: Optional[Path] = None) -> None:
        self.output_dir = Path(output_dir) if output_dir else Path.cwd() / "manifests"

    def _generate_manifest_hash(self, data: Dict[str, Any]) -> str:
        json_str = json.dumps(data, sort_keys=True, ensure_ascii=False)
        return hashlib.sha256(json_str.encode("utf-8")).hexdigest()

    def _create_entry(
        self,
        doc_info: DocumentInfo,
        index: int,
    ) -> ManifestEntry:
        if doc_info.status.value in ("archived", "renamed"):
            operation_type = "move"
        elif doc_info.status.value == "deduplicated":
            operation_type = "deduplicate"
        elif doc_info.status.value == "skipped":
            operation_type = "skip"
        elif doc_info.status.value == "failed":
            operation_type = "failed"
        else:
            operation_type = "process"

        return ManifestEntry(
            id=index,
            source_path=str(doc_info.source_path),
            target_path=str(doc_info.target_path) if doc_info.target_path else None,
            target_name=doc_info.target_name,
            archive_path=str(doc_info.archive_path) if doc_info.archive_path else None,
            file_type=doc_info.metadata.file_type.value,
            file_size=doc_info.metadata.file_size,
            sha256_hash=doc_info.metadata.sha256_hash,
            status=doc_info.status.value,
            error_message=doc_info.error_message,
            operation_type=operation_type,
            timestamp=datetime.now().isoformat(),
            project_code=doc_info.metadata.project_code,
            contract_code=doc_info.metadata.contract_code,
            batch_id=doc_info.batch_id,
        )

    def generate(
        self,
        batch_info: BatchInfo,
        documents: List[DocumentInfo],
        dry_run: bool = False,
    ) -> Manifest:
        self.output_dir.mkdir(parents=True, exist_ok=True)

        entries: List[ManifestEntry] = []
        success_count = 0
        failed_count = 0
        skipped_count = 0

        for i, doc in enumerate(documents, 1):
            entry = self._create_entry(doc, i)
            entries.append(entry)

            if doc.status.value in ("archived", "renamed", "deduplicated"):
                success_count += 1
            elif doc.status.value == "failed":
                failed_count += 1
            elif doc.status.value == "skipped":
                skipped_count += 1

        manifest = Manifest(
            batch_id=batch_info.batch_id,
            created_at=datetime.now().isoformat(),
            total_files=len(entries),
            success_count=success_count,
            failed_count=failed_count,
            skipped_count=skipped_count,
            entries=entries,
        )

        manifest_dict = manifest.to_dict()
        manifest.manifest_hash = self._generate_manifest_hash(
            {k: v for k, v in manifest_dict.items() if k not in ("manifest_hash", "signature")}
        )

        if not dry_run:
            manifest_path = self._save(manifest)
            logger.info(f"操作清单已生成: {manifest_path}")
            return manifest

        logger.info(f"[DRY-RUN] 清单已生成但未保存: {manifest.batch_id}")
        return manifest

    def _save(self, manifest: Manifest) -> Path:
        manifest_path = self.output_dir / f"manifest_{manifest.batch_id}.json"

        with open(manifest_path, "w", encoding="utf-8") as f:
            json.dump(manifest.to_dict(), f, ensure_ascii=False, indent=2)

        return manifest_path

    def load(self, manifest_path: Path) -> Manifest:
        if not manifest_path.exists():
            raise FileNotFoundError(f"清单文件不存在: {manifest_path}")

        try:
            with open(manifest_path, "r", encoding="utf-8") as f:
                data = json.load(f)

            entries = [
                ManifestEntry(**entry_data)
                for entry_data in data.get("entries", [])
            ]

            return Manifest(
                batch_id=data["batch_id"],
                created_at=data["created_at"],
                total_files=data["total_files"],
                success_count=data["success_count"],
                failed_count=data["failed_count"],
                skipped_count=data["skipped_count"],
                entries=entries,
                manifest_hash=data.get("manifest_hash"),
                signature=data.get("signature"),
            )
        except (json.JSONDecodeError, KeyError) as e:
            raise ValueError(f"清单文件格式错误: {e}")

    def verify(self, manifest_path: Path) -> bool:
        try:
            manifest = self.load(manifest_path)

            if not manifest.manifest_hash:
                logger.warning("清单没有哈希值，无法验证")
                return False

            manifest_dict = manifest.to_dict()
            calculated_hash = self._generate_manifest_hash(
                {k: v for k, v in manifest_dict.items() if k not in ("manifest_hash", "signature")}
            )

            if calculated_hash != manifest.manifest_hash:
                logger.error(f"清单哈希验证失败: {manifest_path}")
                return False

            logger.info(f"清单哈希验证通过: {manifest_path}")
            return True

        except Exception as e:
            logger.error(f"清单验证失败 {manifest_path}: {e}")
            return False
