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
import locale
import codecs

# ==================== 编码和路径初始化 ====================

# 设置默认编码为 UTF-8
try:
    # Python 3.11+ 推荐的方式
    if sys.getdefaultencoding() != 'utf-8':
        # 尝试设置标准输入输出的编码
        if hasattr(sys.stdout, 'buffer'):
            sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer)
        if hasattr(sys.stderr, 'buffer'):
            sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer)
except Exception as e:
    print(f"设置编码时出现警告: {e}")

# 设置区域设置（有助于中文字体渲染）
try:
    # 尝试设置为中文区域
    locale.setlocale(locale.LC_ALL, 'zh_CN.UTF-8')
except:
    try:
        # Windows 系统可能需要使用不同的区域名称
        locale.setlocale(locale.LC_ALL, 'Chinese')
    except:
        # 如果都失败，使用默认区域
        pass

# ==================== PyInstaller 打包路径处理 ====================

def get_base_path():
    """
    获取程序的基础路径
    - 开发环境：返回脚本所在目录
    - PyInstaller 打包后：返回可执行文件所在目录
    """
    if getattr(sys, 'frozen', False):
        # PyInstaller 打包后的环境
        # sys._MEIPASS 是 PyInstaller 解压资源的临时目录
        # 但我们希望 data 目录在可执行文件所在目录
        return os.path.dirname(sys.executable)
    else:
        # 开发环境
        return os.path.dirname(os.path.abspath(__file__))

# 获取基础路径
BASE_PATH = get_base_path()

# 确保能找到同目录下的模块
sys.path.insert(0, BASE_PATH)

# 更新 Config 中的数据目录路径
from config import Config

# 重写数据目录路径，确保在打包后也能正确找到
Config.DATA_DIR = os.path.join(BASE_PATH, 'data')
Config.SETTINGS_FILE = os.path.join(Config.DATA_DIR, 'settings.json')
Config.RANKINGS_FILE = os.path.join(Config.DATA_DIR, 'rankings.json')

from game import Game

def main():
    """游戏主函数"""
    # 初始化 Pygame
    pygame.init()
    
    # 初始化 Pygame 字体
    pygame.font.init()
    
    # 确保 Pygame 使用正确的编码
    try:
        # 设置 Pygame 的 Unicode 支持
        os.environ['PYGAME_FREETYPE'] = '1'
    except:
        pass
    
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
