from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QFormLayout, QTabWidget,
    QLabel, QLineEdit, QComboBox, QDateEdit, QTimeEdit, QTextEdit,
    QPushButton, QDoubleSpinBox, QTableWidget, QTableWidgetItem,
    QHeaderView, QGroupBox, QMessageBox, QFileDialog, QDialog,
    QDialogButtonBox, QSpinBox
)
from PySide6.QtCore import Signal, Qt, QDate, QTime
from datetime import datetime
from services.order_service import OrderService, BusinessError
from services.file_index_service import FileIndexService
from services.thumbnail_service import ThumbnailService
from utils import ORDER_STATUSES, PAYMENT_STATUSES, RETOUCH_STATUSES


class CreateOrderDialog(QDialog):
    order_created = Signal(int)

    def __init__(self, order_service: OrderService, parent=None):
        super().__init__(parent)
        self.order_service = order_service
        self.setWindowTitle("新建订单")
        self.setMinimumWidth(520)
        self._setup_ui()

    def _setup_ui(self):
        layout = QVBoxLayout(self)
        form = QFormLayout()

        self.customer_combo = QComboBox()
        self._load_customers()
        btn_new_customer = QPushButton("新增客户")
        btn_new_customer.setProperty("btnType", "secondary")
        btn_new_customer.clicked.connect(self._add_customer)
        customer_layout = QHBoxLayout()
        customer_layout.addWidget(self.customer_combo, 1)
        customer_layout.addWidget(btn_new_customer)
        form.addRow("客户*:", customer_layout)

        self.package_combo = QComboBox()
        self._load_packages()
        self.package_combo.currentIndexChanged.connect(self._on_package_changed)
        form.addRow("拍摄套餐*:", self.package_combo)

        self.photographer_combo = QComboBox()
        self._load_photographers()
        form.addRow("摄影师*:", self.photographer_combo)

        date_layout = QHBoxLayout()
        self.date_edit = QDateEdit()
        self.date_edit.setCalendarPopup(True)
        self.date_edit.setDisplayFormat("yyyy-MM-dd")
        self.date_edit.setDate(QDate.currentDate())
        self.time_edit = QTimeEdit()
        self.time_edit.setDisplayFormat("HH:mm")
        self.time_edit.setTime(QTime(9, 0))
        date_layout.addWidget(self.date_edit)
        date_layout.addWidget(QLabel("时间:"))
        date_layout.addWidget(self.time_edit)
        form.addRow("预约日期*:", date_layout)

        self.amount_spin = QDoubleSpinBox()
        self.amount_spin.setRange(0, 999999)
        self.amount_spin.setDecimals(2)
        self.amount_spin.setPrefix("¥ ")
        form.addRow("订单金额:", self.amount_spin)

        self.notes_edit = QTextEdit()
        self.notes_edit.setMaximumHeight(60)
        form.addRow("备注:", self.notes_edit)

        layout.addLayout(form)

        btn_layout = QHBoxLayout()
        btn_ok = QPushButton("创建订单")
        btn_ok.setProperty("btnType", "success")
        btn_ok.clicked.connect(self._create_order)
        btn_cancel = QPushButton("取消")
        btn_cancel.setProperty("btnType", "secondary")
        btn_cancel.clicked.connect(self.reject)
        btn_layout.addStretch()
        btn_layout.addWidget(btn_ok)
        btn_layout.addWidget(btn_cancel)
        layout.addLayout(btn_layout)

    def _load_customers(self):
        self.customer_combo.clear()
        for c in self.order_service.get_all_customers():
            self.customer_combo.addItem(f"{c.name} ({c.phone})", c.id)

    def _load_packages(self):
        self.package_combo.clear()
        for p in self.order_service.get_all_packages():
            self.package_combo.addItem(f"{p.name} - ¥{p.price:.0f}", p.id)

    def _load_photographers(self):
        self.photographer_combo.clear()
        for p in self.order_service.get_active_photographers():
            self.photographer_combo.addItem(p.name, p.id)

    def _on_package_changed(self):
        pkg_id = self.package_combo.currentData()
        if pkg_id:
            pkg = self.order_service.db.fetch_one("packages", pkg_id)
            if pkg:
                self.amount_spin.setValue(pkg.price)

    def _add_customer(self):
        dialog = AddCustomerDialog(self.order_service, self)
        if dialog.exec() == QDialog.DialogCode.Accepted:
            self._load_customers()
            if self.customer_combo.count() > 0:
                self.customer_combo.setCurrentIndex(self.customer_combo.count() - 1)

    def _create_order(self):
        try:
            customer_id = self.customer_combo.currentData()
            package_id = self.package_combo.currentData()
            photographer_id = self.photographer_combo.currentData()
            if not all([customer_id, package_id, photographer_id]):
                QMessageBox.warning(self, "提示", "请填写所有必填项")
                return

            order_id = self.order_service.create_order(
                customer_id=customer_id,
                package_id=package_id,
                photographer_id=photographer_id,
                appointment_date=self.date_edit.date().toString("yyyy-MM-dd"),
                appointment_time=self.time_edit.time().toString("HH:mm"),
                amount=self.amount_spin.value(),
                notes=self.notes_edit.toPlainText(),
            )
            self.order_created.emit(order_id)
            self.accept()
        except BusinessError as e:
            QMessageBox.warning(self, "业务错误", str(e))


