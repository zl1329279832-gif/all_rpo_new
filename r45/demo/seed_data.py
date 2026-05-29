import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.db_manager import DatabaseManager
from services.order_service import OrderService


def seed():
    db = DatabaseManager()
    svc = OrderService(db)

    if svc.get_all_customers():
        print("数据库已有数据，跳过种子数据插入")
        db.close()
        return

    c1 = svc.create_customer("张三", "13800138001", "zhangsan@email.com", "北京市朝阳区", "婚纱照客户")
    c2 = svc.create_customer("李四", "13900139002", "lisi@email.com", "北京市海淀区", "亲子照客户")
    c3 = svc.create_customer("王五", "13700137003", "wangwu@email.com", "北京市西城区", "个人写真客户")
    c4 = svc.create_customer("赵六", "13600136004", "", "北京市东城区", "全家福客户")
    c5 = svc.create_customer("钱七", "13500135005", "qianqi@email.com", "", "毕业照客户")
    print(f"创建 {5} 个客户")

    p1 = svc.create_package("经典婚纱照", "内景+外景，含精修", 5999, 120, 40, 6.0)
    p2 = svc.create_package("简约婚纱照", "纯内景拍摄", 3999, 80, 25, 4.0)
    p3 = svc.create_package("亲子时光", "室内亲子照", 1999, 60, 20, 2.0)
    p4 = svc.create_package("个人写真", "室内外均可", 1599, 50, 15, 2.0)
    p5 = svc.create_package("全家福", "室内全家福", 1299, 30, 10, 1.5)
    p6 = svc.create_package("毕业季", "校园拍摄", 999, 40, 10, 2.0)
    print(f"创建 {6} 个套餐")

    ph1 = svc.create_photographer("陈大师", "13100131001", "婚纱摄影")
    ph2 = svc.create_photographer("林老师", "13200132002", "人像写真")
    ph3 = svc.create_photographer("周老师", "13300133003", "亲子/全家福")
    print(f"创建 {3} 个摄影师")

    from datetime import date, timedelta
    today = date.today()

    orders_data = [
        (c1, p1, ph1, (today + timedelta(days=3)), "09:00", 5999, "待拍摄", "需要外景拍摄"),
        (c2, p3, ph3, (today + timedelta(days=1)), "10:00", 1999, "拍摄中", "亲子照+宠物"),
        (c3, p4, ph2, today, "14:00", 1599, "选片中", ""),
        (c4, p5, ph3, (today - timedelta(days=5)), "11:00", 1299, "精修中", ""),
        (c1, p2, ph1, (today - timedelta(days=10)), "09:00", 3999, "交付中", "第二次拍摄"),
        (c5, p6, ph2, (today - timedelta(days=15)), "15:00", 999, "交付中", "毕业季套餐"),
        (c3, p4, ph2, (today + timedelta(days=5)), "10:00", 1599, "待拍摄", "续拍写真"),
        (c2, p3, ph3, (today + timedelta(days=7)), "14:00", 1999, "待拍摄", ""),
        (c4, p1, ph1, (today - timedelta(days=20)), "09:00", 5999, "交付中", "婚纱照补拍"),
        (c5, p4, ph2, (today + timedelta(days=2)), "16:00", 1599, "待拍摄", ""),
    ]

    created_order_ids = []
    for i, (cid, pid, phid, adate, atime, amount, status, notes) in enumerate(orders_data):
        try:
            oid = svc.create_order(cid, pid, phid, adate.isoformat(), atime, amount, notes)
            if status != "待拍摄":
                svc.update_order(oid, {"order_status": status})
            created_order_ids.append(oid)
        except Exception as e:
            print(f"订单 {i+1} 创建失败: {e}")

    print(f"创建 {len(created_order_ids)} 个订单")

    payment_indices = [4, 5, 8]
    for idx in payment_indices:
        if idx < len(created_order_ids):
            oid = created_order_ids[idx]
            try:
                order = db.fetch_one("orders", oid)
                if order:
                    svc.add_payment(oid, order.amount * 0.5, "微信", today.isoformat(), "定金")
                    svc.add_payment(oid, order.amount * 0.5, "银行卡", (today - timedelta(days=3)).isoformat(), "尾款")
            except Exception as e:
                print(f"付款记录添加失败: {e}")

    completed_indices = [5, 8]
    for idx in completed_indices:
        if idx < len(created_order_ids):
            oid = created_order_ids[idx]
            try:
                svc.update_order(oid, {"order_status": "已完成"})
            except Exception as e:
                print(f"设置完成状态失败: {e}")

    note_indices = [2, 3]
    for idx in note_indices:
        if idx < len(created_order_ids):
            oid = created_order_ids[idx]
            try:
                svc.add_after_sale_note(oid, "客户要求部分照片重新精修，肤色偏暗", "前台小王")
            except Exception as e:
                print(f"售后备注添加失败: {e}")

    print("种子数据插入完成!")
    db.close()


if __name__ == "__main__":
    seed()
