from dataclasses import dataclass, field
from typing import Optional
from datetime import datetime, date


@dataclass
class Customer:
    id: Optional[int] = None
    name: str = ""
    phone: str = ""
    email: str = ""
    address: str = ""
    notes: str = ""
    created_at: Optional[str] = None


@dataclass
class Package:
    id: Optional[int] = None
    name: str = ""
    description: str = ""
    price: float = 0.0
    photo_count: int = 0
    retouch_count: int = 0
    duration_hours: float = 2.0


@dataclass
class Photographer:
    id: Optional[int] = None
    name: str = ""
    phone: str = ""
    specialty: str = ""
    active: int = 1


@dataclass
class Order:
    id: Optional[int] = None
    order_no: str = ""
    customer_id: int = 0
    package_id: int = 0
    photographer_id: int = 0
    appointment_date: str = ""
    appointment_time: str = ""
    amount: float = 0.0
    paid_amount: float = 0.0
    order_status: str = "待拍摄"
    payment_status: str = "未付款"
    notes: str = ""
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


@dataclass
class Photo:
    id: Optional[int] = None
    order_id: int = 0
    file_path: str = ""
    file_hash: str = ""
    thumbnail_path: str = ""
    selected: int = 0
    retouch_status: str = "待精修"
    retouch_notes: str = ""
    original_filename: str = ""
    file_size: int = 0
    imported_at: Optional[str] = None


@dataclass
class DeliveryFile:
    id: Optional[int] = None
    order_id: int = 0
    file_path: str = ""
    file_name: str = ""
    file_size: int = 0
    delivered_at: Optional[str] = None
    notes: str = ""


@dataclass
class Payment:
    id: Optional[int] = None
    order_id: int = 0
    amount: float = 0.0
    method: str = ""
    payment_date: str = ""
    notes: str = ""


@dataclass
class AfterSaleNote:
    id: Optional[int] = None
    order_id: int = 0
    content: str = ""
    created_at: Optional[str] = None
    author: str = ""


@dataclass
class DeletedRecord:
    id: Optional[int] = None
    table_name: str = ""
    record_id: int = 0
    record_data: str = ""
    deleted_at: Optional[str] = None
    deleted_by: str = ""
    restored: int = 0
