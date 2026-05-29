from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QListWidget, QListWidgetItem,
    QPushButton, QLabel, QComboBox, QLineEdit, QMenu
)
from PySide6.QtCore import Signal, Qt
from PySide6.QtGui import QAction


class OrderNavPanel(QWidget):
    order_selected = Signal(int)
    order_create_requested = Signal()

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setMinimumWidth(280)
        self.setMaximumWidth(360)
        self._setup_ui()

    def _setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(6, 6, 6, 6)
        layout.setSpacing(6)

        title = QLabel("订单导航")
        title.setProperty("headerLabel", True)
        layout.addWidget(title)

        filter_layout = QHBoxLayout()
        self.status_filter = QComboBox()
        self.status_filter.addItem("全部状态", "")
        self.status_filter.addItem("待拍摄", "待拍摄")
        self.status_filter.addItem("拍摄中", "拍摄中")
        self.status_filter.addItem("选片中", "选片中")
        self.status_filter.addItem("精修中", "精修中")
        self.status_filter.addItem("交付中", "交付中")
        self.status_filter.addItem("已完成", "已完成")
        self.status_filter.addItem("已取消", "已取消")
        self.status_filter.currentIndexChanged.connect(self._on_filter_changed)
        filter_layout.addWidget(QLabel("状态:"))
        filter_layout.addWidget(self.status_filter, 1)
        layout.addLayout(filter_layout)

        search_layout = QHBoxLayout()
        self.search_input = QLineEdit()
        self.search_input.setPlaceholderText("搜索订单号/客户名/电话...")
        self.search_input.textChanged.connect(self._on_filter_changed)
        search_layout.addWidget(self.search_input)
        layout.addLayout(search_layout)

        self.order_list = QListWidget()
        self.order_list.currentRowChanged.connect(self._on_row_changed)
        self.order_list.setContextMenuPolicy(Qt.ContextMenuPolicy.CustomContextMenu)
        self.order_list.customContextMenuRequested.connect(self._show_context_menu)
        layout.addWidget(self.order_list)

        btn_layout = QHBoxLayout()
        self.btn_new = QPushButton("新建订单")
        self.btn_new.setProperty("btnType", "success")
        self.btn_new.clicked.connect(self.order_create_requested.emit)
        btn_layout.addWidget(self.btn_new)
        layout.addLayout(btn_layout)

        self._orders_data = []

    def load_orders(self, orders: list):
        self._orders_data = orders
        self._apply_filter()

    def _apply_filter(self):
        self.order_list.blockSignals(True)
        current_id = self._get_selected_order_id()
        self.order_list.clear()

        status = self.status_filter.currentData()
        keyword = self.search_input.text().strip().lower()

        for o in self._orders_data:
            if status and o.get("order_status") != status:
                continue
            if keyword:
                searchable = f"{o.get('order_no', '')} {o.get('customer_name', '')} {o.get('customer_phone', '')}".lower()
                if keyword not in searchable:
                    continue

            text = f"{o.get('order_no', '')} | {o.get('customer_name', '未知')}"
            sub = f"{o.get('order_status', '')} | {o.get('appointment_date', '')} | ¥{o.get('amount', 0):.0f}"
            item = QListWidgetItem(f"{text}\n{sub}")
            item.setData(Qt.ItemDataRole.UserRole, o.get("id"))

            status_colors = {
                "待拍摄": "#f39c12", "拍摄中": "#3498db", "选片中": "#9b59b6",
                "精修中": "#e67e22", "交付中": "#1abc9c", "已完成": "#27ae60",
                "已取消": "#95a5a6"
            }
            color = status_colors.get(o.get("order_status", ""), "#2c3e50")
            item.setForeground(Qt.GlobalColor.darkGray)

            self.order_list.addItem(item)

        self._restore_selection(current_id)
        self.order_list.blockSignals(False)
        if self.order_list.count() > 0 and self.order_list.currentRow() < 0:
            self.order_list.setCurrentRow(0)

    def _on_filter_changed(self):
        self._apply_filter()

    def _on_row_changed(self, row):
        if row >= 0:
            item = self.order_list.item(row)
            if item:
                order_id = item.data(Qt.ItemDataRole.UserRole)
                self.order_selected.emit(order_id)

    def _get_selected_order_id(self):
        item = self.order_list.currentItem()
        if item:
            return item.data(Qt.ItemDataRole.UserRole)
        return None

    def _restore_selection(self, order_id):
        if order_id is None:
            return
        for i in range(self.order_list.count()):
            item = self.order_list.item(i)
            if item and item.data(Qt.ItemDataRole.UserRole) == order_id:
                self.order_list.setCurrentItem(item)
                return

    def _show_context_menu(self, pos):
        item = self.order_list.itemAt(pos)
        if not item:
            return
        menu = QMenu(self)
        copy_action = QAction("复制订单号", self)
        copy_action.triggered.connect(lambda: self._copy_order_no(item))
        menu.addAction(copy_action)
        menu.exec(self.order_list.mapToGlobal(pos))

    def _copy_order_no(self, item):
        from PySide6.QtWidgets import QApplication
        QApplication.clipboard().setText(item.text().split(" | ")[0])
