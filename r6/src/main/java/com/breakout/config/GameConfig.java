package com.breakout.config;

import java.awt.*;

public final class GameConfig {

    public static final int WINDOW_WIDTH = 800;
    public static final int WINDOW_HEIGHT = 600;
    public static final String WINDOW_TITLE = "Breakout Game";
    public static final int FPS = 60;
    public static final double FRAME_TIME = 1.0 / FPS;

    public static final int PADDLE_WIDTH = 100;
    public static final int PADDLE_HEIGHT = 15;
    public static final int PADDLE_Y_OFFSET = 60;
    public static final double PADDLE_SPEED = 8.0;
    public static final int PADDLE_MIN_WIDTH = 50;
    public static final int PADDLE_MAX_WIDTH = 180;

    public static final int BALL_RADIUS = 8;
    public static final double BALL_BASE_SPEED = 5.0;
    public static final double BALL_MAX_SPEED = 12.0;
    public static final double BALL_MIN_SPEED = 3.0;
    public static final double BALL_SPEED_INCREMENT = 0.5;

    public static final int BRICK_WIDTH = 60;
    public static final int BRICK_HEIGHT = 20;
    public static final int BRICK_SPACING = 5;
    public static final int BRICK_TOP_OFFSET = 50;
    public static final int BRICK_LEFT_OFFSET = 40;

    public static final int INITIAL_LIVES = 3;
    public static final int MAX_LIVES = 5;

    public static final int SCORE_NORMAL_BRICK = 10;
    public static final int SCORE_TWO_HIT_BRICK = 20;
    public static final int SCORE_THREE_HIT_BRICK = 30;
    public static final int SCORE_LEVEL_COMPLETE = 1000;

    public static final double POWERUP_SPEED = 3.0;
    public static final int POWERUP_SIZE = 20;
    public static final double POWERUP_DROP_CHANCE = 0.3;

    public static final int MAX_LEVELS = 10;

    private GameConfig() {
    }

    public static final class Colors {
        public static final Color BACKGROUND = new Color(20, 20, 40);
        public static final Color PADDLE = new Color(100, 200, 255);
        public static final Color PADDLE_GLOW = new Color(100, 200, 255, 100);
        public static final Color BALL = new Color(255, 255, 255);
        public static final Color BALL_GLOW = new Color(255, 255, 255, 50);
        public static final Color WALL = new Color(80, 80, 120);
        
        public static final Color BRICK_NORMAL = new Color(60, 179, 113);
        public static final Color BRICK_TWO_HIT = new Color(255, 165, 0);
        public static final Color BRICK_THREE_HIT = new Color(220, 20, 60);
        public static final Color BRICK_INDESTRUCTIBLE = new Color(128, 128, 128);
        public static final Color BRICK_GOLD = new Color(255, 215, 0);
        
        public static final Color TEXT = new Color(255, 255, 255);
        public static final Color TEXT_HIGHLIGHT = new Color(255, 215, 0);
        public static final Color UI_BACKGROUND = new Color(30, 30, 50, 220);
        public static final Color UI_BORDER = new Color(100, 100, 150);
        
        public static final Color POWERUP_EXPAND = new Color(0, 255, 128);
        public static final Color POWERUP_SHRINK = new Color(255, 100, 100);
        public static final Color POWERUP_SPEED_UP = new Color(255, 200, 0);
        public static final Color POWERUP_SLOW_DOWN = new Color(100, 150, 255);
        public static final Color POWERUP_EXTRA_LIFE = new Color(255, 50, 150);
        public static final Color POWERUP_PIERCE = new Color(200, 0, 255);
        public static final Color POWERUP_MULTI_BALL = new Color(0, 200, 255);
        public static final Color POWERUP_CATCH = new Color(255, 255, 0);
        
        private Colors() {
        }
    }

    public static final class Fonts {
        private static Font getChineseFont(int style, int size) {
            Font font;
            
            font = new Font("Microsoft YaHei", style, size);
            if (font.canDisplay('中')) {
                return font;
            }
            
            font = new Font("SimHei", style, size);
            if (font.canDisplay('中')) {
                return font;
            }
            
            font = new Font("SimSun", style, size);
            if (font.canDisplay('中')) {
                return font;
            }
            
            font = new Font("Dialog", style, size);
            if (font.canDisplay('中')) {
                return font;
            }
            
            return new Font("SansSerif", style, size);
        }
        
        public static final Font TITLE = getChineseFont(Font.BOLD, 48);
        public static final Font MENU = getChineseFont(Font.PLAIN, 24);
        public static final Font HUD = getChineseFont(Font.BOLD, 18);
        public static final Font GAME_OVER = getChineseFont(Font.BOLD, 36);
        public static final Font SMALL = getChineseFont(Font.PLAIN, 14);
        
        private Fonts() {
        }
    }
}