class AddCustomerDialog(QDialog):
    def __init__(self, order_service: OrderService, parent=None):
        super().__init__(parent)
        self.order_service = order_service
        self.setWindowTitle("新增客户")
        self.setMinimumWidth(360)
        self._setup_ui()

    def _setup_ui(self):
        layout = QVBoxLayout(self)
        form = QFormLayout()

        self.name_input = QLineEdit()
        form.addRow("姓名*:", self.name_input)

        self.phone_input = QLineEdit()
        form.addRow("电话:", self.phone_input)

        self.email_input = QLineEdit()
        form.addRow("邮箱:", self.email_input)

        self.address_input = QLineEdit()
        form.addRow("地址:", self.address_input)

        layout.addLayout(form)

        btns = QDialogButtonBox(QDialogButtonBox.StandardButton.Ok | QDialogButtonBox.StandardButton.Cancel)
        btns.accepted.connect(self._accept)
        btns.rejected.connect(self.reject)
        layout.addWidget(btns)

    def _accept(self):
        name = self.name_input.text().strip()
        if not name:
            QMessageBox.warning(self, "提示", "客户姓名不能为空")
            return
        try:
            self.order_service.create_customer(
                name=name, phone=self.phone_input.text().strip(),
                email=self.email_input.text().strip(),
                address=self.address_input.text().strip()
            )
            self.accept()
        except BusinessError as e:
            QMessageBox.warning(self, "错误", str(e))


