from PySide6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QFormLayout, QLineEdit,
    QPushButton, QTableWidget, QTableWidgetItem, QHeaderView,
    QMessageBox, QDoubleSpinBox, QSpinBox, QTextEdit, QGroupBox,
    QLabel
)
from services.order_service import OrderService, BusinessError


class ManageCustomersDialog(QDialog):
    def __init__(self, order_service: OrderService, parent=None):
        super().__init__(parent)
        self.order_service = order_service
        self.setWindowTitle("管理客户")
        self.setMinimumSize(600, 450)
        self._setup_ui()
        self._load_data()

    def _setup_ui(self):
        layout = QVBoxLayout(self)

        add_group = QGroupBox("新增客户")
        add_layout = QFormLayout(add_group)
        self.name_input = QLineEdit()
        self.phone_input = QLineEdit()
        self.email_input = QLineEdit()
        self.address_input = QLineEdit()
        add_layout.addRow("姓名*:", self.name_input)
        add_layout.addRow("电话:", self.phone_input)
        add_layout.addRow("邮箱:", self.email_input)
        add_layout.addRow("地址:", self.address_input)

        btn_add = QPushButton("添加")
        btn_add.setProperty("btnType", "success")
        btn_add.clicked.connect(self._add)
        add_layout.addRow(btn_add)
        layout.addWidget(add_group)

        self.table = QTableWidget(0, 5)
        self.table.setHorizontalHeaderLabels(["ID", "姓名", "电话", "邮箱", "地址"])
        self.table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        self.table.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)
        layout.addWidget(self.table)

    def _load_data(self):
        customers = self.order_service.get_all_customers()
        self.table.setRowCount(len(customers))
        for i, c in enumerate(customers):
            self.table.setItem(i, 0, QTableWidgetItem(str(c.id)))
            self.table.setItem(i, 1, QTableWidgetItem(c.name))
            self.table.setItem(i, 2, QTableWidgetItem(c.phone))
            self.table.setItem(i, 3, QTableWidgetItem(c.email))
            self.table.setItem(i, 4, QTableWidgetItem(c.address))

    def _add(self):
        name = self.name_input.text().strip()
        if not name:
            QMessageBox.warning(self, "提示", "姓名不能为空")
            return
        try:
            self.order_service.create_customer(
                name=name, phone=self.phone_input.text().strip(),
                email=self.email_input.text().strip(),
                address=self.address_input.text().strip()
            )
            self.name_input.clear()
            self.phone_input.clear()
            self.email_input.clear()
            self.address_input.clear()
            self._load_data()
        except BusinessError as e:
            QMessageBox.warning(self, "错误", str(e))


