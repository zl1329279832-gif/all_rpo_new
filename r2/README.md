# 像素坦克大战

一个使用 Java 17、Swing/AWT 和 Java2D 开发的像素风格坦克大战桌面游戏。

## 功能特性

- 像素风格图形
- 玩家坦克控制
- 敌方 AI 坦克
- 多种地图元素：砖墙（可破坏）、钢墙（不可破坏）、基地、水、草
- 碰撞检测系统
- 爆炸动画效果
- 道具系统：加速、护盾、强化子弹、生命恢复
- 关卡系统
- 得分和生命值系统
- 游戏状态管理：开始、暂停、胜利、失败

## 项目结构

```
src/main/java/com/tankwar/
├── game/
│   └── TankWarGame.java          # 游戏主类
├── engine/
│   └── GameEngine.java           # 游戏引擎
├── entity/
│   ├── Tank.java                 # 坦克基类
│   ├── PlayerTank.java           # 玩家坦克
│   ├── EnemyTank.java            # 敌方坦克
│   ├── Bullet.java               # 子弹
│   ├── Explosion.java            # 爆炸效果
│   └── PowerUp.java              # 道具
├── map/
│   ├── Wall.java                 # 墙壁
│   └── GameMap.java              # 游戏地图
├── input/
│   └── InputHandler.java         # 输入处理
├── collision/
│   └── CollisionDetector.java    # 碰撞检测
├── ai/
│   └── EnemyAI.java              # 敌方 AI
├── ui/
│   └── GamePanel.java            # 游戏面板
└── util/
    ├── Direction.java            # 方向枚举
    └── GameConstants.java        # 游戏常量
```

## 运行方式

### 使用 Maven 编译运行

1. 编译项目：
```bash
mvn clean compile
```

2. 运行游戏：
```bash
mvn exec:java -Dexec.mainClass="com.tankwar.game.TankWarGame"
```

### 打包成 JAR 文件

```bash
mvn clean package
java -jar target/tank-war-pixel-1.0.0.jar
```

## 操作说明

| 按键 | 功能 |
|------|------|
| W/上方向键 | 向上移动 |
| S/下方向键 | 向下移动 |
| A/左方向键 | 向左移动 |
| D/右方向键 | 向右移动 |
| 空格/CTRL | 射击 |
| ESC/P | 暂停/继续 |
| R | 重新开始/下一关 |

## 游戏规则

1. 保护你的基地，不要让敌人摧毁它
2. 消灭所有敌方坦克即可过关
3. 收集道具可以获得各种增强效果
4. 玩家有 3 条生命
5. 被敌方子弹击中或基地被摧毁则游戏结束

## 道具说明

- **S (速度)**: 坦克移动速度翻倍，持续 8 秒
- **S (护盾)**: 保护坦克免受伤害，持续 8 秒
- **B (强化子弹)**: 子弹伤害翻倍，可破坏钢墙，持续 10 秒
- **+ (治疗)**: 恢复 1 点生命值

## 技术栈

- Java 17
- Swing/AWT
- Java2D
- Maven

## 系统要求

- JDK 17 或更高版本
- Maven 3.6+

## 开发者

本项目使用 Trae IDE 开发。
