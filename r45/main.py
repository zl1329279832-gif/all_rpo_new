import sys
import os
import logging
from PySide6.QtWidgets import QApplication
from PySide6.QtCore import Qt

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from utils import LOG_DIR, APP_NAME

os.makedirs(str(LOG_DIR), exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.FileHandler(str(LOG_DIR / "app.log"), encoding="utf-8"),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)


def main():
    app = QApplication(sys.argv)
    app.setApplicationName(APP_NAME)
    app.setStyle("Fusion")

    from ui.styles import apply_styles
    apply_styles(app)

    from ui.main_window import MainWindow
    window = MainWindow()
    window.show()

    logger.info("应用启动")
    exit_code = app.exec()
    logger.info(f"应用退出, code={exit_code}")
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
