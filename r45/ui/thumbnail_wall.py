import os
from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QGridLayout, QLabel, QPushButton,
    QScrollArea, QFileDialog, QMessageBox, QComboBox, QMenu, QSizePolicy
)
from PySide6.QtCore import Signal, Qt, QSize
from PySide6.QtGui import QPixmap, QImage
from services.file_index_service import FileIndexService
from services.thumbnail_service import ThumbnailService
from services.order_service import OrderService
from utils import SUPPORTED_IMAGE_EXTENSIONS


class ThumbnailItem(QWidget):
    clicked = Signal(int)
    selection_toggled = Signal(int, int)

    def __init__(self, photo_id: int, thumbnail_path: str, filename: str,
                 selected: bool = False, retouch_status: str = "待精修", parent=None):
        super().__init__(parent)
        self.photo_id = photo_id
        self._selected = selected
        self.setFixedSize(160, 180)
        self.setCursor(Qt.CursorShape.PointingHandCursor)
        self._setup_ui(thumbnail_path, filename, selected, retouch_status)

    def _setup_ui(self, thumbnail_path, filename, selected, retouch_status):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(4, 4, 4, 4)
        layout.setSpacing(2)

        self.img_label = QLabel()
        self.img_label.setFixedSize(150, 112)
        self.img_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.img_label.setScaledContents(True)

        if thumbnail_path and os.path.exists(thumbnail_path):
            pixmap = QPixmap(thumbnail_path)
            self.img_label.setPixmap(pixmap.scaled(150, 112, Qt.AspectRatioMode.KeepAspectRatio, Qt.TransformationMode.SmoothTransformation))
        else:
            self.img_label.setText("无缩略图")
            self.img_label.setStyleSheet("background-color: #ecf0f1; color: #95a5a6;")

        self._update_border(selected)
        layout.addWidget(self.img_label)

        name_label = QLabel(filename[:20])
        name_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        name_label.setMaximumHeight(18)
        layout.addWidget(name_label)

        retouch_colors = {"待精修": "#f39c12", "精修中": "#3498db", "已完成": "#27ae60"}
        color = retouch_colors.get(retouch_status, "#95a5a6")
        status_label = QLabel(retouch_status)
        status_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        status_label.setStyleSheet(f"color: {color}; font-size: 11px;")
        layout.addWidget(status_label)

    def _update_border(self, selected):
        if selected:
            self.setStyleSheet("ThumbnailItem { border: 3px solid #27ae60; border-radius: 6px; background: #d5f5e3; }")
        else:
            self.setStyleSheet("ThumbnailItem { border: 1px solid #dcdde1; border-radius: 6px; background: white; }")
        self._selected = selected

    def mousePressEvent(self, event):
        if event.button() == Qt.MouseButton.LeftButton:
            new_selected = 0 if self._selected else 1
            self._update_border(new_selected == 1)
            self.selection_toggled.emit(self.photo_id, new_selected)
        super().mousePressEvent(event)

    def mouseDoubleClickEvent(self, event):
        self.clicked.emit(self.photo_id)
        super().mouseDoubleClickEvent(event)


