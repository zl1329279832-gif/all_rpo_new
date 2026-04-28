import pygame
import random
from .constants import SCREEN_WIDTH, SCREEN_HEIGHT, WHITE, DARK_GRAY

class Star:
    def __init__(self):
        self.reset()

    def reset(self):
        self.x = random.randint(0, SCREEN_WIDTH)
        self.y = random.randint(-SCREEN_HEIGHT, 0)
        self.speed = random.uniform(1, 4)
        self.size = random.randint(1, 3)
        self.brightness = random.randint(100, 255)

    def update(self):
        self.y += self.speed
        if self.y > SCREEN_HEIGHT:
            self.reset()

    def draw(self, surface):
        color = (self.brightness, self.brightness, self.brightness)
        pygame.draw.circle(surface, color, (int(self.x), int(self.y)), self.size)


class Background:
    def __init__(self):
        self.stars = [Star() for _ in range(100)]

    def update(self):
        for star in self.stars:
            star.update()

    def draw(self, surface):
        surface.fill(DARK_GRAY)
        for star in self.stars:
            star.draw(surface)
