from PySide6.QtWidgets import (
    QMainWindow, QSplitter, QTabWidget, QMenuBar, QStatusBar,
    QMessageBox, QLabel, QWidget, QVBoxLayout, QHBoxLayout
)
from PySide6.QtCore import Qt, QDate
from database.db_manager import DatabaseManager
from services.order_service import OrderService
from services.file_index_service import FileIndexService
from services.thumbnail_service import ThumbnailService
from services.export_backup_service import ExportBackupService
from ui.order_nav_panel import OrderNavPanel
from ui.calendar_widget import CalendarWidget
from ui.detail_editor import DetailEditor, CreateOrderDialog
from ui.thumbnail_wall import ThumbnailWall
from ui.photo_selector import PhotoSelector
from ui.search_dialog import SearchDialog
from ui.delivery_export import DeliveryExportWidget
from ui.styles import apply_styles
from utils import APP_NAME, APP_VERSION


class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle(f"{APP_NAME} v{APP_VERSION}")
        self.setMinimumSize(1200, 750)
        self.resize(1400, 850)

        self.db = DatabaseManager()
        self.order_service = OrderService(self.db)
        self.file_index_service = FileIndexService(self.db)
        self.thumbnail_service = ThumbnailService(self.db)
        self.export_service = ExportBackupService(self.db)

        self._setup_ui()
        self._setup_menu()
        self._setup_statusbar()
        self._connect_signals()
        self._load_initial_data()

    def _setup_ui(self):
        central = QWidget()
        self.setCentralWidget(central)
        main_layout = QHBoxLayout(central)
        main_layout.setContentsMargins(4, 4, 4, 4)
        main_layout.setSpacing(4)

        self.left_splitter = QSplitter(Qt.Orientation.Vertical)

        self.nav_panel = OrderNavPanel()
        self.left_splitter.addWidget(self.nav_panel)

        self.calendar_widget = CalendarWidget()
        self.left_splitter.addWidget(self.calendar_widget)

        self.left_splitter.setSizes([400, 280])

        self.right_tabs = QTabWidget()

        self.detail_editor = DetailEditor(
            self.order_service, self.file_index_service, self.thumbnail_service
        )
        self.right_tabs.addTab(self.detail_editor, "订单详情")

        self.thumbnail_wall = ThumbnailWall(
            self.order_service, self.file_index_service, self.thumbnail_service
        )
        self.right_tabs.addTab(self.thumbnail_wall, "缩略图墙")

        self.photo_selector = PhotoSelector(
            self.order_service, self.file_index_service, self.thumbnail_service
        )
        self.right_tabs.addTab(self.photo_selector, "选片管理")

        self.delivery_export = DeliveryExportWidget(self.order_service, self.export_service)
        self.right_tabs.addTab(self.delivery_export, "导出与备份")

        self.main_splitter = QSplitter(Qt.Orientation.Horizontal)
        self.main_splitter.addWidget(self.left_splitter)
        self.main_splitter.addWidget(self.right_tabs)
        self.main_splitter.setSizes([300, 900])

        main_layout.addWidget(self.main_splitter)

    def _setup_menu(self):
        menubar = self.menuBar()

        file_menu = menubar.addMenu("文件")
        act_new_order = file_menu.addAction("新建订单")
        act_new_order.triggered.connect(self._create_order)
        file_menu.addSeparator()
        act_backup = file_menu.addAction("备份数据库")
        act_backup.triggered.connect(lambda: self.delivery_service_backup())
        file_menu.addSeparator()
        act_exit = file_menu.addAction("退出")
        act_exit.triggered.connect(self.close)

        edit_menu = menubar.addMenu("编辑")
        act_search = edit_menu.addAction("条件搜索")
        act_search.triggered.connect(self._open_search)
        edit_menu.addSeparator()
        act_add_customer = edit_menu.addAction("管理客户")
        act_add_customer.triggered.connect(self._manage_customers)
        act_add_package = edit_menu.addAction("管理套餐")
        act_add_package.triggered.connect(self._manage_packages)
        act_add_photographer = edit_menu.addAction("管理摄影师")
        act_add_photographer.triggered.connect(self._manage_photographers)

        view_menu = menubar.addMenu("视图")
        act_refresh = view_menu.addAction("刷新数据")
        act_refresh.triggered.connect(self._refresh_all)
        view_menu.addSeparator()
        act_today = view_menu.addAction("今日预约")
        act_today.triggered.connect(self._show_today_appointments)

        help_menu = menubar.addMenu("帮助")
        act_about = help_menu.addAction("关于")
        act_about.triggered.connect(self._show_about)

    def _setup_statusbar(self):
        self.statusBar().showMessage("就绪")

    def _connect_signals(self):
        self.nav_panel.order_selected.connect(self._on_order_selected)
        self.nav_panel.order_create_requested.connect(self._create_order)
        self.calendar_widget.appointment_clicked.connect(self._on_order_selected)
        self.detail_editor.order_changed.connect(self._refresh_all)
        self.thumbnail_wall.order_changed.connect(self._refresh_all)
        self.photo_selector.photo_retouch_updated.connect(self._refresh_current_photos)
        self.delivery_export.order_changed.connect(self._refresh_all)

    def _load_initial_data(self):
        self._load_orders()
        self._load_appointments()

    def _load_orders(self):
        orders = self.order_service.get_all_orders()
        self.nav_panel.load_orders(orders)

    def _load_appointments(self):
        orders = self.order_service.get_all_orders()
        self.calendar_widget.load_appointments(orders)

    def _on_order_selected(self, order_id: int):
        if not order_id:
            return
        self.detail_editor.load_order(order_id)
        self.thumbnail_wall.load_order_photos(order_id)
        self.photo_selector.load_order(order_id)
        self.delivery_export.set_order(order_id)
        self.statusBar().showMessage(f"已选择订单 #{order_id}")

    def _create_order(self):
        dialog = CreateOrderDialog(self.order_service, self)
        dialog.order_created.connect(self._on_order_created)
        dialog.exec()

    def _on_order_created(self, order_id: int):
        self._refresh_all()
        self._on_order_selected(order_id)

    def _open_search(self):
        photographers = self.order_service.get_active_photographers()
        dialog = SearchDialog(photographers, self)
        dialog.search_requested.connect(self._do_search)
        dialog.exec()

    def _do_search(self, params: dict):
        results = self.order_service.search_orders(**params)
        self.nav_panel.load_orders(results)
        self.statusBar().showMessage(f"搜索完成，共 {len(results)} 条结果")

    def _refresh_all(self):
        self._load_orders()
        self._load_appointments()
        if self.detail_editor._current_order_id:
            self.detail_editor.load_order(self.detail_editor._current_order_id)
            self.thumbnail_wall.load_order_photos(self.detail_editor._current_order_id)
            self.photo_selector.load_order(self.detail_editor._current_order_id)

    def _refresh_current_photos(self):
        if self.detail_editor._current_order_id:
            self.thumbnail_wall.load_order_photos(self.detail_editor._current_order_id)
            self.photo_selector.load_order(self.detail_editor._current_order_id)

    def _show_today_appointments(self):
        today = QDate.currentDate().toString("yyyy-MM-dd")
        self.calendar_widget._show_day_appointments(today)

    def delivery_service_backup(self):
        path = self.export_service.backup_database()
        if path:
            QMessageBox.information(self, "备份成功", f"数据库已备份至:\n{path}")
        else:
            QMessageBox.warning(self, "备份失败", "数据库备份失败")

    def _manage_customers(self):
        from ui.manage_dialogs import ManageCustomersDialog
        dialog = ManageCustomersDialog(self.order_service, self)
        dialog.exec()
        self._refresh_all()

    def _manage_packages(self):
        from ui.manage_dialogs import ManagePackagesDialog
        dialog = ManagePackagesDialog(self.order_service, self)
        dialog.exec()
        self._refresh_all()

    def _manage_photographers(self):
        from ui.manage_dialogs import ManagePhotographersDialog
        dialog = ManagePhotographersDialog(self.order_service, self)
        dialog.exec()
        self._refresh_all()

    def _show_about(self):
        QMessageBox.about(self, "关于",
                          f"{APP_NAME}\n版本: {APP_VERSION}\n\n"
                          f"基于 PySide6 和 SQLite 构建的摄影工作室订单管理系统")

    def closeEvent(self, event):
        self.db.close()
        super().closeEvent(event)
