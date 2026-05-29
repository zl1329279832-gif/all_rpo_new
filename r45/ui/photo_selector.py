from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QFormLayout, QLabel, QPushButton,
    QComboBox, QTextEdit, QTableWidget, QTableWidgetItem, QHeaderView,
    QMessageBox, QGroupBox, QSplitter
)
from PySide6.QtCore import Signal, Qt
from services.order_service import OrderService
from services.file_index_service import FileIndexService
from services.thumbnail_service import ThumbnailService
from utils import RETOUCH_STATUSES


class PhotoSelector(QWidget):
    photo_retouch_updated = Signal()

    def __init__(self, order_service: OrderService,
                 file_index_service: FileIndexService,
                 thumbnail_service: ThumbnailService,
                 parent=None):
        super().__init__(parent)
        self.order_service = order_service
        self.file_index_service = file_index_service
        self.thumbnail_service = thumbnail_service
        self._current_order_id = None
        self._current_photo_id = None
        self._setup_ui()

    def _setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(6, 6, 6, 6)

        toolbar = QHBoxLayout()
        self.filter_combo = QComboBox()
        self.filter_combo.addItem("全部", "all")
        self.filter_combo.addItem("已选片", "selected")
        self.filter_combo.addItem("未选片", "unselected")
        self.filter_combo.addItem("待精修", "retouch_pending")
        self.filter_combo.addItem("精修中", "retouching")
        self.filter_combo.addItem("精修完成", "retouch_done")
        self.filter_combo.currentIndexChanged.connect(self._load_photo_table)
        toolbar.addWidget(QLabel("筛选:"))
        toolbar.addWidget(self.filter_combo)
        toolbar.addStretch()

        btn_batch = QPushButton("批量设置精修状态")
        btn_batch.setProperty("btnType", "warning")
        btn_batch.clicked.connect(self._batch_set_retouch)
        toolbar.addWidget(btn_batch)
        layout.addLayout(toolbar)

        splitter = QSplitter(Qt.Orientation.Horizontal)

        self.photo_table = QTableWidget(0, 5)
        self.photo_table.setHorizontalHeaderLabels(["ID", "文件名", "选片", "精修状态", "大小"])
        self.photo_table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        self.photo_table.setSelectionBehavior(QTableWidget.SelectionBehavior.SelectRows)
        self.photo_table.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)
        self.photo_table.currentCellChanged.connect(self._on_photo_selected)
        splitter.addWidget(self.photo_table)

        right_panel = QWidget()
        right_layout = QVBoxLayout(right_panel)
        right_layout.setContentsMargins(6, 6, 6, 6)

        self.preview_label = QLabel("选择照片查看预览")
        self.preview_label.setFixedSize(200, 200)
        self.preview_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.preview_label.setStyleSheet("background-color: #ecf0f1; border-radius: 4px;")
        right_layout.addWidget(self.preview_label)

        form = QFormLayout()
        self.retouch_combo = QComboBox()
        for s in RETOUCH_STATUSES:
            self.retouch_combo.addItem(s, s)
        form.addRow("精修状态:", self.retouch_combo)

        self.retouch_notes_edit = QTextEdit()
        self.retouch_notes_edit.setMaximumHeight(60)
        form.addRow("精修备注:", self.retouch_notes_edit)

        btn_save = QPushButton("保存精修信息")
        btn_save.setProperty("btnType", "success")
        btn_save.clicked.connect(self._save_retouch)
        form.addRow(btn_save)

        btn_toggle = QPushButton("切换选片状态")
        btn_toggle.clicked.connect(self._toggle_selected)
        form.addRow(btn_toggle)

        right_layout.addLayout(form)
        right_layout.addStretch()
        splitter.addWidget(right_panel)

        splitter.setSizes([500, 280])
        layout.addWidget(splitter)

    def load_order(self, order_id: int):
        self._current_order_id = order_id
        self._load_photo_table()

    def _load_photo_table(self):
        if not self._current_order_id:
            self.photo_table.setRowCount(0)
            return

        filter_data = self.filter_combo.currentData()
        if filter_data == "selected":
            photos = self.file_index_service.get_photos_by_order(self._current_order_id, selected_only=True)
        elif filter_data == "unselected":
            all_photos = self.file_index_service.get_photos_by_order(self._current_order_id)
            photos = [p for p in all_photos if not p.selected]
        elif filter_data == "retouch_pending":
            photos = self.file_index_service.get_photos_by_retouch_status(self._current_order_id, "待精修")
        elif filter_data == "retouching":
            photos = self.file_index_service.get_photos_by_retouch_status(self._current_order_id, "精修中")
        elif filter_data == "retouch_done":
            photos = self.file_index_service.get_photos_by_retouch_status(self._current_order_id, "已完成")
        else:
            photos = self.file_index_service.get_photos_by_order(self._current_order_id)

        self.photo_table.setRowCount(len(photos))
        for i, p in enumerate(photos):
            self.photo_table.setItem(i, 0, QTableWidgetItem(str(p.id)))
            self.photo_table.setItem(i, 1, QTableWidgetItem(p.original_filename))
            sel_item = QTableWidgetItem("✓ 已选" if p.selected else "○ 未选")
            sel_item.setForeground(Qt.GlobalColor.darkGreen if p.selected else Qt.GlobalColor.gray)
            self.photo_table.setItem(i, 2, sel_item)
            self.photo_table.setItem(i, 3, QTableWidgetItem(p.retouch_status))
            size_str = f"{p.file_size / 1024:.1f}KB" if p.file_size else ""
            self.photo_table.setItem(i, 4, QTableWidgetItem(size_str))

    def _on_photo_selected(self, row, col, prev_row, prev_col):
        if row < 0:
            return
        id_item = self.photo_table.item(row, 0)
        if not id_item:
            return
        photo_id = int(id_item.text())
        self._current_photo_id = photo_id

        photo = self.order_service.db.fetch_one("photos", photo_id)
        if not photo:
            return

        thumb_path = self.thumbnail_service.get_thumbnail_path(photo_id)
        if thumb_path:
            from PySide6.QtGui import QPixmap
            pixmap = QPixmap(thumb_path)
            self.preview_label.setPixmap(pixmap.scaled(200, 200, Qt.AspectRatioMode.KeepAspectRatio, Qt.TransformationMode.SmoothTransformation))
        else:
            self.preview_label.setText("无缩略图")

        idx = self.retouch_combo.findData(photo.retouch_status)
        if idx >= 0:
            self.retouch_combo.setCurrentIndex(idx)
        self.retouch_notes_edit.setPlainText(photo.retouch_notes)

    def _save_retouch(self):
        if not self._current_photo_id:
            return
        try:
            self.order_service.update_photo_retouch(
                self._current_photo_id,
                self.retouch_combo.currentData(),
                self.retouch_notes_edit.toPlainText().strip()
            )
            self._load_photo_table()
            self.photo_retouch_updated.emit()
        except Exception as e:
            QMessageBox.warning(self, "错误", str(e))

    def _toggle_selected(self):
        if not self._current_photo_id:
            return
        photo = self.order_service.db.fetch_one("photos", self._current_photo_id)
        if not photo:
            return
        new_val = 0 if photo.selected else 1
        self.order_service.toggle_photo_selected(self._current_photo_id, new_val)
        self._load_photo_table()
        self.photo_retouch_updated.emit()

    def _batch_set_retouch(self):
        rows = self.photo_table.selectionModel().selectedRows()
        if not rows:
            QMessageBox.warning(self, "提示", "请先在表格中选择行")
            return
        from PySide6.QtWidgets import QInputDialog
        status, ok = QInputDialog.getItem(self, "批量设置", "精修状态:", RETOUCH_STATUSES, 0, False)
        if not ok:
            return
        for idx in rows:
            id_item = self.photo_table.item(idx.row(), 0)
            if id_item:
                photo_id = int(id_item.text())
                self.order_service.update_photo_retouch(photo_id, status)
        self._load_photo_table()
        self.photo_retouch_updated.emit()
