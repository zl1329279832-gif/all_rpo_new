import pygame
from config import Config

class Brick:
    """砖块类，负责管理不同类型的砖块"""
    
    def __init__(self, x, y, width, height, brick_type=Config.BRICK_NORMAL, health=1):
        """初始化砖块"""
        self.x = x
        self.y = y
        self.width = width
        self.height = height
        self.type = brick_type
        self.max_health = health
        self.health = health
        self.is_destroyed = False
        
        # 根据砖块类型设置颜色
        self.update_color()
    
    def update_color(self):
        """根据砖块类型和血量更新颜色"""
        if self.type == Config.BRICK_NORMAL:
            # 普通砖块颜色根据位置随机
            colors = [Config.RED, Config.GREEN, Config.BLUE, Config.YELLOW, Config.ORANGE]
            self.color = colors[(self.x // 100 + self.y // 50) % len(colors)]
        elif self.type == Config.BRICK_HARD:
            # 多血量砖块
            if self.health == 1:
                self.color = Config.GRAY
            elif self.health == 2:
                self.color = Config.DARK_GRAY
            else:
                self.color = Config.GOLD
        elif self.type == Config.BRICK_UNBREAKABLE:
            # 不可破坏砖块
            self.color = Config.PURPLE
    
    def hit(self, is_piercing=False):
        """小球击中砖块，返回是否被摧毁"""
        if self.type == Config.BRICK_UNBREAKABLE:
            # 不可破坏砖块
            return False
        
        if self.type == Config.BRICK_HARD:
            # 多血量砖块
            if is_piercing:
                # 穿透球直接摧毁
                self.health = 0
            else:
                self.health -= 1
                self.update_color()
            
            if self.health <= 0:
                self.is_destroyed = True
                return True
            return False
        
        # 普通砖块
        self.health = 0
        self.is_destroyed = True
        return True
    
    def get_score(self):
        """获取击中砖块的分数"""
        if self.type == Config.BRICK_NORMAL:
            return 10 * self.max_health
        elif self.type == Config.BRICK_HARD:
            return 25 * self.max_health
        elif self.type == Config.BRICK_UNBREAKABLE:
            return 0
        return 10
    
    def can_drop_powerup(self):
        """检查砖块是否可以掉落道具"""
        return self.type != Config.BRICK_UNBREAKABLE
    
    def draw(self, screen):
        """绘制砖块"""
        # 绘制砖块主体
        pygame.draw.rect(screen, self.color, (self.x, self.y, self.width, self.height))
        
        # 绘制砖块边框
        if self.type == Config.BRICK_UNBREAKABLE:
            # 不可破坏砖块用特殊边框
            pygame.draw.rect(screen, Config.WHITE, (self.x, self.y, self.width, self.height), 3)
            # 绘制不可破坏标记（两个对角线）
            pygame.draw.line(screen, Config.WHITE, (self.x, self.y), (self.x + self.width, self.y + self.height), 2)
            pygame.draw.line(screen, Config.WHITE, (self.x + self.width, self.y), (self.x, self.y + self.height), 2)
        else:
            # 普通砖块和多血量砖块
            pygame.draw.rect(screen, Config.WHITE, (self.x, self.y, self.width, self.height), 2)
            
            # 如果是多血量砖块，显示血量
            if self.type == Config.BRICK_HARD and self.max_health > 1:
                # 绘制血量指示（小圆圈）
                font = pygame.font.Font(None, 20)
                text = font.render(str(self.health), True, Config.WHITE)
                text_rect = text.get_rect(center=(self.x + self.width // 2, self.y + self.height // 2))
                screen.blit(text, text_rect)
    
    def get_rect(self):
        """获取砖块的矩形区域，用于碰撞检测"""
        return pygame.Rect(self.x, self.y, self.width, self.height)
    
    def is_breakable(self):
        """检查砖块是否可破坏"""
        return self.type != Config.BRICK_UNBREAKABLE
