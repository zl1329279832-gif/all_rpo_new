import pygame
import random
from .enemies import Enemy, Boss
from .game_objects import BulletPool
from .constants import (
    SCREEN_WIDTH, SCREEN_HEIGHT, ENEMY_TYPES, BOSS_CONFIG,
    ENEMY_BULLET_SPEED, MOVE_PATTERNS
)

class EnemyManager:
    def __init__(self):
        self.enemies = []
        self.boss = None
        self.enemy_bullet_pool = BulletPool(is_player=False, width=6, height=6, max_pool=50)
        
        self.spawn_timer = 0
        self.spawn_delay = 1500
        self.difficulty_multiplier = 1.0
        
        self.total_kills = 0
        self.boss_spawned = False
        self.boss_appear_every = BOSS_CONFIG['appear_every_level']

    def update(self, dt, level, player_pos):
        current_time = pygame.time.get_ticks()
        
        self._update_difficulty(level)
        
        if self.boss is None:
            if current_time - self.spawn_timer > self.spawn_delay:
                self._spawn_enemy()
                self.spawn_timer = current_time
        
        for enemy in self.enemies[:]:
            enemy.update(dt)
            
            if enemy.should_shoot():
                self._enemy_shoot(enemy)
            
            if not enemy.alive:
                self.enemies.remove(enemy)
        
        if self.boss is not None:
            self.boss.update(dt, player_pos)
            
            if not self.boss.alive:
                self.boss = None
                self.boss_spawned = False
        
        self.enemy_bullet_pool.update_all(dt)

    def _update_difficulty(self, level):
        self.difficulty_multiplier = 1.0 + (level - 1) * 0.15
        self.spawn_delay = max(500, 1500 - (level - 1) * 100)
        
        if level % self.boss_appear_every == 0 and not self.boss_spawned and self.boss is None:
            if self.total_kills >= 10 * level:
                self._spawn_boss(level)

    def _spawn_enemy(self):
        enemy_types = list(ENEMY_TYPES.keys())
        weights = [ENEMY_TYPES[t]['spawn_weight'] for t in enemy_types]
        
        weights = [w * (1 + (self.difficulty_multiplier - 1) * i) for i, w in enumerate(weights)]
        
        enemy_type = random.choices(enemy_types, weights=weights, k=1)[0]
        move_pattern = random.choice(MOVE_PATTERNS)
        
        enemy = Enemy(enemy_type, move_pattern)
        enemy.speed *= self.difficulty_multiplier
        enemy.health = int(enemy.health * self.difficulty_multiplier)
        enemy.max_health = enemy.health
        
        self.enemies.append(enemy)

    def _spawn_boss(self, level):
        self.boss = Boss(level)
        self.boss_spawned = True

    def _enemy_shoot(self, enemy):
        self.enemy_bullet_pool.get_bullet(enemy.x, enemy.y + enemy.height // 2, 0, ENEMY_BULLET_SPEED)

    def get_all_enemies(self):
        enemies = self.enemies[:]
        if self.boss is not None:
            enemies.append(self.boss)
        return enemies

    def get_active_bullets(self):
        bullets = self.enemy_bullet_pool.get_active_bullets()
        if self.boss is not None:
            bullets.extend(self.boss.get_active_bullets())
        return bullets

    def draw(self, surface):
        for enemy in self.enemies:
            enemy.draw(surface)
        
        if self.boss is not None:
            self.boss.draw(surface)
        
        self.enemy_bullet_pool.draw_all(surface)

    def register_kill(self, score):
        self.total_kills += 1

    def clear_all(self):
        self.enemies.clear()
        self.boss = None
        self.boss_spawned = False
        self.enemy_bullet_pool.clear_all()
        self.total_kills = 0

    def bomb_clear(self):
        killed_enemies = []
        for enemy in self.enemies[:]:
            killed_enemies.append((enemy.x, enemy.y, enemy.score))
            enemy.kill()
            self.enemies.remove(enemy)
        
        if self.boss is not None:
            self.boss.take_damage(10)
            if not self.boss.alive:
                killed_enemies.append((self.boss.x, self.boss.y, self.boss.score))
                self.boss = None
                self.boss_spawned = False
        
        self.enemy_bullet_pool.clear_all()
        
        return killed_enemies
