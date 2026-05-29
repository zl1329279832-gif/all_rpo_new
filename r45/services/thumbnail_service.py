import os
import logging
from typing import Optional
from PIL import Image
from database.db_manager import DatabaseManager
from utils import THUMBNAIL_DIR, THUMBNAIL_SIZE

logger = logging.getLogger(__name__)


class ThumbnailService:
    def __init__(self, db: DatabaseManager):
        self.db = db
        os.makedirs(THUMBNAIL_DIR, exist_ok=True)

    def generate_thumbnail(self, photo_id: int) -> Optional[str]:
        photo = self.db.fetch_one("photos", photo_id)
        if not photo:
            return None

        if photo.thumbnail_path and os.path.exists(photo.thumbnail_path):
            return photo.thumbnail_path

        if not os.path.exists(photo.file_path):
            logger.warning(f"源文件不存在: {photo.file_path}")
            return None

        try:
            thumb_dir = os.path.join(str(THUMBNAIL_DIR), str(photo.order_id))
            os.makedirs(thumb_dir, exist_ok=True)

            thumb_filename = f"thumb_{photo.id}_{os.path.splitext(photo.original_filename)[0]}.jpg"
            thumb_path = os.path.join(thumb_dir, thumb_filename)

            with Image.open(photo.file_path) as img:
                img = img.convert("RGB")
                img.thumbnail(THUMBNAIL_SIZE, Image.Resampling.LANCZOS)
                img.save(thumb_path, "JPEG", quality=85)

            self.db.update("photos", photo_id, {"thumbnail_path": thumb_path})
            return thumb_path

        except Exception as e:
            logger.error(f"生成缩略图失败: {photo.file_path} - {e}")
            return None

    def generate_thumbnails_for_order(self, order_id: int):
        photos = self.db.fetch_all("photos", where="order_id=?", params=(order_id,))
        results = []
        for photo in photos:
            thumb_path = self.generate_thumbnail(photo.id)
            results.append((photo.id, thumb_path))
        return results

    def get_thumbnail_path(self, photo_id: int) -> Optional[str]:
        photo = self.db.fetch_one("photos", photo_id)
        if not photo:
            return None
        if photo.thumbnail_path and os.path.exists(photo.thumbnail_path):
            return photo.thumbnail_path
        return self.generate_thumbnail(photo_id)

    def cleanup_thumbnails(self, order_id: int):
        thumb_dir = os.path.join(str(THUMBNAIL_DIR), str(order_id))
        if os.path.exists(thumb_dir):
            import shutil
            shutil.rmtree(thumb_dir, ignore_errors=True)
