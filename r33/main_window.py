from PySide6.QtWidgets import (
    QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QListWidget, QListWidgetItem, QLineEdit, QTextEdit,
    QPushButton, QLabel, QMessageBox, QSplitter, QFrame
)
from PySide6.QtCore import Qt, QTimer
from PySide6.QtGui import QFont
from note_service import NoteService


class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("本地笔记管理器")
        self.resize(1000, 700)
        self.note_service = NoteService()
        self._init_ui()
        self._load_note_list()

    def _init_ui(self) -> None:
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        main_layout = QHBoxLayout(central_widget)
        main_layout.setContentsMargins(10, 10, 10, 10)
        main_layout.setSpacing(10)

        splitter = QSplitter(Qt.Horizontal)
        main_layout.addWidget(splitter)

        left_panel = self._create_left_panel()
        right_panel = self._create_right_panel()

        splitter.addWidget(left_panel)
        splitter.addWidget(right_panel)
        splitter.setStretchFactor(0, 1)
        splitter.setStretchFactor(1, 2)

    def _create_left_panel(self) -> QWidget:
        panel = QFrame()
        panel.setFrameShape(QFrame.StyledPanel)
        layout = QVBoxLayout(panel)
        layout.setContentsMargins(10, 10, 10, 10)
        layout.setSpacing(10)

        self.search_input = QLineEdit()
        self.search_input.setPlaceholderText("搜索笔记标题或内容...")
        self.search_input.textChanged.connect(self._on_search_changed)
        layout.addWidget(self.search_input)

        self.note_list = QListWidget()
        self.note_list.itemClicked.connect(self._on_note_selected)
        layout.addWidget(self.note_list, 1)

        new_btn = QPushButton("新建笔记")
        new_btn.clicked.connect(self._on_new_note)
        layout.addWidget(new_btn)

        return panel

    def _create_right_panel(self) -> QWidget:
        panel = QFrame()
        panel.setFrameShape(QFrame.StyledPanel)
        layout = QVBoxLayout(panel)
        layout.setContentsMargins(10, 10, 10, 10)
        layout.setSpacing(10)

        title_label = QLabel("标题:")
        title_font = QFont()
        title_font.setBold(True)
        title_label.setFont(title_font)
        layout.addWidget(title_label)

        self.title_input = QLineEdit()
        self.title_input.setPlaceholderText("请输入笔记标题...")
        self.title_input.setFont(QFont("Arial", 12))
        layout.addWidget(self.title_input)

        content_label = QLabel("内容:")
        content_label.setFont(title_font)
        layout.addWidget(content_label)

        self.content_edit = QTextEdit()
        self.content_edit.setPlaceholderText("请输入笔记内容...")
        self.content_edit.setFont(QFont("Arial", 11))
        layout.addWidget(self.content_edit, 1)

        btn_layout = QHBoxLayout()
        btn_layout.setSpacing(10)

        self.save_btn = QPushButton("保存")
        self.save_btn.clicked.connect(self._on_save_note)
        btn_layout.addWidget(self.save_btn)

        self.delete_btn = QPushButton("删除")
        self.delete_btn.clicked.connect(self._on_delete_note)
        self.delete_btn.setEnabled(False)
        btn_layout.addWidget(self.delete_btn)

        btn_layout.addStretch()
        layout.addLayout(btn_layout)

        self.time_label = QLabel("")
        self.time_label.setStyleSheet("color: #666; font-size: 12px;")
        layout.addWidget(self.time_label)

        return panel

    def _load_note_list(self, keyword: str = "") -> None:
        self.note_list.clear()
        try:
            if keyword:
                notes = self.note_service.search_notes(keyword)
            else:
                notes = self.note_service.get_all_notes()

            if not notes and keyword:
                item = QListWidgetItem("未找到匹配的笔记")
                item.setFlags(item.flags() & ~Qt.ItemIsSelectable)
                item.setForeground(Qt.gray)
                self.note_list.addItem(item)
                return

            for note in notes:
                item = QListWidgetItem()
                item.setText(f"{note['title']}\n更新: {note['updated_at']}")
                item.setData(Qt.UserRole, note["id"])
                self.note_list.addItem(item)
        except Exception as e:
            QMessageBox.critical(self, "错误", f"加载笔记列表失败: {str(e)}")

    def _on_search_changed(self, text: str) -> None:
        QTimer.singleShot(300, lambda: self._load_note_list(text))

    def _on_note_selected(self, item: QListWidgetItem) -> None:
        note_id = item.data(Qt.UserRole)
        if note_id is None:
            return

        try:
            note = self.note_service.load_note(note_id)
            if note:
                self.title_input.setText(note["title"])
                self.content_edit.setPlainText(note["content"])
                self.time_label.setText(
                    f"创建时间: {note['created_at']} | 更新时间: {note['updated_at']}"
                )
                self.delete_btn.setEnabled(True)
        except Exception as e:
            QMessageBox.critical(self, "错误", f"加载笔记失败: {str(e)}")

    def _on_new_note(self) -> None:
        self.note_service.clear_current_note()
        self.title_input.clear()
        self.content_edit.clear()
        self.time_label.setText("")
        self.delete_btn.setEnabled(False)
        self.note_list.clearSelection()
        self.title_input.setFocus()

    def _on_save_note(self) -> None:
        title = self.title_input.text()
        content = self.content_edit.toPlainText()

        try:
            note_id = self.note_service.save_current_note(title, content)
            self._load_note_list(self.search_input.text())

            for i in range(self.note_list.count()):
                item = self.note_list.item(i)
                if item.data(Qt.UserRole) == note_id:
                    self.note_list.setCurrentItem(item)
                    break

            note = self.note_service.get_note(note_id)
            if note:
                self.time_label.setText(
                    f"创建时间: {note['created_at']} | 更新时间: {note['updated_at']}"
                )
            self.delete_btn.setEnabled(True)
            QMessageBox.information(self, "成功", "笔记保存成功！")
        except ValueError as e:
            QMessageBox.warning(self, "警告", str(e))
            self.title_input.setFocus()
        except Exception as e:
            QMessageBox.critical(self, "错误", f"保存笔记失败: {str(e)}")

    def _on_delete_note(self) -> None:
        if self.note_service.is_new_note():
            return

        reply = QMessageBox.question(
            self,
            "确认删除",
            "确定要删除这篇笔记吗？此操作不可撤销。",
            QMessageBox.Yes | QMessageBox.No,
            QMessageBox.No
        )

        if reply == QMessageBox.Yes:
            try:
                if self.note_service.delete_note(self.note_service.current_note_id):
                    self._on_new_note()
                    self._load_note_list(self.search_input.text())
                    QMessageBox.information(self, "成功", "笔记删除成功！")
            except Exception as e:
                QMessageBox.critical(self, "错误", f"删除笔记失败: {str(e)}")
