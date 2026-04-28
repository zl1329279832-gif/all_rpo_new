import os
import json

class Config:
    """游戏配置类，负责管理游戏设置和数据持久化"""
    
    # 游戏常量
    SCREEN_WIDTH = 800
    SCREEN_HEIGHT = 600
    FPS = 60
    PADDLE_SPEED = 8
    BALL_SPEED = 5
    INITIAL_LIVES = 3
    
    # 颜色定义
    WHITE = (255, 255, 255)
    BLACK = (0, 0, 0)
    RED = (255, 0, 0)
    GREEN = (0, 255, 0)
    BLUE = (0, 0, 255)
    YELLOW = (255, 255, 0)
    ORANGE = (255, 165, 0)
    PURPLE = (128, 0, 128)
    GRAY = (128, 128, 128)
    DARK_GRAY = (64, 64, 64)
    GOLD = (255, 215, 0)
    CYAN = (0, 255, 255)
    PINK = (255, 192, 203)
    
    # 砖块类型
    BRICK_NORMAL = 1
    BRICK_HARD = 2
    BRICK_UNBREAKABLE = 3
    
    # 道具类型
    POWERUP_EXPAND = 1  # 挡板变长
    POWERUP_SHRINK = 2  # 挡板变短
    POWERUP_SPEED = 3   # 小球加速
    POWERUP_LIFE = 4    # 额外生命
    POWERUP_PIERCE = 5  # 穿透球
    POWERUP_MULTI = 6   # 多球模式
    
    # 数据文件路径
    DATA_DIR = os.path.join(os.getcwd(), 'data')
    SETTINGS_FILE = os.path.join(DATA_DIR, 'settings.json')
    RANKINGS_FILE = os.path.join(DATA_DIR, 'rankings.json')
    
    # 默认设置
    DEFAULT_SETTINGS = {
        'sound_enabled': True,
        'screen_width': 800,
        'screen_height': 600,
        'default_nickname': 'Player',
        'high_score': 0
    }
    
    # 默认排行榜
    DEFAULT_RANKINGS = []
    
    @staticmethod
    def ensure_data_dir():
        """确保数据目录存在"""
        if not os.path.exists(Config.DATA_DIR):
            os.makedirs(Config.DATA_DIR)
    
    @staticmethod
    def load_settings():
        """加载设置文件，如果不存在则创建默认设置"""
        Config.ensure_data_dir()
        
        if os.path.exists(Config.SETTINGS_FILE):
            try:
                with open(Config.SETTINGS_FILE, 'r', encoding='utf-8') as f:
                    settings = json.load(f)
                    # 合并默认设置和加载的设置
                    for key, value in Config.DEFAULT_SETTINGS.items():
                        if key not in settings:
                            settings[key] = value
                    return settings
            except (json.JSONDecodeError, IOError):
                pass
        
        # 如果文件不存在或加载失败，创建默认设置
        settings = Config.DEFAULT_SETTINGS.copy()
        Config.save_settings(settings)
        return settings
    
    @staticmethod
    def save_settings(settings):
        """保存设置到文件"""
        Config.ensure_data_dir()
        
        try:
            with open(Config.SETTINGS_FILE, 'w', encoding='utf-8') as f:
                json.dump(settings, f, indent=4, ensure_ascii=False)
        except IOError:
            print(f"无法保存设置到 {Config.SETTINGS_FILE}")
    
    @staticmethod
    def load_rankings():
        """加载排行榜文件，如果不存在则创建默认排行榜"""
        Config.ensure_data_dir()
        
        if os.path.exists(Config.RANKINGS_FILE):
            try:
                with open(Config.RANKINGS_FILE, 'r', encoding='utf-8') as f:
                    rankings = json.load(f)
                    # 确保排行榜是列表
                    if not isinstance(rankings, list):
                        rankings = []
                    return rankings
            except (json.JSONDecodeError, IOError):
                pass
        
        # 如果文件不存在或加载失败，创建默认排行榜
        rankings = Config.DEFAULT_RANKINGS.copy()
        Config.save_rankings(rankings)
        return rankings
    
    @staticmethod
    def save_rankings(rankings):
        """保存排行榜到文件"""
        Config.ensure_data_dir()
        
        try:
            # 按分数排序，只保留前10名
            sorted_rankings = sorted(rankings, key=lambda x: x['score'], reverse=True)[:10]
            with open(Config.RANKINGS_FILE, 'w', encoding='utf-8') as f:
                json.dump(sorted_rankings, f, indent=4, ensure_ascii=False)
        except IOError:
            print(f"无法保存排行榜到 {Config.RANKINGS_FILE}")
    
    @staticmethod
    def add_to_rankings(nickname, score, level):
        """添加新的分数到排行榜"""
        rankings = Config.load_rankings()
        rankings.append({
            'nickname': nickname,
            'score': score,
            'level': level
        })
        Config.save_rankings(rankings)
