from knowledge_card.database import DatabaseManager
from knowledge_card.config import DB_PATH


def init_database():
    print("=" * 50)
    print("个人知识卡片 - 数据库初始化")
    print("=" * 50)
    print(f"\n数据库路径: {DB_PATH}")
    print("\n正在初始化数据库...")

    db = DatabaseManager()

    stats = db.get_statistics()
    print("\n" + "=" * 50)
    print("数据库初始化完成！")
    print("=" * 50)
    print(f"\n当前统计：")
    print(f"  - 总卡片数: {stats['total_cards']}")
    print(f"  - 收藏卡片: {stats['favorite_cards']}")
    print(f"  - 标签数量: {stats['total_tags']}")

    print("\n添加示例数据...")
    tags = [
        ("Python", "#3776ab"),
        ("编程", "#e34c26"),
        ("学习", "#f59e0b"),
        ("读书笔记", "#10b981"),
        ("生活", "#8b5cf6"),
    ]

    tag_ids = {}
    for name, color in tags:
        tag_id = db.create_tag(name, color)
        tag_ids[name] = tag_id

    sample_cards = [
        {
            "title": "Python 列表推导式",
            "content": "列表推导式是一种简洁的创建列表的方式。\n\n语法：[expression for item in iterable if condition]\n\n例如：\nsquares = [x**2 for x in range(10)]  # [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]\n\n也可以添加条件过滤：\nevens = [x for x in range(20) if x % 2 == 0]",
            "tags": ["Python", "编程"],
            "favorite": True
        },
        {
            "title": "学习方法：费曼技巧",
            "content": "费曼技巧是一种高效的学习方法，由诺贝尔奖得主理查德·费曼提出。\n\n步骤：\n1. 选择一个概念\n2. 用简单的语言向别人解释（就像教一个孩子）\n3. 发现解释中的问题，回去复习\n4. 简化并创建类比\n\n核心思想：如果你不能简单地解释一个概念，说明你还没有真正理解它。",
            "tags": ["学习"],
            "favorite": True
        },
        {
            "title": "《原子习惯》读书笔记",
            "content": "《原子习惯》- 詹姆斯·克利尔\n\n核心观点：\n- 习惯是自我提升的复利计算\n- 如果你想要更好的结果，不要专注于设定目标，专注于改进你的系统\n\n四条行为改变法则：\n1. 让它显而易见（第一法则）\n2. 让它有吸引力（第二法则）\n3. 让它简单易行（第三法则）\n4. 让它令人满足（第四法则）\n\n最重要的是从微小的改变开始，然后持续坚持。",
            "tags": ["读书笔记", "学习"],
            "favorite": False
        },
        {
            "title": "PySide6 信号与槽机制",
            "content": "信号与槽（Signals and Slots）是 Qt 的核心特性之一。\n\n基本概念：\n- 信号（Signal）：当某个事件发生时发送的消息\n- 槽（Slot）：接收并处理信号的函数\n\n使用方式：\n```python\nbutton = QPushButton('点击我')\nbutton.clicked.connect(self.on_button_clicked)\n\ndef on_button_clicked(self):\n    print('按钮被点击了！')\n```\n\n一个信号可以连接多个槽，多个信号也可以连接同一个槽。",
            "tags": ["Python", "编程"],
            "favorite": False
        },
        {
            "title": "每日生活小技巧",
            "content": "1. 早晨喝一杯温水，帮助身体唤醒\n2. 每工作 1 小时休息 10 分钟（番茄工作法）\n3. 睡前放下手机，阅读纸质书籍\n4. 每天记录 3 件感恩的事情\n5. 每周至少运动 3 次\n\n记住：健康是最大的财富！",
            "tags": ["生活"],
            "favorite": False
        }
    ]

    for card_data in sample_cards:
        card_tag_ids = [tag_ids[name] for name in card_data["tags"]]
        card_id = db.create_card(
            title=card_data["title"],
            content=card_data["content"],
            tag_ids=card_tag_ids
        )
        if card_data["favorite"]:
            db.toggle_favorite(card_id)

    stats = db.get_statistics()
    print("\n示例数据已添加！")
    print(f"  - 总卡片数: {stats['total_cards']}")
    print(f"  - 收藏卡片: {stats['favorite_cards']}")
    print(f"  - 标签数量: {stats['total_tags']}")

    print("\n" + "=" * 50)
    print("数据库初始化完成！现在可以运行 main.py 启动应用。")
    print("=" * 50)


if __name__ == "__main__":
    init_database()
