from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QComboBox, QFileDialog, QMessageBox, QTableWidget,
    QTableWidgetItem, QHeaderView, QGroupBox, QProgressBar
)
from PySide6.QtCore import Signal, Qt
from services.export_backup_service import ExportBackupService
from services.order_service import OrderService
from utils import EXPORT_DIR, BACKUP_DIR
import os


class DeliveryExportWidget(QWidget):
    order_changed = Signal()

    def __init__(self, order_service: OrderService,
                 export_service: ExportBackupService,
                 parent=None):
        super().__init__(parent)
        self.order_service = order_service
        self.export_service = export_service
        self._current_order_id = None
        self._setup_ui()

    def _setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(6, 6, 6, 6)

        export_group = QGroupBox("交付清单导出")
        export_layout = QVBoxLayout(export_group)

        row1 = QHBoxLayout()
        self.format_combo = QComboBox()
        self.format_combo.addItems(["xlsx", "csv", "json"])
        row1.addWidget(QLabel("导出格式:"))
        row1.addWidget(self.format_combo)
        btn_export = QPushButton("导出当前订单交付清单")
        btn_export.setProperty("btnType", "success")
        btn_export.clicked.connect(self._export_delivery)
        row1.addWidget(btn_export)
        row1.addStretch()
        export_layout.addLayout(row1)

        self.export_path_label = QLabel("")
        export_layout.addWidget(self.export_path_label)

        layout.addWidget(export_group)

        backup_group = QGroupBox("数据备份与恢复")
        backup_layout = QVBoxLayout(backup_group)

        btn_row = QHBoxLayout()
        btn_backup = QPushButton("立即备份数据库")
        btn_backup.setProperty("btnType", "success")
        btn_backup.clicked.connect(self._backup_db)
        btn_restore = QPushButton("从备份恢复")
        btn_restore.setProperty("btnType", "warning")
        btn_restore.clicked.connect(self._restore_db)
        btn_open_backup_dir = QPushButton("打开备份目录")
        btn_open_backup_dir.setProperty("btnType", "secondary")
        btn_open_backup_dir.clicked.connect(self._open_backup_dir)
        btn_open_export_dir = QPushButton("打开导出目录")
        btn_open_export_dir.setProperty("btnType", "secondary")
        btn_open_export_dir.clicked.connect(self._open_export_dir)
        btn_row.addWidget(btn_backup)
        btn_row.addWidget(btn_restore)
        btn_row.addWidget(btn_open_backup_dir)
        btn_row.addWidget(btn_open_export_dir)
        btn_row.addStretch()
        backup_layout.addLayout(btn_row)

        self.backup_list_label = QLabel("可用备份:")
        backup_layout.addWidget(self.backup_list_label)

        self.backup_table = QTableWidget(0, 3)
        self.backup_table.setHorizontalHeaderLabels(["文件名", "大小", "操作"])
        self.backup_table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        self.backup_table.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)
        backup_layout.addWidget(self.backup_table)

        layout.addWidget(backup_group)

        recycle_group = QGroupBox("误删恢复")
        recycle_layout = QVBoxLayout(recycle_group)

        btn_row2 = QHBoxLayout()
        self.table_filter_combo = QComboBox()
        self.table_filter_combo.addItem("全部表", "")
        self.table_filter_combo.addItem("订单", "orders")
        self.table_filter_combo.addItem("照片", "photos")
        self.table_filter_combo.addItem("交付文件", "delivery_files")
        self.table_filter_combo.currentIndexChanged.connect(self._load_deleted)
        btn_refresh = QPushButton("刷新")
        btn_refresh.setProperty("btnType", "secondary")
        btn_refresh.clicked.connect(self._load_deleted)
        btn_row2.addWidget(QLabel("筛选表:"))
        btn_row2.addWidget(self.table_filter_combo)
        btn_row2.addWidget(btn_refresh)
        btn_row2.addStretch()
        recycle_layout.addLayout(btn_row2)

        self.deleted_table = QTableWidget(0, 5)
        self.deleted_table.setHorizontalHeaderLabels(["ID", "表名", "记录ID", "删除时间", "操作"])
        self.deleted_table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        self.deleted_table.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)
        recycle_layout.addWidget(self.deleted_table)

        layout.addWidget(recycle_group)

        self._load_backups()
        self._load_deleted()

    def set_order(self, order_id: int):
        self._current_order_id = order_id

    def _export_delivery(self):
        if not self._current_order_id:
            QMessageBox.warning(self, "提示", "请先选择订单")
            return
        fmt = self.format_combo.currentText()
        path = self.export_service.export_delivery_list(self._current_order_id, fmt)
        if path:
            self.export_path_label.setText(f"已导出: {path}")
            QMessageBox.information(self, "导出成功", f"交付清单已导出至:\n{path}")
        else:
            QMessageBox.warning(self, "导出失败", "无法导出交付清单")

    def _backup_db(self):
        path = self.export_service.backup_database()
        if path:
            QMessageBox.information(self, "备份成功", f"数据库已备份至:\n{path}")
            self._load_backups()
        else:
            QMessageBox.warning(self, "备份失败", "数据库备份失败")

    def _restore_db(self):
        file_path, _ = QFileDialog.getOpenFileName(
            self, "选择备份文件", str(BACKUP_DIR), "数据库文件 (*.db)")
        if not file_path:
            return
        reply = QMessageBox.warning(
            self, "确认恢复",
            "恢复数据库将覆盖当前数据，是否继续？",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
        )
        if reply == QMessageBox.StandardButton.Yes:
            if self.export_service.restore_database(file_path):
                QMessageBox.information(self, "恢复成功", "数据库已恢复，请重启应用")
                self.order_changed.emit()
            else:
                QMessageBox.warning(self, "恢复失败", "数据库恢复失败")

    def _open_backup_dir(self):
        os.startfile(str(BACKUP_DIR))

    def _open_export_dir(self):
        os.startfile(str(EXPORT_DIR))

    def _load_backups(self):
        backups = self.export_service.list_backups()
        self.backup_table.setRowCount(len(backups))
        for i, bp in enumerate(backups):
            fname = os.path.basename(bp)
            fsize = os.path.getsize(bp) / 1024 if os.path.exists(bp) else 0
            self.backup_table.setItem(i, 0, QTableWidgetItem(fname))
            self.backup_table.setItem(i, 1, QTableWidgetItem(f"{fsize:.1f} KB"))
            btn_restore = QPushButton("恢复")
            btn_restore.setProperty("btnType", "warning")
            btn_restore.clicked.connect(lambda checked, p=bp: self._restore_specific(p))
            self.backup_table.setCellWidget(i, 2, btn_restore)

    def _restore_specific(self, path):
        reply = QMessageBox.warning(
            self, "确认恢复",
            f"确定要从 {os.path.basename(path)} 恢复吗？",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
        )
        if reply == QMessageBox.StandardButton.Yes:
            if self.export_service.restore_database(path):
                QMessageBox.information(self, "恢复成功", "数据库已恢复，请重启应用")
                self.order_changed.emit()
                self._load_backups()

    def _load_deleted(self):
        table_name = self.table_filter_combo.currentData() or ""
        records = self.order_service.get_deleted_records(table_name)
        self.deleted_table.setRowCount(len(records))
        for i, r in enumerate(records):
            self.deleted_table.setItem(i, 0, QTableWidgetItem(str(r.id)))
            self.deleted_table.setItem(i, 1, QTableWidgetItem(r.table_name))
            self.deleted_table.setItem(i, 2, QTableWidgetItem(str(r.record_id)))
            self.deleted_table.setItem(i, 3, QTableWidgetItem(r.deleted_at or ""))
            btn = QPushButton("恢复")
            btn.setProperty("btnType", "success")
            btn.clicked.connect(lambda checked, rid=r.id: self._restore_record(rid))
            self.deleted_table.setCellWidget(i, 4, btn)

    def _restore_record(self, deleted_id):
        if self.order_service.restore_record(deleted_id):
            QMessageBox.information(self, "恢复成功", "记录已恢复")
            self._load_deleted()
            self.order_changed.emit()
        else:
            QMessageBox.warning(self, "恢复失败", "无法恢复该记录")
