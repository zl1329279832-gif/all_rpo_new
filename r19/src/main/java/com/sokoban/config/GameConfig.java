package com.sokoban.config;

import java.awt.Dimension;

public class GameConfig {
    public static final String GAME_TITLE = "像素风推箱子 - Pixel Sokoban";
    public static final int TILE_SIZE = 48;
    public static final int DEFAULT_COLS = 10;
    public static final int DEFAULT_ROWS = 10;
    
    public static final int WINDOW_PADDING = 50;
    public static final int HUD_HEIGHT = 80;
    
    public static final int MAX_UNDO_STEPS = 100;
    public static final int RANKING_ENTRY_COUNT = 10;
    
    public static final int RATING_THREE_STAR_MULTIPLIER = 1;
    public static final int RATING_TWO_STAR_MULTIPLIER = 2;
    public static final int RATING_ONE_STAR_MULTIPLIER = 3;
    
    public static final String LEVELS_DIR = "levels";
    public static final String DATA_DIR = "data";
    public static final String CONFIG_FILE = "game_config.json";
    public static final String RANKING_FILE = "ranking.json";
    
    public static final int FPS = 60;
    public static final long FRAME_TIME = 1000 / FPS;
    
    public static Dimension getGameDimension(int cols, int rows) {
        int width = cols * TILE_SIZE + WINDOW_PADDING * 2;
        int height = rows * TILE_SIZE + HUD_HEIGHT + WINDOW_PADDING * 2;
        return new Dimension(width, height);
    }
    
    public static Dimension getDefaultGameDimension() {
        return getGameDimension(DEFAULT_COLS, DEFAULT_ROWS);
    }
}
