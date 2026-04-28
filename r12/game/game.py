import pygame
import sys
from .constants import SCREEN_WIDTH, SCREEN_HEIGHT, FPS, WHITE, BLACK, RED, GREEN, YELLOW
from .game_states import GameState
from .background import Background
from .player import Player
from .enemy_manager import EnemyManager
from .powerups import PowerUpManager
from .explosions import ExplosionManager
from .sound_manager import SoundManager
from .settings_manager import SettingsManager
from .rankings_manager import RankingsManager
from .ui import UI

class Game:
    def __init__(self):
        pygame.init()
        
        self.settings_manager = SettingsManager()
        self.rankings_manager = RankingsManager()
        
        window_size = self.settings_manager.get_window_size()
        self.screen = pygame.display.set_mode(window_size)
        pygame.display.set_caption('Plane War')
        
        self.clock = pygame.time.Clock()
        
        self.state = GameState.MENU
        
        self.background = Background()
        self.player = None
        self.enemy_manager = EnemyManager()
        self.powerup_manager = PowerUpManager()
        self.explosion_manager = ExplosionManager()
        self.sound_manager = SoundManager()
        self.ui = UI()
        
        self.level = 1
        self.score = 0
        self.score_for_next_level = 1000
        
        self.nickname = self.settings_manager.get_default_nickname()
        self.nickname_input = self.nickname
        
        self.running = True
        self.level_up_timer = 0
        self.show_level_up = False

    def run(self):
        while self.running:
            dt = self.clock.tick(FPS)
            
            self._handle_events()
            
            self._update(dt)
            
            self._draw()
            
            pygame.display.flip()
        
        pygame.quit()
        sys.exit()

    def _handle_events(self):
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False
            
            elif event.type == pygame.KEYDOWN:
                self._handle_key_down(event)
            
            elif event.type == pygame.MOUSEBUTTONDOWN:
                if event.button == 1:
                    self._handle_click(pygame.mouse.get_pos())

    def _handle_key_down(self, event):
        if self.state == GameState.PLAYING:
            if event.key == pygame.K_p:
                self._toggle_pause()
            elif event.key == pygame.K_b:
                self._use_bomb()
            elif event.key == pygame.K_f:
                if self.player:
                    self.player.auto_shoot = not self.player.auto_shoot
                    self.settings_manager.set('auto_shoot', self.player.auto_shoot)
                    self.settings_manager.save()
        
        elif self.state == GameState.PAUSED:
            if event.key == pygame.K_p or event.key == pygame.K_ESCAPE:
                self._toggle_pause()
        
        elif self.state == GameState.ENTER_NICKNAME:
            if event.key == pygame.K_BACKSPACE:
                self.nickname_input = self.nickname_input[:-1]
            elif event.key == pygame.K_RETURN:
                self._confirm_nickname()
            elif event.key == pygame.K_ESCAPE:
                self.state = GameState.SETTINGS
            else:
                if len(self.nickname_input) < 15:
                    if event.unicode.isalnum() or event.unicode in [' ', '_', '-']:
                        self.nickname_input += event.unicode

    def _handle_click(self, pos):
        if self.state == GameState.MENU:
            self._handle_menu_click(pos)
        elif self.state == GameState.PAUSED:
            self._handle_pause_click(pos)
        elif self.state == GameState.GAME_OVER:
            self._handle_game_over_click(pos)
        elif self.state == GameState.HIGH_SCORES:
            self._handle_high_scores_click(pos)
        elif self.state == GameState.SETTINGS:
            self._handle_settings_click(pos)
        elif self.state == GameState.ENTER_NICKNAME:
            self._handle_nickname_click(pos)

    def _handle_menu_click(self, pos):
        buttons = self._get_menu_buttons()
        if not buttons:
            return
        
        button_rects = buttons
        if len(button_rects) >= 4:
            if button_rects[0].collidepoint(pos):
                self._start_game()
            elif button_rects[1].collidepoint(pos):
                self.state = GameState.HIGH_SCORES
            elif button_rects[2].collidepoint(pos):
                self.state = GameState.SETTINGS
            elif button_rects[3].collidepoint(pos):
                self.running = False

    def _handle_pause_click(self, pos):
        buttons = self._get_pause_buttons()
        if not buttons:
            return
        
        if len(buttons) >= 3:
            if buttons[0].collidepoint(pos):
                self._toggle_pause()
            elif buttons[1].collidepoint(pos):
                self._restart_game()
            elif buttons[2].collidepoint(pos):
                self._go_to_menu()

    def _handle_game_over_click(self, pos):
        buttons = self._get_game_over_buttons()
        if not buttons:
            return
        
        if len(buttons) >= 3:
            if buttons[0].collidepoint(pos):
                self._restart_game()
            elif buttons[1].collidepoint(pos):
                self.state = GameState.HIGH_SCORES
            elif buttons[2].collidepoint(pos):
                self._go_to_menu()

    def _handle_high_scores_click(self, pos):
        buttons = self._get_high_scores_buttons()
        if not buttons:
            return
        
        if buttons[0].collidepoint(pos):
            self._go_to_menu()

    def _handle_settings_click(self, pos):
        buttons = self._get_settings_buttons()
        if not buttons:
            return
        
        for name, rect in buttons:
            if rect.collidepoint(pos):
                if name == 'sound':
                    self.settings_manager.toggle_sound()
                elif name == 'auto_shoot':
                    self.settings_manager.toggle_auto_shoot()
                elif name == 'nickname':
                    self.nickname_input = self.nickname
                    self.state = GameState.ENTER_NICKNAME
                elif name == 'back':
                    self._go_to_menu()
                break

    def _handle_nickname_click(self, pos):
        buttons, _ = self._get_nickname_buttons()
        if buttons and buttons[0].collidepoint(pos):
            self._confirm_nickname()

    def _get_menu_buttons(self):
        return []

    def _get_pause_buttons(self):
        return []

    def _get_game_over_buttons(self):
        return []

    def _get_high_scores_buttons(self):
        return []

    def _get_settings_buttons(self):
        return []

    def _get_nickname_buttons(self):
        return [], None

    def _update(self, dt):
        self.background.update()
        
        if self.state == GameState.PLAYING:
            self._update_game(dt)
        
        self.explosion_manager.update()

    def _update_game(self, dt):
        keys = pygame.key.get_pressed()
        
        if self.player:
            self.player.update(dt, keys)
        
        if self.player:
            player_pos = (self.player.x, self.player.y)
        else:
            player_pos = (SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2)
        
        self.enemy_manager.update(dt, self.level, player_pos)
        self.powerup_manager.update(dt)
        
        self._check_collisions()
        
        self._check_level_up()
        
        if self.show_level_up:
            elapsed = pygame.time.get_ticks() - self.level_up_timer
            if elapsed > 2000:
                self.show_level_up = False

    def _check_collisions(self):
        if not self.player or not self.player.alive:
            return
        
        player_bullets = self.player.get_active_bullets()
        for bullet in player_bullets[:]:
            for enemy in self.enemy_manager.get_all_enemies():
                if bullet.get_rect().colliderect(enemy.get_rect()):
                    bullet.kill()
                    if enemy.take_damage(bullet.damage):
                        self.score += enemy.score
                        self.settings_manager.update_high_score(self.score)
                        self.enemy_manager.register_kill(enemy.score)
                        
                        size = 'large' if hasattr(enemy, 'boss') else 'medium'
                        self.explosion_manager.spawn_explosion(enemy.x, enemy.y, size)
                        self.sound_manager.play_sound('explosion')
                        
                        self.powerup_manager.spawn_powerup(enemy.x, enemy.y)
        
        enemy_bullets = self.enemy_manager.get_active_bullets()
        for bullet in enemy_bullets[:]:
            if bullet.get_rect().colliderect(self.player.get_rect()):
                bullet.kill()
                if self.player.take_damage(bullet.damage):
                    self._game_over()
                else:
                    self.sound_manager.play_sound('hit')
        
        for enemy in self.enemy_manager.get_all_enemies():
            if enemy.get_rect().colliderect(self.player.get_rect()):
                if self.player.take_damage(1):
                    self._game_over()
                else:
                    self.sound_manager.play_sound('hit')
                if hasattr(enemy, 'boss'):
                    enemy.take_damage(5)
                else:
                    enemy.kill()
        
        collected = self.powerup_manager.check_collisions(self.player)
        if collected:
            self.sound_manager.play_sound('powerup')

    def _check_level_up(self):
        if self.score >= self.score_for_next_level:
            self.level += 1
            self.score_for_next_level = self.level * 1000
            self.show_level_up = True
            self.level_up_timer = pygame.time.get_ticks()
            self.sound_manager.play_sound('level_up')
            
            self.enemy_manager.enemies.clear()
            
            self.player.add_health(1)

    def _draw(self):
        self.background.draw(self.screen)
        
        if self.state == GameState.MENU:
            self._draw_menu()
        elif self.state == GameState.PLAYING:
            self._draw_game()
        elif self.state == GameState.PAUSED:
            self._draw_game()
            self._draw_pause()
        elif self.state == GameState.GAME_OVER:
            self._draw_game()
            self._draw_game_over()
        elif self.state == GameState.HIGH_SCORES:
            self._draw_high_scores()
        elif self.state == GameState.SETTINGS:
            self._draw_settings()
        elif self.state == GameState.ENTER_NICKNAME:
            self._draw_nickname_input()

    def _draw_menu(self):
        high_score = self.settings_manager.get_high_score()
        buttons = self.ui.draw_menu(self.screen, high_score)
        self._last_menu_buttons = buttons

    def _get_menu_buttons(self):
        return getattr(self, '_last_menu_buttons', [])

    def _draw_game(self):
        if self.player:
            self.player.draw(self.screen)
        
        self.enemy_manager.draw(self.screen)
        self.powerup_manager.draw(self.screen)
        self.explosion_manager.draw(self.screen)
        
        if self.player:
            self.ui.draw_hud(self.screen, self.player, self.level, self.score)
        
        if self.show_level_up:
            self.ui.draw_level_up(self.screen, self.level)

    def _draw_pause(self):
        buttons = self.ui.draw_pause(self.screen)
        self._last_pause_buttons = buttons

    def _get_pause_buttons(self):
        return getattr(self, '_last_pause_buttons', [])

    def _draw_game_over(self):
        is_high_score = self.rankings_manager.is_high_score(self.score)
        buttons = self.ui.draw_game_over(self.screen, self.score, self.level, is_high_score)
        self._last_game_over_buttons = buttons

    def _get_game_over_buttons(self):
        return getattr(self, '_last_game_over_buttons', [])

    def _draw_high_scores(self):
        rankings = self.rankings_manager.get_top_scores()
        buttons = self.ui.draw_high_scores(self.screen, rankings)
        self._last_high_scores_buttons = buttons

    def _get_high_scores_buttons(self):
        return getattr(self, '_last_high_scores_buttons', [])

    def _draw_settings(self):
        buttons = self.ui.draw_settings(self.screen, self.settings_manager, self.sound_manager)
        self._last_settings_buttons = buttons

    def _get_settings_buttons(self):
        return getattr(self, '_last_settings_buttons', [])

    def _draw_nickname_input(self):
        buttons, input_rect = self.ui.draw_nickname_input(self.screen, self.nickname_input)
        self._last_nickname_buttons = buttons
        self._last_nickname_input_rect = input_rect

    def _get_nickname_buttons(self):
        return getattr(self, '_last_nickname_buttons', []), getattr(self, '_last_nickname_input_rect', None)

    def _start_game(self):
        self.player = Player()
        self.player.auto_shoot = self.settings_manager.is_auto_shoot_enabled()
        self.enemy_manager.clear_all()
        self.powerup_manager.clear()
        self.explosion_manager.clear()
        
        self.level = 1
        self.score = 0
        self.score_for_next_level = 1000
        self.show_level_up = False
        
        self.state = GameState.PLAYING

    def _restart_game(self):
        self._start_game()

    def _toggle_pause(self):
        if self.state == GameState.PLAYING:
            self.state = GameState.PAUSED
        elif self.state == GameState.PAUSED:
            self.state = GameState.PLAYING

    def _use_bomb(self):
        if self.player and self.player.use_bomb():
            self.sound_manager.play_sound('bomb')
            killed = self.enemy_manager.bomb_clear()
            for x, y, score in killed:
                self.score += score
                self.explosion_manager.spawn_explosion(x, y, 'boss')

    def _game_over(self):
        self.state = GameState.GAME_OVER
        self.sound_manager.play_sound('game_over')
        
        self.rankings_manager.add_score(self.nickname, self.score, self.level)
        self.settings_manager.update_high_score(self.score)
        
        if self.player:
            self.explosion_manager.spawn_explosion(self.player.x, self.player.y, 'boss')

    def _go_to_menu(self):
        self.state = GameState.MENU
        self.player = None
        self.enemy_manager.clear_all()
        self.powerup_manager.clear()
        self.explosion_manager.clear()

    def _confirm_nickname(self):
        if self.nickname_input.strip():
            self.nickname = self.nickname_input.strip()
            self.settings_manager.set_default_nickname(self.nickname)
        self.state = GameState.SETTINGS
