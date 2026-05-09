from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QLineEdit, QTextEdit,
    QPushButton, QCheckBox, QComboBox, QFrame, QMessageBox
)
from PySide6.QtCore import Qt, Signal
from PySide6.QtGui import QColor

from typing import Optional, List, Dict, Any, Set

from ..database import DatabaseManager


class DetailPanel(QWidget):
    card_saved = Signal()
    card_deleted = Signal()
    tags_changed = Signal()

    def __init__(self, db: DatabaseManager, parent=None):
        super().__init__(parent)
        self.db = db
        self.current_card_id: Optional[int] = None
        self._original_tags: List[Dict[str, Any]] = []
        self._original_is_favorite: bool = False
        self._init_ui()
        self._connect_signals()
        self._set_editable(False)
        self._show_empty_state()

    def _init_ui(self):
        main_layout = QVBoxLayout(self)
        main_layout.setContentsMargins(12, 12, 12, 12)
        main_layout.setSpacing(10)

        header_label = QLabel("卡片详情")
        header_label.setStyleSheet("font-size: 16px; font-weight: bold;")
        main_layout.addWidget(header_label)

        self.content_frame = QFrame()
        content_layout = QVBoxLayout(self.content_frame)
        content_layout.setContentsMargins(0, 0, 0, 0)
        content_layout.setSpacing(10)

        title_layout = QHBoxLayout()
        title_label = QLabel("标题：")
        title_label.setStyleSheet("font-weight: bold;")
        title_layout.addWidget(title_label)
        self.title_edit = QLineEdit()
        self.title_edit.setPlaceholderText("输入卡片标题")
        self.title_edit.setStyleSheet(
            "QLineEdit { padding: 8px 12px; border: 1px solid #cbd5e1; "
            "border-radius: 6px; font-size: 14px; }"
            "QLineEdit:focus { border-color: #3b82f6; }"
        )
        title_layout.addWidget(self.title_edit, 1)
        content_layout.addLayout(title_layout)

        tags_layout = QHBoxLayout()
        tags_label = QLabel("标签：")
        tags_label.setStyleSheet("font-weight: bold;")
        tags_layout.addWidget(tags_label)

        self.tags_container = QHBoxLayout()
        self.tags_container.setSpacing(6)
        tags_layout.addLayout(self.tags_container, 1)
        tags_layout.addStretch()
        content_layout.addLayout(tags_layout)

        tag_select_layout = QHBoxLayout()
        self.tag_combo = QComboBox()
        self.tag_combo.setMinimumWidth(150)
        self.tag_combo.setStyleSheet(
            "QComboBox { padding: 6px 10px; border: 1px solid #cbd5e1; "
            "border-radius: 4px; }"
        )
        tag_select_layout.addWidget(self.tag_combo)

        self.add_tag_btn = QPushButton("添加标签")
        self.add_tag_btn.setStyleSheet(
            "QPushButton { padding: 6px 12px; border: 1px solid #6366f1; "
            "border-radius: 4px; background-color: #6366f1; color: white; }"
            "QPushButton:hover { background-color: #4f46e5; }"
            "QPushButton:disabled { background-color: #cbd5e1; border-color: #cbd5e1; }"
        )
        tag_select_layout.addWidget(self.add_tag_btn)
        tag_select_layout.addStretch()
        content_layout.addLayout(tag_select_layout)

        content_label = QLabel("内容：")
        content_label.setStyleSheet("font-weight: bold;")
        content_layout.addWidget(content_label)

        self.content_edit = QTextEdit()
        self.content_edit.setPlaceholderText("输入卡片内容...")
        self.content_edit.setStyleSheet(
            "QTextEdit { padding: 10px 12px; border: 1px solid #cbd5e1; "
            "border-radius: 6px; font-size: 13px; line-height: 1.6; }"
            "QTextEdit:focus { border-color: #3b82f6; }"
        )
        content_layout.addWidget(self.content_edit, 1)

        self.meta_label = QLabel()
        self.meta_label.setStyleSheet("color: #64748b; font-size: 12px;")
        self.meta_label.setWordWrap(True)
        content_layout.addWidget(self.meta_label)

        btn_layout = QHBoxLayout()
        self.favorite_checkbox = QCheckBox(" 收藏")
        self.favorite_checkbox.setStyleSheet(
            "QCheckBox { padding: 4px; font-size: 14px; }"
            "QCheckBox::indicator { width: 18px; height: 18px; }"
        )
        btn_layout.addWidget(self.favorite_checkbox)

        btn_layout.addStretch()

        self.save_btn = QPushButton("保存")
        self.save_btn.setStyleSheet(
            "QPushButton { padding: 8px 20px; border: none; border-radius: 6px; "
            "background-color: #3b82f6; color: white; font-weight: bold; }"
            "QPushButton:hover { background-color: #2563eb; }"
            "QPushButton:disabled { background-color: #cbd5e1; }"
        )
        btn_layout.addWidget(self.save_btn)

        self.delete_btn = QPushButton("删除")
        self.delete_btn.setStyleSheet(
            "QPushButton { padding: 8px 20px; border: 1px solid #ef4444; "
            "border-radius: 6px; background-color: white; color: #ef4444; }"
            "QPushButton:hover { background-color: #fef2f2; }"
            "QPushButton:disabled { border-color: #cbd5e1; color: #cbd5e1; }"
        )
        btn_layout.addWidget(self.delete_btn)

        content_layout.addLayout(btn_layout)

        main_layout.addWidget(self.content_frame, 1)

        self.empty_label = QLabel(
            "\n\n\n\n选择一张卡片查看详情，\n或者点击「新建卡片」创建新卡片。"
        )
        self.empty_label.setAlignment(Qt.AlignCenter)
        self.empty_label.setStyleSheet(
            "color: #94a3b8; font-size: 16px;"
        )
        main_layout.addWidget(self.empty_label)

    def _connect_signals(self):
        self.save_btn.clicked.connect(self._on_save)
        self.delete_btn.clicked.connect(self._on_delete)
        self.add_tag_btn.clicked.connect(self._on_add_tag)

    def _set_editable(self, editable: bool):
        self.title_edit.setEnabled(editable)
        self.content_edit.setEnabled(editable)
        self.favorite_checkbox.setEnabled(editable)
        self.add_tag_btn.setEnabled(editable)
        self.tag_combo.setEnabled(editable)
        self.save_btn.setEnabled(editable)
        self.delete_btn.setEnabled(editable)

    def _show_empty_state(self):
        self.content_frame.hide()
        self.empty_label.show()

    def _show_content_state(self):
        self.content_frame.show()
        self.empty_label.hide()

    def load_card(self, card_id: int):
        card = self.db.get_card_by_id(card_id)
        if not card:
            self._show_empty_state()
            return

        self.current_card_id = card_id
        self._original_tags = list(card['tags'])
        self._original_is_favorite = (card['is_favorite'] == 1)

        self._clear_tag_buttons()

        self.title_edit.setText(card['title'])
        self.content_edit.setPlainText(card['content'])
        self.favorite_checkbox.setChecked(self._original_is_favorite)

        for tag in card['tags']:
            self._add_tag_button(tag)

        self.meta_label.setText(
            f"创建时间：{card['created_at']}    更新时间：{card['updated_at']}"
        )

        self._refresh_tag_combo(card['tags'])

        self._set_editable(True)
        self._show_content_state()

        self.db.add_recent_view(card_id)

    def _clear_tag_buttons(self):
        while self.tags_container.count():
            item = self.tags_container.takeAt(0)
            widget = item.widget()
            if widget:
                widget.deleteLater()

    def _add_tag_button(self, tag: Dict[str, Any]):
        btn = QPushButton(f"× {tag['name']}")
        btn.setCursor(Qt.PointingHandCursor)
        btn.setStyleSheet(
            f"QPushButton {{ padding: 4px 10px; border-radius: 12px; "
            f"background-color: {tag['color']}; color: white; border: none; "
            f"font-size: 12px; }}"
            "QPushButton:hover { opacity: 0.8; }"
        )
        btn.setProperty('tag_id', tag['id'])
        btn.setProperty('tag_name', tag['name'])
        btn.setProperty('tag_color', tag['color'])
        btn.clicked.connect(lambda: self._on_remove_tag(tag['id']))
        self.tags_container.addWidget(btn)

    def _get_current_tag_ids(self) -> List[int]:
        tag_ids = []
        for i in range(self.tags_container.count()):
            widget = self.tags_container.itemAt(i).widget()
            if isinstance(widget, QPushButton):
                tag_id = widget.property('tag_id')
                if tag_id:
                    tag_ids.append(tag_id)
        return tag_ids

    def _get_current_tags(self) -> List[Dict[str, Any]]:
        tags = []
        for i in range(self.tags_container.count()):
            widget = self.tags_container.itemAt(i).widget()
            if isinstance(widget, QPushButton):
                tag_id = widget.property('tag_id')
                tag_name = widget.property('tag_name')
                tag_color = widget.property('tag_color')
                if tag_id:
                    tags.append({
                        'id': tag_id,
                        'name': tag_name,
                        'color': tag_color
                    })
        return tags

    def _refresh_tag_combo(self, current_tags: List[Dict[str, Any]]):
        self.tag_combo.blockSignals(True)
        self.tag_combo.clear()

        current_tag_ids: Set[int] = {t['id'] for t in current_tags}
        all_tags = self.db.get_all_tags()
        available_tags = [t for t in all_tags if t['id'] not in current_tag_ids]

        if not available_tags:
            self.tag_combo.addItem("（无可用标签）", -1)
        else:
            self.tag_combo.addItem("选择标签...", -1)
            for tag in available_tags:
                self.tag_combo.addItem(tag['name'], tag['id'])

        self.tag_combo.blockSignals(False)

    def _on_save(self):
        if not self.current_card_id:
            return

        title = self.title_edit.text().strip() or "未命名卡片"
        content = self.content_edit.toPlainText()
        tag_ids = self._get_current_tag_ids()
        is_favorite = self.favorite_checkbox.isChecked()

        self.db.update_card(
            card_id=self.current_card_id,
            title=title,
            content=content,
            tag_ids=tag_ids
        )

        self.db.set_favorite(self.current_card_id, is_favorite)

        self._original_tags = self._get_current_tags()
        self._original_is_favorite = is_favorite

        self.card_saved.emit()
        self.load_card(self.current_card_id)

    def _on_delete(self):
        if not self.current_card_id:
            return

        card = self.db.get_card_by_id(self.current_card_id)
        if not card:
            return

        reply = QMessageBox.question(
            self, "确认删除",
            f"确定要删除卡片「{card['title']}」吗？\n此操作不可恢复。",
            QMessageBox.Yes | QMessageBox.No,
            QMessageBox.No
        )

        if reply == QMessageBox.Yes:
            self.db.delete_card(self.current_card_id)
            self.current_card_id = None
            self._original_tags = []
            self._original_is_favorite = False
            self._show_empty_state()
            self._set_editable(False)
            self.card_deleted.emit()

    def _on_add_tag(self):
        if not self.current_card_id:
            return

        tag_id = self.tag_combo.currentData()
        if tag_id == -1 or not tag_id:
            return

        tag = self.db.get_tag_by_id(tag_id)
        if not tag:
            return

        current_tag_ids = set(self._get_current_tag_ids())
        if tag_id in current_tag_ids:
            return

        self._add_tag_button(tag)
        current_tags = self._get_current_tags()
        self._refresh_tag_combo(current_tags)

    def _on_remove_tag(self, tag_id: int):
        if not self.current_card_id:
            return

        for i in range(self.tags_container.count()):
            widget = self.tags_container.itemAt(i).widget()
            if isinstance(widget, QPushButton):
                if widget.property('tag_id') == tag_id:
                    self.tags_container.removeWidget(widget)
                    widget.deleteLater()
                    break

        current_tags = self._get_current_tags()
        self._refresh_tag_combo(current_tags)

    def clear(self):
        self.current_card_id = None
        self._original_tags = []
        self._original_is_favorite = False
        self._clear_tag_buttons()
        self.title_edit.clear()
        self.content_edit.clear()
        self.favorite_checkbox.setChecked(False)
        self.meta_label.clear()
        self._show_empty_state()
        self._set_editable(False)

    def refresh_tags(self):
        if self.current_card_id:
            self.load_card(self.current_card_id)
        self._refresh_tag_combo([])
