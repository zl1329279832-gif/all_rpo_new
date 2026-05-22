from PySide6.QtWidgets import (
    QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QListWidget, QListWidgetItem, QLineEdit, QTextEdit,
    QPushButton, QLabel, QMessageBox, QSplitter, QFrame,
    QToolBar, QFontComboBox, QSpinBox, QColorDialog
)
from PySide6.QtCore import Qt, QTimer
from PySide6.QtGui import (
    QFont, QAction, QIcon, QTextCursor, QTextDocument,
    QColor, QTextCharFormat, QTextListFormat
)
from note_service import NoteService


class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("本地笔记管理器")
        self.resize(1100, 750)
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
        layout.setSpacing(8)

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

        toolbar = self._create_format_toolbar()
        layout.addWidget(toolbar)

        self.content_edit = QTextEdit()
        self.content_edit.setPlaceholderText("请输入笔记内容，支持富文本格式...")
        self.content_edit.setFont(QFont("Arial", 11))
        self.content_edit.setAcceptRichText(True)
        self.content_edit.currentCharFormatChanged.connect(self._update_format_actions)
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

    def _create_format_toolbar(self) -> QToolBar:
        toolbar = QToolBar()
        toolbar.setMovable(False)
        toolbar.setStyleSheet("QToolBar { spacing: 2px; padding: 2px; }")

        self.undo_action = QAction("撤销", self)
        self.undo_action.setShortcut("Ctrl+Z")
        self.undo_action.triggered.connect(self.content_edit.undo)
        toolbar.addAction(self.undo_action)

        self.redo_action = QAction("重做", self)
        self.redo_action.setShortcut("Ctrl+Y")
        self.redo_action.triggered.connect(self.content_edit.redo)
        toolbar.addAction(self.redo_action)

        toolbar.addSeparator()

        self.bold_action = QAction("B", self)
        self.bold_action.setCheckable(True)
        self.bold_action.setShortcut("Ctrl+B")
        bold_font = QFont()
        bold_font.setBold(True)
        self.bold_action.setFont(bold_font)
        self.bold_action.triggered.connect(self._toggle_bold)
        toolbar.addAction(self.bold_action)

        self.italic_action = QAction("I", self)
        self.italic_action.setCheckable(True)
        self.italic_action.setShortcut("Ctrl+I")
        italic_font = QFont()
        italic_font.setItalic(True)
        self.italic_action.setFont(italic_font)
        self.italic_action.triggered.connect(self._toggle_italic)
        toolbar.addAction(self.italic_action)

        self.underline_action = QAction("U", self)
        self.underline_action.setCheckable(True)
        self.underline_action.setShortcut("Ctrl+U")
        underline_font = QFont()
        underline_font.setUnderline(True)
        self.underline_action.setFont(underline_font)
        self.underline_action.triggered.connect(self._toggle_underline)
        toolbar.addAction(self.underline_action)

        self.strikethrough_action = QAction("S", self)
        self.strikethrough_action.setCheckable(True)
        strike_font = QFont()
        strike_font.setStrikeOut(True)
        self.strikethrough_action.setFont(strike_font)
        self.strikethrough_action.triggered.connect(self._toggle_strikethrough)
        toolbar.addAction(self.strikethrough_action)

        toolbar.addSeparator()

        self.font_combo = QFontComboBox()
        self.font_combo.setFontFilters(QFontComboBox.ScalableFonts)
        self.font_combo.setFixedWidth(150)
        self.font_combo.currentFontChanged.connect(self._change_font)
        toolbar.addWidget(self.font_combo)

        self.size_spin = QSpinBox()
        self.size_spin.setRange(6, 72)
        self.size_spin.setValue(11)
        self.size_spin.setFixedWidth(60)
        self.size_spin.setSuffix(" pt")
        self.size_spin.valueChanged.connect(self._change_font_size)
        toolbar.addWidget(self.size_spin)

        toolbar.addSeparator()

        self.color_action = QAction("A", self)
        self.color_action.triggered.connect(self._change_text_color)
        self._update_color_icon(QColor("#000000"))
        toolbar.addAction(self.color_action)

        self.bg_color_action = QAction("高亮", self)
        self.bg_color_action.triggered.connect(self._change_bg_color)
        toolbar.addAction(self.bg_color_action)

        toolbar.addSeparator()

        self.align_left_action = QAction("左", self)
        self.align_left_action.setCheckable(True)
        self.align_left_action.triggered.connect(lambda: self._set_alignment(Qt.AlignLeft))
        toolbar.addAction(self.align_left_action)

        self.align_center_action = QAction("中", self)
        self.align_center_action.setCheckable(True)
        self.align_center_action.triggered.connect(lambda: self._set_alignment(Qt.AlignCenter))
        toolbar.addAction(self.align_center_action)

        self.align_right_action = QAction("右", self)
        self.align_right_action.setCheckable(True)
        self.align_right_action.triggered.connect(lambda: self._set_alignment(Qt.AlignRight))
        toolbar.addAction(self.align_right_action)

        self.align_justify_action = QAction("两", self)
        self.align_justify_action.setCheckable(True)
        self.align_justify_action.triggered.connect(lambda: self._set_alignment(Qt.AlignJustify))
        toolbar.addAction(self.align_justify_action)

        toolbar.addSeparator()

        self.bullet_list_action = QAction("• 列表", self)
        self.bullet_list_action.setCheckable(True)
        self.bullet_list_action.triggered.connect(self._toggle_bullet_list)
        toolbar.addAction(self.bullet_list_action)

        self.number_list_action = QAction("1. 列表", self)
        self.number_list_action.setCheckable(True)
        self.number_list_action.triggered.connect(self._toggle_number_list)
        toolbar.addAction(self.number_list_action)

        toolbar.addSeparator()

        self.clear_format_action = QAction("清除格式", self)
        self.clear_format_action.triggered.connect(self._clear_format)
        toolbar.addAction(self.clear_format_action)

        return toolbar

    def _update_color_icon(self, color: QColor) -> None:
        pixmap = self.content_edit.style().standardPixmap(
            self.content_edit.style().SP_FileIcon
        )
        icon = QIcon(pixmap)
        self.color_action.setIcon(icon)
        self.color_action.setToolTip(f"文字颜色: {color.name()}")

    def _toggle_bold(self) -> None:
        fmt = QTextCharFormat()
        fmt.setFontWeight(QFont.Bold if self.bold_action.isChecked() else QFont.Normal)
        self._merge_format(fmt)

    def _toggle_italic(self) -> None:
        fmt = QTextCharFormat()
        fmt.setFontItalic(self.italic_action.isChecked())
        self._merge_format(fmt)

    def _toggle_underline(self) -> None:
        fmt = QTextCharFormat()
        fmt.setFontUnderline(self.underline_action.isChecked())
        self._merge_format(fmt)

    def _toggle_strikethrough(self) -> None:
        fmt = QTextCharFormat()
        fmt.setFontStrikeOut(self.strikethrough_action.isChecked())
        self._merge_format(fmt)

    def _change_font(self, font: QFont) -> None:
        fmt = QTextCharFormat()
        fmt.setFontFamily(font.family())
        self._merge_format(fmt)

    def _change_font_size(self, size: int) -> None:
        fmt = QTextCharFormat()
        fmt.setFontPointSize(size)
        self._merge_format(fmt)

    def _change_text_color(self) -> None:
        color = QColorDialog.getColor(
            self.content_edit.textColor(),
            self,
            "选择文字颜色"
        )
        if color.isValid():
            fmt = QTextCharFormat()
            fmt.setForeground(color)
            self._merge_format(fmt)
            self._update_color_icon(color)

    def _change_bg_color(self) -> None:
        color = QColorDialog.getColor(
            QColor("#FFFF00"),
            self,
            "选择背景颜色"
        )
        if color.isValid():
            fmt = QTextCharFormat()
            fmt.setBackground(color)
            self._merge_format(fmt)

    def _set_alignment(self, alignment: Qt.Alignment) -> None:
        self.content_edit.setAlignment(alignment)
        self.align_left_action.setChecked(alignment == Qt.AlignLeft)
        self.align_center_action.setChecked(alignment == Qt.AlignCenter)
        self.align_right_action.setChecked(alignment == Qt.AlignRight)
        self.align_justify_action.setChecked(alignment == Qt.AlignJustify)

    def _toggle_bullet_list(self) -> None:
        cursor = self.content_edit.textCursor()
        if self.bullet_list_action.isChecked():
            fmt = QTextListFormat()
            fmt.setStyle(QTextListFormat.ListDisc)
            cursor.createList(fmt)
            self.number_list_action.setChecked(False)
        else:
            cursor.setBlockFormat(cursor.blockFormat())

    def _toggle_number_list(self) -> None:
        cursor = self.content_edit.textCursor()
        if self.number_list_action.isChecked():
            fmt = QTextListFormat()
            fmt.setStyle(QTextListFormat.ListDecimal)
            cursor.createList(fmt)
            self.bullet_list_action.setChecked(False)
        else:
            cursor.setBlockFormat(cursor.blockFormat())

    def _clear_format(self) -> None:
        cursor = self.content_edit.textCursor()
        cursor.select(QTextCursor.Document)
        fmt = QTextCharFormat()
        fmt.setFontFamily("Arial")
        fmt.setFontPointSize(11)
        fmt.setFontWeight(QFont.Normal)
        fmt.setFontItalic(False)
        fmt.setFontUnderline(False)
        fmt.setFontStrikeOut(False)
        fmt.setForeground(QColor("#000000"))
        fmt.setBackground(QColor("#FFFFFF"))
        cursor.setCharFormat(fmt)
        self.content_edit.setAlignment(Qt.AlignLeft)
        self._update_format_actions()

    def _merge_format(self, fmt: QTextCharFormat) -> None:
        cursor = self.content_edit.textCursor()
        if not cursor.hasSelection():
            cursor.select(QTextCursor.WordUnderCursor)
        cursor.mergeCharFormat(fmt)
        self.content_edit.mergeCurrentCharFormat(fmt)

    def _update_format_actions(self) -> None:
        fmt = self.content_edit.currentCharFormat()
        self.bold_action.setChecked(fmt.fontWeight() == QFont.Bold)
        self.italic_action.setChecked(fmt.fontItalic())
        self.underline_action.setChecked(fmt.fontUnderline())
        self.strikethrough_action.setChecked(fmt.fontStrikeOut())

        font = fmt.font()
        self.font_combo.setCurrentFont(font)
        self.size_spin.setValue(int(fmt.fontPointSize()) if fmt.fontPointSize() > 0 else 11)

        alignment = self.content_edit.alignment()
        self.align_left_action.setChecked(alignment == Qt.AlignLeft)
        self.align_center_action.setChecked(alignment == Qt.AlignCenter)
        self.align_right_action.setChecked(alignment == Qt.AlignRight)
        self.align_justify_action.setChecked(alignment == Qt.AlignJustify)

    def _html_to_plain_text(self, html: str) -> str:
        doc = QTextDocument()
        doc.setHtml(html)
        return doc.toPlainText()

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
                preview = self._html_to_plain_text(note["content"])
                preview = preview.strip()[:50] + "..." if len(preview) > 50 else preview
                item.setText(f"{note['title']}\n{preview}\n更新: {note['updated_at']}")
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
                self.content_edit.setHtml(note["content"])
                self.time_label.setText(
                    f"创建时间: {note['created_at']} | 更新时间: {note['updated_at']}"
                )
                self.delete_btn.setEnabled(True)
                self._update_format_actions()
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
        self._update_format_actions()

    def _on_save_note(self) -> None:
        title = self.title_input.text()
        content = self.content_edit.toHtml()

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
