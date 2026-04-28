from typing import List, Optional
from models.category import Category
from storage.json_storage import JSONStorage
from utils.validators import validate_category_data
from utils.logger import get_logger


class CategoryService:
    def __init__(self, storage: JSONStorage):
        self.storage = storage
        self.logger = get_logger("CategoryService")

    def get_all_categories(self) -> List[Category]:
        return self.storage.get_all(Category)

    def get_category_by_id(self, category_id: str) -> Optional[Category]:
        return self.storage.get_by_id(Category, category_id)

    def get_category_by_name(self, name: str) -> Optional[Category]:
        categories = self.get_all_categories()
        name_lower = name.lower()
        for category in categories:
            if category.name.lower() == name_lower:
                return category
        return None

    def create_category(self, name: str, color: str = "#3498db", 
                        icon: str = "folder", description: str = "") -> Optional[Category]:
        data = {
            "name": name,
            "color": color,
            "icon": icon,
            "description": description,
        }
        
        is_valid, error_msg = validate_category_data(data)
        if not is_valid:
            self.logger.error(f"创建分类失败: {error_msg}")
            return None
        
        if self.get_category_by_name(name):
            self.logger.error(f"创建分类失败: 分类名称已存在 - {name}")
            return None
        
        category = Category(
            name=name,
            color=color,
            icon=icon,
            description=description,
        )
        
        if self.storage.add(category):
            self.logger.info(f"创建分类成功: {category.name}")
            return category
        return None

    def update_category(self, category: Category, **kwargs) -> bool:
        if "name" in kwargs:
            existing = self.get_category_by_name(kwargs["name"])
            if existing and existing.id != category.id:
                self.logger.error(f"更新分类失败: 分类名称已存在 - {kwargs['name']}")
                return False
        
        category.update(**kwargs)
        if self.storage.update(category):
            self.logger.info(f"更新分类成功: {category.name}")
            return True
        return False

    def delete_category(self, category_id: str) -> bool:
        category = self.get_category_by_id(category_id)
        if category:
            if self.storage.delete(category_id):
                self.logger.info(f"删除分类: {category.name}")
                return True
        return False

    def get_category_count(self) -> int:
        return self.storage.count()

    def get_default_category(self) -> Optional[Category]:
        categories = self.get_all_categories()
        if categories:
            return categories[0]
        return None
