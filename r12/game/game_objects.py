import pygame
import math
from abc import ABC, abstractmethod
from .constants import SCREEN_WIDTH, SCREEN_HEIGHT

class GameObject(ABC):
    def __init__(self, x, y, width, height):
        self.x = x
        self.y = y
        self.width = width
        self.height = height
        self.rect = pygame.Rect(x, y, width, height)
        self.alive = True
        self.vx = 0
        self.vy = 0

    @abstractmethod
    def update(self, dt):
        pass

    @abstractmethod
    def draw(self, surface):
        pass

    def get_rect(self):
        self.rect.x = int(self.x - self.width / 2)
        self.rect.y = int(self.y - self.height / 2)
        return self.rect

    def is_off_screen(self):
        return (self.x < -self.width or self.x > SCREEN_WIDTH + self.width or
                self.y < -self.height or self.y > SCREEN_HEIGHT + self.height)

    def kill(self):
        self.alive = False


class Bullet(GameObject):
    def __init__(self, x, y, width, height, speed, damage, is_player_bullet=True, vx=0, vy=0):
        super().__init__(x, y, width, height)
        self.speed = speed
        self.damage = damage
        self.is_player_bullet = is_player_bullet
        if vx == 0 and vy == 0:
            self.vy = -speed if is_player_bullet else speed
        else:
            self.vx = vx
            self.vy = vy
        self.in_use = False

    def update(self, dt):
        self.x += self.vx
        self.y += self.vy
        if self.is_off_screen():
            self.kill()

    def draw(self, surface):
        if self.is_player_bullet:
            color = (0, 255, 255)
        else:
            color = (255, 100, 100)
        pygame.draw.rect(surface, color, self.get_rect())

    def reset(self, x, y, vx=0, vy=0):
        self.x = x
        self.y = y
        self.vx = vx
        self.vy = vy
        self.alive = True
        self.in_use = True


class BulletPool:
    def __init__(self, is_player, width=4, height=12, max_pool=50):
        self.is_player = is_player
        self.width = width
        self.height = height
        self.max_pool = max_pool
        self.pool = []
        self._initialize_pool()

    def _initialize_pool(self):
        for _ in range(self.max_pool):
            bullet = Bullet(
                x=0, y=0,
                width=self.width, height=self.height,
                speed=10, damage=1,
                is_player_bullet=self.is_player
            )
            bullet.in_use = False
            bullet.alive = False
            self.pool.append(bullet)

    def get_bullet(self, x, y, vx=0, vy=0):
        for bullet in self.pool:
            if not bullet.in_use:
                bullet.reset(x, y, vx, vy)
                return bullet
        
        if len(self.pool) < self.max_pool * 3:
            new_bullet = Bullet(
                x=x, y=y,
                width=self.width, height=self.height,
                speed=10, damage=1,
                is_player_bullet=self.is_player
            )
            new_bullet.vx = vx
            new_bullet.vy = vy
            new_bullet.in_use = True
            self.pool.append(new_bullet)
            return new_bullet
        
        for bullet in self.pool:
            if bullet.in_use:
                bullet.reset(x, y, vx, vy)
                return bullet
        
        return None

    def update_all(self, dt):
        for bullet in self.pool:
            if bullet.in_use and bullet.alive:
                bullet.update(dt)
                if not bullet.alive:
                    bullet.in_use = False

    def draw_all(self, surface):
        for bullet in self.pool:
            if bullet.in_use and bullet.alive:
                bullet.draw(surface)

    def get_active_bullets(self):
        return [b for b in self.pool if b.in_use and b.alive]

    def clear_all(self):
        for bullet in self.pool:
            bullet.in_use = False
            bullet.alive = False
