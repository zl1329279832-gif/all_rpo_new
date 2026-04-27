package com.game.planewar.core;

/**
 * 关卡系统 - 管理难度递增
 */
public class LevelSystem {
    
    private final GameController gameController;
    private int currentLevel;
    private int scoreToNextLevel;
    private int enemiesKilledInLevel;
    private int enemiesToKillForLevel;
    private float difficultyMultiplier;
    private boolean bossActive;
    
    private static final int BASE_SCORE_PER_LEVEL = 5000;
    private static final int BASE_ENEMIES_PER_LEVEL = 20;
    
    public LevelSystem(GameController gameController) {
        this.gameController = gameController;
        reset();
    }
    
    /**
     * 重置关卡系统
     */
    public void reset() {
        this.currentLevel = 1;
        this.scoreToNextLevel = BASE_SCORE_PER_LEVEL;
        this.enemiesKilledInLevel = 0;
        this.enemiesToKillForLevel = BASE_ENEMIES_PER_LEVEL;
        this.difficultyMultiplier = 1.0f;
        this.bossActive = false;
    }
    
    /**
     * 更新关卡进度
     */
    public void update() {
        int currentScore = gameController.getScoreSystem().getScore();
        
        if (!bossActive && (currentScore >= scoreToNextLevel || 
            enemiesKilledInLevel >= enemiesToKillForLevel)) {
            
            if (currentLevel % 5 == 0) {
                activateBoss();
            } else {
                levelUp();
            }
        }
    }
    
    /**
     * 升级到下一关
     */
    private void levelUp() {
        currentLevel++;
        scoreToNextLevel = BASE_SCORE_PER_LEVEL * currentLevel;
        enemiesKilledInLevel = 0;
        enemiesToKillForLevel = BASE_ENEMIES_PER_LEVEL + currentLevel * 2;
        difficultyMultiplier = 1.0f + (currentLevel - 1) * 0.1f;
    }
    
    /**
     * 激活 Boss 关卡
     */
    private void activateBoss() {
        bossActive = true;
        gameController.getEnemyManager().spawnBoss();
    }
    
    /**
     * Boss 被击败
     */
    public void bossDefeated() {
        bossActive = false;
        levelUp();
        gameController.getScoreSystem().addScore(10000, false);
    }
    
    /**
     * 记录击杀敌人
     */
    public void onEnemyKilled() {
        enemiesKilledInLevel++;
    }
    
    /**
     * 获取当前关卡
     */
    public int getCurrentLevel() {
        return currentLevel;
    }
    
    /**
     * 获取难度乘数
     */
    public float getDifficultyMultiplier() {
        return difficultyMultiplier;
    }
    
    /**
     * 检查 Boss 是否激活
     */
    public boolean isBossActive() {
        return bossActive;
    }
    
    /**
     * 获取当前关卡进度百分比
     */
    public float getLevelProgress() {
        int currentScore = gameController.getScoreSystem().getScore();
        float scoreProgress = (float) currentScore / scoreToNextLevel;
        float enemyProgress = (float) enemiesKilledInLevel / enemiesToKillForLevel;
        
        return Math.max(scoreProgress, enemyProgress);
    }
}
