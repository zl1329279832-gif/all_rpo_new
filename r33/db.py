import sqlite3
from datetime import datetime
from typing import Optional, List, Tuple


class Database:
    def __init__(self, db_path: str = "notes.db"):
        self.db_path = db_path
        self._create_table()
        self._migrate()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _create_table(self) -> None:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS notes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    content TEXT,
                    plain_content TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
                """
            )
            conn.commit()

    def _migrate(self) -> None:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            try:
                cursor.execute("SELECT plain_content FROM notes LIMIT 1")
            except sqlite3.OperationalError:
                cursor.execute("ALTER TABLE notes ADD COLUMN plain_content TEXT")
                conn.commit()

    def create_note(self, title: str, content: str, plain_content: str = "") -> int:
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO notes (title, content, plain_content, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
                (title, content, plain_content, now, now)
            )
            conn.commit()
            return cursor.lastrowid

    def get_note(self, note_id: int) -> Optional[sqlite3.Row]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM notes WHERE id = ?", (note_id,))
            return cursor.fetchone()

    def get_all_notes(self) -> List[sqlite3.Row]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id, title, content, updated_at FROM notes ORDER BY updated_at DESC")
            return cursor.fetchall()

    def search_notes(self, keyword: str) -> List[sqlite3.Row]:
        keyword = f"%{keyword}%"
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT id, title, content, updated_at FROM notes WHERE title LIKE ? OR plain_content LIKE ? ORDER BY updated_at DESC",
                (keyword, keyword)
            )
            return cursor.fetchall()

    def update_note(self, note_id: int, title: str, content: str, plain_content: str = "") -> bool:
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE notes SET title = ?, content = ?, plain_content = ?, updated_at = ? WHERE id = ?",
                (title, content, plain_content, now, note_id)
            )
            conn.commit()
            return cursor.rowcount > 0

    def delete_note(self, note_id: int) -> bool:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM notes WHERE id = ?", (note_id,))
            conn.commit()
            return cursor.rowcount > 0
