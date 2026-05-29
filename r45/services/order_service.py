import logging
from datetime import datetime
from typing import Optional, List
from database.db_manager import DatabaseManager
from utils import (
    ORDER_STATUS_COMPLETED, PAYMENT_STATUS_PAID, PAYMENT_STATUS_UNPAID,
    PAYMENT_STATUS_PARTIAL, RETOUCH_STATUSES, ORDER_STATUSES, PAYMENT_STATUSES
)

logger = logging.getLogger(__name__)


class BusinessError(Exception):
    pass


class OrderService:
    def __init__(self, db: DatabaseManager):
        self.db = db

    def create_customer(self, name: str, phone: str = "", email: str = "",
                        address: str = "", notes: str = "") -> int:
        if not name.strip():
            raise BusinessError("客户姓名不能为空")
        return self.db.insert("customers", {
            "name": name.strip(), "phone": phone.strip(),
            "email": email.strip(), "address": address.strip(), "notes": notes.strip()
        })

    def update_customer(self, customer_id: int, data: dict) -> bool:
        if "name" in data and not data["name"].strip():
            raise BusinessError("客户姓名不能为空")
        return self.db.update("customers", customer_id, data)

    def get_all_customers(self):
        return self.db.fetch_all("customers", order_by="name ASC")

    def create_package(self, name: str, description: str = "", price: float = 0.0,
                       photo_count: int = 0, retouch_count: int = 0,
                       duration_hours: float = 2.0) -> int:
        if not name.strip():
            raise BusinessError("套餐名称不能为空")
        return self.db.insert("packages", {
            "name": name.strip(), "description": description.strip(),
            "price": price, "photo_count": photo_count,
            "retouch_count": retouch_count, "duration_hours": duration_hours
        })

    def update_package(self, package_id: int, data: dict) -> bool:
        return self.db.update("packages", package_id, data)

    def get_all_packages(self):
        return self.db.fetch_all("packages", order_by="name ASC")

    def create_photographer(self, name: str, phone: str = "",
                             specialty: str = "") -> int:
        if not name.strip():
            raise BusinessError("摄影师姓名不能为空")
        return self.db.insert("photographers", {
            "name": name.strip(), "phone": phone.strip(),
            "specialty": specialty.strip()
        })

    def update_photographer(self, photographer_id: int, data: dict) -> bool:
        return self.db.update("photographers", photographer_id, data)

    def get_active_photographers(self):
        return self.db.fetch_all("photographers", where="active=1", order_by="name ASC")

    def get_all_photographers(self):
        return self.db.fetch_all("photographers", order_by="name ASC")

    def generate_order_no(self) -> str:
        today = datetime.now().strftime("%Y%m%d")
        prefix = f"ORD{today}"
        sql = "SELECT COUNT(*) as cnt FROM orders WHERE order_no LIKE ?"
        result = self.db.fetch_by_sql(sql, (f"{prefix}%",))
        seq = (result[0]["cnt"] + 1) if result else 1
        return f"{prefix}{seq:03d}"

    def create_order(self, customer_id: int, package_id: int, photographer_id: int,
                     appointment_date: str, appointment_time: str,
                     amount: float, notes: str = "") -> int:
        if not customer_id or not package_id or not photographer_id:
            raise BusinessError("客户、套餐和摄影师不能为空")
        if not appointment_date:
            raise BusinessError("预约日期不能为空")

        if self.db.check_photographer_conflict(photographer_id, appointment_date, appointment_time):
            raise BusinessError(f"摄影师在该时段已有预约，存在档期冲突")

        package = self.db.fetch_one("packages", package_id)
        order_no = self.generate_order_no()

        return self.db.insert("orders", {
            "order_no": order_no,
            "customer_id": customer_id,
            "package_id": package_id,
            "photographer_id": photographer_id,
            "appointment_date": appointment_date,
            "appointment_time": appointment_time,
            "amount": amount,
            "paid_amount": 0.0,
            "order_status": "待拍摄",
            "payment_status": PAYMENT_STATUS_UNPAID,
            "notes": notes.strip()
        })

    def update_order(self, order_id: int, data: dict) -> bool:
        order = self.db.fetch_one("orders", order_id)
        if not order:
            raise BusinessError("订单不存在")

        if "photographer_id" in data and "appointment_date" in data and "appointment_time" in data:
            if self.db.check_photographer_conflict(
                data["photographer_id"], data["appointment_date"],
                data["appointment_time"], exclude_order_id=order_id
            ):
                raise BusinessError("摄影师在该时段已有预约，存在档期冲突")

        if "order_status" in data:
            new_status = data["order_status"]
            if new_status == ORDER_STATUS_COMPLETED:
                if order.payment_status != PAYMENT_STATUS_PAID:
                    raise BusinessError("未结清订单不能标记为已完成，请先完成付款")

        data["updated_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        return self.db.update("orders", order_id, data)

    def delete_order(self, order_id: int, deleted_by: str = "") -> bool:
        return self.db.soft_delete("orders", order_id, deleted_by)

    def get_order(self, order_id: int) -> Optional[dict]:
        return self.db.get_order_with_details(order_id)

    def get_all_orders(self) -> List[dict]:
        return self.db.search_orders()

    def search_orders(self, **kwargs) -> List[dict]:
        return self.db.search_orders(**kwargs)

    def add_payment(self, order_id: int, amount: float, method: str = "",
                    payment_date: str = "", notes: str = "") -> int:
        order = self.db.fetch_one("orders", order_id)
        if not order:
            raise BusinessError("订单不存在")
        if amount <= 0:
            raise BusinessError("付款金额必须大于0")

        payment_id = self.db.insert("payments", {
            "order_id": order_id, "amount": amount,
            "method": method, "payment_date": payment_date or datetime.now().strftime("%Y-%m-%d"),
            "notes": notes
        })

        new_paid = order.paid_amount + amount
        new_payment_status = PAYMENT_STATUS_PAID if new_paid >= order.amount else PAYMENT_STATUS_PARTIAL
        self.db.update("orders", order_id, {
            "paid_amount": new_paid,
            "payment_status": new_payment_status,
            "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        })
        return payment_id

    def get_payments(self, order_id: int):
        return self.db.fetch_all("payments", where="order_id=?", params=(order_id,), order_by="payment_date DESC")

    def add_after_sale_note(self, order_id: int, content: str, author: str = "") -> int:
        if not content.strip():
            raise BusinessError("备注内容不能为空")
        return self.db.insert("after_sale_notes", {
            "order_id": order_id, "content": content.strip(), "author": author.strip()
        })

    def get_after_sale_notes(self, order_id: int):
        return self.db.fetch_all("after_sale_notes", where="order_id=?", params=(order_id,), order_by="created_at DESC")

    def toggle_photo_selected(self, photo_id: int, selected: int) -> bool:
        return self.db.update("photos", photo_id, {"selected": selected})

    def update_photo_retouch(self, photo_id: int, retouch_status: str, retouch_notes: str = "") -> bool:
        if retouch_status not in RETOUCH_STATUSES:
            raise BusinessError(f"无效的精修状态: {retouch_status}")
        return self.db.update("photos", photo_id, {
            "retouch_status": retouch_status, "retouch_notes": retouch_notes
        })

    def add_delivery_file(self, order_id: int, file_path: str, file_name: str,
                          file_size: int = 0, notes: str = "") -> int:
        order = self.db.fetch_one("orders", order_id)
        if not order:
            raise BusinessError("订单不存在")
        return self.db.insert("delivery_files", {
            "order_id": order_id, "file_path": file_path,
            "file_name": file_name, "file_size": file_size, "notes": notes
        })

    def get_delivery_files(self, order_id: int):
        return self.db.fetch_all("delivery_files", where="order_id=?", params=(order_id,))

    def delete_delivery_file(self, file_id: int) -> bool:
        return self.db.soft_delete("delivery_files", file_id)

    def get_deleted_records(self, table_name: str = ""):
        if table_name:
            return self.db.fetch_all("deleted_records", where="table_name=? AND restored=0",
                                     params=(table_name,), order_by="deleted_at DESC")
        return self.db.fetch_all("deleted_records", where="restored=0", order_by="deleted_at DESC")

    def restore_record(self, deleted_id: int) -> bool:
        return self.db.restore_deleted(deleted_id)

    def get_appointments_by_date(self, date_str: str) -> List[dict]:
        sql = """
            SELECT o.id, o.order_no, o.appointment_date, o.appointment_time,
                   o.order_status, c.name as customer_name, ph.name as photographer_name,
                   p.name as package_name
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.id
            LEFT JOIN photographers ph ON o.photographer_id = ph.id
            LEFT JOIN packages p ON o.package_id = p.id
            WHERE o.appointment_date=? AND o.order_status NOT IN ('已取消')
            ORDER BY o.appointment_time
        """
        return self.db.fetch_by_sql(sql, (date_str,))

    def get_order_statistics(self) -> dict:
        sql = """SELECT order_status, COUNT(*) as cnt, SUM(amount) as total_amount,
                 SUM(paid_amount) as total_paid FROM orders GROUP BY order_status"""
        rows = self.db.fetch_by_sql(sql)
        stats = {}
        for r in rows:
            stats[r["order_status"]] = {
                "count": r["cnt"],
                "amount": r["total_amount"] or 0,
                "paid": r["total_paid"] or 0
            }
        return stats
