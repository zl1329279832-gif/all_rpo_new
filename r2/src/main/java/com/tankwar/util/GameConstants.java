package com.tankwar.util;

public class GameConstants {
    public static final int TILE_SIZE = 32;
    public static final int MAP_WIDTH = 20;
    public static final int MAP_HEIGHT = 16;
    public static final int SCREEN_WIDTH = MAP_WIDTH * TILE_SIZE;
    public static final int SCREEN_HEIGHT = MAP_HEIGHT * TILE_SIZE + 80;
    public static final int GAME_HEIGHT = MAP_HEIGHT * TILE_SIZE;

    public static final int PLAYER_SPEED = 3;
    public static final int ENEMY_SPEED = 2;
    public static final int BULLET_SPEED = 8;
    public static final int EXPLOSION_FRAMES = 8;

    public static final int FPS = 60;
    public static final long FRAME_TIME = 1000 / FPS;

    public static final int MAX_ENEMIES = 5;
    public static final int ENEMY_SPAWN_DELAY = 3000;

    public enum GameMode {
        PRACTICE, BATTLE
    }

    public static final int MAX_BATTLE_LEVELS = 5;
}
