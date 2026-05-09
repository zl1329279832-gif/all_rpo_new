from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QListWidget, QListWidgetItem,
    QPushButton, QInputDialog, QColorDialog, QMessageBox, QMenu, QLabel
)
from PySide6.QtCore import Qt, Signal
from PySide6.QtGui import QAction, QColor, QIcon

from typing import Optional

from ..database import DatabaseManager


class TagPanel(QWidget):
    tag_selected = Signal(object)
    tags_changed = Signal()

    def __init__(self, db: DatabaseManager, parent=None):
        super().__init__(parent)
        self.db = db
        self.selected_tag_id: Optional[int] = None
        self.selected_filter_type: str = 'all'
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
        self.tag_list.itemClicked.connect(self._on_tag_clicked)
        self.tag_list.currentItemChanged.connect(self._on_tag_changed)
        self.tag_list.customContextMenuRequested.connect(self._on_context_menu)

    def refresh(self):
        self.tag_list.clear()
        stats = self.db.get_statistics()

        special_items = [
            {
                'id': -1,
                'name': '全部卡片',
                'color': '#6366f1',
                'count': stats['total_cards'],
                'filter_type': 'all'
            },
            {
                'id': -2,
                'name': '收藏夹',
                'color': '#eab308',
                'count': stats['favorite_cards'],
                'filter_type': 'favorite'
            },
            {
                'id': -3,
                'name': '最近浏览',
                'color': '#10b981',
                'count': 0,
                'filter_type': 'recent'
            },
        ]

        for item_data in special_items:
            item = QListWidgetItem(f"  {item_data['name']}  ({item_data['count']})")
            item.setData(Qt.UserRole, item_data['id'])
            item.setData(Qt.UserRole + 1, item_data['filter_type'])
            item.setData(Qt.UserRole + 2, True)
            item.setForeground(QColor(item_data['color']))
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

    def _on_add_tag(self):
        name, ok = QInputDialog.getText(self, "新建标签", "请输入标签名称：")
        if ok and name.strip():
            name = name.strip()
            color = QColorDialog.getColor(QColor("#3498db"), self, "选择标签颜色")
            if color.isValid():
                tag_id = self.db.create_tag(name, color.name())
                self.refresh()
                self.tags_changed.emit()

    def _on_tag_clicked(self, item: QListWidgetItem):
        self._select_tag(item)

    def _on_tag_changed(self, current: QListWidgetItem, previous: QListWidgetItem):
        if current:
            self._select_tag(current)

    def _select_tag(self, item: QListWidgetItem):
        tag_id = item.data(Qt.UserRole)
        filter_type = item.data(Qt.UserRole + 1)
        self.selected_tag_id = tag_id
        self.selected_filter_type = filter_type
        self.tag_selected.emit({
            'tag_id': tag_id,
            'filter_type': filter_type
        })

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
                self.refresh()
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
            self.refresh()
            self.tags_changed.emit()

    def get_selected_filter(self):
        return {
            'tag_id': self.selected_tag_id,
            'filter_type': self.selected_filter_type
        }

    def select_all_cards(self):
        for i in range(self.tag_list.count()):
            item = self.tag_list.item(i)
            if item.data(Qt.UserRole + 1) == 'all':
                self.tag_list.setCurrentItem(item)
                break
