from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QListWidget, QListWidgetItem,
    QPushButton, QLabel, QLineEdit, QMessageBox, QMenu
)
from PySide6.QtCore import Qt, Signal, QTimer
from PySide6.QtGui import QAction, QColor, QFont

from typing import Optional, List, Dict, Any

from ..database import DatabaseManager


class CardListPanel(QWidget):
    card_selected = Signal(int)
    card_deleted = Signal()
    cards_changed = Signal()
    new_card_created = Signal(int)

    def __init__(self, db: DatabaseManager, parent=None):
        super().__init__(parent)
        self.db = db
        self.cards: List[Dict[str, Any]] = []
        self.current_filter: Dict[str, Any] = {'tag_id': -1, 'filter_type': 'all'}
        self.current_search: str = ''
        self._init_ui()
        self._connect_signals()

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
        self.card_list.currentItemChanged.connect(self._on_current_item_changed)
        self.card_list.customContextMenuRequested.connect(self._on_context_menu)

    def set_filter(self, filter_data: Dict[str, Any]):
        self.current_filter = dict(filter_data)
        self.refresh()

    def refresh(self):
        current_id = self.get_selected_card_id()
        self.card_list.clear()

        cards = self._fetch_cards()
        self.cards = cards

        for card in cards:
            self._add_card_item(card)

        if not cards:
            empty_item = QListWidgetItem("暂无卡片，点击上方按钮新建")
            empty_item.setFlags(Qt.NoItemFlags)
            empty_item.setForeground(QColor("#94a3b8"))
            empty_item.setTextAlignment(Qt.AlignCenter)
            self.card_list.addItem(empty_item)
        else:
            if current_id:
                self._select_card_by_id(current_id)

    def _fetch_cards(self) -> List[Dict[str, Any]]:
        filter_type = self.current_filter.get('filter_type', 'all')
        tag_id = self.current_filter.get('tag_id')
        search = self.current_search if self.current_search else None

        if filter_type == 'favorite':
            return self.db.get_all_cards(search_query=search, favorite_only=True)
        elif filter_type == 'recent':
            recent_cards = self.db.get_recent_cards(limit=10)
            if search:
                query = search.lower()
                return [
                    c for c in recent_cards
                    if query in c['title'].lower() or query in c['content'].lower()
                ]
            return recent_cards
        elif filter_type == 'tag':
            return self.db.get_all_cards(tag_filter=tag_id, search_query=search)
        else:
            return self.db.get_all_cards(tag_filter=None, search_query=search)

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

    def _select_card_by_id(self, card_id: int):
        for i in range(self.card_list.count()):
            item = self.card_list.item(i)
            if item.data(Qt.UserRole) == card_id:
                self.card_list.setCurrentRow(i)
                self.card_list.scrollToItem(item)
                return

    def get_selected_card_id(self) -> Optional[int]:
        current = self.card_list.currentItem()
        if current and current.flags() & Qt.ItemIsSelectable:
            data = current.data(Qt.UserRole)
            if data is not None and data > 0:
                return data
        return None

    def _on_search_changed(self, text: str):
        self.current_search = text
        QTimer.singleShot(300, self._apply_search)

    def _on_search_triggered(self):
        self.current_search = self.search_input.text()
        self.refresh()

    def _apply_search(self):
        current_text = self.search_input.text()
        if current_text != self.current_search:
            self.current_search = current_text
        self.refresh()

    def _on_new_card(self):
        new_card_id = self.db.create_card(
            title="未命名卡片",
            content="",
            tag_ids=[]
        )
        self.new_card_created.emit(new_card_id)
        self.cards_changed.emit()

    def _on_current_item_changed(self, current: QListWidgetItem, previous: QListWidgetItem):
        if not current:
            return
        card_id = current.data(Qt.UserRole)
        if card_id and card_id > 0:
            self.card_selected.emit(card_id)

    def _on_context_menu(self, pos):
        item = self.card_list.itemAt(pos)
        if not item:
            return

        card_id = item.data(Qt.UserRole)
        if not card_id or card_id <= 0:
            return

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
        self.cards_changed.emit()

    def _delete_card(self, card_id: int, title: str):
        reply = QMessageBox.question(
            self, "确认删除",
            f"确定要删除卡片「{title}」吗？\n此操作不可恢复。",
            QMessageBox.Yes | QMessageBox.No,
            QMessageBox.No
        )

        if reply == QMessageBox.Yes:
            self.db.delete_card(card_id)
            self.card_deleted.emit()
            self.cards_changed.emit()

    def get_current_filter(self) -> Dict[str, Any]:
        return dict(self.current_filter)

    def get_search_query(self) -> str:
        return self.current_search
