import sqlite3
from contextlib import contextmanager
from datetime import datetime
from typing import List, Optional, Tuple

from .config import DB_PATH, ensure_app_data_dir


class DatabaseManager:
    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path or DB_PATH
        ensure_app_data_dir()
        self.init_database()

    @contextmanager
    def get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
        finally:
            conn.close()

    def init_database(self):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS tags (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL UNIQUE,
                    color TEXT DEFAULT '#3498db',
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
            ''')
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS cards (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    content TEXT NOT NULL,
                    is_favorite INTEGER DEFAULT 0,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
            ''')
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS card_tags (
                    card_id INTEGER NOT NULL,
                    tag_id INTEGER NOT NULL,
                    PRIMARY KEY (card_id, tag_id),
                    FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
                    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
                )
            ''')
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS recent_views (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    card_id INTEGER NOT NULL,
                    viewed_at TEXT NOT NULL,
                    FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
                )
            ''')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_cards_title ON cards(title)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_cards_content ON cards(content)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_cards_favorite ON cards(is_favorite)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_recent_views_card ON recent_views(card_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_recent_views_time ON recent_views(viewed_at)')
            conn.commit()

    def get_timestamp(self) -> str:
        return datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    def create_tag(self, name: str, color: str = '#3498db') -> int:
        timestamp = self.get_timestamp()
        with self.get_connection() as conn:
            cursor = conn.cursor()
            try:
                cursor.execute(
                    'INSERT INTO tags (name, color, created_at, updated_at) VALUES (?, ?, ?, ?)',
                    (name, color, timestamp, timestamp)
                )
                conn.commit()
                return cursor.lastrowid
            except sqlite3.IntegrityError:
                cursor.execute('SELECT id FROM tags WHERE name = ?', (name,))
                return cursor.fetchone()['id']

    def get_all_tags(self) -> List[dict]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM tags ORDER BY name')
            return [dict(row) for row in cursor.fetchall()]

    def get_tag_by_id(self, tag_id: int) -> Optional[dict]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM tags WHERE id = ?', (tag_id,))
            row = cursor.fetchone()
            return dict(row) if row else None

    def update_tag(self, tag_id: int, name: str, color: str) -> bool:
        timestamp = self.get_timestamp()
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                'UPDATE tags SET name = ?, color = ?, updated_at = ? WHERE id = ?',
                (name, color, timestamp, tag_id)
            )
            conn.commit()
            return cursor.rowcount > 0

    def delete_tag(self, tag_id: int) -> bool:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('DELETE FROM tags WHERE id = ?', (tag_id,))
            conn.commit()
            return cursor.rowcount > 0

    def get_tag_card_count(self, tag_id: int) -> int:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                'SELECT COUNT(*) as count FROM card_tags WHERE tag_id = ?',
                (tag_id,)
            )
            return cursor.fetchone()['count']

    def create_card(self, title: str, content: str, tag_ids: List[int] = None) -> int:
        timestamp = self.get_timestamp()
        tag_ids = tag_ids or []
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                'INSERT INTO cards (title, content, created_at, updated_at) VALUES (?, ?, ?, ?)',
                (title, content, timestamp, timestamp)
            )
            card_id = cursor.lastrowid
            for tag_id in tag_ids:
                cursor.execute(
                    'INSERT OR IGNORE INTO card_tags (card_id, tag_id) VALUES (?, ?)',
                    (card_id, tag_id)
                )
            conn.commit()
            return card_id

    def get_all_cards(self, tag_filter: Optional[int] = None, search_query: Optional[str] = None,
                      favorite_only: bool = False, recent_only: bool = False,
                      recent_limit: int = 10) -> List[dict]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            query_parts = ['SELECT DISTINCT c.* FROM cards c']
            params = []

            if tag_filter is not None:
                query_parts.append('JOIN card_tags ct ON c.id = ct.card_id')

            if recent_only:
                query_parts.append('JOIN recent_views rv ON c.id = rv.card_id')

            conditions = []
            if tag_filter is not None:
                conditions.append('ct.tag_id = ?')
                params.append(tag_filter)

            if search_query:
                conditions.append('(c.title LIKE ? OR c.content LIKE ?)')
                like_query = f'%{search_query}%'
                params.extend([like_query, like_query])

            if favorite_only:
                conditions.append('c.is_favorite = 1')

            if conditions:
                query_parts.append('WHERE ' + ' AND '.join(conditions))

            if recent_only:
                query_parts.append('ORDER BY rv.viewed_at DESC')
                query_parts.append('LIMIT ?')
                params.append(recent_limit)
            else:
                query_parts.append('ORDER BY c.updated_at DESC')

            cursor.execute(' '.join(query_parts), params)
            cards = [dict(row) for row in cursor.fetchall()]

            for card in cards:
                card['tags'] = self.get_card_tags(card['id'])

            return cards

    def get_card_by_id(self, card_id: int) -> Optional[dict]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM cards WHERE id = ?', (card_id,))
            row = cursor.fetchone()
            if not row:
                return None
            card = dict(row)
            card['tags'] = self.get_card_tags(card_id)
            return card

    def get_card_tags(self, card_id: int) -> List[dict]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                '''SELECT t.* FROM tags t
                   JOIN card_tags ct ON t.id = ct.tag_id
                   WHERE ct.card_id = ?
                   ORDER BY t.name''',
                (card_id,)
            )
            return [dict(row) for row in cursor.fetchall()]

    def update_card(self, card_id: int, title: str, content: str,
                    tag_ids: Optional[List[int]] = None) -> bool:
        timestamp = self.get_timestamp()
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                'UPDATE cards SET title = ?, content = ?, updated_at = ? WHERE id = ?',
                (title, content, timestamp, card_id)
            )
            updated = cursor.rowcount > 0

            if tag_ids is not None:
                cursor.execute('DELETE FROM card_tags WHERE card_id = ?', (card_id,))
                for tag_id in tag_ids:
                    cursor.execute(
                        'INSERT OR IGNORE INTO card_tags (card_id, tag_id) VALUES (?, ?)',
                        (card_id, tag_id)
                    )

            conn.commit()
            return updated

    def toggle_favorite(self, card_id: int) -> bool:
        timestamp = self.get_timestamp()
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                '''UPDATE cards 
                   SET is_favorite = CASE WHEN is_favorite = 1 THEN 0 ELSE 1 END,
                       updated_at = ?
                   WHERE id = ?''',
                (timestamp, card_id)
            )
            conn.commit()
            return cursor.rowcount > 0

    def delete_card(self, card_id: int) -> bool:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('DELETE FROM cards WHERE id = ?', (card_id,))
            conn.commit()
            return cursor.rowcount > 0

    def add_recent_view(self, card_id: int, limit: int = 10) -> None:
        timestamp = self.get_timestamp()
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('DELETE FROM recent_views WHERE card_id = ?', (card_id,))
            cursor.execute(
                'INSERT INTO recent_views (card_id, viewed_at) VALUES (?, ?)',
                (card_id, timestamp)
            )
            cursor.execute(
                '''DELETE FROM recent_views 
                   WHERE id NOT IN (SELECT id FROM recent_views ORDER BY viewed_at DESC LIMIT ?)''',
                (limit,)
            )
            conn.commit()

    def get_recent_cards(self, limit: int = 10) -> List[dict]:
        return self.get_all_cards(recent_only=True, recent_limit=limit)

    def get_statistics(self) -> dict:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT COUNT(*) as count FROM cards')
            total_cards = cursor.fetchone()['count']
            cursor.execute('SELECT COUNT(*) as count FROM cards WHERE is_favorite = 1')
            favorite_cards = cursor.fetchone()['count']
            cursor.execute('SELECT COUNT(*) as count FROM tags')
            total_tags = cursor.fetchone()['count']
            return {
                'total_cards': total_cards,
                'favorite_cards': favorite_cards,
                'total_tags': total_tags
            }
