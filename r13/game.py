import pygame
import random
import math
from config import Config
from paddle import Paddle
from ball import Ball
from brick import Brick
from powerup import PowerUp
from level import Level

class GameState:
    """游戏状态枚举"""
    MENU = 1
    PLAYING = 2
    PAUSED = 3
    GAME_OVER = 4
    VICTORY = 5
    RANKINGS = 6
    SETTINGS = 7

class Game:
    """游戏主类，负责管理游戏状态和游戏循环"""
    
    def __init__(self, screen, settings):
        """初始化游戏"""
        self.screen = screen
        self.settings = settings
        self.clock = pygame.time.Clock()
        
        # 游戏状态
        self.state = GameState.MENU
        
        # 游戏核心对象
        self.paddle = None
        self.balls = []
        self.bricks = []
        self.powerups = []
        
        # 关卡系统
        self.level_system = Level(Config.SCREEN_WIDTH, Config.SCREEN_HEIGHT)
        
        # 游戏数据
        self.score = 0
        self.lives = Config.INITIAL_LIVES
        self.current_level = 1
        
        # 消息显示
        self.message = ""
        self.message_timer = 0
        
        # 选中的菜单项
        self.selected_menu_item = 0
        self.menu_items = []
        
        # 输入框状态
        self.input_active = False
        self.input_text = settings.get('default_nickname', 'Player')
        
        # 初始化字体
        self._init_fonts()
        
        # 初始化菜单
        self._init_menu_items()
    
    def _init_fonts(self):
        """初始化字体"""
        try:
            # 尝试使用系统字体
            self.title_font = pygame.font.Font(None, 64)
            self.large_font = pygame.font.Font(None, 48)
            self.medium_font = pygame.font.Font(None, 36)
            self.small_font = pygame.font.Font(None, 24)
        except:
            # 如果失败，使用默认字体
            self.title_font = pygame.font.Font(None, 64)
            self.large_font = pygame.font.Font(None, 48)
            self.medium_font = pygame.font.Font(None, 36)
            self.small_font = pygame.font.Font(None, 24)
    
    def _init_menu_items(self):
        """初始化菜单项"""
        self.menu_items = [
            "开始游戏",
            "排行榜",
            "设置",
            "退出"
        ]
    
    def _init_game_objects(self):
        """初始化游戏对象"""
        # 创建挡板
        self.paddle = Paddle(Config.SCREEN_WIDTH, Config.SCREEN_HEIGHT)
        
        # 创建小球
        self.balls = []
        ball = Ball(
            Config.SCREEN_WIDTH, 
            Config.SCREEN_HEIGHT, 
            self.paddle.x, 
            self.paddle.y, 
            self.paddle.width
        )
        self.balls.append(ball)
        
        # 清空砖块和道具列表
        self.bricks = []
        self.powerups = []
        
        # 重置游戏数据
        self.score = 0
        self.lives = Config.INITIAL_LIVES
        self.current_level = 1
        
        # 加载第一关
        self._load_level()
    
    def _load_level(self):
        """加载当前关卡"""
        # 重置关卡系统
        self.level_system.set_level(self.current_level)
        
        # 生成砖块
        self.bricks = self.level_system.generate_level()
        
        # 清空道具列表
        self.powerups = []
        
        # 重置小球到挡板上
        for ball in self.balls:
            ball.attach_to_paddle(self.paddle.x, self.paddle.width)
        
        # 显示关卡开始消息
        self.show_message(f"第 {self.current_level} 关", 3)
    
    def _check_level_complete(self):
        """检查是否通关当前关卡"""
        # 计算剩余可破坏砖块数量
        remaining = self.level_system.count_breakable_bricks()
        
        if remaining == 0:
            # 所有可破坏砖块都被清除，进入下一关
            self.current_level += 1
            self.level_system.next_level()
            
            # 检查是否是终极关卡（可以设置一个最大关卡数）
            # 这里我们设置为无限关卡，只要玩家能玩下去
            self._load_level()
            
            # 奖励分数
            self.score += 500 * self.current_level
    
    def _check_game_over(self):
        """检查游戏是否结束"""
        if self.lives <= 0:
            self.state = GameState.GAME_OVER
            self._save_score()
    
    def _save_score(self):
        """保存分数到排行榜"""
        # 更新最高分
        if self.score > self.settings.get('high_score', 0):
            self.settings['high_score'] = self.score
            Config.save_settings(self.settings)
        
        # 添加到排行榜
        Config.add_to_rankings(
            self.input_text, 
            self.score, 
            self.current_level
        )
    
    def show_message(self, message, duration=2):
        """显示消息"""
        self.message = message
        self.message_timer = duration * Config.FPS  # 转换为帧数
    
    def _update_message(self):
        """更新消息显示"""
        if self.message_timer > 0:
            self.message_timer -= 1
            if self.message_timer == 0:
                self.message = ""
    
    def handle_event(self, event):
        """处理事件"""
        if event.type == pygame.QUIT:
            return False
        
        if event.type == pygame.KEYDOWN:
            # 处理不同状态下的键盘事件
            if self.state == GameState.MENU:
                self._handle_menu_keydown(event)
            elif self.state == GameState.PLAYING:
                self._handle_playing_keydown(event)
            elif self.state == GameState.PAUSED:
                self._handle_paused_keydown(event)
            elif self.state == GameState.GAME_OVER:
                self._handle_game_over_keydown(event)
            elif self.state == GameState.RANKINGS:
                self._handle_rankings_keydown(event)
            elif self.state == GameState.SETTINGS:
                self._handle_settings_keydown(event)
        
        elif event.type == pygame.KEYUP:
            # 处理按键释放事件
            if self.state == GameState.PLAYING:
                self._handle_playing_keyup(event)
        
        return True
    
    def _handle_menu_keydown(self, event):
        """处理菜单状态下的键盘事件"""
        if event.key == pygame.K_UP:
            self.selected_menu_item = (self.selected_menu_item - 1) % len(self.menu_items)
        elif event.key == pygame.K_DOWN:
            self.selected_menu_item = (self.selected_menu_item + 1) % len(self.menu_items)
        elif event.key == pygame.K_RETURN or event.key == pygame.K_KP_ENTER:
            self._select_menu_item()
        elif event.key == pygame.K_ESCAPE:
            # 退出游戏
            pygame.event.post(pygame.event.Event(pygame.QUIT))
    
    def _handle_playing_keydown(self, event):
        """处理游戏进行中的键盘事件"""
        if event.key == pygame.K_LEFT or event.key == pygame.K_a:
            self.paddle.move_left()
        elif event.key == pygame.K_RIGHT or event.key == pygame.K_d:
            self.paddle.move_right()
        elif event.key == pygame.K_SPACE:
            # 发射所有未移动的小球
            for ball in self.balls:
                if not ball.is_moving:
                    ball.launch()
        elif event.key == pygame.K_p or event.key == pygame.K_ESCAPE:
            # 暂停游戏
            self.state = GameState.PAUSED
    
    def _handle_playing_keyup(self, event):
        """处理游戏进行中的按键释放事件"""
        if event.key == pygame.K_LEFT or event.key == pygame.K_a or event.key == pygame.K_RIGHT or event.key == pygame.K_d:
            # 检查是否还有方向键被按下
            keys = pygame.key.get_pressed()
            if not keys[pygame.K_LEFT] and not keys[pygame.K_a] and not keys[pygame.K_RIGHT] and not keys[pygame.K_d]:
                self.paddle.stop()
            elif keys[pygame.K_LEFT] or keys[pygame.K_a]:
                self.paddle.move_left()
            elif keys[pygame.K_RIGHT] or keys[pygame.K_d]:
                self.paddle.move_right()
    
    def _handle_paused_keydown(self, event):
        """处理暂停状态下的键盘事件"""
        if event.key == pygame.K_p or event.key == pygame.K_ESCAPE or event.key == pygame.K_SPACE:
            # 继续游戏
            self.state = GameState.PLAYING
        elif event.key == pygame.K_r:
            # 重新开始当前关卡
            self._restart_level()
    
    def _handle_game_over_keydown(self, event):
        """处理游戏结束状态下的键盘事件"""
        if event.key == pygame.K_RETURN or event.key == pygame.K_KP_ENTER:
            # 返回主菜单
            self.state = GameState.MENU
        elif event.key == pygame.K_r:
            # 重新开始游戏
            self._restart_game()
    
    def _handle_rankings_keydown(self, event):
        """处理排行榜状态下的键盘事件"""
        if event.key == pygame.K_ESCAPE or event.key == pygame.K_RETURN:
            # 返回主菜单
            self.state = GameState.MENU
    
    def _handle_settings_keydown(self, event):
        """处理设置状态下的键盘事件"""
        if event.key == pygame.K_ESCAPE:
            # 保存设置并返回主菜单
            Config.save_settings(self.settings)
            self.state = GameState.MENU
        elif event.key == pygame.K_s:
            # 切换音效开关
            self.settings['sound_enabled'] = not self.settings.get('sound_enabled', True)
        elif event.key == pygame.K_n:
            # 修改昵称
            self.input_active = not self.input_active
        elif self.input_active:
            if event.key == pygame.K_BACKSPACE:
                self.input_text = self.input_text[:-1]
            elif event.key == pygame.K_RETURN:
                self.input_active = False
                self.settings['default_nickname'] = self.input_text
            elif event.unicode.isalnum() or event.unicode == '_':
                if len(self.input_text) < 10:
                    self.input_text += event.unicode
    
    def _select_menu_item(self):
        """选择菜单项"""
        if self.selected_menu_item == 0:
            # 开始游戏
            self._init_game_objects()
            self.state = GameState.PLAYING
        elif self.selected_menu_item == 1:
            # 排行榜
            self.state = GameState.RANKINGS
        elif self.selected_menu_item == 2:
            # 设置
            self.state = GameState.SETTINGS
        elif self.selected_menu_item == 3:
            # 退出
            pygame.event.post(pygame.event.Event(pygame.QUIT))
    
    def _restart_level(self):
        """重新开始当前关卡"""
        # 重置挡板
        self.paddle = Paddle(Config.SCREEN_WIDTH, Config.SCREEN_HEIGHT)
        
        # 重置小球
        self.balls = []
        ball = Ball(
            Config.SCREEN_WIDTH, 
            Config.SCREEN_HEIGHT, 
            self.paddle.x, 
            self.paddle.y, 
            self.paddle.width
        )
        self.balls.append(ball)
        
        # 清空道具列表
        self.powerups = []
        
        # 重新加载关卡
        self.bricks = self.level_system.generate_level()
        
        # 显示消息
        self.show_message("重新开始", 2)
        
        # 恢复游戏状态
        self.state = GameState.PLAYING
    
    def _restart_game(self):
        """重新开始整个游戏"""
        self._init_game_objects()
        self.state = GameState.PLAYING
    
    def update(self):
        """更新游戏状态"""
        if self.state == GameState.PLAYING:
            self._update_playing()
        
        # 更新消息显示
        self._update_message()
    
    def _update_playing(self):
        """更新游戏进行中的状态"""
        # 更新挡板
        self.paddle.update()
        
        # 更新小球
        for i in range(len(self.balls) - 1, -1, -1):
            ball = self.balls[i]
            ball.update()
            
            # 如果小球没有移动，确保它跟随挡板
            if not ball.is_moving:
                ball.attach_to_paddle(self.paddle.x, self.paddle.width)
            
            # 检查小球是否超出屏幕
            if ball.check_out_of_bounds():
                self.balls.pop(i)
                
                # 如果没有小球了，减少生命值
                if len(self.balls) == 0:
                    self.lives -= 1
                    
                    # 检查游戏是否结束
                    self._check_game_over()
                    
                    # 如果游戏还没结束，创建一个新的小球
                    if self.lives > 0:
                        new_ball = Ball(
                            Config.SCREEN_WIDTH, 
                            Config.SCREEN_HEIGHT, 
                            self.paddle.x, 
                            self.paddle.y, 
                            self.paddle.width
                        )
                        self.balls.append(new_ball)
            
            # 检测小球与挡板的碰撞
            elif ball.is_moving and ball.check_collision(self.paddle.get_rect()):
                ball.bounce_paddle(self.paddle)
        
        # 检测小球与砖块的碰撞
        self._check_ball_brick_collisions()
        
        # 检测小球与小球的碰撞（多球模式）
        self._check_ball_ball_collisions()
        
        # 更新道具
        self._update_powerups()
        
        # 检查是否通关
        self._check_level_complete()
    
    def _check_ball_brick_collisions(self):
        """检测小球与砖块的碰撞"""
        for ball in self.balls:
            if not ball.is_moving:
                continue
            
            for brick in self.bricks:
                if brick.is_destroyed:
                    continue
                
                if ball.check_collision(brick.get_rect()):
                    # 计算碰撞方向
                    is_side = ball.check_side_collision(brick.get_rect())
                    
                    # 处理碰撞反弹
                    ball.bounce_brick(brick.get_rect(), is_side)
                    
                    # 击中砖块
                    if brick.hit(ball.is_piercing):
                        # 砖块被摧毁，增加分数
                        self.score += brick.get_score()
                        
                        # 检查是否掉落道具
                        if brick.can_drop_powerup() and random.random() < self.level_system.get_powerup_chance():
                            # 创建道具
                            powerup = PowerUp(
                                brick.x + brick.width // 2 - 10,
                                brick.y,
                                20,
                                20
                            )
                            self.powerups.append(powerup)
    
    def _check_ball_ball_collisions(self):
        """检测小球与小球的碰撞"""
        # 简单实现：多球之间不发生碰撞
        pass
    
    def _update_powerups(self):
        """更新道具"""
        for i in range(len(self.powerups) - 1, -1, -1):
            powerup = self.powerups[i]
            powerup.update()
            
            # 检查道具是否超出屏幕
            if powerup.check_out_of_bounds(Config.SCREEN_HEIGHT):
                self.powerups.pop(i)
                continue
            
            # 检查道具是否与挡板碰撞
            if powerup.get_rect().colliderect(self.paddle.get_rect()):
                # 应用道具效果
                powerup.apply_effect(self)
                self.powerups.pop(i)
    
    def draw(self):
        """绘制游戏"""
        # 填充背景
        self.screen.fill(Config.BLACK)
        
        # 根据状态绘制不同的界面
        if self.state == GameState.MENU:
            self._draw_menu()
        elif self.state == GameState.PLAYING:
            self._draw_playing()
        elif self.state == GameState.PAUSED:
            self._draw_paused()
        elif self.state == GameState.GAME_OVER:
            self._draw_game_over()
        elif self.state == GameState.VICTORY:
            self._draw_victory()
        elif self.state == GameState.RANKINGS:
            self._draw_rankings()
        elif self.state == GameState.SETTINGS:
            self._draw_settings()
        
        # 绘制消息（如果有）
        if self.message:
            self._draw_message()
    
    def _draw_menu(self):
        """绘制主菜单"""
        # 绘制标题
        title_text = self.title_font.render("打砖块", True, Config.WHITE)
        title_rect = title_text.get_rect(center=(Config.SCREEN_WIDTH // 2, 100))
        self.screen.blit(title_text, title_rect)
        
        # 绘制副标题
        subtitle_text = self.medium_font.render("BREAKOUT", True, Config.GRAY)
        subtitle_rect = subtitle_text.get_rect(center=(Config.SCREEN_WIDTH // 2, 160))
        self.screen.blit(subtitle_text, subtitle_rect)
        
        # 绘制菜单项
        for i, item in enumerate(self.menu_items):
            if i == self.selected_menu_item:
                # 选中的项
                text = self.medium_font.render(f"> {item} <", True, Config.YELLOW)
            else:
                text = self.medium_font.render(item, True, Config.WHITE)
            
            text_rect = text.get_rect(center=(Config.SCREEN_WIDTH // 2, 250 + i * 60))
            self.screen.blit(text, text_rect)
        
        # 绘制操作提示
        hint_text = self.small_font.render("方向键选择，Enter确认，ESC退出", True, Config.GRAY)
        hint_rect = hint_text.get_rect(center=(Config.SCREEN_WIDTH // 2, Config.SCREEN_HEIGHT - 50))
        self.screen.blit(hint_text, hint_rect)
    
    def _draw_playing(self):
        """绘制游戏进行中的界面"""
        # 绘制挡板
        self.paddle.draw(self.screen)
        
        # 绘制小球
        for ball in self.balls:
            ball.draw(self.screen)
        
        # 绘制砖块
        for brick in self.bricks:
            if not brick.is_destroyed:
                brick.draw(self.screen)
        
        # 绘制道具
        for powerup in self.powerups:
            powerup.draw(self.screen)
        
        # 绘制HUD（顶部信息栏）
        self._draw_hud()
    
    def _draw_hud(self):
        """绘制游戏信息栏"""
        # 绘制分数
        score_text = self.small_font.render(f"分数: {self.score}", True, Config.WHITE)
        self.screen.blit(score_text, (10, 10))
        
        # 绘制关卡
        level_text = self.small_font.render(f"关卡: {self.current_level}", True, Config.WHITE)
        level_rect = level_text.get_rect(center=(Config.SCREEN_WIDTH // 2, 20))
        self.screen.blit(level_text, level_rect)
        
        # 绘制生命值
        lives_text = self.small_font.render(f"生命: {self.lives}", True, Config.WHITE)
        lives_rect = lives_text.get_rect(right=Config.SCREEN_WIDTH - 10, top=10)
        self.screen.blit(lives_text, lives_rect)
        
        # 绘制生命值图标（用小球表示）
        for i in range(self.lives):
            pygame.draw.circle(self.screen, Config.RED, (Config.SCREEN_WIDTH - 100 + i * 20, 40), 8)
    
    def _draw_paused(self):
        """绘制暂停界面"""
        # 先绘制游戏画面
        self._draw_playing()
        
        # 绘制半透明遮罩
        overlay = pygame.Surface((Config.SCREEN_WIDTH, Config.SCREEN_HEIGHT))
        overlay.set_alpha(128)
        overlay.fill(Config.BLACK)
        self.screen.blit(overlay, (0, 0))
        
        # 绘制暂停文本
        pause_text = self.large_font.render("游戏暂停", True, Config.YELLOW)
        pause_rect = pause_text.get_rect(center=(Config.SCREEN_WIDTH // 2, Config.SCREEN_HEIGHT // 2 - 50))
        self.screen.blit(pause_text, pause_rect)
        
        # 绘制操作提示
        hint1_text = self.small_font.render("按 P 或 ESC 继续游戏", True, Config.WHITE)
        hint1_rect = hint1_text.get_rect(center=(Config.SCREEN_WIDTH // 2, Config.SCREEN_HEIGHT // 2 + 20))
        self.screen.blit(hint1_text, hint1_rect)
        
        hint2_text = self.small_font.render("按 R 重新开始当前关卡", True, Config.WHITE)
        hint2_rect = hint2_text.get_rect(center=(Config.SCREEN_WIDTH // 2, Config.SCREEN_HEIGHT // 2 + 50))
        self.screen.blit(hint2_text, hint2_rect)
    
    def _draw_game_over(self):
        """绘制游戏结束界面"""
        # 绘制背景
        self.screen.fill(Config.BLACK)
        
        # 绘制游戏结束文本
        game_over_text = self.title_font.render("游戏结束", True, Config.RED)
        game_over_rect = game_over_text.get_rect(center=(Config.SCREEN_WIDTH // 2, 150))
        self.screen.blit(game_over_text, game_over_rect)
        
        # 绘制最终分数
        score_text = self.medium_font.render(f"最终分数: {self.score}", True, Config.WHITE)
        score_rect = score_text.get_rect(center=(Config.SCREEN_WIDTH // 2, 250))
        self.screen.blit(score_text, score_rect)
        
        # 绘制到达的关卡
        level_text = self.medium_font.render(f"到达关卡: {self.current_level}", True, Config.WHITE)
        level_rect = level_text.get_rect(center=(Config.SCREEN_WIDTH // 2, 300))
        self.screen.blit(level_text, level_rect)
        
        # 绘制最高分
        high_score_text = self.small_font.render(f"最高分: {self.settings.get('high_score', 0)}", True, Config.GOLD)
        high_score_rect = high_score_text.get_rect(center=(Config.SCREEN_WIDTH // 2, 370))
        self.screen.blit(high_score_text, high_score_rect)
        
        # 绘制操作提示
        hint1_text = self.small_font.render("按 Enter 返回主菜单", True, Config.WHITE)
        hint1_rect = hint1_text.get_rect(center=(Config.SCREEN_WIDTH // 2, Config.SCREEN_HEIGHT - 100))
        self.screen.blit(hint1_text, hint1_rect)
        
        hint2_text = self.small_font.render("按 R 重新开始游戏", True, Config.WHITE)
        hint2_rect = hint2_text.get_rect(center=(Config.SCREEN_WIDTH // 2, Config.SCREEN_HEIGHT - 70))
        self.screen.blit(hint2_text, hint2_rect)
    
    def _draw_victory(self):
        """绘制通关界面（暂未使用，因为设置了无限关卡）"""
        # 绘制背景
        self.screen.fill(Config.BLACK)
        
        # 绘制通关文本
        victory_text = self.title_font.render("恭喜通关!", True, Config.GOLD)
        victory_rect = victory_text.get_rect(center=(Config.SCREEN_WIDTH // 2, 150))
        self.screen.blit(victory_text, victory_rect)
        
        # 绘制最终分数
        score_text = self.medium_font.render(f"最终分数: {self.score}", True, Config.WHITE)
        score_rect = score_text.get_rect(center=(Config.SCREEN_WIDTH // 2, 250))
        self.screen.blit(score_text, score_rect)
        
        # 绘制操作提示
        hint_text = self.small_font.render("按 Enter 返回主菜单", True, Config.WHITE)
        hint_rect = hint_text.get_rect(center=(Config.SCREEN_WIDTH // 2, Config.SCREEN_HEIGHT - 70))
        self.screen.blit(hint_text, hint_rect)
    
    def _draw_rankings(self):
        """绘制排行榜界面"""
        # 绘制背景
        self.screen.fill(Config.BLACK)
        
        # 绘制标题
        title_text = self.large_font.render("排行榜", True, Config.GOLD)
        title_rect = title_text.get_rect(center=(Config.SCREEN_WIDTH // 2, 80))
        self.screen.blit(title_text, title_rect)
        
        # 加载排行榜数据
        rankings = Config.load_rankings()
        
        if not rankings:
            # 没有数据
            no_data_text = self.medium_font.render("暂无排行榜数据", True, Config.GRAY)
            no_data_rect = no_data_text.get_rect(center=(Config.SCREEN_WIDTH // 2, Config.SCREEN_HEIGHT // 2))
            self.screen.blit(no_data_text, no_data_rect)
        else:
            # 绘制表头
            header_text = self.small_font.render(f"{'排名':<6}{'昵称':<15}{'分数':<10}{'关卡':<6}", True, Config.YELLOW)
            header_rect = header_text.get_rect(topleft=(100, 150))
            self.screen.blit(header_text, header_rect)
            
            # 绘制分隔线
            pygame.draw.line(self.screen, Config.WHITE, (80, 180), (Config.SCREEN_WIDTH - 80, 180), 2)
            
            # 绘制排名数据
            for i, entry in enumerate(rankings[:10]):
                rank = i + 1
                nickname = entry.get('nickname', 'Unknown')
                score = entry.get('score', 0)
                level = entry.get('level', 1)
                
                # 根据排名设置颜色
                if rank == 1:
                    color = Config.GOLD
                elif rank == 2:
                    color = (192, 192, 192)  # 银色
                elif rank == 3:
                    color = (205, 127, 50)   # 铜色
                else:
                    color = Config.WHITE
                
                # 绘制排名项
                rank_text = self.small_font.render(f"{rank:<6}{nickname:<15}{score:<10}{level:<6}", True, color)
                rank_rect = rank_text.get_rect(topleft=(100, 200 + i * 35))
                self.screen.blit(rank_text, rank_rect)
        
        # 绘制操作提示
        hint_text = self.small_font.render("按 ESC 或 Enter 返回主菜单", True, Config.GRAY)
        hint_rect = hint_text.get_rect(center=(Config.SCREEN_WIDTH // 2, Config.SCREEN_HEIGHT - 50))
        self.screen.blit(hint_text, hint_rect)
    
    def _draw_settings(self):
        """绘制设置界面"""
        # 绘制背景
        self.screen.fill(Config.BLACK)
        
        # 绘制标题
        title_text = self.large_font.render("游戏设置", True, Config.WHITE)
        title_rect = title_text.get_rect(center=(Config.SCREEN_WIDTH // 2, 80))
        self.screen.blit(title_text, title_rect)
        
        # 绘制音效开关
        sound_status = "开启" if self.settings.get('sound_enabled', True) else "关闭"
        sound_text = self.medium_font.render(f"音效: {sound_status} (按 S 切换)", True, Config.WHITE)
        sound_rect = sound_text.get_rect(center=(Config.SCREEN_WIDTH // 2, 200))
        self.screen.blit(sound_text, sound_rect)
        
        # 绘制昵称设置
        nickname_text = self.medium_font.render(f"默认昵称:", True, Config.WHITE)
        nickname_rect = nickname_text.get_rect(center=(Config.SCREEN_WIDTH // 2 - 80, 280))
        self.screen.blit(nickname_text, nickname_rect)
        
        # 绘制昵称输入框
        input_box = pygame.Rect(Config.SCREEN_WIDTH // 2, 265, 200, 40)
        pygame.draw.rect(self.screen, Config.DARK_GRAY if self.input_active else Config.GRAY, input_box)
        pygame.draw.rect(self.screen, Config.WHITE, input_box, 2)
        
        # 绘制输入的文本
        text_surface = self.medium_font.render(self.input_text, True, Config.WHITE)
        text_rect = text_surface.get_rect(center=input_box.center)
        self.screen.blit(text_surface, text_rect)
        
        # 绘制输入提示
        hint_text = self.small_font.render("按 N 激活输入框，输入后按 Enter 确认", True, Config.GRAY)
        hint_rect = hint_text.get_rect(center=(Config.SCREEN_WIDTH // 2, 330))
        self.screen.blit(hint_text, hint_rect)
        
        # 绘制窗口大小
        width = self.settings.get('screen_width', Config.SCREEN_WIDTH)
        height = self.settings.get('screen_height', Config.SCREEN_HEIGHT)
        window_text = self.medium_font.render(f"窗口大小: {width} x {height}", True, Config.WHITE)
        window_rect = window_text.get_rect(center=(Config.SCREEN_WIDTH // 2, 400))
        self.screen.blit(window_text, window_rect)
        
        # 绘制最高分
        high_score_text = self.medium_font.render(f"最高分: {self.settings.get('high_score', 0)}", True, Config.GOLD)
        high_score_rect = high_score_text.get_rect(center=(Config.SCREEN_WIDTH // 2, 470))
        self.screen.blit(high_score_text, high_score_rect)
        
        # 绘制操作提示
        hint_text = self.small_font.render("按 ESC 保存并返回主菜单", True, Config.GRAY)
        hint_rect = hint_text.get_rect(center=(Config.SCREEN_WIDTH // 2, Config.SCREEN_HEIGHT - 50))
        self.screen.blit(hint_text, hint_rect)
    
    def _draw_message(self):
        """绘制消息"""
        # 绘制半透明背景
        overlay = pygame.Surface((Config.SCREEN_WIDTH, 100))
        overlay.set_alpha(200)
        overlay.fill(Config.DARK_GRAY)
        self.screen.blit(overlay, (0, Config.SCREEN_HEIGHT // 2 - 50))
        
        # 绘制消息文本
        message_text = self.large_font.render(self.message, True, Config.YELLOW)
        message_rect = message_text.get_rect(center=(Config.SCREEN_WIDTH // 2, Config.SCREEN_HEIGHT // 2))
        self.screen.blit(message_text, message_rect)
    
    # 辅助函数，用于道具系统
    def _get_angle(self, dx, dy):
        """获取速度方向的角度"""
        return math.atan2(dy, dx)
    
    def _get_dx(self, angle, speed):
        """根据角度和速度获取dx分量"""
        return math.cos(angle) * speed
    
    def _get_dy(self, angle, speed):
        """根据角度和速度获取dy分量"""
        return math.sin(angle) * speed
