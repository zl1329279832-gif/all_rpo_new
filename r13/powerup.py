import pygame
import random
from config import Config

class PowerUp:
    """道具类，负责管理不同类型的道具"""
    
    def __init__(self, x, y, width, height, powerup_type=None):
        """初始化道具"""
        self.x = x
        self.y = y
        self.width = width
        self.height = height
        
        # 如果没有指定道具类型，随机选择一个
        if powerup_type is None:
            self.type = random.choice([
                Config.POWERUP_EXPAND,
                Config.POWERUP_SHRINK,
                Config.POWERUP_SPEED,
                Config.POWERUP_LIFE,
                Config.POWERUP_PIERCE,
                Config.POWERUP_MULTI
            ])
        else:
            self.type = powerup_type
        
        # 道具下落速度
        self.speed = 3
        
        # 根据道具类型设置颜色和符号
        self.update_appearance()
    
    def update_appearance(self):
        """根据道具类型更新外观"""
        if self.type == Config.POWERUP_EXPAND:
            # 挡板变长
            self.color = Config.CYAN
            self.symbol = "E"  # Expand
        elif self.type == Config.POWERUP_SHRINK:
            # 挡板变短
            self.color = Config.ORANGE
            self.symbol = "S"  # Shrink
        elif self.type == Config.POWERUP_SPEED:
            # 小球加速
            self.color = Config.YELLOW
            self.symbol = "F"  # Fast
        elif self.type == Config.POWERUP_LIFE:
            # 额外生命
            self.color = Config.PINK
            self.symbol = "L"  # Life
        elif self.type == Config.POWERUP_PIERCE:
            # 穿透球
            self.color = Config.PURPLE
            self.symbol = "P"  # Pierce
        elif self.type == Config.POWERUP_MULTI:
            # 多球模式
            self.color = Config.GREEN
            self.symbol = "M"  # Multi
        else:
            # 默认
            self.color = Config.WHITE
            self.symbol = "?"
    
    def update(self):
        """更新道具位置（下落）"""
        self.y += self.speed
    
    def draw(self, screen):
        """绘制道具"""
        # 绘制道具主体
        pygame.draw.rect(screen, self.color, (self.x, self.y, self.width, self.height))
        
        # 绘制道具边框
        pygame.draw.rect(screen, Config.WHITE, (self.x, self.y, self.width, self.height), 2)
        
        # 绘制道具符号
        font = pygame.font.Font(None, 20)
        text = font.render(self.symbol, True, Config.BLACK)
        text_rect = text.get_rect(center=(self.x + self.width // 2, self.y + self.height // 2))
        screen.blit(text, text_rect)
    
    def get_rect(self):
        """获取道具的矩形区域，用于碰撞检测"""
        return pygame.Rect(self.x, self.y, self.width, self.height)
    
    def check_out_of_bounds(self, screen_height):
        """检查道具是否超出屏幕底部"""
        return self.y > screen_height
    
    def apply_effect(self, game):
        """应用道具效果到游戏"""
        if self.type == Config.POWERUP_EXPAND:
            # 挡板变长
            game.paddle.expand()
            game.show_message("挡板变长!", 2)
        elif self.type == Config.POWERUP_SHRINK:
            # 挡板变短
            game.paddle.shrink()
            game.show_message("挡板变短!", 2)
        elif self.type == Config.POWERUP_SPEED:
            # 小球加速
            for ball in game.balls:
                ball.speed_up()
            game.show_message("小球加速!", 2)
        elif self.type == Config.POWERUP_LIFE:
            # 额外生命
            game.lives += 1
            game.show_message("+1 生命!", 2)
        elif self.type == Config.POWERUP_PIERCE:
            # 穿透球
            for ball in game.balls:
                ball.make_piercing()
            game.show_message("穿透球!", 2)
        elif self.type == Config.POWERUP_MULTI:
            # 多球模式
            new_balls = []
            for ball in game.balls:
                if ball.is_moving:
                    # 为每个移动的小球创建两个副本
                    new_ball1 = ball.duplicate()
                    new_ball2 = ball.duplicate()
                    # 调整方向使其稍微不同
                    angle1 = 1.0  # 稍微偏右
                    angle2 = -1.0  # 稍微偏左
                    
                    # 修改新小球的方向
                    speed = ball.speed
                    original_angle = game._get_angle(ball.dx, ball.dy)
                    
                    new_ball1.dx = game._get_dx(original_angle + angle1, speed)
                    new_ball1.dy = game._get_dy(original_angle + angle1, speed)
                    
                    new_ball2.dx = game._get_dx(original_angle + angle2, speed)
                    new_ball2.dy = game._get_dy(original_angle + angle2, speed)
                    
                    new_balls.append(new_ball1)
                    new_balls.append(new_ball2)
            
            # 添加新小球到游戏中
            game.balls.extend(new_balls)
            game.show_message("多球模式!", 2)
