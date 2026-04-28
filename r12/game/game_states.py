from enum import Enum

class GameState(Enum):
    MENU = 'menu'
    PLAYING = 'playing'
    PAUSED = 'paused'
    GAME_OVER = 'game_over'
    HIGH_SCORES = 'high_scores'
    SETTINGS = 'settings'
    ENTER_NICKNAME = 'enter_nickname'
