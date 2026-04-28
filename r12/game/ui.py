import pygame
from .constants import (
    SCREEN_WIDTH, SCREEN_HEIGHT, WHITE, BLACK, RED, GREEN, YELLOW, BLUE, GRAY, LIGHT_BLUE, DARK_GRAY, PINK
)

class UI:
    def __init__(self):
        self.font_large = None
        self.font_medium = None
        self.font_small = None
        self._init_fonts()

    def _init_fonts(self):
        pygame.font.init()
        try:
            self.font_large = pygame.font.Font(None, 48)
            self.font_medium = pygame.font.Font(None, 36)
            self.font_small = pygame.font.Font(None, 24)
        except:
            self.font_large = pygame.font.Font(pygame.font.get_default_font(), 48)
            self.font_medium = pygame.font.Font(pygame.font.get_default_font(), 36)
            self.font_small = pygame.font.Font(pygame.font.get_default_font(), 24)

    def draw_text(self, surface, text, x, y, color=WHITE, font='medium', center=False):
        if font == 'large':
            text_surface = self.font_large.render(text, True, color)
        elif font == 'medium':
            text_surface = self.font_medium.render(text, True, color)
        else:
            text_surface = self.font_small.render(text, True, color)
        
        text_rect = text_surface.get_rect()
        if center:
            text_rect.centerx = x
            text_rect.centery = y
        else:
            text_rect.x = x
            text_rect.y = y
        
        surface.blit(text_surface, text_rect)
        return text_rect

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
        self.draw_text(surface, f'Score: {score}', 10, 10, YELLOW, 'small')
        self.draw_text(surface, f'Level: {level}', SCREEN_WIDTH - 100, 10, GREEN, 'small')
        
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
        
        self.draw_text(surface, 'Lives:', x, y - 5, WHITE, 'small')

    def _draw_bombs(self, surface, bombs, x, y):
        for i in range(bombs):
            pygame.draw.circle(surface, RED, (x + i * 25 + 10, y + 10), 8)
            pygame.draw.line(surface, YELLOW, (x + i * 25 + 10, y), (x + i * 25 + 10, y - 5), 2)
        
        self.draw_text(surface, 'Bombs:', x, y - 5, WHITE, 'small')

    def _draw_powerup_status(self, surface, player):
        y = 100
        status = []
        
        if player.has_double_fire:
            status.append(('Double Fire', YELLOW))
        if player.has_shield:
            status.append(('Shield', LIGHT_BLUE))
        if player.has_multi_shot:
            status.append(('Multi Shot', PINK if 'PINK' in dir() else (255, 192, 203)))
        
        for text, color in status:
            self.draw_text(surface, text, 10, y, color, 'small')
            y += 20

    def draw_menu(self, surface, high_score):
        overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
        overlay.fill((0, 0, 0, 180))
        surface.blit(overlay, (0, 0))
        
        self.draw_text(surface, 'PLANE WAR', SCREEN_WIDTH // 2, 150, YELLOW, 'large', True)
        
        self.draw_text(surface, f'High Score: {high_score}', SCREEN_WIDTH // 2, 220, GREEN, 'medium', True)
        
        buttons = []
        buttons.append(self.draw_button(surface, 'Start Game', SCREEN_WIDTH // 2 - 100, 300, 200, 50))
        buttons.append(self.draw_button(surface, 'High Scores', SCREEN_WIDTH // 2 - 100, 370, 200, 50))
        buttons.append(self.draw_button(surface, 'Settings', SCREEN_WIDTH // 2 - 100, 440, 200, 50))
        buttons.append(self.draw_button(surface, 'Quit', SCREEN_WIDTH // 2 - 100, 510, 200, 50))
        
        self.draw_text(surface, 'Use WASD/Arrows to move, Space to shoot', SCREEN_WIDTH // 2, 600, GRAY, 'small', True)
        self.draw_text(surface, 'P to pause, B to use bomb, F to toggle auto-fire', SCREEN_WIDTH // 2, 630, GRAY, 'small', True)
        
        return buttons

    def draw_pause(self, surface):
        overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
        overlay.fill((0, 0, 0, 180))
        surface.blit(overlay, (0, 0))
        
        self.draw_text(surface, 'PAUSED', SCREEN_WIDTH // 2, 200, YELLOW, 'large', True)
        
        buttons = []
        buttons.append(self.draw_button(surface, 'Resume', SCREEN_WIDTH // 2 - 100, 300, 200, 50))
        buttons.append(self.draw_button(surface, 'Restart', SCREEN_WIDTH // 2 - 100, 370, 200, 50))
        buttons.append(self.draw_button(surface, 'Main Menu', SCREEN_WIDTH // 2 - 100, 440, 200, 50))
        
        return buttons

    def draw_game_over(self, surface, score, level, is_high_score):
        overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
        overlay.fill((0, 0, 0, 200))
        surface.blit(overlay, (0, 0))
        
        self.draw_text(surface, 'GAME OVER', SCREEN_WIDTH // 2, 150, RED, 'large', True)
        
        self.draw_text(surface, f'Final Score: {score}', SCREEN_WIDTH // 2, 230, YELLOW, 'medium', True)
        self.draw_text(surface, f'Level Reached: {level}', SCREEN_WIDTH // 2, 280, GREEN, 'medium', True)
        
        if is_high_score:
            self.draw_text(surface, 'NEW HIGH SCORE!', SCREEN_WIDTH // 2, 330, RED, 'medium', True)
        
        buttons = []
        buttons.append(self.draw_button(surface, 'Play Again', SCREEN_WIDTH // 2 - 100, 400, 200, 50))
        buttons.append(self.draw_button(surface, 'High Scores', SCREEN_WIDTH // 2 - 100, 470, 200, 50))
        buttons.append(self.draw_button(surface, 'Main Menu', SCREEN_WIDTH // 2 - 100, 540, 200, 50))
        
        return buttons

    def draw_high_scores(self, surface, rankings):
        overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
        overlay.fill((0, 0, 0, 200))
        surface.blit(overlay, (0, 0))
        
        self.draw_text(surface, 'HIGH SCORES', SCREEN_WIDTH // 2, 80, YELLOW, 'large', True)
        
        if not rankings:
            self.draw_text(surface, 'No scores yet!', SCREEN_WIDTH // 2, 250, GRAY, 'medium', True)
        else:
            for i, entry in enumerate(rankings[:10]):
                y = 140 + i * 40
                rank_color = YELLOW if i == 0 else (GREEN if i < 3 else WHITE)
                
                self.draw_text(surface, f'{i + 1}.', 80, y, rank_color, 'small')
                self.draw_text(surface, entry['nickname'][:15], 130, y, WHITE, 'small')
                self.draw_text(surface, str(entry['score']), 350, y, YELLOW, 'small')
                self.draw_text(surface, f'Lvl {entry["level"]}', 450, y, GREEN, 'small')
        
        buttons = []
        buttons.append(self.draw_button(surface, 'Back', SCREEN_WIDTH // 2 - 100, 600, 200, 50))
        
        return buttons

    def draw_settings(self, surface, settings_manager, sound_manager):
        overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
        overlay.fill((0, 0, 0, 200))
        surface.blit(overlay, (0, 0))
        
        self.draw_text(surface, 'SETTINGS', SCREEN_WIDTH // 2, 80, YELLOW, 'large', True)
        
        y = 150
        
        sound_enabled = settings_manager.is_sound_enabled()
        sound_text = 'Sound: ON' if sound_enabled else 'Sound: OFF'
        sound_color = GREEN if sound_enabled else RED
        sound_btn = self.draw_button(surface, sound_text, SCREEN_WIDTH // 2 - 100, y, 200, 40, sound_color, (sound_color[0] + 50, sound_color[1] + 50, sound_color[2] + 50))
        
        y += 60
        auto_shoot = settings_manager.is_auto_shoot_enabled()
        auto_text = 'Auto Shoot: ON' if auto_shoot else 'Auto Shoot: OFF'
        auto_color = GREEN if auto_shoot else RED
        auto_btn = self.draw_button(surface, auto_text, SCREEN_WIDTH // 2 - 100, y, 200, 40, auto_color, (auto_color[0] + 50, auto_color[1] + 50, auto_color[2] + 50))
        
        y += 60
        nickname = settings_manager.get_default_nickname()
        self.draw_text(surface, f'Nickname: {nickname}', SCREEN_WIDTH // 2 - 100, y, WHITE, 'small')
        nick_btn = self.draw_button(surface, 'Change', SCREEN_WIDTH // 2 + 20, y - 10, 80, 30)
        
        y += 60
        self.draw_text(surface, 'Controls:', SCREEN_WIDTH // 2 - 100, y, YELLOW, 'small')
        y += 30
        self.draw_text(surface, 'WASD/Arrows - Move', SCREEN_WIDTH // 2 - 100, y, GRAY, 'small')
        y += 25
        self.draw_text(surface, 'Space - Shoot', SCREEN_WIDTH // 2 - 100, y, GRAY, 'small')
        y += 25
        self.draw_text(surface, 'P - Pause', SCREEN_WIDTH // 2 - 100, y, GRAY, 'small')
        y += 25
        self.draw_text(surface, 'B - Use Bomb', SCREEN_WIDTH // 2 - 100, y, GRAY, 'small')
        y += 25
        self.draw_text(surface, 'F - Toggle Auto-Fire', SCREEN_WIDTH // 2 - 100, y, GRAY, 'small')
        
        buttons = []
        buttons.append(('sound', sound_btn))
        buttons.append(('auto_shoot', auto_btn))
        buttons.append(('nickname', nick_btn))
        
        back_btn = self.draw_button(surface, 'Back', SCREEN_WIDTH // 2 - 100, 600, 200, 50)
        buttons.append(('back', back_btn))
        
        return buttons

    def draw_nickname_input(self, surface, current_nickname):
        overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
        overlay.fill((0, 0, 0, 220))
        surface.blit(overlay, (0, 0))
        
        self.draw_text(surface, 'Enter Nickname', SCREEN_WIDTH // 2, 200, YELLOW, 'large', True)
        
        input_rect = pygame.Rect(SCREEN_WIDTH // 2 - 150, 300, 300, 50)
        pygame.draw.rect(surface, DARK_GRAY, input_rect)
        pygame.draw.rect(surface, WHITE, input_rect, 2)
        
        self.draw_text(surface, current_nickname, input_rect.centerx, input_rect.centery, WHITE, 'medium', True)
        
        self.draw_text(surface, 'Type your name and press Enter', SCREEN_WIDTH // 2, 400, GRAY, 'small', True)
        
        buttons = []
        buttons.append(self.draw_button(surface, 'OK', SCREEN_WIDTH // 2 - 100, 450, 200, 50))
        
        return buttons, input_rect

    def draw_level_up(self, surface, level):
        self.draw_text(surface, f'LEVEL {level}', SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 - 50, YELLOW, 'large', True)
        self.draw_text(surface, 'Get Ready!', SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + 20, WHITE, 'medium', True)
