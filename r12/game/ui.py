import pygame
import sys
import os
from .constants import (
    SCREEN_WIDTH, SCREEN_HEIGHT, WHITE, BLACK, RED, GREEN, YELLOW, BLUE, GRAY, LIGHT_BLUE, DARK_GRAY, PINK
)

CHINESE_FONTS = [
    'simhei',
    'microsoftyahei',
    'msyh',
    'simsun',
    'simkai',
    'simli',
    'stkaiti',
    'stsong',
    'wqy-microhei',
    'wqy-zenhei',
    'NotoSansCJKSC',
    'SourceHanSansCN',
]

class UI:
    def __init__(self):
        self.font_large = None
        self.font_medium = None
        self.font_small = None
        self.use_chinese = True
        self._init_fonts()

    def _init_fonts(self):
        pygame.font.init()
        
        self.font_large = self._try_load_chinese_font(48)
        if not self.font_large:
            self.use_chinese = False
            self.font_large = self._load_default_font(48)
        
        self.font_medium = self._try_load_chinese_font(36)
        if not self.font_medium:
            self.font_medium = self._load_default_font(36)
        
        self.font_small = self._try_load_chinese_font(24)
        if not self.font_small:
            self.font_small = self._load_default_font(24)

    def _try_load_chinese_font(self, size):
        for font_name in CHINESE_FONTS:
            try:
                font = pygame.font.SysFont(font_name, size)
                test = font.render('测试', True, WHITE)
                if test.get_width() > 0:
                    return font
            except:
                continue
        
        try:
            if sys.platform == 'win32':
                font_paths = [
                    'C:\\Windows\\Fonts\\simhei.ttf',
                    'C:\\Windows\\Fonts\\msyh.ttc',
                    'C:\\Windows\\Fonts\\simsun.ttc',
                    'C:\\Windows\\Fonts\\simkai.ttf',
                ]
                for font_path in font_paths:
                    if os.path.exists(font_path):
                        font = pygame.font.Font(font_path, size)
                        return font
        except:
            pass
        
        return None

    def _load_default_font(self, size):
        try:
            return pygame.font.Font(None, size)
        except:
            return pygame.font.Font(pygame.font.get_default_font(), size)

    def draw_text(self, surface, text, x, y, color=WHITE, font='medium', center=False):
        if not self.use_chinese:
            text = self._convert_to_pinyin(text)
        
        try:
            if font == 'large':
                text_surface = self.font_large.render(text, True, color)
            elif font == 'medium':
                text_surface = self.font_medium.render(text, True, color)
            else:
                text_surface = self.font_small.render(text, True, color)
        except:
            try:
                temp_font = pygame.font.Font(pygame.font.get_default_font(), 
                    48 if font == 'large' else (36 if font == 'medium' else 24))
                text_surface = temp_font.render(self._convert_to_pinyin(text), True, color)
            except:
                return pygame.Rect(x, y, 0, 0)
        
        text_rect = text_surface.get_rect()
        if center:
            text_rect.centerx = x
            text_rect.centery = y
        else:
            text_rect.x = x
            text_rect.y = y
        
        surface.blit(text_surface, text_rect)
        return text_rect

    def _convert_to_pinyin(self, text):
        mapping = {
            '飞机大战': 'Plane War',
            '最高分': 'High Score',
            '开始游戏': 'Start Game',
            '排行榜': 'High Scores',
            '设置': 'Settings',
            '退出': 'Quit',
            '得分': 'Score',
            '关卡': 'Level',
            '生命': 'Lives',
            '炸弹': 'Bombs',
            '双倍火力': 'Double Fire',
            '护盾': 'Shield',
            '散射': 'Multi Shot',
            '游戏暂停': 'PAUSED',
            '继续游戏': 'Resume',
            '重新开始': 'Restart',
            '返回主菜单': 'Main Menu',
            '游戏结束': 'GAME OVER',
            '最终得分': 'Final Score',
            '到达关卡': 'Level Reached',
            '新纪录': 'NEW RECORD',
            '再来一局': 'Play Again',
            '主菜单': 'Main Menu',
            '暂无记录': 'No scores yet',
            '排名': 'Rank',
            '玩家名': 'Name',
            '返回': 'Back',
            '游戏设置': 'SETTINGS',
            '音效': 'Sound',
            '开启': 'ON',
            '关闭': 'OFF',
            '自动射击': 'Auto Shoot',
            '修改': 'Change',
            '操作说明': 'Controls',
            '使用': 'Use',
            '或': 'or',
            '方向键': 'Arrows',
            '移动': 'to move',
            '空格键': 'Space',
            '射击': 'to shoot',
            '键': 'Key',
            '暂停': 'Pause',
            '使用炸弹': 'Use Bomb',
            '切换自动射击': 'Toggle Auto',
            '输入玩家名': 'Enter Name',
            '输入后按回车确认': 'Press Enter to confirm',
            '支持字母、数字和下划线': 'Letters, numbers, _ only',
            '确定': 'OK',
            '准备好了': 'Get Ready',
        }
        
        for cn, en in mapping.items():
            if cn in text:
                text = text.replace(cn, en)
        
        return text

    def draw_button(self, surface, text, x, y, width, height, color=BLUE, hover_color=LIGHT_BLUE, text_color=WHITE):
        mouse_pos = pygame.mouse.get_pos()
        button_rect = pygame.Rect(x, y, width, height)
        
        if button_rect.collidepoint(mouse_pos):
            pygame.draw.rect(surface, hover_color, button_rect)
        else:
            pygame.draw.rect(surface, color, button_rect)
        
        pygame.draw.rect(surface, WHITE, button_rect, 2)
        self.draw_text(surface, text, x + width // 2, y + height // 2, text_color, 'medium', True)
        
        return button_rect

    def draw_hud(self, surface, player, level, score):
        self.draw_text(surface, f'得分: {score}', 10, 10, YELLOW, 'small')
        self.draw_text(surface, f'关卡: {level}', SCREEN_WIDTH - 100, 10, GREEN, 'small')
        
        self._draw_lives(surface, player.lives, 10, 35)
        self._draw_bombs(surface, player.bombs, 10, 60)
        
        self._draw_powerup_status(surface, player)

    def _draw_lives(self, surface, lives, x, y):
        for i in range(lives):
            pygame.draw.polygon(surface, GREEN, [
                (x + i * 25, y + 10),
                (x + i * 25 - 8, y + 25),
                (x + i * 25 + 8, y + 25),
            ])
        
        self.draw_text(surface, '生命:', x, y - 5, WHITE, 'small')

    def _draw_bombs(self, surface, bombs, x, y):
        for i in range(bombs):
            pygame.draw.circle(surface, RED, (x + i * 25 + 10, y + 10), 8)
            pygame.draw.line(surface, YELLOW, (x + i * 25 + 10, y), (x + i * 25 + 10, y - 5), 2)
        
        self.draw_text(surface, '炸弹:', x, y - 5, WHITE, 'small')

    def _draw_powerup_status(self, surface, player):
        y = 100
        status = []
        
        if player.has_double_fire:
            status.append(('双倍火力', YELLOW))
        if player.has_shield:
            status.append(('护盾', LIGHT_BLUE))
        if player.has_multi_shot:
            status.append(('散射', PINK))
        
        for text, color in status:
            self.draw_text(surface, text, 10, y, color, 'small')
            y += 20

    def draw_menu(self, surface, high_score):
        overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
        overlay.fill((0, 0, 0, 180))
        surface.blit(overlay, (0, 0))
        
        self.draw_text(surface, '飞机大战', SCREEN_WIDTH // 2, 150, YELLOW, 'large', True)
        
        self.draw_text(surface, f'最高分: {high_score}', SCREEN_WIDTH // 2, 220, GREEN, 'medium', True)
        
        buttons = []
        buttons.append(self.draw_button(surface, '开始游戏', SCREEN_WIDTH // 2 - 100, 300, 200, 50))
        buttons.append(self.draw_button(surface, '排行榜', SCREEN_WIDTH // 2 - 100, 370, 200, 50))
        buttons.append(self.draw_button(surface, '设置', SCREEN_WIDTH // 2 - 100, 440, 200, 50))
        buttons.append(self.draw_button(surface, '退出', SCREEN_WIDTH // 2 - 100, 510, 200, 50))
        
        self.draw_text(surface, '使用 WASD或方向键移动，空格键射击', SCREEN_WIDTH // 2, 600, GRAY, 'small', True)
        self.draw_text(surface, 'P暂停，B使用炸弹，F切换自动射击', SCREEN_WIDTH // 2, 630, GRAY, 'small', True)
        
        return buttons

    def draw_pause(self, surface):
        overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
        overlay.fill((0, 0, 0, 180))
        surface.blit(overlay, (0, 0))
        
        self.draw_text(surface, '游戏暂停', SCREEN_WIDTH // 2, 200, YELLOW, 'large', True)
        
        buttons = []
        buttons.append(self.draw_button(surface, '继续游戏', SCREEN_WIDTH // 2 - 100, 300, 200, 50))
        buttons.append(self.draw_button(surface, '重新开始', SCREEN_WIDTH // 2 - 100, 370, 200, 50))
        buttons.append(self.draw_button(surface, '返回主菜单', SCREEN_WIDTH // 2 - 100, 440, 200, 50))
        
        return buttons

    def draw_game_over(self, surface, score, level, is_high_score):
        overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
        overlay.fill((0, 0, 0, 200))
        surface.blit(overlay, (0, 0))
        
        self.draw_text(surface, '游戏结束', SCREEN_WIDTH // 2, 150, RED, 'large', True)
        
        self.draw_text(surface, f'最终得分: {score}', SCREEN_WIDTH // 2, 230, YELLOW, 'medium', True)
        self.draw_text(surface, f'到达关卡: {level}', SCREEN_WIDTH // 2, 280, GREEN, 'medium', True)
        
        if is_high_score:
            self.draw_text(surface, '新纪录！', SCREEN_WIDTH // 2, 330, RED, 'medium', True)
        
        buttons = []
        buttons.append(self.draw_button(surface, '再来一局', SCREEN_WIDTH // 2 - 100, 400, 200, 50))
        buttons.append(self.draw_button(surface, '排行榜', SCREEN_WIDTH // 2 - 100, 470, 200, 50))
        buttons.append(self.draw_button(surface, '主菜单', SCREEN_WIDTH // 2 - 100, 540, 200, 50))
        
        return buttons

    def draw_high_scores(self, surface, rankings):
        overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
        overlay.fill((0, 0, 0, 200))
        surface.blit(overlay, (0, 0))
        
        self.draw_text(surface, '排行榜', SCREEN_WIDTH // 2, 80, YELLOW, 'large', True)
        
        if not rankings:
            self.draw_text(surface, '暂无记录！', SCREEN_WIDTH // 2, 250, GRAY, 'medium', True)
        else:
            self.draw_text(surface, '排名', 80, 120, WHITE, 'small')
            self.draw_text(surface, '玩家名', 160, 120, WHITE, 'small')
            self.draw_text(surface, '得分', 350, 120, YELLOW, 'small')
            self.draw_text(surface, '关卡', 450, 120, GREEN, 'small')
            
            for i, entry in enumerate(rankings[:10]):
                y = 150 + i * 35
                rank_color = YELLOW if i == 0 else (GREEN if i < 3 else WHITE)
                
                self.draw_text(surface, f'{i + 1}.', 80, y, rank_color, 'small')
                self.draw_text(surface, entry['nickname'][:12], 160, y, WHITE, 'small')
                self.draw_text(surface, str(entry['score']), 350, y, YELLOW, 'small')
                self.draw_text(surface, str(entry['level']), 450, y, GREEN, 'small')
        
        buttons = []
        buttons.append(self.draw_button(surface, '返回', SCREEN_WIDTH // 2 - 100, 600, 200, 50))
        
        return buttons

    def draw_settings(self, surface, settings_manager, sound_manager):
        overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
        overlay.fill((0, 0, 0, 200))
        surface.blit(overlay, (0, 0))
        
        self.draw_text(surface, '游戏设置', SCREEN_WIDTH // 2, 80, YELLOW, 'large', True)
        
        y = 150
        
        sound_enabled = settings_manager.is_sound_enabled()
        sound_text = '音效: 开启' if sound_enabled else '音效: 关闭'
        sound_color = GREEN if sound_enabled else RED
        sound_btn = self.draw_button(surface, sound_text, SCREEN_WIDTH // 2 - 100, y, 200, 40, sound_color, (sound_color[0] + 50, sound_color[1] + 50, sound_color[2] + 50))
        
        y += 60
        auto_shoot = settings_manager.is_auto_shoot_enabled()
        auto_text = '自动射击: 开启' if auto_shoot else '自动射击: 关闭'
        auto_color = GREEN if auto_shoot else RED
        auto_btn = self.draw_button(surface, auto_text, SCREEN_WIDTH // 2 - 100, y, 200, 40, auto_color, (auto_color[0] + 50, auto_color[1] + 50, auto_color[2] + 50))
        
        y += 60
        nickname = settings_manager.get_default_nickname()
        self.draw_text(surface, f'玩家名: {nickname}', SCREEN_WIDTH // 2 - 100, y, WHITE, 'small')
        nick_btn = self.draw_button(surface, '修改', SCREEN_WIDTH // 2 + 30, y - 10, 70, 30)
        
        y += 60
        self.draw_text(surface, '操作说明:', SCREEN_WIDTH // 2 - 100, y, YELLOW, 'small')
        y += 30
        self.draw_text(surface, 'WASD或方向键 - 移动', SCREEN_WIDTH // 2 - 100, y, GRAY, 'small')
        y += 25
        self.draw_text(surface, '空格键 - 射击', SCREEN_WIDTH // 2 - 100, y, GRAY, 'small')
        y += 25
        self.draw_text(surface, 'P键 - 暂停', SCREEN_WIDTH // 2 - 100, y, GRAY, 'small')
        y += 25
        self.draw_text(surface, 'B键 - 使用炸弹', SCREEN_WIDTH // 2 - 100, y, GRAY, 'small')
        y += 25
        self.draw_text(surface, 'F键 - 切换自动射击', SCREEN_WIDTH // 2 - 100, y, GRAY, 'small')
        
        buttons = []
        buttons.append(('sound', sound_btn))
        buttons.append(('auto_shoot', auto_btn))
        buttons.append(('nickname', nick_btn))
        
        back_btn = self.draw_button(surface, '返回', SCREEN_WIDTH // 2 - 100, 600, 200, 50)
        buttons.append(('back', back_btn))
        
        return buttons

    def draw_nickname_input(self, surface, current_nickname):
        overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
        overlay.fill((0, 0, 0, 220))
        surface.blit(overlay, (0, 0))
        
        self.draw_text(surface, '输入玩家名', SCREEN_WIDTH // 2, 200, YELLOW, 'large', True)
        
        input_rect = pygame.Rect(SCREEN_WIDTH // 2 - 150, 300, 300, 50)
        pygame.draw.rect(surface, DARK_GRAY, input_rect)
        pygame.draw.rect(surface, WHITE, input_rect, 2)
        
        display_name = current_nickname if current_nickname else '_'
        self.draw_text(surface, display_name, input_rect.centerx, input_rect.centery, WHITE, 'medium', True)
        
        self.draw_text(surface, '输入后按回车确认', SCREEN_WIDTH // 2, 400, GRAY, 'small', True)
        self.draw_text(surface, '支持字母、数字和下划线', SCREEN_WIDTH // 2, 430, GRAY, 'small', True)
        
        buttons = []
        buttons.append(self.draw_button(surface, '确定', SCREEN_WIDTH // 2 - 100, 480, 200, 50))
        
        return buttons, input_rect

    def draw_level_up(self, surface, level):
        self.draw_text(surface, f'关卡 {level}', SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 - 50, YELLOW, 'large', True)
        self.draw_text(surface, '准备好了！', SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + 20, WHITE, 'medium', True)
