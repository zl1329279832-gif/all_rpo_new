from database.db_manager import DatabaseManager
from database.models import (
    Customer, Package, Photographer, Order, Photo,
    DeliveryFile, Payment, AfterSaleNote, DeletedRecord
)

db = DatabaseManager()
