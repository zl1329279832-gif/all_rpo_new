import random
from config import Config
from brick import Brick

class Level:
    """关卡类，负责管理不同关卡的砖块布局和难度递增"""
    
    def __init__(self, screen_width, screen_height):
        """初始化关卡系统"""
        self.screen_width = screen_width
        self.screen_height = screen_height
        self.current_level = 1
        
        # 砖块尺寸
        self.brick_width = 60
        self.brick_height = 20
        self.brick_padding = 5
        
        # 砖块区域的起始位置
        self.start_x = 50
        self.start_y = 60
        
        # 计算每行可以放多少个砖块
        self.bricks_per_row = (screen_width - self.start_x * 2) // (self.brick_width + self.brick_padding)
        
        # 当前关卡的砖块列表
        self.bricks = []
    
    def get_level(self):
        """获取当前关卡号"""
        return self.current_level
    
    def set_level(self, level):
        """设置当前关卡号"""
        self.current_level = level
    
    def next_level(self):
        """进入下一关"""
        self.current_level += 1
        return self.current_level
    
    def generate_level(self):
        """生成当前关卡的砖块布局"""
        self.bricks = []
        
        # 根据关卡号确定难度
        rows = self._get_rows()
        unbreakable_ratio = self._get_unbreakable_ratio()
        hard_ratio = self._get_hard_ratio()
        powerup_chance = self._get_powerup_chance()
        
        # 生成砖块
        for row in range(rows):
            for col in range(self.bricks_per_row):
                x = self.start_x + col * (self.brick_width + self.brick_padding)
                y = self.start_y + row * (self.brick_height + self.brick_padding)
                
                # 确定砖块类型
                brick_type = Config.BRICK_NORMAL
                health = 1
                
                random_value = random.random()
                
                # 先检查是否是不可破坏砖块
                if random_value < unbreakable_ratio and row > 0:
                    # 不可破坏砖块，且不在第一行（确保第一关可以通关）
                    brick_type = Config.BRICK_UNBREAKABLE
                    health = 999
                elif random_value < unbreakable_ratio + hard_ratio:
                    # 多血量砖块
                    brick_type = Config.BRICK_HARD
                    # 血量根据关卡递增（最多5）
                    health = min(self.current_level, 5)
                
                # 创建砖块
                brick = Brick(x, y, self.brick_width, self.brick_height, brick_type, health)
                
                # 设置砖块是否可以掉落道具
                # 这里我们暂时不在这里设置，而是在击中砖块时决定是否掉落
                self.bricks.append(brick)
        
        return self.bricks
    
    def _get_rows(self):
        """根据关卡号获取砖块行数"""
        # 基础行数为4，每3关增加1行，最多8行
        base_rows = 4
        additional_rows = (self.current_level - 1) // 3
        return min(base_rows + additional_rows, 8)
    
    def _get_unbreakable_ratio(self):
        """根据关卡号获取不可破坏砖块的比例"""
        # 第1关没有不可破坏砖块
        if self.current_level < 2:
            return 0.0
        
        # 从第2关开始，比例逐渐增加，最多15%
        base_ratio = 0.05
        additional_ratio = (self.current_level - 2) * 0.01
        return min(base_ratio + additional_ratio, 0.15)
    
    def _get_hard_ratio(self):
        """根据关卡号获取多血量砖块的比例"""
        # 基础比例为10%，每关增加2%，最多30%
        base_ratio = 0.10
        additional_ratio = (self.current_level - 1) * 0.02
        return min(base_ratio + additional_ratio, 0.30)
    
    def _get_powerup_chance(self):
        """根据关卡号获取道具掉落概率"""
        # 基础概率为20%，每5关降低1%，最少10%
        base_chance = 0.20
        reduction = (self.current_level - 1) // 5 * 0.01
        return max(base_chance - reduction, 0.10)
    
    def count_breakable_bricks(self):
        """计算可破坏砖块的数量"""
        return sum(1 for brick in self.bricks if brick.is_breakable() and not brick.is_destroyed)
    
    def count_total_bricks(self):
        """计算总砖块数量（包括已摧毁的）"""
        return len(self.bricks)
    
    def get_bricks(self):
        """获取当前关卡的砖块列表"""
        return self.bricks
    
    def get_powerup_chance(self):
        """获取当前关卡的道具掉落概率"""
        return self._get_powerup_chance()
    
    def reset(self):
        """重置关卡系统到第1关"""
        self.current_level = 1
        self.bricks = []
