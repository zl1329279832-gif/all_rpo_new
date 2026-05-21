from typing import Optional, List
import sqlite3
from db import Database


class NoteService:
    def __init__(self, db_path: str = "notes.db"):
        self.db = Database(db_path)
        self.current_note_id: Optional[int] = None

    def create_note(self, title: str, content: str) -> int:
        title = title.strip()
        if not title:
            raise ValueError("标题不能为空")
        return self.db.create_note(title, content.strip())

    def get_note(self, note_id: int) -> Optional[sqlite3.Row]:
        return self.db.get_note(note_id)

    def get_all_notes(self) -> List[sqlite3.Row]:
        return self.db.get_all_notes()

    def search_notes(self, keyword: str) -> List[sqlite3.Row]:
        keyword = keyword.strip()
        if not keyword:
            return self.get_all_notes()
        return self.db.search_notes(keyword)

    def update_note(self, note_id: int, title: str, content: str) -> bool:
        title = title.strip()
        if not title:
            raise ValueError("标题不能为空")
        return self.db.update_note(note_id, title, content.strip())

    def delete_note(self, note_id: int) -> bool:
        return self.db.delete_note(note_id)

    def save_current_note(self, title: str, content: str) -> int:
        title = title.strip()
        if not title:
            raise ValueError("标题不能为空")

        if self.current_note_id is None:
            self.current_note_id = self.create_note(title, content)
            return self.current_note_id
        else:
            self.update_note(self.current_note_id, title, content)
            return self.current_note_id

    def load_note(self, note_id: int) -> Optional[sqlite3.Row]:
        self.current_note_id = note_id
        return self.get_note(note_id)

    def clear_current_note(self) -> None:
        self.current_note_id = None

    def is_new_note(self) -> bool:
        return self.current_note_id is None
