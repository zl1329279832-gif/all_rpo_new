import sqlite3
import json
import logging
from typing import Optional, List, Any
from database.models import (
    Customer, Package, Photographer, Order, Photo,
    DeliveryFile, Payment, AfterSaleNote, DeletedRecord
)
from utils import DB_PATH

logger = logging.getLogger(__name__)


class DatabaseManager:
    def __init__(self, db_path=None):
        self.db_path = str(db_path or DB_PATH)
        self.conn = None
        self.connect()
        self.create_tables()

    def connect(self):
        self.conn = sqlite3.connect(self.db_path, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        self.conn.execute("PRAGMA journal_mode=WAL")
        self.conn.execute("PRAGMA foreign_keys=ON")

    def create_tables(self):
        cursor = self.conn.cursor()
        cursor.executescript("""
            CREATE TABLE IF NOT EXISTS customers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                phone TEXT DEFAULT '',
                email TEXT DEFAULT '',
                address TEXT DEFAULT '',
                notes TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS packages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT DEFAULT '',
                price REAL DEFAULT 0.0,
                photo_count INTEGER DEFAULT 0,
                retouch_count INTEGER DEFAULT 0,
                duration_hours REAL DEFAULT 2.0
            );

            CREATE TABLE IF NOT EXISTS photographers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                phone TEXT DEFAULT '',
                specialty TEXT DEFAULT '',
                active INTEGER DEFAULT 1
            );

            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_no TEXT UNIQUE NOT NULL,
                customer_id INTEGER NOT NULL,
                package_id INTEGER NOT NULL,
                photographer_id INTEGER NOT NULL,
                appointment_date TEXT DEFAULT '',
                appointment_time TEXT DEFAULT '',
                amount REAL DEFAULT 0.0,
                paid_amount REAL DEFAULT 0.0,
                order_status TEXT DEFAULT '待拍摄',
                payment_status TEXT DEFAULT '未付款',
                notes TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(id),
                FOREIGN KEY (package_id) REFERENCES packages(id),
                FOREIGN KEY (photographer_id) REFERENCES photographers(id)
            );

            CREATE TABLE IF NOT EXISTS photos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                file_path TEXT NOT NULL,
                file_hash TEXT NOT NULL,
                thumbnail_path TEXT DEFAULT '',
                selected INTEGER DEFAULT 0,
                retouch_status TEXT DEFAULT '待精修',
                retouch_notes TEXT DEFAULT '',
                original_filename TEXT DEFAULT '',
                file_size INTEGER DEFAULT 0,
                imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
            );

            CREATE UNIQUE INDEX IF NOT EXISTS idx_photos_hash ON photos(file_hash, order_id);

            CREATE TABLE IF NOT EXISTS delivery_files (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                file_path TEXT NOT NULL,
                file_name TEXT DEFAULT '',
                file_size INTEGER DEFAULT 0,
                delivered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                notes TEXT DEFAULT '',
                FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                amount REAL NOT NULL,
                method TEXT DEFAULT '',
                payment_date TEXT DEFAULT '',
                notes TEXT DEFAULT '',
                FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS after_sale_notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                author TEXT DEFAULT '',
                FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS deleted_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                table_name TEXT NOT NULL,
                record_id INTEGER NOT NULL,
                record_data TEXT NOT NULL,
                deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                deleted_by TEXT DEFAULT '',
                restored INTEGER DEFAULT 0
            );
        """)
        self.conn.commit()

    def _row_to_model(self, table: str, row: sqlite3.Row):
        mapping = {
            "customers": Customer,
            "packages": Package,
            "photographers": Photographer,
            "orders": Order,
            "photos": Photo,
            "delivery_files": DeliveryFile,
            "payments": Payment,
            "after_sale_notes": AfterSaleNote,
            "deleted_records": DeletedRecord,
        }
        cls = mapping.get(table)
        if not cls or not row:
            return None
        d = dict(row)
        return cls(**d)

    def insert(self, table: str, data: dict) -> int:
        cols = ", ".join(data.keys())
        placeholders = ", ".join(["?"] * len(data))
        sql = f"INSERT INTO {table} ({cols}) VALUES ({placeholders})"
        cursor = self.conn.cursor()
        cursor.execute(sql, list(data.values()))
        self.conn.commit()
        return cursor.lastrowid

    def update(self, table: str, record_id: int, data: dict) -> bool:
        sets = ", ".join([f"{k}=?" for k in data.keys()])
        sql = f"UPDATE {table} SET {sets} WHERE id=?"
        params = list(data.values()) + [record_id]
        cursor = self.conn.cursor()
        cursor.execute(sql, params)
        self.conn.commit()
        return cursor.rowcount > 0

    def delete(self, table: str, record_id: int) -> bool:
        sql = f"DELETE FROM {table} WHERE id=?"
        cursor = self.conn.cursor()
        cursor.execute(sql, (record_id,))
        self.conn.commit()
        return cursor.rowcount > 0

    def fetch_one(self, table: str, record_id: int):
        sql = f"SELECT * FROM {table} WHERE id=?"
        cursor = self.conn.cursor()
        cursor.execute(sql, (record_id,))
        row = cursor.fetchone()
        return self._row_to_model(table, row)

    def fetch_all(self, table: str, where: str = "", params: tuple = (), order_by: str = "id DESC"):
        sql = f"SELECT * FROM {table}"
        if where:
            sql += f" WHERE {where}"
        sql += f" ORDER BY {order_by}"
        cursor = self.conn.cursor()
        cursor.execute(sql, params)
        return [self._row_to_model(table, row) for row in cursor.fetchall()]

    def fetch_by_sql(self, sql: str, params: tuple = ()):
        cursor = self.conn.cursor()
        cursor.execute(sql, params)
        return [dict(row) for row in cursor.fetchall()]

    def soft_delete(self, table: str, record_id: int, deleted_by: str = "") -> bool:
        record = self.fetch_one(table, record_id)
        if not record:
            return False
        record_data = json.dumps(dict(record.__dict__), ensure_ascii=False, default=str)
        self.insert("deleted_records", {
            "table_name": table,
            "record_id": record_id,
            "record_data": record_data,
            "deleted_by": deleted_by,
        })
        return self.delete(table, record_id)

    def restore_deleted(self, deleted_id: int) -> bool:
        record = self.fetch_one("deleted_records", deleted_id)
        if not record or record.restored:
            return False
        data = json.loads(record.record_data)
        data.pop("id", None)
        data.pop("deleted_at", None)
        data.pop("deleted_by", None)
        new_id = self.insert(record.table_name, data)
        self.update("deleted_records", deleted_id, {"restored": 1, "record_id": new_id})
        return True

    def check_photographer_conflict(self, photographer_id: int, appointment_date: str,
                                     appointment_time: str, exclude_order_id: int = 0) -> bool:
        sql = """SELECT COUNT(*) as cnt FROM orders
                 WHERE photographer_id=? AND appointment_date=? AND appointment_time=?
                 AND order_status NOT IN ('已取消')
                 AND id != ?"""
        result = self.fetch_by_sql(sql, (photographer_id, appointment_date, appointment_time, exclude_order_id))
        return result[0]["cnt"] > 0 if result else False

    def check_duplicate_photo(self, file_hash: str, order_id: int) -> bool:
        sql = "SELECT COUNT(*) as cnt FROM photos WHERE file_hash=? AND order_id=?"
        result = self.fetch_by_sql(sql, (file_hash, order_id))
        return result[0]["cnt"] > 0 if result else False

    def get_order_with_details(self, order_id: int) -> Optional[dict]:
        sql = """
            SELECT o.*, c.name as customer_name, c.phone as customer_phone,
                   p.name as package_name, p.price as package_price,
                   ph.name as photographer_name
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.id
            LEFT JOIN packages p ON o.package_id = p.id
            LEFT JOIN photographers ph ON o.photographer_id = ph.id
            WHERE o.id=?
        """
        result = self.fetch_by_sql(sql, (order_id,))
        return result[0] if result else None

    def search_orders(self, keyword: str = "", status: str = "",
                      date_from: str = "", date_to: str = "",
                      photographer_id: int = 0) -> List[dict]:
        conditions = []
        params = []
        if keyword:
            conditions.append("(o.order_no LIKE ? OR c.name LIKE ? OR c.phone LIKE ?)")
            kw = f"%{keyword}%"
            params.extend([kw, kw, kw])
        if status:
            conditions.append("o.order_status = ?")
            params.append(status)
        if date_from:
            conditions.append("o.appointment_date >= ?")
            params.append(date_from)
        if date_to:
            conditions.append("o.appointment_date <= ?")
            params.append(date_to)
        if photographer_id:
            conditions.append("o.photographer_id = ?")
            params.append(photographer_id)
        where = " AND ".join(conditions) if conditions else "1=1"
        sql = f"""
            SELECT o.*, c.name as customer_name, c.phone as customer_phone,
                   p.name as package_name, ph.name as photographer_name
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.id
            LEFT JOIN packages p ON o.package_id = p.id
            LEFT JOIN photographers ph ON o.photographer_id = ph.id
            WHERE {where}
            ORDER BY o.created_at DESC
        """
        return self.fetch_by_sql(sql, tuple(params))

    def close(self):
        if self.conn:
            self.conn.close()
