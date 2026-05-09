from PySide6.QtWidgets import (
    QMainWindow, QWidget, QHBoxLayout, QVBoxLayout, QSplitter,
    QStatusBar, QMessageBox
)
from PySide6.QtCore import Qt, QSize, QTimer
from PySide6.QtGui import QFont, QIcon

from ..database import DatabaseManager
from .tag_panel import TagPanel
from .card_list import CardListPanel
from .detail_panel import DetailPanel


class MainWindow(QMainWindow):
    def __init__(self, db: DatabaseManager):
        super().__init__()
        self.db = db
        self._init_ui()
        self._connect_signals()
        self._init_default_selection()
        self._update_status()

    def _init_default_selection(self):
        QTimer.singleShot(50, self._trigger_initial_selection)

    def _trigger_initial_selection(self):
        first_item = self.tag_panel.tag_list.item(0)
        if first_item:
            self.tag_panel.tag_list.setCurrentRow(0)

    def _init_ui(self):
        self.setWindowTitle("个人知识卡片管理")
        self.setMinimumSize(1200, 700)
        self.resize(1400, 800)

        central_widget = QWidget()
        self.setCentralWidget(central_widget)

        main_layout = QVBoxLayout(central_widget)
        main_layout.setContentsMargins(0, 0, 0, 0)
        main_layout.setSpacing(0)

        splitter = QSplitter(Qt.Horizontal)
        splitter.setStyleSheet(
            "QSplitter::handle { background-color: #e2e8f0; width: 1px; }"
        )

        self.tag_panel = TagPanel(self.db)
        self.tag_panel.setMinimumWidth(200)
        self.tag_panel.setMaximumWidth(300)
        splitter.addWidget(self.tag_panel)

        self.card_list_panel = CardListPanel(self.db)
        self.card_list_panel.setMinimumWidth(300)
        self.card_list_panel.setMaximumWidth(450)
        splitter.addWidget(self.card_list_panel)

        self.detail_panel = DetailPanel(self.db)
        self.detail_panel.setMinimumWidth(400)
        splitter.addWidget(self.detail_panel)

        splitter.setSizes([220, 380, 700])
        splitter.setStretchFactor(0, 0)
        splitter.setStretchFactor(1, 0)
        splitter.setStretchFactor(2, 1)

        main_layout.addWidget(splitter, 1)

        self.status_bar = QStatusBar()
        self.status_bar.setStyleSheet(
            "QStatusBar { background-color: #f1f5f9; color: #475569; padding: 4px; }"
        )
        self.setStatusBar(self.status_bar)

    def _connect_signals(self):
        self.tag_panel.tag_selected.connect(self._on_tag_selected)
        self.tag_panel.tags_changed.connect(self._on_tags_changed)

        self.card_list_panel.card_selected.connect(self._on_card_selected)
        self.card_list_panel.card_updated.connect(self._on_cards_changed)
        self.card_list_panel.card_deleted.connect(self._on_card_deleted)
        self.card_list_panel.search_changed.connect(self._on_search_changed)
        self.card_list_panel.new_card_created.connect(self._on_new_card_created)

        self.detail_panel.card_saved.connect(self._on_cards_changed)
        self.detail_panel.card_deleted.connect(self._on_card_deleted)
        self.detail_panel.tags_changed.connect(self._on_tags_changed)

    def _on_tag_selected(self, filter_data: dict):
        tag_id = filter_data.get('tag_id')
        filter_type = filter_data.get('filter_type', 'all')
        self.card_list_panel.set_filter(tag_id, filter_type)

    def _on_new_card_created(self, card_id: int):
        for i in range(self.tag_panel.tag_list.count()):
            item = self.tag_panel.tag_list.item(i)
            if item.data(Qt.UserRole + 1) == 'all':
                self.tag_panel.tag_list.setCurrentRow(i)
                break

    def _on_tags_changed(self):
        self.tag_panel.refresh()
        self.detail_panel.refresh_tags()
        self._update_status()

    def _on_card_selected(self, card_id: int):
        self.detail_panel.load_card(card_id)
        self._update_status()

    def _on_cards_changed(self):
        self.card_list_panel.refresh()
        self.tag_panel.refresh()
        self._update_status()

    def _on_card_deleted(self):
        self.detail_panel.clear()
        self.card_list_panel.refresh()
        self.tag_panel.refresh()
        self._update_status()

    def _on_search_changed(self, query: str):
        self._update_status()

    def _update_status(self):
        stats = self.db.get_statistics()
        search_query = self.card_list_panel.current_search
        visible_count = self.card_list_panel.card_list.count()

        status_text = f"总卡片: {stats['total_cards']}  |  收藏: {stats['favorite_cards']}  |  标签: {stats['total_tags']}"
        if search_query:
            status_text += f"  |  搜索: \"{search_query}\""
        self.status_bar.showMessage(status_text)

    def closeEvent(self, event):
        reply = QMessageBox.question(
            self, "退出程序",
            "确定要退出个人知识卡片管理吗？",
            QMessageBox.Yes | QMessageBox.No,
            QMessageBox.No
        )

        if reply == QMessageBox.Yes:
            event.accept()
        else:
            event.ignore()
