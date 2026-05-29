from PySide6.QtWidgets import QWidget, QVBoxLayout, QCalendarWidget, QListWidget, QListWidgetItem, QLabel
from PySide6.QtCore import Signal, Qt, QDate
from PySide6.QtGui import QTextCharFormat, QColor, QBrush


class CalendarWidget(QWidget):
    date_selected = Signal(str)
    appointment_clicked = Signal(int)

    def __init__(self, parent=None):
        super().__init__(parent)
        self._appointments = {}
        self._setup_ui()

    def _setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(6, 6, 6, 6)
        layout.setSpacing(6)

        title = QLabel("预约日历")
        title.setProperty("headerLabel", True)
        layout.addWidget(title)

        self.calendar = QCalendarWidget()
        self.calendar.setGridVisible(True)
        self.calendar.clicked.connect(self._on_date_clicked)
        self.calendar.currentPageChanged.connect(self._on_page_changed)
        layout.addWidget(self.calendar)

        self.day_list = QListWidget()
        self.day_list.setMaximumHeight(200)
        self.day_list.itemDoubleClicked.connect(self._on_item_double_clicked)
        layout.addWidget(QLabel("当日预约:"))
        layout.addWidget(self.day_list)

    def load_appointments(self, appointments: list):
        self._appointments = {}
        for a in appointments:
            date_str = a.get("appointment_date", "")
            if date_str:
                if date_str not in self._appointments:
                    self._appointments[date_str] = []
                self._appointments[date_str].append(a)
        self._highlight_dates()

    def _highlight_dates(self):
        fmt_default = QTextCharFormat()
        self.calendar.setDateTextFormat(QDate(), fmt_default)

        fmt_has_appt = QTextCharFormat()
        fmt_has_appt.setBackground(QBrush(QColor("#d5f5e3")))
        fmt_has_appt.setFontWeight(700)

        for date_str in self._appointments:
            parts = date_str.split("-")
            if len(parts) == 3:
                qdate = QDate(int(parts[0]), int(parts[1]), int(parts[2]))
                self.calendar.setDateTextFormat(qdate, fmt_has_appt)

    def _on_date_clicked(self, qdate: QDate):
        date_str = qdate.toString("yyyy-MM-dd")
        self.date_selected.emit(date_str)
        self._show_day_appointments(date_str)

    def _on_page_changed(self, year, month):
        pass

    def _show_day_appointments(self, date_str: str):
        self.day_list.clear()
        appts = self._appointments.get(date_str, [])
        if not appts:
            item = QListWidgetItem("当日无预约")
            item.setFlags(item.flags() & ~Qt.ItemFlag.ItemIsEnabled)
            self.day_list.addItem(item)
            return
        for a in appts:
            text = (f"{a.get('appointment_time', '')} | "
                    f"{a.get('customer_name', '')} | "
                    f"{a.get('photographer_name', '')} | "
                    f"{a.get('package_name', '')} | "
                    f"{a.get('order_status', '')}")
            item = QListWidgetItem(text)
            item.setData(Qt.ItemDataRole.UserRole, a.get("id"))
            self.day_list.addItem(item)

    def _on_item_double_clicked(self, item):
        order_id = item.data(Qt.ItemDataRole.UserRole)
        if order_id:
            self.appointment_clicked.emit(order_id)
