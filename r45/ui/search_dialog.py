from PySide6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QFormLayout, QLineEdit,
    QComboBox, QDateEdit, QPushButton, QLabel, QGroupBox, QMessageBox
)
from PySide6.QtCore import Qt, QDate, Signal


class SearchDialog(QDialog):
    search_requested = Signal(dict)

    def __init__(self, photographers: list, parent=None):
        super().__init__(parent)
        self.setWindowTitle("条件搜索")
        self.setMinimumWidth(420)
        self._photographers = photographers
        self._setup_ui()

    def _setup_ui(self):
        layout = QVBoxLayout(self)

        form_group = QGroupBox("搜索条件")
        form = QFormLayout(form_group)

        self.keyword_input = QLineEdit()
        self.keyword_input.setPlaceholderText("订单号、客户名或电话")
        form.addRow("关键词:", self.keyword_input)

        self.status_combo = QComboBox()
        self.status_combo.addItem("全部", "")
        for s in ["待拍摄", "拍摄中", "选片中", "精修中", "交付中", "已完成", "已取消"]:
            self.status_combo.addItem(s, s)
        form.addRow("订单状态:", self.status_combo)

        self.photographer_combo = QComboBox()
        self.photographer_combo.addItem("全部", 0)
        for p in self._photographers:
            self.photographer_combo.addItem(p.name, p.id)
        form.addRow("摄影师:", self.photographer_combo)

        self.date_from = QDateEdit()
        self.date_from.setCalendarPopup(True)
        self.date_from.setDisplayFormat("yyyy-MM-dd")
        self.date_from.setSpecialValueText("不限")
        self.date_from.setDate(QDate(2000, 1, 1))
        form.addRow("预约起始:", self.date_from)

        self.date_to = QDateEdit()
        self.date_to.setCalendarPopup(True)
        self.date_to.setDisplayFormat("yyyy-MM-dd")
        self.date_to.setSpecialValueText("不限")
        self.date_to.setDate(QDate.currentDate().addYears(1))
        form.addRow("预约截止:", self.date_to)

        layout.addWidget(form_group)

        btn_layout = QHBoxLayout()
        btn_search = QPushButton("搜索")
        btn_search.setProperty("btnType", "success")
        btn_search.clicked.connect(self._do_search)
        btn_reset = QPushButton("重置")
        btn_reset.setProperty("btnType", "secondary")
        btn_reset.clicked.connect(self._reset)
        btn_cancel = QPushButton("取消")
        btn_cancel.setProperty("btnType", "secondary")
        btn_cancel.clicked.connect(self.reject)
        btn_layout.addStretch()
        btn_layout.addWidget(btn_search)
        btn_layout.addWidget(btn_reset)
        btn_layout.addWidget(btn_cancel)
        layout.addLayout(btn_layout)

    def _do_search(self):
        date_from = self.date_from.date().toString("yyyy-MM-dd")
        date_to = self.date_to.date().toString("yyyy-MM-dd")
        params = {
            "keyword": self.keyword_input.text().strip(),
            "status": self.status_combo.currentData() or "",
            "photographer_id": self.photographer_combo.currentData() or 0,
            "date_from": date_from if self.date_from.date().year() > 2000 else "",
            "date_to": date_to if self.date_to.date().year() < 2100 else "",
        }
        self.search_requested.emit(params)
        self.accept()

    def _reset(self):
        self.keyword_input.clear()
        self.status_combo.setCurrentIndex(0)
        self.photographer_combo.setCurrentIndex(0)
        self.date_from.setDate(QDate(2000, 1, 1))
        self.date_to.setDate(QDate.currentDate().addYears(1))
