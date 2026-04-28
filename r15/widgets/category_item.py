from PySide6.QtWidgets import QWidget, QHBoxLayout, QLabel, QPushButton, QFrame
from PySide6.QtCore import Qt, Signal, QSize
from PySide6.QtGui import QFont
from typing import Optional
from models.category import Category


class CategoryItemWidget(QFrame):
    clicked = Signal(str)
    edited = Signal(str)
    deleted = Signal(str)

    def __init__(self, category: Category, parent=None):
        super().__init__(parent)
        self.category = category
        self._is_selected = False
        self._init_ui()
        self._update_display()

    def _init_ui(self):
        self.setFrameStyle(QFrame.StyledPanel)
        self.setProperty("class", "category-item")
        self.setMinimumHeight(40)
        
        layout = QHBoxLayout(self)
        layout.setContentsMargins(10, 8, 10, 8)
        layout.setSpacing(8)
        
        self.color_label = QLabel()
        self.color_label.setFixedSize(12, 12)
        self.color_label.setObjectName("category-color")
        layout.addWidget(self.color_label)
        
        self.name_label = QLabel()
        self.name_label.setObjectName("category-name")
        self.name_label.setAlignment(Qt.AlignVCenter)
        font = QFont()
        font.setPointSize(10)
        self.name_label.setFont(font)
        layout.addWidget(self.name_label, stretch=1)
        
        self.count_label = QLabel()
        self.count_label.setObjectName("category-count")
        self.count_label.setAlignment(Qt.AlignVCenter)
        self.count_label.setStyleSheet("color: #888; font-size: 9px;")
        layout.addWidget(self.count_label)
        
        self.edit_button = QPushButton("✏️")
        self.edit_button.setFixedSize(24, 24)
        self.edit_button.setToolTip("编辑分类")
        self.edit_button.clicked.connect(self._on_edit_clicked)
        layout.addWidget(self.edit_button)
        
        self.delete_button = QPushButton("🗑️")
        self.delete_button.setFixedSize(24, 24)
        self.delete_button.setToolTip("删除分类")
        self.delete_button.clicked.connect(self._on_delete_clicked)
        layout.addWidget(self.delete_button)

    def _update_display(self):
        category = self.category
        
        self.color_label.setStyleSheet(
            f"background-color: {category.color}; border-radius: 6px;"
        )
        
        self.name_label.setText(category.name)
        
        self._update_styles()

    def _update_styles(self):
        if self._is_selected:
            self.setStyleSheet("""
                QFrame.category-item {
                    background-color: #e3f2fd;
                    border: 1px solid #2196f3;
                    border-radius: 6px;
                }
                QLabel#category-name {
                    color: #1976d2;
                    font-weight: bold;
                }
            """)
        else:
            self.setStyleSheet("""
                QFrame.category-item {
                    background-color: transparent;
                    border: 1px solid transparent;
                    border-radius: 6px;
                }
                QFrame.category-item:hover {
                    background-color: #f5f5f5;
                }
                QLabel#category-name {
                    color: #333;
                }
            """)

    def _on_edit_clicked(self):
        self.edited.emit(self.category.id)

    def _on_delete_clicked(self):
        self.deleted.emit(self.category.id)

    def set_selected(self, selected: bool):
        self._is_selected = selected
        self._update_styles()

    def set_task_count(self, count: int):
        self.count_label.setText(f"({count})")

    def update_category(self, category: Category):
        self.category = category
        self._update_display()

    def mousePressEvent(self, event):
        if event.button() == Qt.LeftButton:
            self.clicked.emit(self.category.id)
        super().mousePressEvent(event)
