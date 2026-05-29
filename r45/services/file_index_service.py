import os
import hashlib
import logging
from typing import List, Tuple
from database.db_manager import DatabaseManager
from utils import SUPPORTED_IMAGE_EXTENSIONS

logger = logging.getLogger(__name__)


class FileIndexService:
    def __init__(self, db: DatabaseManager):
        self.db = db

    @staticmethod
    def compute_file_hash(file_path: str) -> str:
        hasher = hashlib.sha256()
        with open(file_path, "rb") as f:
            while True:
                chunk = f.read(8192)
                if not chunk:
                    break
                hasher.update(chunk)
        return hasher.hexdigest()

    def import_photos(self, order_id: int, file_paths: List[str]) -> Tuple[List[int], List[str]]:
        imported_ids = []
        skipped = []
        for fp in file_paths:
            ext = os.path.splitext(fp)[1].lower()
            if ext not in SUPPORTED_IMAGE_EXTENSIONS:
                skipped.append(f"{os.path.basename(fp)}: 不支持的格式")
                continue

            try:
                file_hash = self.compute_file_hash(fp)
            except (IOError, OSError) as e:
                skipped.append(f"{os.path.basename(fp)}: 无法读取文件 - {e}")
                continue

            if self.db.check_duplicate_photo(file_hash, order_id):
                skipped.append(f"{os.path.basename(fp)}: 重复素材，已存在")
                continue

            file_size = os.path.getsize(fp) if os.path.exists(fp) else 0
            photo_id = self.db.insert("photos", {
                "order_id": order_id,
                "file_path": fp,
                "file_hash": file_hash,
                "original_filename": os.path.basename(fp),
                "file_size": file_size,
                "selected": 0,
                "retouch_status": "待精修",
            })
            imported_ids.append(photo_id)

        return imported_ids, skipped

    def get_photos_by_order(self, order_id: int, selected_only: bool = False):
        if selected_only:
            return self.db.fetch_all("photos", where="order_id=? AND selected=1",
                                     params=(order_id,), order_by="imported_at ASC")
        return self.db.fetch_all("photos", where="order_id=?", params=(order_id,),
                                 order_by="imported_at ASC")

    def get_photos_by_retouch_status(self, order_id: int, status: str):
        return self.db.fetch_all("photos", where="order_id=? AND retouch_status=?",
                                 params=(order_id, status), order_by="imported_at ASC")

    def delete_photo(self, photo_id: int, deleted_by: str = "") -> bool:
        return self.db.soft_delete("photos", photo_id, deleted_by)

    def check_missing_files(self, order_id: int) -> List[dict]:
        photos = self.db.fetch_all("photos", where="order_id=?", params=(order_id,))
        missing = []
        for p in photos:
            if not os.path.exists(p.file_path):
                missing.append({
                    "id": p.id,
                    "file_path": p.file_path,
                    "original_filename": p.original_filename,
                })
        return missing

    def get_photo_count(self, order_id: int) -> dict:
        all_photos = self.db.fetch_all("photos", where="order_id=?", params=(order_id,))
        selected = sum(1 for p in all_photos if p.selected)
        retouching = sum(1 for p in all_photos if p.retouch_status == "精修中")
        retouched = sum(1 for p in all_photos if p.retouch_status == "已完成")
        return {
            "total": len(all_photos),
            "selected": selected,
            "unselected": len(all_photos) - selected,
            "retouch_pending": len(all_photos) - retouching - retouched,
            "retouching": retouching,
            "retouched": retouched,
        }
