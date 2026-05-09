from PySide6.QtCore import Qt, QAbstractListModel, QModelIndex, Signal, QObject
from typing import List, Optional, Dict, Any

from ..database import DatabaseManager


class SignalBus(QObject):
    card_updated = Signal()
    tag_updated = Signal()
    card_selected = Signal(int)
    card_deleted = Signal()


signal_bus = SignalBus()


class TagListModel(QAbstractListModel):
    TagNameRole = Qt.UserRole + 1
    TagIdRole = Qt.UserRole + 2
    TagColorRole = Qt.UserRole + 3
    TagCountRole = Qt.UserRole + 4
    IsSpecialRole = Qt.UserRole + 5
    SpecialTypeRole = Qt.UserRole + 6

    def __init__(self, db: DatabaseManager, parent=None):
        super().__init__(parent)
        self.db = db
        self.tags: List[Dict[str, Any]] = []
        self.refresh()

    def refresh(self):
        self.beginResetModel()
        stats = self.db.get_statistics()
        self.tags = [
            {
                'id': -1,
                'name': '全部卡片',
                'color': '#6366f1',
                'count': stats['total_cards'],
                'is_special': True,
                'special_type': 'all'
            },
            {
                'id': -2,
                'name': '收藏夹',
                'color': '#eab308',
                'count': stats['favorite_cards'],
                'is_special': True,
                'special_type': 'favorite'
            },
            {
                'id': -3,
                'name': '最近浏览',
                'color': '#10b981',
                'count': 0,
                'is_special': True,
                'special_type': 'recent'
            },
        ]
        tags = self.db.get_all_tags()
        for tag in tags:
            tag['count'] = self.db.get_tag_card_count(tag['id'])
            tag['is_special'] = False
            tag['special_type'] = None
            self.tags.append(tag)
        self.endResetModel()

    def rowCount(self, parent=QModelIndex()):
        return len(self.tags)

    def data(self, index: QModelIndex, role: int = Qt.DisplayRole):
        if not index.isValid() or index.row() >= len(self.tags):
            return None
        tag = self.tags[index.row()]
        if role == Qt.DisplayRole:
            if tag['is_special']:
                return tag['name']
            return f"{tag['name']} ({tag['count']})"
        elif role == Qt.DecorationRole:
            from PySide6.QtGui import QColor
            return QColor(tag['color'])
        elif role == self.TagIdRole:
            return tag['id']
        elif role == self.TagNameRole:
            return tag['name']
        elif role == self.TagColorRole:
            return tag['color']
        elif role == self.TagCountRole:
            return tag['count']
        elif role == self.IsSpecialRole:
            return tag['is_special']
        elif role == self.SpecialTypeRole:
            return tag['special_type']
        return None


class CardListModel(QAbstractListModel):
    CardIdRole = Qt.UserRole + 1
    CardTitleRole = Qt.UserRole + 2
    CardContentRole = Qt.UserRole + 3
    CardTagsRole = Qt.UserRole + 4
    CardFavoriteRole = Qt.UserRole + 5
    CardUpdatedAtRole = Qt.UserRole + 6
    CardCreatedAtRole = Qt.UserRole + 7

    def __init__(self, db: DatabaseManager, parent=None):
        super().__init__(parent)
        self.db = db
        self.cards: List[Dict[str, Any]] = []
        self.current_tag_filter: Optional[int] = None
        self.current_search: str = ''
        self.current_filter_type: str = 'all'

    def refresh(self):
        self.beginResetModel()
        if self.current_filter_type == 'favorite':
            self.cards = self.db.get_all_cards(
                search_query=self.current_search if self.current_search else None,
                favorite_only=True
            )
        elif self.current_filter_type == 'recent':
            self.cards = self.db.get_recent_cards(limit=10)
            if self.current_search:
                self.cards = [
                    c for c in self.cards
                    if self.current_search.lower() in c['title'].lower() or
                       self.current_search.lower() in c['content'].lower()
                ]
        else:
            self.cards = self.db.get_all_cards(
                tag_filter=self.current_tag_filter,
                search_query=self.current_search if self.current_search else None
            )
        self.endResetModel()

    def set_filter(self, tag_id: Optional[int] = None, filter_type: str = 'all'):
        self.current_tag_filter = tag_id
        self.current_filter_type = filter_type
        self.refresh()

    def set_search(self, query: str):
        self.current_search = query
        self.refresh()

    def rowCount(self, parent=QModelIndex()):
        return len(self.cards)

    def data(self, index: QModelIndex, role: int = Qt.DisplayRole):
        if not index.isValid() or index.row() >= len(self.cards):
            return None
        card = self.cards[index.row()]
        if role == Qt.DisplayRole:
            return card['title']
        elif role == self.CardIdRole:
            return card['id']
        elif role == self.CardTitleRole:
            return card['title']
        elif role == self.CardContentRole:
            return card['content']
        elif role == self.CardTagsRole:
            return card.get('tags', [])
        elif role == self.CardFavoriteRole:
            return card['is_favorite'] == 1
        elif role == self.CardUpdatedAtRole:
            return card['updated_at']
        elif role == self.CardCreatedAtRole:
            return card['created_at']
        return None

    def get_card(self, row: int) -> Optional[Dict[str, Any]]:
        if 0 <= row < len(self.cards):
            return self.cards[row]
        return None