class ManagePackagesDialog(QDialog):
    def __init__(self, order_service: OrderService, parent=None):
        super().__init__(parent)
        self.order_service = order_service
        self.setWindowTitle("管理套餐")
        self.setMinimumSize(600, 450)
        self._setup_ui()
        self._load_data()

    def _setup_ui(self):
        layout = QVBoxLayout(self)

        add_group = QGroupBox("新增套餐")
        add_layout = QFormLayout(add_group)
        self.name_input = QLineEdit()
        self.desc_input = QLineEdit()
        self.price_spin = QDoubleSpinBox()
        self.price_spin.setRange(0, 999999)
        self.price_spin.setDecimals(2)
        self.photo_spin = QSpinBox()
        self.photo_spin.setRange(0, 9999)
        self.retouch_spin = QSpinBox()
        self.retouch_spin.setRange(0, 9999)
        self.duration_spin = QDoubleSpinBox()
        self.duration_spin.setRange(0.5, 24)
        self.duration_spin.setDecimals(1)
        add_layout.addRow("名称*:", self.name_input)
        add_layout.addRow("描述:", self.desc_input)
        add_layout.addRow("价格:", self.price_spin)
        add_layout.addRow("拍摄张数:", self.photo_spin)
        add_layout.addRow("精修张数:", self.retouch_spin)
        add_layout.addRow("拍摄时长(小时):", self.duration_spin)

        btn_add = QPushButton("添加")
        btn_add.setProperty("btnType", "success")
        btn_add.clicked.connect(self._add)
        add_layout.addRow(btn_add)
        layout.addWidget(add_group)

        self.table = QTableWidget(0, 5)
        self.table.setHorizontalHeaderLabels(["ID", "名称", "价格", "拍摄张数", "精修张数"])
        self.table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        self.table.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)
        layout.addWidget(self.table)

    def _load_data(self):
        packages = self.order_service.get_all_packages()
        self.table.setRowCount(len(packages))
        for i, p in enumerate(packages):
            self.table.setItem(i, 0, QTableWidgetItem(str(p.id)))
            self.table.setItem(i, 1, QTableWidgetItem(p.name))
            self.table.setItem(i, 2, QTableWidgetItem(f"¥{p.price:.0f}"))
            self.table.setItem(i, 3, QTableWidgetItem(str(p.photo_count)))
            self.table.setItem(i, 4, QTableWidgetItem(str(p.retouch_count)))

    def _add(self):
        name = self.name_input.text().strip()
        if not name:
            QMessageBox.warning(self, "提示", "名称不能为空")
            return
        try:
            self.order_service.create_package(
                name=name, description=self.desc_input.text().strip(),
                price=self.price_spin.value(), photo_count=self.photo_spin.value(),
                retouch_count=self.retouch_spin.value(),
                duration_hours=self.duration_spin.value()
            )
            self.name_input.clear()
            self.desc_input.clear()
            self._load_data()
        except BusinessError as e:
            QMessageBox.warning(self, "错误", str(e))


class ManagePhotographersDialog(QDialog):
    def __init__(self, order_service: OrderService, parent=None):
        super().__init__(parent)
        self.order_service = order_service
        self.setWindowTitle("管理摄影师")
        self.setMinimumSize(500, 400)
        self._setup_ui()
        self._load_data()

    def _setup_ui(self):
        layout = QVBoxLayout(self)

        add_group = QGroupBox("新增摄影师")
        add_layout = QFormLayout(add_group)
        self.name_input = QLineEdit()
        self.phone_input = QLineEdit()
        self.specialty_input = QLineEdit()
        add_layout.addRow("姓名*:", self.name_input)
        add_layout.addRow("电话:", self.phone_input)
        add_layout.addRow("专长:", self.specialty_input)

        btn_add = QPushButton("添加")
        btn_add.setProperty("btnType", "success")
        btn_add.clicked.connect(self._add)
        add_layout.addRow(btn_add)
        layout.addWidget(add_group)

        self.table = QTableWidget(0, 4)
        self.table.setHorizontalHeaderLabels(["ID", "姓名", "电话", "专长"])
        self.table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        self.table.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)
        layout.addWidget(self.table)

    def _load_data(self):
        photographers = self.order_service.get_all_photographers()
        self.table.setRowCount(len(photographers))
        for i, p in enumerate(photographers):
            self.table.setItem(i, 0, QTableWidgetItem(str(p.id)))
            self.table.setItem(i, 1, QTableWidgetItem(p.name))
            self.table.setItem(i, 2, QTableWidgetItem(p.phone))
            self.table.setItem(i, 3, QTableWidgetItem(p.specialty))

    def _add(self):
        name = self.name_input.text().strip()
        if not name:
            QMessageBox.warning(self, "提示", "姓名不能为空")
            return
        try:
            self.order_service.create_photographer(
                name=name, phone=self.phone_input.text().strip(),
                specialty=self.specialty_input.text().strip()
            )
            self.name_input.clear()
            self.phone_input.clear()
            self.specialty_input.clear()
            self._load_data()
        except BusinessError as e:
            QMessageBox.warning(self, "错误", str(e))
