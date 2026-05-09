from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QListWidget, QListWidgetItem,
    QPushButton, QLabel, QLineEdit, QMessageBox, QMenu, QFrame
)
from PySide6.QtCore import Qt, Signal, QTimer
from PySide6.QtGui import QAction, QColor, QFont, QCursor

from typing import Optional, List, Dict, Any

from ..database import DatabaseManager


class CardListPanel(QWidget):
    card_selected = Signal(int)
    card_deleted = Signal()
    card_updated = Signal()
    search_changed = Signal(str)
    new_card_created = Signal(int)

    def __init__(self, db: DatabaseManager, parent=None):
        super().__init__(parent)
        self.db = db
        self.cards: List[Dict[str, Any]] = []
        self.current_tag_filter: Optional[int] = None
        self.current_filter_type: str = 'all'
        self.current_search: str = ''
        self._init_ui()
        self._connect_signals()
        self.refresh()

    def _init_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(8)

        header = QLabel("知识卡片")
        header.setStyleSheet("font-size: 16px; font-weight: bold; padding: 8px;")
        layout.addWidget(header)

        search_layout = QHBoxLayout()
        self.search_input = QLineEdit()
        self.search_input.setPlaceholderText("搜索标题或内容...")
        self.search_input.setStyleSheet(
            "QLineEdit { padding: 8px 12px; border: 1px solid #cbd5e1; "
            "border-radius: 6px; background-color: white; }"
            "QLineEdit:focus { border-color: #3b82f6; }"
        )
        search_layout.addWidget(self.search_input)

        self.search_btn = QPushButton("搜索")
        self.search_btn.setStyleSheet(
            "QPushButton { padding: 8px 16px; border: 1px solid #3b82f6; "
            "border-radius: 6px; background-color: #3b82f6; color: white; }"
            "QPushButton:hover { background-color: #2563eb; }"
        )
        search_layout.addWidget(self.search_btn)
        layout.addLayout(search_layout)

        btn_layout = QHBoxLayout()
        self.new_btn = QPushButton("+ 新建卡片")
        self.new_btn.setStyleSheet(
            "QPushButton { padding: 8px 16px; border: none; "
            "border-radius: 6px; background-color: #10b981; color: white; "
            "font-weight: bold; }"
            "QPushButton:hover { background-color: #059669; }"
        )
        btn_layout.addWidget(self.new_btn)
        btn_layout.addStretch()
        layout.addLayout(btn_layout)

        self.card_list = QListWidget()
        self.card_list.setContextMenuPolicy(Qt.CustomContextMenu)
        self.card_list.setStyleSheet(
            "QListWidget { border: 1px solid #e2e8f0; border-radius: 6px; "
            "background-color: white; }"
            "QListWidget::item { padding: 12px; border-bottom: 1px solid #f1f5f9; }"
            "QListWidget::item:selected { background-color: #eff6ff; }"
            "QListWidget::item:hover { background-color: #f8fafc; }"
        )
        layout.addWidget(self.card_list)

    def _connect_signals(self):
        self.search_input.textChanged.connect(self._on_search_changed)
        self.search_input.returnPressed.connect(self._on_search_triggered)
        self.search_btn.clicked.connect(self._on_search_triggered)
        self.new_btn.clicked.connect(self._on_new_card)
        self.card_list.itemClicked.connect(self._on_card_clicked)
        self.card_list.currentItemChanged.connect(self._on_card_changed)
        self.card_list.customContextMenuRequested.connect(self._on_context_menu)

    def _on_search_changed(self, text: str):
        self.current_search = text
        QTimer.singleShot(300, lambda: self._do_search(text))

    def _on_search_triggered(self):
        self.current_search = self.search_input.text()
        self.refresh()

    def _do_search(self, text: str):
        if text != self.search_input.text():
            return
        self.current_search = text
        self.refresh()
        self.search_changed.emit(text)

    def _on_new_card(self):
        new_card_id = self.db.create_card(
            title="未命名卡片",
            content="",
            tag_ids=[]
        )
        self.new_card_created.emit(new_card_id)
        self.refresh()
        self.card_updated.emit()
        self._select_card_by_id(new_card_id)

    def _select_card_by_id(self, card_id: int):
        for i in range(self.card_list.count()):
            item = self.card_list.item(i)
            if item.data(Qt.UserRole) == card_id:
                self.card_list.setCurrentRow(i)
                self.card_list.scrollToItem(item)
                break

    def _on_card_clicked(self, item: QListWidgetItem):
        card_id = item.data(Qt.UserRole)
        self.card_selected.emit(card_id)

    def _on_card_changed(self, current: QListWidgetItem, previous: QListWidgetItem):
        if current:
            card_id = current.data(Qt.UserRole)
            self.card_selected.emit(card_id)

    def _on_context_menu(self, pos):
        item = self.card_list.itemAt(pos)
        if not item:
            return

        card_id = item.data(Qt.UserRole)
        card = self.db.get_card_by_id(card_id)
        if not card:
            return

        menu = QMenu(self)

        new_action = QAction("新建卡片", self)
        new_action.triggered.connect(self._on_new_card)
        menu.addAction(new_action)

        menu.addSeparator()

        favorite_text = "取消收藏" if card['is_favorite'] == 1 else "收藏"
        favorite_action = QAction(favorite_text, self)
        favorite_action.triggered.connect(lambda: self._toggle_favorite(card_id))
        menu.addAction(favorite_action)

        delete_action = QAction("删除卡片", self)
        delete_action.triggered.connect(lambda: self._delete_card(card_id, card['title']))
        menu.addAction(delete_action)

        menu.exec(self.card_list.viewport().mapToGlobal(pos))

    def _toggle_favorite(self, card_id: int):
        self.db.toggle_favorite(card_id)
        self.refresh()
        self.card_updated.emit()

    def _delete_card(self, card_id: int, title: str):
        reply = QMessageBox.question(
            self, "确认删除",
            f"确定要删除卡片「{title}」吗？\n此操作不可恢复。",
            QMessageBox.Yes | QMessageBox.No,
            QMessageBox.No
        )

        if reply == QMessageBox.Yes:
            self.db.delete_card(card_id)
            self.refresh()
            self.card_deleted.emit()
            self.card_updated.emit()

    def set_filter(self, tag_id: Optional[int], filter_type: str):
        self.current_tag_filter = tag_id
        self.current_filter_type = filter_type
        self.refresh()

    def refresh(self):
        self.card_list.clear()

        if self.current_filter_type == 'favorite':
            self.cards = self.db.get_all_cards(
                search_query=self.current_search if self.current_search else None,
                favorite_only=True
            )
        elif self.current_filter_type == 'recent':
            self.cards = self.db.get_recent_cards(limit=10)
            if self.current_search:
                query = self.current_search.lower()
                self.cards = [
                    c for c in self.cards
                    if query in c['title'].lower() or query in c['content'].lower()
                ]
        else:
            self.cards = self.db.get_all_cards(
                tag_filter=self.current_tag_filter,
                search_query=self.current_search if self.current_search else None
            )

        for card in self.cards:
            self._add_card_item(card)

        if not self.cards:
            empty_item = QListWidgetItem("暂无卡片，点击上方按钮新建")
            empty_item.setFlags(Qt.NoItemFlags)
            empty_item.setForeground(QColor("#94a3b8"))
            empty_item.setTextAlignment(Qt.AlignCenter)
            self.card_list.addItem(empty_item)

    def _add_card_item(self, card: Dict[str, Any]):
        display_title = card['title'] or "未命名"
        if len(display_title) > 30:
            display_title = display_title[:30] + "..."

        content_preview = (card['content'] or "").strip()
        if content_preview:
            content_preview = content_preview.replace('\n', ' ')
            if len(content_preview) > 50:
                content_preview = content_preview[:50] + "..."

        tags_text = ""
        if card.get('tags'):
            tags_text = " | ".join([t['name'] for t in card['tags']])

        display_text = display_title
        if content_preview:
            display_text += f"\n  {content_preview}"
        if tags_text:
            display_text += f"\n  [{tags_text}]"

        favorite_marker = "★ " if card['is_favorite'] == 1 else ""
        display_text = favorite_marker + display_text

        item = QListWidgetItem(display_text)
        item.setData(Qt.UserRole, card['id'])
        if card['is_favorite'] == 1:
            item.setForeground(QColor('#b45309'))

        font = QFont()
        font.setPointSize(10)
        item.setFont(font)

        self.card_list.addItem(item)

    def get_selected_card_id(self) -> Optional[int]:
        current = self.card_list.currentItem()
        if current and current.flags() & Qt.ItemIsSelectable:
            return current.data(Qt.UserRole)
        return None

    def update_card_display(self, card_id: int):
        card = self.db.get_card_by_id(card_id)
        if not card:
            return

        for i in range(self.card_list.count()):
            item = self.card_list.item(i)
            if item.data(Qt.UserRole) == card_id:
                self.cards = [c for c in self.cards if c['id'] != card_id]
                self.cards.insert(0, card)
                self.card_list.takeItem(i)
                self._add_card_item_at(card, 0)
                break

    def _add_card_item_at(self, card: Dict[str, Any], position: int):
        display_title = card['title'] or "未命名"
        if len(display_title) > 30:
            display_title = display_title[:30] + "..."

        content_preview = (card['content'] or "").strip()
        if content_preview:
            content_preview = content_preview.replace('\n', ' ')
            if len(content_preview) > 50:
                content_preview = content_preview[:50] + "..."

        tags_text = ""
        if card.get('tags'):
            tags_text = " | ".join([t['name'] for t in card['tags']])

        display_text = display_title
        if content_preview:
            display_text += f"\n  {content_preview}"
        if tags_text:
            display_text += f"\n  [{tags_text}]"

        favorite_marker = "★ " if card['is_favorite'] == 1 else ""
        display_text = favorite_marker + display_text

        item = QListWidgetItem(display_text)
        item.setData(Qt.UserRole, card['id'])
        if card['is_favorite'] == 1:
            item.setForeground(QColor('#b45309'))

        font = QFont()
        font.setPointSize(10)
        item.setFont(font)

        self.card_list.insertItem(position, item)
