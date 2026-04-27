package com.tankwar.engine;

import com.tankwar.util.GameConstants;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

public class GameSaveData implements Serializable {
    private static final long serialVersionUID = 1L;

    public GameConstants.GameMode gameMode;
    public int level;
    public int score;
    public int lives;
    public int playerHealth;
    public int enemiesKilled;
    public int totalEnemies;
    public int totalTargets;
    public int destroyedTargets;
    public String gameState;

    public int playerX;
    public int playerY;

    public List<WallState> destroyedWalls;

    public static class WallState implements Serializable {
        private static final long serialVersionUID = 1L;
        public int x;
        public int y;
        public String type;

        public WallState(int x, int y, String type) {
            this.x = x;
            this.y = y;
            this.type = type;
        }
    }

    public GameSaveData() {
        this.destroyedWalls = new ArrayList<>();
    }

    public GameSaveData(GameConstants.GameMode gameMode, int level, int score, int lives, int playerHealth,
                        int enemiesKilled, int totalEnemies, int totalTargets, int destroyedTargets,
                        String gameState, int playerX, int playerY) {
        this.gameMode = gameMode;
        this.level = level;
        this.score = score;
        this.lives = lives;
        this.playerHealth = playerHealth;
        this.enemiesKilled = enemiesKilled;
        this.totalEnemies = totalEnemies;
        this.totalTargets = totalTargets;
        this.destroyedTargets = destroyedTargets;
        this.gameState = gameState;
        this.playerX = playerX;
        this.playerY = playerY;
        this.destroyedWalls = new ArrayList<>();
    }
}