class DetailEditor(QWidget):
    order_changed = Signal()
    switch_to_tab = Signal(int)

    def __init__(self, order_service: OrderService,
                 file_index_service: FileIndexService,
                 thumbnail_service: ThumbnailService,
                 parent=None):
        super().__init__(parent)
        self.order_service = order_service
        self.file_index_service = file_index_service
        self.thumbnail_service = thumbnail_service
        self._current_order_id = None
        self._setup_ui()

    def _setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(6, 6, 6, 6)

        self.header_label = QLabel("请选择一个订单")
        self.header_label.setProperty("headerLabel", True)
        layout.addWidget(self.header_label)

        self.tabs = QTabWidget()
        layout.addWidget(self.tabs)

        self._setup_order_tab()
        self._setup_payment_tab()
        self._setup_after_sale_tab()
        self._setup_delivery_tab()

    def _setup_order_tab(self):
        tab = QWidget()
        layout = QVBoxLayout(tab)
        form = QFormLayout()

        self.order_no_label = QLabel("-")
        form.addRow("订单号:", self.order_no_label)

        self.customer_combo = QComboBox()
        self._load_customers()
        form.addRow("客户:", self.customer_combo)

        self.package_combo = QComboBox()
        self._load_packages()
        self.package_combo.currentIndexChanged.connect(self._on_package_changed)
        form.addRow("套餐:", self.package_combo)

        self.photographer_combo = QComboBox()
        self._load_photographers()
        form.addRow("摄影师:", self.photographer_combo)

        date_layout = QHBoxLayout()
        self.date_edit = QDateEdit()
        self.date_edit.setCalendarPopup(True)
        self.date_edit.setDisplayFormat("yyyy-MM-dd")
        self.time_edit = QTimeEdit()
        self.time_edit.setDisplayFormat("HH:mm")
        date_layout.addWidget(self.date_edit)
        date_layout.addWidget(QLabel("时间:"))
        date_layout.addWidget(self.time_edit)
        form.addRow("预约日期:", date_layout)

        self.amount_spin = QDoubleSpinBox()
        self.amount_spin.setRange(0, 999999)
        self.amount_spin.setDecimals(2)
        self.amount_spin.setPrefix("¥ ")
        form.addRow("订单金额:", self.amount_spin)

        self.order_status_combo = QComboBox()
        for s in ORDER_STATUSES:
            self.order_status_combo.addItem(s, s)
        form.addRow("订单状态:", self.order_status_combo)

        self.payment_status_label = QLabel("-")
        form.addRow("付款状态:", self.payment_status_label)

        self.paid_label = QLabel("-")
        form.addRow("已付金额:", self.paid_label)

        self.notes_edit = QTextEdit()
        self.notes_edit.setMaximumHeight(60)
        form.addRow("备注:", self.notes_edit)

        layout.addLayout(form)

        btn_layout = QHBoxLayout()
        btn_save = QPushButton("保存修改")
        btn_save.setProperty("btnType", "success")
        btn_save.clicked.connect(self._save_order)
        btn_delete = QPushButton("删除订单")
        btn_delete.setProperty("btnType", "danger")
        btn_delete.clicked.connect(self._delete_order)
        btn_layout.addStretch()
        btn_layout.addWidget(btn_save)
        btn_layout.addWidget(btn_delete)
        layout.addLayout(btn_layout)

        self.tabs.addTab(tab, "订单信息")

    def _setup_payment_tab(self):
        tab = QWidget()
        layout = QVBoxLayout(tab)

        add_layout = QHBoxLayout()
        self.pay_amount_spin = QDoubleSpinBox()
        self.pay_amount_spin.setRange(0.01, 999999)
        self.pay_amount_spin.setDecimals(2)
        self.pay_amount_spin.setPrefix("¥ ")
        self.pay_method_combo = QComboBox()
        self.pay_method_combo.addItems(["现金", "微信", "支付宝", "银行卡", "其他"])
        self.pay_date_edit = QDateEdit()
        self.pay_date_edit.setCalendarPopup(True)
        self.pay_date_edit.setDisplayFormat("yyyy-MM-dd")
        self.pay_date_edit.setDate(QDate.currentDate())
        self.pay_notes_input = QLineEdit()
        self.pay_notes_input.setPlaceholderText("备注")
        btn_add_pay = QPushButton("添加付款")
        btn_add_pay.setProperty("btnType", "success")
        btn_add_pay.clicked.connect(self._add_payment)
        add_layout.addWidget(QLabel("金额:"))
        add_layout.addWidget(self.pay_amount_spin)
        add_layout.addWidget(QLabel("方式:"))
        add_layout.addWidget(self.pay_method_combo)
        add_layout.addWidget(QLabel("日期:"))
        add_layout.addWidget(self.pay_date_edit)
        add_layout.addWidget(self.pay_notes_input)
        add_layout.addWidget(btn_add_pay)
        layout.addLayout(add_layout)

        self.payment_table = QTableWidget(0, 5)
        self.payment_table.setHorizontalHeaderLabels(["ID", "金额", "方式", "日期", "备注"])
        self.payment_table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        self.payment_table.setSelectionBehavior(QTableWidget.SelectionBehavior.SelectRows)
        self.payment_table.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)
        layout.addWidget(self.payment_table)

        self.tabs.addTab(tab, "付款记录")

    def _setup_after_sale_tab(self):
        tab = QWidget()
        layout = QVBoxLayout(tab)

        add_layout = QHBoxLayout()
        self.note_author_input = QLineEdit()
        self.note_author_input.setPlaceholderText("记录人")
        self.note_content_input = QLineEdit()
        self.note_content_input.setPlaceholderText("售后备注内容...")
        btn_add_note = QPushButton("添加备注")
        btn_add_note.setProperty("btnType", "success")
        btn_add_note.clicked.connect(self._add_after_sale_note)
        add_layout.addWidget(QLabel("记录人:"))
        add_layout.addWidget(self.note_author_input)
        add_layout.addWidget(self.note_content_input, 1)
        add_layout.addWidget(btn_add_note)
        layout.addLayout(add_layout)

        self.note_table = QTableWidget(0, 4)
        self.note_table.setHorizontalHeaderLabels(["ID", "时间", "记录人", "内容"])
        self.note_table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        self.note_table.setSelectionBehavior(QTableWidget.SelectionBehavior.SelectRows)
        self.note_table.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)
        layout.addWidget(self.note_table)

        self.tabs.addTab(tab, "售后备注")

    def _setup_delivery_tab(self):
        tab = QWidget()
        layout = QVBoxLayout(tab)

        btn_layout = QHBoxLayout()
        btn_add_file = QPushButton("添加交付文件")
        btn_add_file.setProperty("btnType", "success")
        btn_add_file.clicked.connect(self._add_delivery_file)
        btn_layout.addWidget(btn_add_file)
        btn_layout.addStretch()
        layout.addLayout(btn_layout)

        self.delivery_table = QTableWidget(0, 5)
        self.delivery_table.setHorizontalHeaderLabels(["ID", "文件名", "大小", "时间", "备注"])
        self.delivery_table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        self.delivery_table.setSelectionBehavior(QTableWidget.SelectionBehavior.SelectRows)
        self.delivery_table.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)
        layout.addWidget(self.delivery_table)

        self.tabs.addTab(tab, "交付文件")

    def _load_customers(self):
        self.customer_combo.clear()
        for c in self.order_service.get_all_customers():
            self.customer_combo.addItem(f"{c.name} ({c.phone})", c.id)

    def _load_packages(self):
        self.package_combo.clear()
        for p in self.order_service.get_all_packages():
            self.package_combo.addItem(f"{p.name} - ¥{p.price:.0f}", p.id)

    def _load_photographers(self):
        self.photographer_combo.clear()
        for p in self.order_service.get_active_photographers():
            self.photographer_combo.addItem(p.name, p.id)

    def _on_package_changed(self):
        pkg_id = self.package_combo.currentData()
        if pkg_id:
            pkg = self.order_service.db.fetch_one("packages", pkg_id)
            if pkg:
                self.amount_spin.setValue(pkg.price)

    def load_order(self, order_id: int):
        self._current_order_id = order_id
        order = self.order_service.get_order(order_id)
        if not order:
            self.header_label.setText("订单不存在")
            return

        self.header_label.setText(
            f"订单: {order.get('order_no', '')} | "
            f"客户: {order.get('customer_name', '')} | "
            f"状态: {order.get('order_status', '')}"
        )

        self.order_no_label.setText(order.get("order_no", "-"))

        for i in range(self.customer_combo.count()):
            if self.customer_combo.itemData(i) == order.get("customer_id"):
                self.customer_combo.setCurrentIndex(i)
                break

        for i in range(self.package_combo.count()):
            if self.package_combo.itemData(i) == order.get("package_id"):
                self.package_combo.setCurrentIndex(i)
                break

        for i in range(self.photographer_combo.count()):
            if self.photographer_combo.itemData(i) == order.get("photographer_id"):
                self.photographer_combo.setCurrentIndex(i)
                break

        appt_date = order.get("appointment_date", "")
        if appt_date:
            parts = appt_date.split("-")
            if len(parts) == 3:
                self.date_edit.setDate(QDate(int(parts[0]), int(parts[1]), int(parts[2])))

        appt_time = order.get("appointment_time", "")
        if appt_time:
            parts = appt_time.split(":")
            if len(parts) >= 2:
                self.time_edit.setTime(QTime(int(parts[0]), int(parts[1])))

        self.amount_spin.setValue(order.get("amount", 0))

        status = order.get("order_status", "")
        idx = self.order_status_combo.findData(status)
        if idx >= 0:
            self.order_status_combo.setCurrentIndex(idx)

        self.payment_status_label.setText(order.get("payment_status", "-"))
        self.paid_label.setText(f"¥{order.get('paid_amount', 0):.2f}")
        self.notes_edit.setPlainText(order.get("notes", ""))

        self._load_payments(order_id)
        self._load_after_sale_notes(order_id)
        self._load_delivery_files(order_id)

    def _load_payments(self, order_id: int):
        payments = self.order_service.get_payments(order_id)
        self.payment_table.setRowCount(len(payments))
        for i, p in enumerate(payments):
            self.payment_table.setItem(i, 0, QTableWidgetItem(str(p.id)))
            self.payment_table.setItem(i, 1, QTableWidgetItem(f"¥{p.amount:.2f}"))
            self.payment_table.setItem(i, 2, QTableWidgetItem(p.method))
            self.payment_table.setItem(i, 3, QTableWidgetItem(p.payment_date))
            self.payment_table.setItem(i, 4, QTableWidgetItem(p.notes))

    def _load_after_sale_notes(self, order_id: int):
        notes = self.order_service.get_after_sale_notes(order_id)
        self.note_table.setRowCount(len(notes))
        for i, n in enumerate(notes):
            self.note_table.setItem(i, 0, QTableWidgetItem(str(n.id)))
            self.note_table.setItem(i, 1, QTableWidgetItem(n.created_at or ""))
            self.note_table.setItem(i, 2, QTableWidgetItem(n.author))
            self.note_table.setItem(i, 3, QTableWidgetItem(n.content))

    def _load_delivery_files(self, order_id: int):
        files = self.order_service.get_delivery_files(order_id)
        self.delivery_table.setRowCount(len(files))
        for i, f in enumerate(files):
            self.delivery_table.setItem(i, 0, QTableWidgetItem(str(f.id)))
            self.delivery_table.setItem(i, 1, QTableWidgetItem(f.file_name))
            self.delivery_table.setItem(i, 2, QTableWidgetItem(f"{f.file_size / 1024:.1f}KB" if f.file_size else ""))
            self.delivery_table.setItem(i, 3, QTableWidgetItem(f.delivered_at or ""))
            self.delivery_table.setItem(i, 4, QTableWidgetItem(f.notes))

    def _save_order(self):
        if not self._current_order_id:
            return
        try:
            data = {
                "customer_id": self.customer_combo.currentData(),
                "package_id": self.package_combo.currentData(),
                "photographer_id": self.photographer_combo.currentData(),
                "appointment_date": self.date_edit.date().toString("yyyy-MM-dd"),
                "appointment_time": self.time_edit.time().toString("HH:mm"),
                "amount": self.amount_spin.value(),
                "order_status": self.order_status_combo.currentData(),
                "notes": self.notes_edit.toPlainText().strip(),
            }
            self.order_service.update_order(self._current_order_id, data)
            self.order_changed.emit()
            QMessageBox.information(self, "提示", "订单已保存")
        except BusinessError as e:
            QMessageBox.warning(self, "业务错误", str(e))

    def _delete_order(self):
        if not self._current_order_id:
            return
        reply = QMessageBox.question(self, "确认删除",
                                     "确定要删除此订单吗？删除后可从回收站恢复。",
                                     QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No)
        if reply == QMessageBox.StandardButton.Yes:
            self.order_service.delete_order(self._current_order_id, "操作员")
            self.order_changed.emit()
            self._current_order_id = None
            self.header_label.setText("订单已删除")

    def _add_payment(self):
        if not self._current_order_id:
            return
        try:
            self.order_service.add_payment(
                order_id=self._current_order_id,
                amount=self.pay_amount_spin.value(),
                method=self.pay_method_combo.currentText(),
                payment_date=self.pay_date_edit.date().toString("yyyy-MM-dd"),
                notes=self.pay_notes_input.text().strip(),
            )
            self._load_payments(self._current_order_id)
            order = self.order_service.get_order(self._current_order_id)
            if order:
                self.payment_status_label.setText(order.get("payment_status", ""))
                self.paid_label.setText(f"¥{order.get('paid_amount', 0):.2f}")
            self.pay_amount_spin.setValue(0.01)
            self.pay_notes_input.clear()
            self.order_changed.emit()
        except BusinessError as e:
            QMessageBox.warning(self, "错误", str(e))

    def _add_after_sale_note(self):
        if not self._current_order_id:
            return
        content = self.note_content_input.text().strip()
        if not content:
            QMessageBox.warning(self, "提示", "备注内容不能为空")
            return
        self.order_service.add_after_sale_note(
            order_id=self._current_order_id,
            content=content,
            author=self.note_author_input.text().strip(),
        )
        self._load_after_sale_notes(self._current_order_id)
        self.note_content_input.clear()

    def _add_delivery_file(self):
        if not self._current_order_id:
            return
        file_paths, _ = QFileDialog.getOpenFileNames(self, "选择交付文件")
        if not file_paths:
            return
        import os
        for fp in file_paths:
            try:
                self.order_service.add_delivery_file(
                    order_id=self._current_order_id,
                    file_path=fp,
                    file_name=os.path.basename(fp),
                    file_size=os.path.getsize(fp) if os.path.exists(fp) else 0,
                )
            except BusinessError as e:
                QMessageBox.warning(self, "错误", str(e))
        self._load_delivery_files(self._current_order_id)
