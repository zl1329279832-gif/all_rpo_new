import pygame
import random
import math
from .game_objects import GameObject, BulletPool
from .constants import (
    SCREEN_WIDTH, SCREEN_HEIGHT, ENEMY_TYPES, BOSS_CONFIG,
    ENEMY_BULLET_SPEED, ENEMY_BULLET_DAMAGE, MOVE_PATTERNS,
    RED, YELLOW
)

class Enemy(GameObject):
    def __init__(self, enemy_type, move_pattern='straight'):
        config = ENEMY_TYPES[enemy_type]
        self.type = enemy_type
        
        x = random.randint(config['width'] // 2, SCREEN_WIDTH - config['width'] // 2)
        y = -config['height'] // 2
        
        super().__init__(x, y, config['width'], config['height'])
        
        self.speed = config['speed']
        self.health = config['health']
        self.max_health = config['health']
        self.score = config['score']
        self.color = config['color']
        self.shoot_chance = config['shoot_chance']
        
        self.move_pattern = move_pattern
        self.pattern_time = 0
        self.start_x = x
        self.amplitude = random.randint(30, 80)
        self.frequency = random.uniform(0.01, 0.03)
        self.direction = random.choice([-1, 1])
        
        self.vy = self.speed
        self.vx = 0

    def update(self, dt):
        self.pattern_time += 1
        
        if self.move_pattern == 'straight':
            self.y += self.vy
        
        elif self.move_pattern == 'zigzag':
            self.y += self.vy
            if self.x < self.width // 2 + 50:
                self.direction = 1
            elif self.x > SCREEN_WIDTH - self.width // 2 - 50:
                self.direction = -1
            self.x += self.direction * self.speed * 0.8
        
        elif self.move_pattern == 'sine':
            self.y += self.vy
            self.x = self.start_x + math.sin(self.pattern_time * self.frequency) * self.amplitude
            self.x = max(self.width // 2, min(SCREEN_WIDTH - self.width // 2, self.x))
        
        elif self.move_pattern == 'diagonal':
            self.y += self.vy
            self.x += self.direction * self.speed * 0.5
            if self.x < self.width // 2 or self.x > SCREEN_WIDTH - self.width // 2:
                self.direction *= -1
        
        if self.y > SCREEN_HEIGHT + self.height:
            self.kill()

    def draw(self, surface):
        rect = self.get_rect()
        
        if self.type == 'small':
            pygame.draw.polygon(surface, self.color, [
                (self.x, self.y + self.height // 2),
                (self.x - self.width // 2, self.y - self.height // 2),
                (self.x + self.width // 2, self.y - self.height // 2),
            ])
        
        elif self.type == 'medium':
            pygame.draw.ellipse(surface, self.color, rect)
            pygame.draw.rect(surface, (self.color[0] // 2, self.color[1] // 2, self.color[2] // 2), (
                self.x - 8, self.y - self.height // 2,
                16, self.height
            ))
        
        elif self.type == 'large':
            pygame.draw.polygon(surface, self.color, [
                (self.x, self.y + self.height // 2),
                (self.x - self.width // 2, self.y),
                (self.x - self.width // 3, self.y - self.height // 2),
                (self.x + self.width // 3, self.y - self.height // 2),
                (self.x + self.width // 2, self.y),
            ])
        
        if self.health < self.max_health:
            bar_width = self.width
            bar_height = 4
            fill = (self.health / self.max_health) * bar_width
            pygame.draw.rect(surface, RED, (self.x - bar_width // 2, self.y - self.height // 2 - 10, bar_width, bar_height))
            pygame.draw.rect(surface, YELLOW, (self.x - bar_width // 2, self.y - self.height // 2 - 10, fill, bar_height))

    def take_damage(self, damage):
        self.health -= damage
        if self.health <= 0:
            self.kill()
            return True
        return False

    def should_shoot(self):
        return random.random() < self.shoot_chance


class Boss(GameObject):
    def __init__(self, level):
        config = BOSS_CONFIG
        super().__init__(
            x=SCREEN_WIDTH // 2,
            y=-config['height'] // 2,
            width=config['width'],
            height=config['height']
        )
        
        self.speed = config['speed']
        self.base_health = config['health']
        self.health = config['health'] + level * 10
        self.max_health = self.health
        self.score = config['score'] * (level // BOSS_CONFIG['appear_every_level'])
        self.color = config['color']
        self.shoot_interval = config['shoot_interval']
        self.last_shot = 0
        
        self.entering = True
        self.target_y = 80
        
        self.move_direction = 1
        self.move_range = SCREEN_WIDTH - self.width - 50
        
        self.skill_cooldown = 5000
        self.last_skill = 0
        self.skill_active = False
        self.skill_type = None
        
        self.bullet_pool = BulletPool(is_player=False, width=8, height=8, max_pool=40)

    def update(self, dt, player_pos):
        current_time = pygame.time.get_ticks()
        
        if self.entering:
            self.y += 2
            if self.y >= self.target_y:
                self.entering = False
                self.y = self.target_y
        else:
            self.x += self.move_direction * self.speed
            if self.x <= self.width // 2 + 20:
                self.move_direction = 1
            elif self.x >= SCREEN_WIDTH - self.width // 2 - 20:
                self.move_direction = -1
        
        if not self.entering:
            if current_time - self.last_skill > self.skill_cooldown:
                self._activate_skill()
                self.last_skill = current_time
        
        if self.skill_active:
            self._update_skill(current_time, player_pos)
        elif not self.entering:
            if current_time - self.last_shot > self.shoot_interval:
                self._shoot(player_pos)
                self.last_shot = current_time
        
        self.bullet_pool.update_all(dt)

    def _shoot(self, player_pos):
        for i in range(3):
            angle = math.radians(-90 + (i - 1) * 15)
            vx = math.cos(angle) * ENEMY_BULLET_SPEED
            vy = math.sin(angle) * ENEMY_BULLET_SPEED
            self.bullet_pool.get_bullet(self.x, self.y + self.height // 2, vx, vy)

    def _activate_skill(self):
        self.skill_active = True
        self.skill_type = random.choice(['spread', 'aimed', 'barrage'])
        self.skill_start_time = pygame.time.get_ticks()
        self.skill_duration = 3000
        self.skill_shots = 0

    def _update_skill(self, current_time, player_pos):
        elapsed = current_time - self.skill_start_time
        
        if elapsed > self.skill_duration:
            self.skill_active = False
            self.skill_type = None
            return
        
        if current_time - self.last_shot > 200:
            if self.skill_type == 'spread':
                for i in range(7):
                    angle = math.radians(-90 + (i - 3) * 20)
                    vx = math.cos(angle) * ENEMY_BULLET_SPEED
                    vy = math.sin(angle) * ENEMY_BULLET_SPEED
                    self.bullet_pool.get_bullet(self.x, self.y + self.height // 2, vx, vy)
            
            elif self.skill_type == 'aimed':
                dx = player_pos[0] - self.x
                dy = player_pos[1] - self.y
                dist = math.sqrt(dx * dx + dy * dy)
                if dist > 0:
                    vx = (dx / dist) * ENEMY_BULLET_SPEED
                    vy = (dy / dist) * ENEMY_BULLET_SPEED
                    for i in range(3):
                        offset = (i - 1) * 15
                        angle = math.atan2(vy, vx) + math.radians(offset)
                        vx2 = math.cos(angle) * ENEMY_BULLET_SPEED
                        vy2 = math.sin(angle) * ENEMY_BULLET_SPEED
                        self.bullet_pool.get_bullet(self.x, self.y + self.height // 2, vx2, vy2)
            
            elif self.skill_type == 'barrage':
                for x in range(3):
                    start_x = self.x - 40 + x * 40
                    self.bullet_pool.get_bullet(start_x, self.y + self.height // 2, 0, ENEMY_BULLET_SPEED)
            
            self.last_shot = current_time

    def draw(self, surface):
        if self.entering:
            alpha = min(255, int(255 * (self.y / self.target_y)))
        else:
            alpha = 255
        
        rect = self.get_rect()
        
        pygame.draw.polygon(surface, self.color, [
            (self.x, self.y + self.height // 2),
            (self.x - self.width // 2, self.y + self.height // 4),
            (self.x - self.width // 2, self.y - self.height // 4),
            (self.x - self.width // 4, self.y - self.height // 2),
            (self.x + self.width // 4, self.y - self.height // 2),
            (self.x + self.width // 2, self.y - self.height // 4),
            (self.x + self.width // 2, self.y + self.height // 4),
        ])
        
        pygame.draw.ellipse(surface, (200, 0, 0), (
            self.x - 20, self.y - 20,
            40, 40
        ))
        pygame.draw.ellipse(surface, YELLOW, (
            self.x - 10, self.y - 10,
            20, 20
        ))
        
        bar_width = self.width + 20
        bar_height = 8
        fill = (self.health / self.max_health) * bar_width
        pygame.draw.rect(surface, (50, 50, 50), (
            SCREEN_WIDTH // 2 - bar_width // 2, 10, bar_width, bar_height
        ))
        pygame.draw.rect(surface, RED, (
            SCREEN_WIDTH // 2 - bar_width // 2, 10, fill, bar_height
        ))
        pygame.draw.rect(surface, WHITE, (
            SCREEN_WIDTH // 2 - bar_width // 2, 10, bar_width, bar_height
        ), 1)
        
        font = pygame.font.Font(None, 24)
        text = font.render(f'BOSS HP: {self.health}/{self.max_health}', True, RED)
        surface.blit(text, (SCREEN_WIDTH // 2 - text.get_width() // 2, 25))
        
        self.bullet_pool.draw_all(surface)

    def take_damage(self, damage):
        self.health -= damage
        if self.health <= 0:
            self.health = 0
            self.kill()
            return True
        return False

    def get_active_bullets(self):
        return self.bullet_pool.get_active_bullets()
