# ⚔️ Roguelike - 地牢探险

一个基于 Vue 3 + TypeScript + Canvas 的 2D Roguelike 网页小游戏。

## 🎮 游戏特性

- **随机地图生成** - 每次游戏都是独特的地牢体验
- **关卡推进系统** - 探索更深的地牢，挑战更强的敌人
- **角色成长** - 升级提升属性，解锁新技能
- **丰富的道具** - 生命药水、增益药剂、金币等
- **技能系统** - 普通攻击、火球术、治疗术、冲刺
- **暂停/存档** - 随时保存进度，继续冒险
- **实时战斗** - 近战攻击、弹道法术、粒子特效

## 🚀 快速开始

### 环境要求

- Node.js >= 16
- npm >= 7

### 安装与运行

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

游戏将在 `http://localhost:5173` 启动。

## 🎯 操作说明

| 按键 | 功能 |
|------|------|
| **WASD / 方向键** | 移动角色 |
| **Space / J** | 普通攻击 |
| **1** | 普通攻击技能 |
| **2** | 火球术 |
| **3** | 治疗术 |
| **4** | 冲刺 |
| **I** | 打开背包 |
| **ESC** | 暂停游戏 |

## 🏗️ 项目结构

```
src/
├── components/           # Vue UI 组件
│   ├── GameCanvas.vue    # 游戏主画布组件
│   ├── HUDPanel.vue      # 状态栏面板
│   ├── SkillBar.vue      # 技能栏
│   ├── InventoryPanel.vue # 背包面板
│   ├── PauseMenu.vue     # 暂停菜单
│   ├── LevelComplete.vue # 关卡结算
│   ├── GameOver.vue      # 游戏结束
│   └── MainMenu.vue      # 主菜单
├── game/                 # 游戏核心逻辑
│   ├── core/             # 核心系统
│   │   ├── GameEngine.ts    # 游戏主引擎
│   │   ├── InputManager.ts  # 输入管理
│   │   ├── ResourceManager.ts # 资源管理
│   │   ├── SaveManager.ts   # 存档管理
│   │   └── EventBus.ts      # 事件总线
│   ├── entity/           # 实体系统
│   │   ├── Entity.ts        # 实体基类
│   │   ├── Player.ts        # 玩家
│   │   ├── Enemy.ts         # 敌人
│   │   ├── Item.ts          # 道具
│   │   └── Projectile.ts    # 弹道
│   ├── map/              # 地图系统
│   │   └── MapGenerator.ts  # 地牢生成器
│   ├── combat/           # 战斗系统
│   │   └── CombatSystem.ts  # 战斗逻辑
│   └── config/           # 游戏配置
│       └── GameConfig.ts    # 游戏参数配置
├── types/                # TypeScript 类型定义
│   └── game.ts
├── App.vue               # 根组件
├── main.ts               # 入口文件
└── style.css             # 全局样式
```

## 🔧 扩展指南

### 添加新怪物

在 `src/game/config/GameConfig.ts` 的 `ENEMIES` 对象中添加新怪物配置：

```typescript
export const ENEMIES = {
  // ... 现有怪物
  new_monster: {
    name: '新怪物名称',
    stats: {
      maxHp: 60,
      hp: 60,
      attack: 12,
      defense: 4,
      speed: 2,
    },
    expReward: 50,          // 击杀获得的经验值
    color: '#ff9800',       // 怪物颜色
    aiType: 'melee',        // AI 类型: 'melee' | 'ranged' | 'fast'
  },
}
```

**AI 类型说明：**
- `melee` - 近战型，靠近玩家后攻击
- `ranged` - 远程型，保持距离发射弹道
- `fast` - 快速型，高移动速度，快速攻击

然后在 `src/game/core/GameEngine.ts` 的 `generateLevel` 方法中，将新怪物添加到 `enemyTypes` 数组中：

```typescript
const enemyTypes: EnemyType[] = ['slime', 'skeleton', 'bat', 'goblin', 'new_monster']
```

### 添加新道具

在 `src/game/config/GameConfig.ts` 的 `ITEMS` 对象中添加新道具配置：

```typescript
export const ITEMS = {
  // ... 现有道具
  new_item: {
    name: '新道具名称',
    description: '道具描述',
    icon: '✨',              // Emoji 图标
    effect: {               // 道具效果（可选）
      hp: 30,              // 恢复生命值
      attack: 2,           // 增加攻击力
      defense: 1,          // 增加防御力
      speed: 0.5,          // 增加移动速度
    },
    duration: 20000,       // 持续时间（毫秒），不设置则为立即生效
  },
}
```

**效果说明：**
- 不设置 `duration` - 立即生效的道具（如生命药水）
- 设置 `duration` - 持续一段时间的增益效果

然后在 `src/game/core/GameEngine.ts` 的 `generateLevel` 方法中，将新道具添加到 `itemTypes` 数组中：

```typescript
const itemTypes: ItemType[] = ['health_potion', 'coin', 'new_item']
```

### 添加新技能

在 `src/game/config/GameConfig.ts` 的 `SKILLS` 数组中添加新技能：

```typescript
export const SKILLS = [
  // ... 现有技能
  {
    id: 'new_skill',
    name: '新技能名称',
    icon: '🌟',
    cooldown: 5,            // 冷却时间（秒）
    damage: 1.5,           // 伤害倍率（0 表示无伤害）
    manaCost: 25,          // 法力消耗
    description: '技能描述',
  },
]
```

在 `src/game/core/GameEngine.ts` 的 `update` 方法中添加技能逻辑：

```typescript
if (inputManager.isKeyPressed('5')) {
  if (this.player.useSkill('new_skill')) {
    this.executeNewSkill()
  }
}
```

### 调整游戏参数

在 `src/game/config/GameConfig.ts` 中可以调整：

- `GAME_CONFIG` - 画布尺寸、地图大小、房间数量等
- `PLAYER_INITIAL_STATS` - 玩家初始属性
- `COLORS` - 游戏中使用的颜色

## 📦 技术栈

- **Vue 3** - 渐进式 JavaScript 框架
- **TypeScript** - 类型安全的 JavaScript
- **Canvas** - HTML5 Canvas 2D 渲染
- **Vite** - 下一代前端构建工具

## 📝 开发说明

### 游戏循环

游戏使用 `requestAnimationFrame` 实现主循环，每帧更新顺序：
1. 处理输入
2. 更新玩家状态
3. 更新敌人 AI
4. 处理碰撞
5. 渲染画面

### 状态管理

游戏状态机：
```
menu → playing ⇄ paused → levelComplete → playing
                           ↘ gameOver → menu
```

### 事件系统

使用 `EventBus` 进行模块间通信，支持的事件：
- `playerDied` - 玩家死亡
- `playerLevelUp` - 玩家升级
- `enemyDied` - 敌人死亡
- `itemUsed` - 使用道具
- `skillUsed` - 使用技能
- `playerHeal` - 玩家治疗

## 📄 许可证

MIT License