class ThumbnailWall(QWidget):
    photo_clicked = Signal(int)
    order_changed = Signal()

    def __init__(self, order_service: OrderService,
                 file_index_service: FileIndexService,
                 thumbnail_service: ThumbnailService,
                 parent=None):
        super().__init__(parent)
        self.order_service = order_service
        self.file_index_service = file_index_service
        self.thumbnail_service = thumbnail_service
        self._current_order_id = None
        self._filter_selected = False
        self._filter_retouch = ""
        self._setup_ui()

    def _setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(6, 6, 6, 6)
        layout.setSpacing(6)

        toolbar = QHBoxLayout()

        self.btn_import = QPushButton("导入照片")
        self.btn_import.setProperty("btnType", "success")
        self.btn_import.clicked.connect(self._import_photos)

        self.btn_generate_thumbs = QPushButton("生成缩略图")
        self.btn_generate_thumbs.clicked.connect(self._generate_thumbnails)

        self.filter_combo = QComboBox()
        self.filter_combo.addItem("全部照片", "all")
        self.filter_combo.addItem("已选片", "selected")
        self.filter_combo.addItem("未选片", "unselected")
        self.filter_combo.currentIndexChanged.connect(self._on_filter_changed)

        self.retouch_filter_combo = QComboBox()
        self.retouch_filter_combo.addItem("全部精修状态", "")
        self.retouch_filter_combo.addItem("待精修", "待精修")
        self.retouch_filter_combo.addItem("精修中", "精修中")
        self.retouch_filter_combo.addItem("已完成", "已完成")
        self.retouch_filter_combo.currentIndexChanged.connect(self._on_retouch_filter_changed)

        self.btn_select_all = QPushButton("全选")
        self.btn_select_all.setProperty("btnType", "secondary")
        self.btn_select_all.clicked.connect(self._select_all)

        self.btn_deselect_all = QPushButton("取消全选")
        self.btn_deselect_all.setProperty("btnType", "secondary")
        self.btn_deselect_all.clicked.connect(self._deselect_all)

        self.btn_check_files = QPushButton("检查文件")
        self.btn_check_files.clicked.connect(self._check_missing_files)

        self.stats_label = QLabel("")
        toolbar.addWidget(self.btn_import)
        toolbar.addWidget(self.btn_generate_thumbs)
        toolbar.addWidget(QLabel("筛选:"))
        toolbar.addWidget(self.filter_combo)
        toolbar.addWidget(self.retouch_filter_combo)
        toolbar.addWidget(self.btn_select_all)
        toolbar.addWidget(self.btn_deselect_all)
        toolbar.addWidget(self.btn_check_files)
        toolbar.addStretch()
        toolbar.addWidget(self.stats_label)
        layout.addLayout(toolbar)

        self.scroll_area = QScrollArea()
        self.scroll_area.setWidgetResizable(True)
        self.scroll_content = QWidget()
        self.grid_layout = QGridLayout(self.scroll_content)
        self.grid_layout.setSpacing(8)
        self.grid_layout.setAlignment(Qt.AlignmentFlag.AlignTop | Qt.AlignmentFlag.AlignLeft)
        self.scroll_area.setWidget(self.scroll_content)
        layout.addWidget(self.scroll_area)

        self._photo_items = {}

    def load_order_photos(self, order_id: int):
        self._current_order_id = order_id
        self._refresh_photos()

    def _refresh_photos(self):
        for item in self._photo_items.values():
            item.setParent(None)
            item.deleteLater()
        self._photo_items.clear()

        if not self._current_order_id:
            self.stats_label.setText("")
            return

        photos = self.file_index_service.get_photos_by_order(self._current_order_id)

        if self.filter_combo.currentData() == "selected":
            photos = [p for p in photos if p.selected]
        elif self.filter_combo.currentData() == "unselected":
            photos = [p for p in photos if not p.selected]

        retouch_filter = self.retouch_filter_combo.currentData()
        if retouch_filter:
            photos = [p for p in photos if p.retouch_status == retouch_filter]

        cols = max(1, (self.scroll_area.viewport().width() - 16) // 168)
        for i, photo in enumerate(photos):
            thumb_path = self.thumbnail_service.get_thumbnail_path(photo.id)
            item = ThumbnailItem(
                photo_id=photo.id,
                thumbnail_path=thumb_path or "",
                filename=photo.original_filename,
                selected=bool(photo.selected),
                retouch_status=photo.retouch_status,
            )
            item.selection_toggled.connect(self._on_selection_toggled)
            item.clicked.connect(self.photo_clicked.emit)
            row, col = divmod(i, cols)
            self.grid_layout.addWidget(item, row, col)
            self._photo_items[photo.id] = item

        counts = self.file_index_service.get_photo_count(self._current_order_id)
        self.stats_label.setText(
            f"总计: {counts['total']} | 已选: {counts['selected']} | "
            f"待精修: {counts['retouch_pending']} | 精修中: {counts['retouching']} | "
            f"已完成: {counts['retouched']}"
        )

    def _import_photos(self):
        if not self._current_order_id:
            QMessageBox.warning(self, "提示", "请先选择订单")
            return
        exts = " ".join([f"*{e}" for e in SUPPORTED_IMAGE_EXTENSIONS])
        file_paths, _ = QFileDialog.getOpenFileNames(self, "选择照片文件", "", f"图片文件 ({exts})")
        if not file_paths:
            return
        imported, skipped = self.file_index_service.import_photos(self._current_order_id, file_paths)
        if skipped:
            msg = "\n".join(skipped[:10])
            QMessageBox.warning(self, "导入提示", f"成功导入 {len(imported)} 张，跳过 {len(skipped)} 张:\n{msg}")
        else:
            QMessageBox.information(self, "导入完成", f"成功导入 {len(imported)} 张照片")
        self._refresh_photos()

    def _generate_thumbnails(self):
        if not self._current_order_id:
            return
        self.thumbnail_service.generate_thumbnails_for_order(self._current_order_id)
        self._refresh_photos()

    def _on_filter_changed(self):
        self._refresh_photos()

    def _on_retouch_filter_changed(self):
        self._refresh_photos()

    def _on_selection_toggled(self, photo_id: int, selected: int):
        self.order_service.toggle_photo_selected(photo_id, selected)
        self._update_stats()

    def _select_all(self):
        if not self._current_order_id:
            return
        photos = self.file_index_service.get_photos_by_order(self._current_order_id)
        for p in photos:
            if not p.selected:
                self.order_service.toggle_photo_selected(p.id, 1)
        self._refresh_photos()

    def _deselect_all(self):
        if not self._current_order_id:
            return
        photos = self.file_index_service.get_photos_by_order(self._current_order_id)
        for p in photos:
            if p.selected:
                self.order_service.toggle_photo_selected(p.id, 0)
        self._refresh_photos()

    def _check_missing_files(self):
        if not self._current_order_id:
            return
        missing = self.file_index_service.check_missing_files(self._current_order_id)
        if not missing:
            QMessageBox.information(self, "检查结果", "所有源文件均存在，无丢失")
        else:
            msg = "\n".join([f"• {m['original_filename']}: {m['file_path']}" for m in missing[:20]])
            QMessageBox.warning(self, "文件丢失", f"发现 {len(missing)} 个文件丢失:\n{msg}")

    def _update_stats(self):
        if not self._current_order_id:
            return
        counts = self.file_index_service.get_photo_count(self._current_order_id)
        self.stats_label.setText(
            f"总计: {counts['total']} | 已选: {counts['selected']} | "
            f"待精修: {counts['retouch_pending']} | 精修中: {counts['retouching']} | "
            f"已完成: {counts['retouched']}"
        )
