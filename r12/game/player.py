import pygame
import time
from .game_objects import GameObject, BulletPool
from .constants import (
    SCREEN_WIDTH, SCREEN_HEIGHT, PLAYER_SPEED, PLAYER_LIVES,
    PLAYER_BULLET_SPEED, PLAYER_BULLET_DAMAGE, PLAYER_SHOOT_DELAY,
    BLUE, LIGHT_BLUE
)

class Player(GameObject):
    def __init__(self):
        super().__init__(
            x=SCREEN_WIDTH // 2,
            y=SCREEN_HEIGHT - 80,
            width=50,
            height=50
        )
        self.lives = PLAYER_LIVES
        self.score = 0
        self.speed = PLAYER_SPEED
        self.shoot_delay = PLAYER_SHOOT_DELAY
        self.last_shot = 0
        self.auto_shoot = False
        self.invincible = False
        self.invincible_time = 0
        self.invincible_duration = 2000
        
        self.has_double_fire = False
        self.double_fire_end_time = 0
        
        self.has_shield = False
        self.shield_end_time = 0
        
        self.has_multi_shot = False
        self.multi_shot_end_time = 0
        
        self.bombs = 2
        
        self.bullet_pool = BulletPool(is_player=True, width=4, height=12, max_pool=30)

    def update(self, dt, keys):
        current_time = pygame.time.get_ticks()
        
        if self.invincible and current_time - self.invincible_time > self.invincible_duration:
            self.invincible = False
        
        if self.has_double_fire and current_time > self.double_fire_end_time:
            self.has_double_fire = False
        
        if self.has_shield and current_time > self.shield_end_time:
            self.has_shield = False
        
        if self.has_multi_shot and current_time > self.multi_shot_end_time:
            self.has_multi_shot = False
        
        if keys[pygame.K_LEFT] or keys[pygame.K_a]:
            self.x -= self.speed
        if keys[pygame.K_RIGHT] or keys[pygame.K_d]:
            self.x += self.speed
        if keys[pygame.K_UP] or keys[pygame.K_w]:
            self.y -= self.speed
        if keys[pygame.K_DOWN] or keys[pygame.K_s]:
            self.y += self.speed
        
        self.x = max(self.width // 2, min(SCREEN_WIDTH - self.width // 2, self.x))
        self.y = max(self.height // 2, min(SCREEN_HEIGHT - self.height // 2, self.y))
        
        if keys[pygame.K_SPACE] or self.auto_shoot:
            self.shoot()
        
        self.bullet_pool.update_all(dt)

    def shoot(self):
        current_time = pygame.time.get_ticks()
        if current_time - self.last_shot < self.shoot_delay:
            return
        
        self.last_shot = current_time
        
        if self.has_multi_shot:
            angles = [-30, -15, 0, 15, 30]
            for angle in angles:
                import math
                rad = math.radians(angle)
                vx = math.sin(rad) * PLAYER_BULLET_SPEED
                vy = -math.cos(rad) * PLAYER_BULLET_SPEED
                self.bullet_pool.get_bullet(self.x, self.y - self.height // 2, vx, vy)
        
        elif self.has_double_fire:
            offset = 15
            self.bullet_pool.get_bullet(self.x - offset, self.y - self.height // 2, 0, -PLAYER_BULLET_SPEED)
            self.bullet_pool.get_bullet(self.x + offset, self.y - self.height // 2, 0, -PLAYER_BULLET_SPEED)
        
        else:
            self.bullet_pool.get_bullet(self.x, self.y - self.height // 2, 0, -PLAYER_BULLET_SPEED)

    def draw(self, surface):
        if self.invincible:
            if (pygame.time.get_ticks() // 100) % 2 == 0:
                pass
            else:
                self._draw_plane(surface)
        else:
            self._draw_plane(surface)
        
        if self.has_shield:
            pygame.draw.circle(surface, LIGHT_BLUE, (int(self.x), int(self.y)), self.width // 2 + 10, 2)
        
        self.bullet_pool.draw_all(surface)

    def _draw_plane(self, surface):
        rect = self.get_rect()
        
        pygame.draw.polygon(surface, BLUE, [
            (self.x, self.y - self.height // 2),
            (self.x - self.width // 2, self.y + self.height // 2),
            (self.x - self.width // 4, self.y + self.height // 3),
        ])
        pygame.draw.polygon(surface, BLUE, [
            (self.x, self.y - self.height // 2),
            (self.x + self.width // 2, self.y + self.height // 2),
            (self.x + self.width // 4, self.y + self.height // 3),
        ])
        
        pygame.draw.ellipse(surface, (0, 150, 255), (
            self.x - 8, self.y - 15,
            16, 25
        ))
        
        pygame.draw.rect(surface, (255, 100, 0), (
            self.x - 8, self.y + self.height // 4,
            6, 15
        ))
        pygame.draw.rect(surface, (255, 100, 0), (
            self.x + 2, self.y + self.height // 4,
            6, 15
        ))

    def take_damage(self, damage=1):
        if self.invincible or self.has_shield:
            return False
        
        self.lives -= damage
        if self.lives <= 0:
            self.lives = 0
            self.kill()
            return True
        
        self.invincible = True
        self.invincible_time = pygame.time.get_ticks()
        return False

    def add_score(self, points):
        self.score += points

    def activate_double_fire(self, duration):
        self.has_double_fire = True
        self.double_fire_end_time = pygame.time.get_ticks() + duration

    def activate_shield(self, duration):
        self.has_shield = True
        self.shield_end_time = pygame.time.get_ticks() + duration

    def activate_multi_shot(self, duration):
        self.has_multi_shot = True
        self.multi_shot_end_time = pygame.time.get_ticks() + duration

    def add_health(self, amount=1):
        self.lives = min(self.lives + amount, PLAYER_LIVES + 2)

    def use_bomb(self):
        if self.bombs > 0:
            self.bombs -= 1
            return True
        return False

    def add_bomb(self):
        self.bombs = min(self.bombs + 1, 5)

    def get_active_bullets(self):
        return self.bullet_pool.get_active_bullets()

    def reset(self):
        self.x = SCREEN_WIDTH // 2
        self.y = SCREEN_HEIGHT - 80
        self.lives = PLAYER_LIVES
        self.score = 0
        self.invincible = False
        self.has_double_fire = False
        self.has_shield = False
        self.has_multi_shot = False
        self.bombs = 2
        self.bullet_pool.clear_all()
        self.alive = True
