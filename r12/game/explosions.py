import pygame
from .constants import EXPLOSION_FRAMES, EXPLOSION_DURATION, YELLOW, ORANGE, RED, WHITE

class Explosion:
    def __init__(self, x, y, size='medium'):
        self.x = x
        self.y = y
        self.size = size
        
        if size == 'small':
            self.max_radius = 15
            self.duration = EXPLOSION_DURATION // 2
        elif size == 'medium':
            self.max_radius = 30
            self.duration = EXPLOSION_DURATION
        elif size == 'large':
            self.max_radius = 60
            self.duration = EXPLOSION_DURATION * 2
        elif size == 'boss':
            self.max_radius = 100
            self.duration = EXPLOSION_DURATION * 3
        
        self.start_time = pygame.time.get_ticks()
        self.alive = True

    def update(self):
        elapsed = pygame.time.get_ticks() - self.start_time
        if elapsed >= self.duration:
            self.alive = False

    def draw(self, surface):
        elapsed = pygame.time.get_ticks() - self.start_time
        progress = elapsed / self.duration
        
        current_radius = self.max_radius * progress
        alpha = int(255 * (1 - progress))
        
        if progress < 0.3:
            color = WHITE
        elif progress < 0.6:
            color = YELLOW
        elif progress < 0.8:
            color = ORANGE
        else:
            color = RED
        
        temp_surface = pygame.Surface((int(self.max_radius * 2), int(self.max_radius * 2)), pygame.SRCALPHA)
        
        pygame.draw.circle(temp_surface, (*color, alpha), 
                          (int(self.max_radius), int(self.max_radius)), 
                          int(current_radius))
        
        if progress < 0.5:
            pygame.draw.circle(temp_surface, (*WHITE, int(alpha * 0.5)),
                              (int(self.max_radius), int(self.max_radius)),
                              int(current_radius * 0.5))
        
        surface.blit(temp_surface, (int(self.x - self.max_radius), int(self.y - self.max_radius)))


class ExplosionManager:
    def __init__(self):
        self.explosions = []

    def spawn_explosion(self, x, y, size='medium'):
        explosion = Explosion(x, y, size)
        self.explosions.append(explosion)

    def update(self):
        for explosion in self.explosions[:]:
            explosion.update()
            if not explosion.alive:
                self.explosions.remove(explosion)

    def draw(self, surface):
        for explosion in self.explosions:
            explosion.draw(surface)

    def clear(self):
        self.explosions.clear()
