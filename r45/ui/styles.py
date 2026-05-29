from PySide6.QtWidgets import QApplication
from PySide6.QtGui import QFont
from PySide6.QtCore import Qt

STYLESHEET = """
QMainWindow {
    background-color: #f5f6fa;
}

QGroupBox {
    font-weight: bold;
    border: 1px solid #dcdde1;
    border-radius: 6px;
    margin-top: 12px;
    padding-top: 16px;
}

QGroupBox::title {
    subcontrol-origin: margin;
    left: 12px;
    padding: 0 6px;
    color: #2c3e50;
}

QPushButton {
    background-color: #3498db;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 6px 16px;
    font-size: 13px;
    min-height: 28px;
}

QPushButton:hover {
    background-color: #2980b9;
}

QPushButton:pressed {
    background-color: #2471a3;
}

QPushButton[btnType="danger"] {
    background-color: #e74c3c;
}

QPushButton[btnType="danger"]:hover {
    background-color: #c0392b;
}

QPushButton[btnType="success"] {
    background-color: #27ae60;
}

QPushButton[btnType="success"]:hover {
    background-color: #229954;
}

QPushButton[btnType="warning"] {
    background-color: #f39c12;
}

QPushButton[btnType="warning"]:hover {
    background-color: #d68910;
}

QPushButton[btnType="secondary"] {
    background-color: #95a5a6;
}

QPushButton[btnType="secondary"]:hover {
    background-color: #7f8c8d;
}

QLineEdit, QComboBox, QSpinBox, QDoubleSpinBox, QTextEdit, QDateEdit {
    border: 1px solid #bdc3c7;
    border-radius: 4px;
    padding: 4px 8px;
    background-color: white;
    min-height: 24px;
}

QLineEdit:focus, QComboBox:focus, QTextEdit:focus {
    border-color: #3498db;
}

QTableWidget {
    border: 1px solid #dcdde1;
    border-radius: 4px;
    background-color: white;
    gridline-color: #ecf0f1;
    selection-background-color: #3498db;
    selection-color: white;
}

QTableWidget::item {
    padding: 4px;
}

QHeaderView::section {
    background-color: #ecf0f1;
    border: none;
    border-bottom: 2px solid #bdc3c7;
    padding: 6px;
    font-weight: bold;
    color: #2c3e50;
}

QListWidget {
    border: 1px solid #dcdde1;
    border-radius: 4px;
    background-color: white;
    outline: none;
}

QListWidget::item {
    padding: 8px;
    border-bottom: 1px solid #f0f0f0;
}

QListWidget::item:selected {
    background-color: #3498db;
    color: white;
}

QListWidget::item:hover {
    background-color: #ebf5fb;
}

QTabWidget::pane {
    border: 1px solid #dcdde1;
    border-radius: 4px;
    background-color: white;
}

QTabBar::tab {
    padding: 8px 20px;
    border: 1px solid #dcdde1;
    border-bottom: none;
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
    background-color: #ecf0f1;
    color: #2c3e50;
    margin-right: 2px;
}

QTabBar::tab:selected {
    background-color: white;
    font-weight: bold;
    color: #3498db;
    border-bottom: 2px solid white;
}

QCalendarWidget {
    border: 1px solid #dcdde1;
    border-radius: 4px;
}

QCalendarWidget QToolButton {
    color: #2c3e50;
    font-size: 13px;
}

QCalendarWidget QMenu {
    background-color: white;
}

QCalendarWidget QAbstractItemView {
    selection-background-color: #3498db;
    selection-color: white;
}

QLabel[headerLabel="true"] {
    font-size: 15px;
    font-weight: bold;
    color: #2c3e50;
}

QStatusBar {
    background-color: #ecf0f1;
    color: #2c3e50;
    border-top: 1px solid #bdc3c7;
}

QMenuBar {
    background-color: #2c3e50;
    color: white;
}

QMenuBar::item:selected {
    background-color: #3498db;
}

QMenu {
    background-color: white;
    border: 1px solid #dcdde1;
}

QMenu::item:selected {
    background-color: #3498db;
    color: white;
}

QScrollBar:vertical {
    background-color: #f5f6fa;
    width: 10px;
    border: none;
}

QScrollBar::handle:vertical {
    background-color: #bdc3c7;
    border-radius: 5px;
    min-height: 30px;
}

QScrollBar::handle:vertical:hover {
    background-color: #95a5a6;
}

QSplitter::handle {
    background-color: #dcdde1;
    width: 2px;
}
"""


def apply_styles(app: QApplication):
    app.setFont(QFont("Microsoft YaHei", 10))
    app.setStyleSheet(STYLESHEET)
