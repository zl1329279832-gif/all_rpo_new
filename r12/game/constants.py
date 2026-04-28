import pygame

SCREEN_WIDTH = 480
SCREEN_HEIGHT = 700
FPS = 60

WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
RED = (255, 0, 0)
GREEN = (0, 255, 0)
BLUE = (0, 0, 255)
YELLOW = (255, 255, 0)
GRAY = (128, 128, 128)
LIGHT_BLUE = (173, 216, 230)
DARK_GRAY = (64, 64, 64)
PURPLE = (128, 0, 128)
ORANGE = (255, 165, 0)
PINK = (255, 192, 203)

PLAYER_SPEED = 5
PLAYER_LIVES = 3
PLAYER_BULLET_SPEED = 10
PLAYER_BULLET_DAMAGE = 1
PLAYER_SHOOT_DELAY = 200

ENEMY_TYPES = {
    'small': {
        'width': 30,
        'height': 30,
        'speed': 2,
        'health': 1,
        'score': 100,
        'color': GRAY,
        'shoot_chance': 0.002,
        'spawn_weight': 5
    },
    'medium': {
        'width': 50,
        'height': 40,
        'speed': 1.5,
        'health': 3,
        'score': 300,
        'color': ORANGE,
        'shoot_chance': 0.005,
        'spawn_weight': 3
    },
    'large': {
        'width': 70,
        'height': 55,
        'speed': 1,
        'health': 5,
        'score': 500,
        'color': PURPLE,
        'shoot_chance': 0.01,
        'spawn_weight': 2
    }
}

BOSS_CONFIG = {
    'width': 120,
    'height': 100,
    'speed': 2,
    'health': 50,
    'score': 5000,
    'color': RED,
    'shoot_interval': 1500,
    'appear_every_level': 3
}

ENEMY_BULLET_SPEED = 5
ENEMY_BULLET_DAMAGE = 1

POWERUP_TYPES = {
    'double_fire': {
        'color': YELLOW,
        'duration': 10000,
        'description': '双倍火力'
    },
    'shield': {
        'color': LIGHT_BLUE,
        'duration': 8000,
        'description': '护盾'
    },
    'health': {
        'color': GREEN,
        'duration': 0,
        'description': '回血'
    },
    'bomb': {
        'color': RED,
        'duration': 0,
        'description': '清屏炸弹'
    },
    'multi_shot': {
        'color': PINK,
        'duration': 8000,
        'description': '多弹道射击'
    }
}

EXPLOSION_FRAMES = 5
EXPLOSION_DURATION = 500

DATA_DIR = 'data'
SETTINGS_FILE = 'data/settings.json'
RANKINGS_FILE = 'data/rankings.json'

MAX_RANKINGS = 10

DEFAULT_SETTINGS = {
    'sound_enabled': True,
    'music_enabled': True,
    'sound_volume': 0.5,
    'music_volume': 0.3,
    'window_width': SCREEN_WIDTH,
    'window_height': SCREEN_HEIGHT,
    'default_nickname': 'Player',
    'high_score': 0,
    'auto_shoot': False
}

DEFAULT_RANKINGS = []

MOVE_PATTERNS = ['straight', 'zigzag', 'sine', 'diagonal']
