import sys

from PySide6.QtWidgets import QApplication
from PySide6.QtGui import QFont

from knowledge_card.database import DatabaseManager
from knowledge_card.ui.main_window import MainWindow


def main():
    app = QApplication(sys.argv)
    app.setApplicationName("个人知识卡片管理")
    app.setApplicationVersion("1.0.0")

    font = QFont("Microsoft YaHei UI", 10)
    app.setFont(font)

    app.setStyleSheet(
        """
        QWidget {
            background-color: #f8fafc;
            color: #1e293b;
        }
        QLabel {
            background-color: transparent;
        }
        QMainWindow {
            background-color: #f8fafc;
        }
        """
    )

    db = DatabaseManager()
    window = MainWindow(db)
    window.show()

    sys.exit(app.exec())


if __name__ == "__main__":
    main()
