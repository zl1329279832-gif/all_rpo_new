package com.tankwar.engine;

import com.tankwar.util.GameConstants;

import java.io.Serializable;

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

    public GameSaveData(GameConstants.GameMode gameMode, int level, int score, int lives, int playerHealth,
                        int enemiesKilled, int totalEnemies, int totalTargets, int destroyedTargets) {
        this.gameMode = gameMode;
        this.level = level;
        this.score = score;
        this.lives = lives;
        this.playerHealth = playerHealth;
        this.enemiesKilled = enemiesKilled;
        this.totalEnemies = totalEnemies;
        this.totalTargets = totalTargets;
        this.destroyedTargets = destroyedTargets;
    }
}
