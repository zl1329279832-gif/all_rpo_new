#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
打砖块游戏 (Breakout)
使用 Python 3.11+ 和 Pygame 开发

操作说明：
- 左右方向键 或 A/D：控制挡板移动
- 空格键：发射小球
- P 或 ESC：暂停/继续游戏
- R：重新开始当前关卡（暂停时）或重新开始游戏（游戏结束时）

作者：Python 游戏开发工程师
"""

import pygame
import sys
import os

# 确保能找到同目录下的模块
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import Config
from game import Game

def main():
    """游戏主函数"""
    # 初始化 Pygame
    pygame.init()
    
    # 初始化 Pygame 字体
    pygame.font.init()
    
    # 加载设置
    settings = Config.load_settings()
    
    # 获取窗口大小
    screen_width = settings.get('screen_width', Config.SCREEN_WIDTH)
    screen_height = settings.get('screen_height', Config.SCREEN_HEIGHT)
    
    # 创建游戏窗口
    screen = pygame.display.set_mode((screen_width, screen_height))
    pygame.display.set_caption("打砖块 - Breakout")
    
    # 设置窗口图标（如果有）
    try:
        # 这里可以添加图标，但为了简单起见，我们跳过
        pass
    except:
        pass
    
    # 创建游戏对象
    game = Game(screen, settings)
    
    # 游戏主循环
    running = True
    clock = pygame.time.Clock()
    
    while running:
        # 限制帧率
        clock.tick(Config.FPS)
        
        # 处理事件
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            else:
                # 让游戏对象处理其他事件
                if not game.handle_event(event):
                    running = False
        
        # 更新游戏状态
        game.update()
        
        # 绘制游戏
        game.draw()
        
        # 更新显示
        pygame.display.flip()
    
    # 保存设置
    Config.save_settings(settings)
    
    # 退出 Pygame
    pygame.font.quit()
    pygame.quit()
    sys.exit()

if __name__ == "__main__":
    main()
