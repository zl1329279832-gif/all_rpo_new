import pygame
import math
from config import Config

class Ball:
    """小球类，负责管理小球的移动、碰撞检测和反弹逻辑"""
    
    def __init__(self, screen_width, screen_height, paddle_x, paddle_y, paddle_width):
        """初始化小球"""
        self.screen_width = screen_width
        self.screen_height = screen_height
        
        # 小球尺寸
        self.radius = 8
        self.diameter = self.radius * 2
        
        # 小球初始位置（位于挡板上方居中）
        self.x = paddle_x + paddle_width // 2
        self.y = paddle_y - self.radius
        
        # 小球速度
        self.speed = Config.BALL_SPEED
        self.original_speed = Config.BALL_SPEED
        
        # 小球初始方向（向上）
        self.dx = 0
        self.dy = -self.speed
        
        # 小球颜色
        self.color = Config.WHITE
        
        # 小球是否在移动（初始时依附在挡板上）
        self.is_moving = False
        
        # 特殊效果
        self.is_piercing = False  # 是否是穿透球
        self.is_speed_up = False  # 是否加速
        self.pierce_timer = 0     # 穿透效果计时器
        self.speed_timer = 0      # 加速效果计时器
        
        # 记录上一帧位置，用于连续碰撞检测
        self.last_x = self.x
        self.last_y = self.y
    
    def attach_to_paddle(self, paddle_x, paddle_width):
        """将小球依附到挡板上"""
        self.is_moving = False
        self.x = paddle_x + paddle_width // 2
        self.y = self.screen_height - 50 - self.radius
        self.dx = 0
        self.dy = -self.speed
    
    def launch(self):
        """发射小球"""
        if not self.is_moving:
            self.is_moving = True
            # 随机一个初始角度
            angle = -math.pi / 2  # 90度，向上
            self.dx = math.cos(angle) * self.speed
            self.dy = math.sin(angle) * self.speed
    
    def update(self):
        """更新小球位置"""
        # 记录上一帧位置
        self.last_x = self.x
        self.last_y = self.y
        
        # 更新特殊效果计时器
        if self.pierce_timer > 0:
            self.pierce_timer -= 1
            if self.pierce_timer == 0:
                self.is_piercing = False
                self.color = Config.WHITE
        
        if self.speed_timer > 0:
            self.speed_timer -= 1
            if self.speed_timer == 0:
                self.is_speed_up = False
                self.speed = self.original_speed
                # 保持方向，调整速度大小
                if self.dx != 0 or self.dy != 0:
                    speed = math.sqrt(self.dx ** 2 + self.dy ** 2)
                    if speed > 0:
                        self.dx = (self.dx / speed) * self.speed
                        self.dy = (self.dy / speed) * self.speed
        
        # 如果小球在移动，更新位置
        if self.is_moving:
            self.x += self.dx
            self.y += self.dy
            
            # 边界碰撞检测
            # 左边界
            if self.x - self.radius < 0:
                self.x = self.radius
                self.dx = -self.dx
            
            # 右边界
            if self.x + self.radius > self.screen_width:
                self.x = self.screen_width - self.radius
                self.dx = -self.dx
            
            # 上边界
            if self.y - self.radius < 0:
                self.y = self.radius
                self.dy = -self.dy
        else:
            # 小球依附在挡板上时，位置更新由游戏主循环处理
            pass
    
    def draw(self, screen):
        """绘制小球"""
        pygame.draw.circle(screen, self.color, (int(self.x), int(self.y)), self.radius)
        # 绘制小球高光
        pygame.draw.circle(screen, Config.WHITE, (int(self.x - 3), int(self.y - 3)), 2)
    
    def get_rect(self):
        """获取小球的矩形区域，用于碰撞检测"""
        return pygame.Rect(
            self.x - self.radius,
            self.y - self.radius,
            self.diameter,
            self.diameter
        )
    
    def get_next_rect(self):
        """获取小球下一帧的矩形区域，用于预测碰撞"""
        return pygame.Rect(
            self.x + self.dx - self.radius,
            self.y + self.dy - self.radius,
            self.diameter,
            self.diameter
        )
    
    def bounce_paddle(self, paddle):
        """处理小球与挡板的碰撞反弹"""
        # 计算反弹角度
        bounce_angle = paddle.get_bounce_angle(self.x)
        
        # 根据反弹角度计算新的速度分量
        # 确保dy始终为负（向上）
        self.dx = math.sin(bounce_angle) * self.speed
        self.dy = -math.cos(bounce_angle) * self.speed
        
        # 确保小球不会卡在挡板里
        self.y = paddle.y - self.radius
    
    def bounce_brick(self, brick_rect, from_side):
        """处理小球与砖块的碰撞反弹"""
        if not self.is_piercing:
            # 不是穿透球，正常反弹
            if from_side:
                # 从侧面碰撞，水平方向反弹
                self.dx = -self.dx
            else:
                # 从上下方向碰撞，垂直方向反弹
                self.dy = -self.dy
    
    def check_collision(self, rect):
        """检查小球是否与指定矩形碰撞"""
        ball_rect = self.get_rect()
        return ball_rect.colliderect(rect)
    
    def check_side_collision(self, rect):
        """检查小球是从侧面还是上下方向碰撞"""
        # 计算小球中心与矩形中心的偏移
        ball_center_x = self.x
        ball_center_y = self.y
        rect_center_x = rect.x + rect.width / 2
        rect_center_y = rect.y + rect.height / 2
        
        # 计算小球相对于矩形的位置
        dx = ball_center_x - rect_center_x
        dy = ball_center_y - rect_center_y
        
        # 计算碰撞角度
        angle = math.atan2(dy, dx)
        
        # 如果角度在45-135度或225-315度之间，认为是上下方向碰撞
        # 否则认为是侧面碰撞
        is_side = (abs(math.cos(angle)) > 0.7)
        return is_side
    
    def speed_up(self):
        """小球加速"""
        self.is_speed_up = True
        self.speed = self.original_speed * 1.5
        self.speed_timer = 600  # 10秒 (60 FPS)
        # 保持方向，调整速度大小
        if self.dx != 0 or self.dy != 0:
            speed = math.sqrt(self.dx ** 2 + self.dy ** 2)
            if speed > 0:
                self.dx = (self.dx / speed) * self.speed
                self.dy = (self.dy / speed) * self.speed
        self.color = Config.YELLOW
    
    def make_piercing(self):
        """使小球成为穿透球"""
        self.is_piercing = True
        self.pierce_timer = 300  # 5秒 (60 FPS)
        self.color = Config.PURPLE
    
    def check_out_of_bounds(self):
        """检查小球是否超出屏幕底部"""
        return self.y - self.radius > self.screen_height
    
    def duplicate(self):
        """复制一个新的小球（用于多球模式）"""
        new_ball = Ball(self.screen_width, self.screen_height, 0, 0, 0)
        new_ball.x = self.x
        new_ball.y = self.y
        new_ball.speed = self.speed
        new_ball.original_speed = self.original_speed
        
        # 随机一个稍微不同的方向
        angle = math.atan2(self.dy, self.dx) + (0.5 if self.dx > 0 else -0.5)
        new_ball.dx = math.cos(angle) * self.speed
        new_ball.dy = math.sin(angle) * self.speed
        
        new_ball.is_moving = True
        new_ball.color = self.color
        
        # 复制特殊效果
        new_ball.is_piercing = self.is_piercing
        new_ball.is_speed_up = self.is_speed_up
        new_ball.pierce_timer = self.pierce_timer
        new_ball.speed_timer = self.speed_timer
        
        return new_ball
