import pygame
import random
import math
import sys

# ==================== 游戏配置常量 ====================
SCREEN_WIDTH = 800
SCREEN_HEIGHT = 600
FPS = 60
TILE_SIZE = 32

# 颜色定义 (像素风配色)
COLOR_BG = (20, 24, 40)
COLOR_GROUND = (40, 50, 60)
COLOR_BASE = (100, 200, 100)
COLOR_BASE_CORE = (150, 255, 150)
COLOR_ENEMY = (200, 80, 80)
COLOR_ENEMY_EYE = (255, 255, 100)
COLOR_TOWER = (80, 120, 200)
COLOR_TOWER_BARREL = (180, 180, 200)
COLOR_BULLET = (255, 230, 100)
COLOR_UI_BG = (30, 35, 50)
COLOR_UI_TEXT = (220, 220, 220)
COLOR_GOLD = (255, 215, 0)
COLOR_HEALTH = (255, 60, 60)

# 游戏数值
BASE_MAX_HEALTH = 100
TOWER_COST = 50
TOWER_RANGE = 120
TOWER_DAMAGE = 10
TOWER_FIRE_RATE = 60
ENEMY_BASE_HP = 30
ENEMY_BASE_SPEED = 1.2
ENEMY_KILL_GOLD = 15
ENEMY_SPAWN_INTERVAL = 90
STARTING_GOLD = 200


class Entity:
    def __init__(self, x: float, y: float):
        self.x = x
        self.y = y
        self.rect = pygame.Rect(0, 0, 0, 0)

    def update(self, *args):
        pass

    def draw(self, surface: pygame.Surface):
        pass


