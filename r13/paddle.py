import pygame
from config import Config

class Paddle:
    """挡板类，负责管理挡板的移动和绘制"""
    
    def __init__(self, screen_width, screen_height):
        """初始化挡板"""
        self.screen_width = screen_width
        self.screen_height = screen_height
        
        # 挡板初始尺寸
        self.original_width = 100
        self.original_height = 15
        self.width = self.original_width
        self.height = self.original_height
        
        # 挡板初始位置（屏幕底部居中）
        self.x = (screen_width - self.width) // 2
        self.y = screen_height - 50
        
        # 挡板速度
        self.speed = Config.PADDLE_SPEED
        
        # 挡板颜色
        self.color = Config.BLUE
        
        # 挡板移动方向
        self.direction = 0  # -1: 左, 0: 静止, 1: 右
        
        # 道具效果计时器
        self.expand_timer = 0
        self.shrink_timer = 0
    
    def move_left(self):
        """向左移动挡板"""
        self.direction = -1
    
    def move_right(self):
        """向右移动挡板"""
        self.direction = 1
    
    def stop(self):
        """停止挡板移动"""
        self.direction = 0
    
    def update(self):
        """更新挡板位置"""
        # 根据方向移动挡板
        if self.direction == -1:
            self.x -= self.speed
        elif self.direction == 1:
            self.x += self.speed
        
        # 确保挡板不会移出屏幕
        if self.x < 0:
            self.x = 0
        if self.x > self.screen_width - self.width:
            self.x = self.screen_width - self.width
        
        # 更新道具效果计时器
        if self.expand_timer > 0:
            self.expand_timer -= 1
            if self.expand_timer == 0:
                self.reset_size()
        
        if self.shrink_timer > 0:
            self.shrink_timer -= 1
            if self.shrink_timer == 0:
                self.reset_size()
    
    def draw(self, screen):
        """绘制挡板"""
        pygame.draw.rect(screen, self.color, (self.x, self.y, self.width, self.height))
        # 绘制挡板边框
        pygame.draw.rect(screen, Config.WHITE, (self.x, self.y, self.width, self.height), 2)
    
    def get_rect(self):
        """获取挡板的矩形区域，用于碰撞检测"""
        return pygame.Rect(self.x, self.y, self.width, self.height)
    
    def expand(self):
        """挡板变长"""
        self.width = self.original_width * 2
        self.x -= (self.original_width // 2)  # 保持中心位置不变
        self.expand_timer = 600  # 10秒 (60 FPS)
        self.shrink_timer = 0  # 取消变短效果
        self.color = Config.CYAN
    
    def shrink(self):
        """挡板变短"""
        self.width = self.original_width // 2
        self.x += (self.original_width // 4)  # 保持中心位置不变
        self.shrink_timer = 600  # 10秒 (60 FPS)
        self.expand_timer = 0  # 取消变长效果
        self.color = Config.ORANGE
    
    def reset_size(self):
        """重置挡板尺寸"""
        self.width = self.original_width
        self.color = Config.BLUE
    
    def get_bounce_angle(self, ball_x):
        """计算小球碰撞挡板后的反弹角度"""
        # 计算小球相对于挡板中心的位置
        relative_intersect_x = (self.x + self.width / 2) - ball_x
        normalized_relative_intersect_x = relative_intersect_x / (self.width / 2)
        
        # 计算反弹角度（最大角度为75度）
        bounce_angle = normalized_relative_intersect_x * 1.309  # 75度转换为弧度（约1.309）
        
        return bounce_angle
