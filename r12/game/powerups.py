import pygame
import random
import math
from .game_objects import GameObject
from .constants import SCREEN_WIDTH, SCREEN_HEIGHT, POWERUP_TYPES, YELLOW, LIGHT_BLUE, GREEN, RED, PINK, ORANGE, WHITE

class PowerUp(GameObject):
    def __init__(self, x, y, powerup_type):
        self.powerup_type = powerup_type
        config = POWERUP_TYPES[powerup_type]
        self.color = config['color']
        self.duration = config['duration']
        self.description = config['description']
        
        super().__init__(x, y, 24, 24)
        
        self.speed = 2
        self.vy = self.speed
        self.rotation = 0
        self.pulse_time = 0

    def update(self, dt):
        self.y += self.vy
        self.rotation += 3
        self.pulse_time += 0.1
        
        if self.y > SCREEN_HEIGHT + self.height:
            self.kill()

    def draw(self, surface):
        pulse_size = 1 + math.sin(self.pulse_time) * 0.2
        size = int(self.width * pulse_size) // 2
        
        center = (int(self.x), int(self.y))
        
        if self.powerup_type == 'double_fire':
            pygame.draw.polygon(surface, self.color, [
                (center[0], center[1] - size),
                (center[0] - size, center[1] + size),
                (center[0] + size, center[1] + size),
            ])
            pygame.draw.polygon(surface, WHITE, [
                (center[0], center[1] - size // 2),
                (center[0] - size // 2, center[1] + size // 2),
                (center[0] + size // 2, center[1] + size // 2),
            ])
        
        elif self.powerup_type == 'shield':
            pygame.draw.circle(surface, self.color, center, size)
            pygame.draw.circle(surface, WHITE, center, size - 4)
            pygame.draw.circle(surface, self.color, center, size - 8)
        
        elif self.powerup_type == 'health':
            pygame.draw.rect(surface, self.color, (
                center[0] - size // 4, center[1] - size,
                size // 2, size * 2
            ))
            pygame.draw.rect(surface, self.color, (
                center[0] - size, center[1] - size // 4,
                size * 2, size // 2
            ))
        
        elif self.powerup_type == 'bomb':
            pygame.draw.circle(surface, self.color, center, size)
            pygame.draw.line(surface, YELLOW, (center[0], center[1] - size), (center[0], center[1] - size - 8), 2)
            pygame.draw.circle(surface, ORANGE, (center[0], center[1] - size - 8), 4)
        
        elif self.powerup_type == 'multi_shot':
            for i in range(3):
                angle = math.radians(self.rotation + i * 120)
                x = center[0] + math.cos(angle) * (size - 4)
                y = center[1] + math.sin(angle) * (size - 4)
                pygame.draw.circle(surface, self.color, (int(x), int(y)), 4)
        
        pygame.draw.circle(surface, WHITE, center, size + 2, 1)


class PowerUpManager:
    def __init__(self):
        self.powerups = []
        self.drop_chance = 0.15

    def spawn_powerup(self, x, y):
        if random.random() < self.drop_chance:
            powerup_types = list(POWERUP_TYPES.keys())
            weights = [3, 2, 4, 1, 2]
            powerup_type = random.choices(powerup_types, weights=weights, k=1)[0]
            powerup = PowerUp(x, y, powerup_type)
            self.powerups.append(powerup)

    def update(self, dt):
        for powerup in self.powerups[:]:
            powerup.update(dt)
            if not powerup.alive:
                self.powerups.remove(powerup)

    def draw(self, surface):
        for powerup in self.powerups:
            powerup.draw(surface)

    def check_collisions(self, player):
        player_rect = player.get_rect()
        collected = []
        
        for powerup in self.powerups[:]:
            if powerup.get_rect().colliderect(player_rect):
                collected.append(powerup)
                self.powerups.remove(powerup)
                self._apply_powerup(player, powerup)
        
        return collected

    def _apply_powerup(self, player, powerup):
        if powerup.powerup_type == 'double_fire':
            player.activate_double_fire(powerup.duration)
        
        elif powerup.powerup_type == 'shield':
            player.activate_shield(powerup.duration)
        
        elif powerup.powerup_type == 'health':
            player.add_health(1)
        
        elif powerup.powerup_type == 'bomb':
            player.add_bomb()
        
        elif powerup.powerup_type == 'multi_shot':
            player.activate_multi_shot(powerup.duration)

    def clear(self):
        self.powerups.clear()