class Base(Entity):
    def __init__(self, x: float, y: float):
        super().__init__(x, y)
        self.max_health = BASE_MAX_HEALTH
        self.health = self.max_health
        self.size = 64
        self.rect = pygame.Rect(x - self.size // 2, y - self.size // 2, self.size, self.size)

    def take_damage(self, amount: int):
        self.health = max(0, self.health - amount)

    def is_alive(self) -> bool:
        return self.health > 0

    def draw(self, surface: pygame.Surface):
        base_rect = pygame.Rect(self.x - self.size // 2, self.y - self.size // 2, self.size, self.size)
        pygame.draw.rect(surface, COLOR_BASE, base_rect)
        pygame.draw.rect(surface, (60, 150, 60), base_rect, 3)

        core_size = 24
        core_rect = pygame.Rect(self.x - core_size // 2, self.y - core_size // 2, core_size, core_size)
        pygame.draw.rect(surface, COLOR_BASE_CORE, core_rect)
        pygame.draw.rect(surface, (200, 255, 200), core_rect, 2)

        bar_width = self.size
        bar_height = 6
        bar_x = self.x - bar_width // 2
        bar_y = self.y - self.size // 2 - 12
        health_pct = self.health / self.max_health
        pygame.draw.rect(surface, (80, 20, 20), (bar_x, bar_y, bar_width, bar_height))
        pygame.draw.rect(surface, COLOR_HEALTH, (bar_x, bar_y, bar_width * health_pct, bar_height))
        pygame.draw.rect(surface, (0, 0, 0), (bar_x, bar_y, bar_width, bar_height), 1)


class Enemy(Entity):
    def __init__(self, x: float, y: float, wave_multiplier: float = 1.0):
        super().__init__(x, y)
        self.max_health = int(ENEMY_BASE_HP * wave_multiplier)
        self.health = self.max_health
        self.speed = ENEMY_BASE_SPEED * (1 + (wave_multiplier - 1) * 0.3)
        self.size = 24
        self.damage = 5
        self.rect = pygame.Rect(x - self.size // 2, y - self.size // 2, self.size, self.size)
        self.anim_frame = 0

    def update(self, base: Base):
        dx = base.x - self.x
        dy = base.y - self.y
        dist = math.sqrt(dx * dx + dy * dy)

        if dist > 2:
            self.x += (dx / dist) * self.speed
            self.y += (dy / dist) * self.speed
            self.anim_frame = (self.anim_frame + 0.2) % 4

        self.rect.center = (self.x, self.y)

        if self.rect.colliderect(base.rect):
            base.take_damage(self.damage)
            self.health = 0

    def take_damage(self, amount: int) -> bool:
        self.health -= amount
        return self.health <= 0

    def is_alive(self) -> bool:
        return self.health > 0

    def draw(self, surface: pygame.Surface):
        e_rect = pygame.Rect(self.x - self.size // 2, self.y - self.size // 2, self.size, self.size)
        pygame.draw.rect(surface, COLOR_ENEMY, e_rect)
        pygame.draw.rect(surface, (120, 40, 40), e_rect, 2)

        eye_offset = int(math.sin(self.anim_frame) * 2)
        pygame.draw.rect(surface, COLOR_ENEMY_EYE, (self.x - 6, self.y - 4 + eye_offset, 4, 4))
        pygame.draw.rect(surface, COLOR_ENEMY_EYE, (self.x + 2, self.y - 4 + eye_offset, 4, 4))

        bar_width = self.size
        bar_height = 3
        bar_x = self.x - bar_width // 2
        bar_y = self.y - self.size // 2 - 6
        health_pct = self.health / self.max_health
        pygame.draw.rect(surface, (60, 10, 10), (bar_x, bar_y, bar_width, bar_height))
        pygame.draw.rect(surface, COLOR_HEALTH, (bar_x, bar_y, bar_width * health_pct, bar_height))


class Bullet(Entity):
    def __init__(self, x: float, y: float, target: Enemy, damage: int):
        super().__init__(x, y)
        self.target = target
        self.damage = damage
        self.speed = 8
        self.size = 6
        self.alive = True
        self.rect = pygame.Rect(x - self.size // 2, y - self.size // 2, self.size, self.size)

    def update(self):
        if not self.target.is_alive():
            self.alive = False
            return

        dx = self.target.x - self.x
        dy = self.target.y - self.y
        dist = math.sqrt(dx * dx + dy * dy)

        if dist < 10:
            self.target.take_damage(self.damage)
            self.alive = False
            return

        self.x += (dx / dist) * self.speed
        self.y += (dy / dist) * self.speed
        self.rect.center = (self.x, self.y)

    def is_alive(self) -> bool:
        return self.alive

    def draw(self, surface: pygame.Surface):
        pygame.draw.rect(surface, COLOR_BULLET, (self.x - 3, self.y - 3, 6, 6))
        pygame.draw.rect(surface, (255, 255, 200), (self.x - 2, self.y - 2, 4, 4))


class Tower(Entity):
    def __init__(self, x: float, y: float):
        super().__init__(x, y)
        self.range = TOWER_RANGE
        self.damage = TOWER_DAMAGE
        self.fire_rate = TOWER_FIRE_RATE
        self.cooldown = 0
        self.size = 28
        self.rect = pygame.Rect(x - self.size // 2, y - self.size // 2, self.size, self.size)
        self.angle = 0
        self.target_enemy = None

    def update(self, enemies: list, bullets: list):
        self.cooldown = max(0, self.cooldown - 1)

        if self.target_enemy and self.target_enemy.is_alive():
            dist = math.sqrt((self.target_enemy.x - self.x) ** 2 + (self.target_enemy.y - self.y) ** 2)
            if dist > self.range:
                self.target_enemy = None
        else:
            self.target_enemy = None

        if not self.target_enemy:
            closest_dist = self.range
            for enemy in enemies:
                if enemy.is_alive():
                    dist = math.sqrt((enemy.x - self.x) ** 2 + (enemy.y - self.y) ** 2)
                    if dist < closest_dist:
                        closest_dist = dist
                        self.target_enemy = enemy

        if self.target_enemy and self.cooldown == 0:
            dx = self.target_enemy.x - self.x
            dy = self.target_enemy.y - self.y
            self.angle = math.atan2(dy, dx)
            bullets.append(Bullet(self.x, self.y, self.target_enemy, self.damage))
            self.cooldown = self.fire_rate

    def draw(self, surface: pygame.Surface, show_range: bool = False):
        if show_range:
            range_surface = pygame.Surface((self.range * 2, self.range * 2), pygame.SRCALPHA)
            pygame.draw.circle(range_surface, (80, 120, 200, 40), (self.range, self.range), self.range)
            surface.blit(range_surface, (self.x - self.range, self.y - self.range))

        base_rect = pygame.Rect(self.x - self.size // 2, self.y - self.size // 2, self.size, self.size)
        pygame.draw.rect(surface, COLOR_TOWER, base_rect)
        pygame.draw.rect(surface, (40, 70, 140), base_rect, 2)

        barrel_len = 14
        end_x = self.x + math.cos(self.angle) * barrel_len
        end_y = self.y + math.sin(self.angle) * barrel_len
        pygame.draw.line(surface, COLOR_TOWER_BARREL, (self.x, self.y), (end_x, end_y), 4)
        pygame.draw.line(surface, (100, 100, 120), (self.x, self.y), (end_x, end_y), 1)


def get_chinese_font(size: int) -> pygame.font.Font:
    font_candidates = [
        "microsoftyahei",
        "microsoftyaheiui",
        "simhei",
        "simsun",
        "kaiti",
        "mingsun",
        "consolas",
        "arial",
    ]
    for font_name in font_candidates:
        try:
            font = pygame.font.SysFont(font_name, size)
            test_surface = font.render("测试", True, (255, 255, 255))
            if test_surface.get_width() > 0:
                return font
        except Exception:
            continue
    return pygame.font.Font(None, size)


class Game:
    def __init__(self):
        pygame.init()
        pygame.display.set_caption("像素塔防 - Pixel Tower Defense")
        self.screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
        self.clock = pygame.time.Clock()
        self.font_small = get_chinese_font(16)
        self.font_large = get_chinese_font(28)

        self.base = Base(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2)
        self.towers: list[Tower] = []
        self.enemies: list[Enemy] = []
        self.bullets: list[Bullet] = []

        self.gold = STARTING_GOLD
        self.wave = 0
        self.spawn_timer = 0
        self.enemies_spawned = 0
        self.enemies_per_wave = 5
        self.wave_cooldown = 0
        self.game_over = False
        self.victory = False
        self.max_waves = 10

        self.mouse_x = 0
        self.mouse_y = 0
        self.hover_tile = None
        self.score = 0

        grid_cols = math.ceil(SCREEN_WIDTH / TILE_SIZE)
        grid_rows = math.ceil(SCREEN_HEIGHT / TILE_SIZE)
        self.placement_grid = [[False for _ in range(grid_cols)] for _ in range(grid_rows)]
        center_gx = (SCREEN_WIDTH // 2) // TILE_SIZE
        center_gy = (SCREEN_HEIGHT // 2) // TILE_SIZE
        for gy in range(center_gy - 2, center_gy + 2):
            for gx in range(center_gx - 2, center_gx + 2):
                if 0 <= gy < len(self.placement_grid) and 0 <= gx < len(self.placement_grid[0]):
                    self.placement_grid[gy][gx] = True

    def spawn_enemy(self):
        side = random.randint(0, 3)
        if side == 0:
            x = random.randint(0, SCREEN_WIDTH)
            y = -20
        elif side == 1:
            x = SCREEN_WIDTH + 20
            y = random.randint(0, SCREEN_HEIGHT)
        elif side == 2:
            x = random.randint(0, SCREEN_WIDTH)
            y = SCREEN_HEIGHT + 20
        else:
            x = -20
            y = random.randint(0, SCREEN_HEIGHT)

        wave_mult = 1.0 + (self.wave - 1) * 0.25
        self.enemies.append(Enemy(x, y, wave_mult))
        self.enemies_spawned += 1

    def can_place_tower(self, gx: int, gy: int) -> bool:
        if gx < 0 or gy < 0 or gy >= len(self.placement_grid) or gx >= len(self.placement_grid[0]):
            return False
        if self.placement_grid[gy][gx]:
            return False
        for tower in self.towers:
            tgx = int(tower.x // TILE_SIZE)
            tgy = int(tower.y // TILE_SIZE)
            if tgx == gx and tgy == gy:
                return False
        return True

    def handle_events(self):
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                return False
            if event.type == pygame.MOUSEMOTION:
                self.mouse_x, self.mouse_y = event.pos
                gx = self.mouse_x // TILE_SIZE
                gy = self.mouse_y // TILE_SIZE
                self.hover_tile = (gx, gy)
            if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
                if self.game_over or self.victory:
                    self.__init__()
                    return True
                gx = self.mouse_x // TILE_SIZE
                gy = self.mouse_y // TILE_SIZE
                if self.can_place_tower(gx, gy) and self.gold >= TOWER_COST:
                    px = gx * TILE_SIZE + TILE_SIZE // 2
                    py = gy * TILE_SIZE + TILE_SIZE // 2
                    self.towers.append(Tower(px, py))
                    self.gold -= TOWER_COST
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    return False
                if event.key == pygame.K_r and (self.game_over or self.victory):
                    self.__init__()
        return True

    def update(self):
        if self.game_over or self.victory:
            return

        if self.wave_cooldown > 0:
            self.wave_cooldown -= 1
            return

        if self.wave == 0 or (self.enemies_spawned >= self.enemies_per_wave and len(self.enemies) == 0):
            self.wave += 1
            if self.wave > self.max_waves:
                self.victory = True
                return
            self.enemies_spawned = 0
            self.enemies_per_wave = 5 + self.wave * 2
            self.wave_cooldown = 180
            return

        self.spawn_timer += 1
        if self.spawn_timer >= ENEMY_SPAWN_INTERVAL and self.enemies_spawned < self.enemies_per_wave:
            self.spawn_enemy()
            self.spawn_timer = 0

        for enemy in self.enemies:
            enemy.update(self.base)

        for tower in self.towers:
            tower.update(self.enemies, self.bullets)

        for bullet in self.bullets:
            bullet.update()

        dead_enemies = [e for e in self.enemies if not e.is_alive()]
        for enemy in dead_enemies:
            if enemy.health <= 0 and not enemy.rect.colliderect(self.base.rect):
                self.gold += ENEMY_KILL_GOLD
                self.score += 10

        self.enemies = [e for e in self.enemies if e.is_alive()]
        self.bullets = [b for b in self.bullets if b.is_alive()]

        if not self.base.is_alive():
            self.game_over = True

    def draw_grid(self):
        for y in range(0, SCREEN_HEIGHT, TILE_SIZE):
            for x in range(0, SCREEN_WIDTH, TILE_SIZE):
                rect = pygame.Rect(x, y, TILE_SIZE, TILE_SIZE)
                gx = x // TILE_SIZE
                gy = y // TILE_SIZE
                if self.placement_grid[gy][gx]:
                    pygame.draw.rect(self.screen, (35, 45, 55), rect)
                else:
                    pygame.draw.rect(self.screen, (45, 55, 70), rect)
                pygame.draw.rect(self.screen, (30, 40, 50), rect, 1)

    def draw_placement_preview(self):
        if self.hover_tile and not self.game_over and not self.victory:
            gx, gy = self.hover_tile
            can_place = self.can_place_tower(gx, gy) and self.gold >= TOWER_COST
            preview_x = gx * TILE_SIZE
            preview_y = gy * TILE_SIZE
            color = (100, 255, 100) if can_place else (255, 100, 100)
            pygame.draw.rect(self.screen, color, (preview_x, preview_y, TILE_SIZE, TILE_SIZE), 2)

            if can_place:
                center_x = preview_x + TILE_SIZE // 2
                center_y = preview_y + TILE_SIZE // 2
                range_surface = pygame.Surface((TOWER_RANGE * 2, TOWER_RANGE * 2), pygame.SRCALPHA)
                pygame.draw.circle(range_surface, (100, 200, 100, 30), (TOWER_RANGE, TOWER_RANGE), TOWER_RANGE)
                self.screen.blit(range_surface, (center_x - TOWER_RANGE, center_y - TOWER_RANGE))

    def draw_ui(self):
        ui_surface = pygame.Surface((SCREEN_WIDTH, 50))
        ui_surface.fill(COLOR_UI_BG)
        ui_surface.set_alpha(230)
        self.screen.blit(ui_surface, (0, SCREEN_HEIGHT - 50))

        health_text = self.font_small.render(f"生命: {self.base.health}/{self.base.max_health}", True, COLOR_UI_TEXT)
        self.screen.blit(health_text, (10, SCREEN_HEIGHT - 40))

        gold_text = self.font_small.render(f"金币: {self.gold}", True, COLOR_GOLD)
        self.screen.blit(gold_text, (180, SCREEN_HEIGHT - 40))

        wave_text = self.font_small.render(f"波次: {self.wave}/{self.max_waves}", True, COLOR_UI_TEXT)
        self.screen.blit(wave_text, (320, SCREEN_HEIGHT - 40))

        tower_text = self.font_small.render(f"塔: {len(self.towers)} | 造价: {TOWER_COST}", True, COLOR_UI_TEXT)
        self.screen.blit(tower_text, (460, SCREEN_HEIGHT - 40))

        score_text = self.font_small.render(f"分数: {self.score}", True, COLOR_UI_TEXT)
        self.screen.blit(score_text, (680, SCREEN_HEIGHT - 40))

        if self.wave_cooldown > 0:
            seconds = self.wave_cooldown // FPS
            wave_start_text = self.font_large.render(f"第 {self.wave} 波即将到来... {seconds + 1}", True, (255, 200, 100))
            text_rect = wave_start_text.get_rect(center=(SCREEN_WIDTH // 2, 80))
            self.screen.blit(wave_start_text, text_rect)

    def draw_game_over(self):
        overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT))
        overlay.set_alpha(180)
        overlay.fill((0, 0, 0))
        self.screen.blit(overlay, (0, 0))

        if self.victory:
            title = self.font_large.render("胜利！", True, (100, 255, 100))
        else:
            title = self.font_large.render("游戏结束", True, (255, 100, 100))
        subtitle = self.font_small.render(f"最终分数: {self.score} | 到达波次: {self.wave}", True, COLOR_UI_TEXT)
        restart = self.font_small.render("点击鼠标或按 R 键重新开始", True, COLOR_UI_TEXT)

        title_rect = title.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 - 40))
        sub_rect = subtitle.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + 10))
        restart_rect = restart.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + 40))

        self.screen.blit(title, title_rect)
        self.screen.blit(subtitle, sub_rect)
        self.screen.blit(restart, restart_rect)

    def draw(self):
        self.screen.fill(COLOR_BG)
        self.draw_grid()
        self.draw_placement_preview()
        self.base.draw(self.screen)

        for tower in self.towers:
            tower.draw(self.screen, show_range=False)

        for enemy in self.enemies:
            enemy.draw(self.screen)

        for bullet in self.bullets:
            bullet.draw(self.screen)

        self.draw_ui()

        if self.game_over or self.victory:
            self.draw_game_over()

        pygame.display.flip()

    def run(self):
        running = True
        while running:
            running = self.handle_events()
            self.update()
            self.draw()
            self.clock.tick(FPS)
        pygame.quit()
        sys.exit()


if __name__ == "__main__":
    game = Game()
    game.run()
