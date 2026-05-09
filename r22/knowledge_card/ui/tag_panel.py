from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QListWidget, QListWidgetItem,
    QPushButton, QInputDialog, QColorDialog, QMessageBox, QMenu, QLabel
)
from PySide6.QtCore import Qt, Signal
from PySide6.QtGui import QAction, QColor

from typing import Optional, Dict, Any

from ..database import DatabaseManager


class TagPanel(QWidget):
    filter_changed = Signal(object)
    tags_changed = Signal()

    SPECIAL_ITEMS = [
        {'id': -1, 'name': '全部卡片', 'color': '#6366f1', 'filter_type': 'all'},
        {'id': -2, 'name': '收藏夹', 'color': '#eab308', 'filter_type': 'favorite'},
        {'id': -3, 'name': '最近浏览', 'color': '#10b981', 'filter_type': 'recent'},
    ]

    def __init__(self, db: DatabaseManager, parent=None):
        super().__init__(parent)
        self.db = db
        self.current_filter: Dict[str, Any] = {'tag_id': -1, 'filter_type': 'all'}
        self._refresh_lock = False
        self._init_ui()
        self._connect_signals()
        self.refresh()

    def _init_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(6)

        header = QLabel("标签分类")
        header.setStyleSheet("font-size: 16px; font-weight: bold; padding: 8px;")
        layout.addWidget(header)

        btn_layout = QHBoxLayout()
        self.add_btn = QPushButton("+ 新建标签")
        self.add_btn.setCursor(Qt.PointingHandCursor)
        self.add_btn.setStyleSheet(
            "QPushButton { padding: 6px 12px; border: 1px solid #3b82f6; "
            "border-radius: 4px; background-color: #3b82f6; color: white; }"
            "QPushButton:hover { background-color: #2563eb; }"
        )
        btn_layout.addWidget(self.add_btn)
        btn_layout.addStretch()
        layout.addLayout(btn_layout)

        self.tag_list = QListWidget()
        self.tag_list.setContextMenuPolicy(Qt.CustomContextMenu)
        self.tag_list.setStyleSheet(
            "QListWidget { border: none; background-color: #f8fafc; }"
            "QListWidget::item { padding: 10px 12px; border-radius: 4px; margin: 2px 4px; }"
            "QListWidget::item:selected { background-color: #e0e7ff; color: #1e40af; }"
            "QListWidget::item:hover { background-color: #e2e8f0; }"
        )
        layout.addWidget(self.tag_list)

    def _connect_signals(self):
        self.add_btn.clicked.connect(self._on_add_tag)
        self.tag_list.currentRowChanged.connect(self._on_selection_changed)
        self.tag_list.customContextMenuRequested.connect(self._on_context_menu)

    def refresh(self, keep_selection: bool = True):
        self._refresh_lock = True
        self.tag_list.blockSignals(True)

        saved_filter = dict(self.current_filter) if keep_selection else {'tag_id': -1, 'filter_type': 'all'}

        self.tag_list.clear()
        stats = self.db.get_statistics()

        for special in self.SPECIAL_ITEMS:
            count = 0
            if special['filter_type'] == 'all':
                count = stats['total_cards']
            elif special['filter_type'] == 'favorite':
                count = stats['favorite_cards']

            item = QListWidgetItem(f"  {special['name']}  ({count})")
            item.setData(Qt.UserRole, special['id'])
            item.setData(Qt.UserRole + 1, special['filter_type'])
            item.setData(Qt.UserRole + 2, True)
            item.setForeground(QColor(special['color']))
            self.tag_list.addItem(item)

        tags = self.db.get_all_tags()
        for tag in tags:
            count = self.db.get_tag_card_count(tag['id'])
            item = QListWidgetItem(f"  {tag['name']}  ({count})")
            item.setData(Qt.UserRole, tag['id'])
            item.setData(Qt.UserRole + 1, 'tag')
            item.setData(Qt.UserRole + 2, False)
            item.setForeground(QColor(tag['color']))
            self.tag_list.addItem(item)

        target_row = 0
        for i in range(self.tag_list.count()):
            item = self.tag_list.item(i)
            if item.data(Qt.UserRole + 1) == saved_filter['filter_type']:
                if saved_filter['filter_type'] == 'tag':
                    if item.data(Qt.UserRole) == saved_filter['tag_id']:
                        target_row = i
                        break
                else:
                    target_row = i
                    break

        if target_row < self.tag_list.count():
            self.tag_list.setCurrentRow(target_row)

        self.tag_list.blockSignals(False)
        self._refresh_lock = False

    def _on_selection_changed(self, row: int):
        if self._refresh_lock or row < 0:
            return

        item = self.tag_list.item(row)
        if not item:
            return

        tag_id = item.data(Qt.UserRole)
        filter_type = item.data(Qt.UserRole + 1)

        self.current_filter = {'tag_id': tag_id, 'filter_type': filter_type}
        self.filter_changed.emit(dict(self.current_filter))

    def _on_add_tag(self):
        name, ok = QInputDialog.getText(self, "新建标签", "请输入标签名称：")
        if ok and name.strip():
            name = name.strip()
            color = QColorDialog.getColor(QColor("#3498db"), self, "选择标签颜色")
            if color.isValid():
                self.db.create_tag(name, color.name())
                self.refresh(keep_selection=True)
                self.tags_changed.emit()

    def _on_context_menu(self, pos):
        item = self.tag_list.itemAt(pos)
        if not item:
            return

        is_special = item.data(Qt.UserRole + 2)
        if is_special:
            return

        tag_id = item.data(Qt.UserRole)
        tag_name = item.text().strip().split('  ')[0]
        tag = self.db.get_tag_by_id(tag_id)
        if not tag:
            return

        menu = QMenu(self)

        edit_action = QAction("编辑标签", self)
        edit_action.triggered.connect(lambda: self._edit_tag(tag_id, tag))
        menu.addAction(edit_action)

        delete_action = QAction("删除标签", self)
        delete_action.triggered.connect(lambda: self._delete_tag(tag_id, tag_name))
        menu.addAction(delete_action)

        menu.exec(self.tag_list.viewport().mapToGlobal(pos))

    def _edit_tag(self, tag_id: int, tag: dict):
        name, ok = QInputDialog.getText(
            self, "编辑标签", "标签名称：", text=tag['name']
        )
        if ok and name.strip():
            name = name.strip()
            current_color = QColor(tag['color'])
            color = QColorDialog.getColor(current_color, self, "选择标签颜色")
            if color.isValid():
                self.db.update_tag(tag_id, name, color.name())
                self.refresh(keep_selection=True)
                self.tags_changed.emit()

    def _delete_tag(self, tag_id: int, tag_name: str):
        count = self.db.get_tag_card_count(tag_id)
        message = f"确定要删除标签「{tag_name}」吗？"
        if count > 0:
            message = f"确定要删除标签「{tag_name}」吗？\n该标签下有 {count} 张卡片，删除后这些卡片将不再关联此标签。"

        reply = QMessageBox.question(
            self, "确认删除", message,
            QMessageBox.Yes | QMessageBox.No,
            QMessageBox.No
        )

        if reply == QMessageBox.Yes:
            self.db.delete_tag(tag_id)
            if self.current_filter.get('filter_type') == 'tag' and self.current_filter.get('tag_id') == tag_id:
                self.select_all_cards()
            else:
                self.refresh(keep_selection=True)
            self.tags_changed.emit()

    def select_all_cards(self):
        for i in range(self.tag_list.count()):
            item = self.tag_list.item(i)
            if item.data(Qt.UserRole + 1) == 'all':
                self.tag_list.setCurrentRow(i)
                break

    def get_current_filter(self) -> Dict[str, Any]:
        return dict(self.current_filter)
