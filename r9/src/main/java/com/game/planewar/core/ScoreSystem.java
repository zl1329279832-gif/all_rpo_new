package com.game.planewar.core;

/**
 * 得分系统
 */
public class ScoreSystem {
    
    private final GameController gameController;
    private int score;
    private int highScore;
    private int combo;
    private long lastKillTime;
    private static final long COMBO_TIMEOUT = 2000;
    
    public ScoreSystem(GameController gameController) {
        this.gameController = gameController;
        reset();
    }
    
    /**
     * 重置得分
     */
    public void reset() {
        this.score = 0;
        this.combo = 0;
        this.lastKillTime = 0;
    }
    
    /**
     * 更新（检查连击超时）
     */
    public void update() {
        long currentTime = System.currentTimeMillis();
        if (combo > 0 && currentTime - lastKillTime > COMBO_TIMEOUT) {
            combo = 0;
        }
    }
    
    /**
     * 增加得分
     * @param baseScore 基础得分
     * @param comboMultiplier 是否应用连击加成
     */
    public void addScore(int baseScore, boolean comboMultiplier) {
        long currentTime = System.currentTimeMillis();
        
        if (currentTime - lastKillTime <= COMBO_TIMEOUT) {
            combo++;
        } else {
            combo = 1;
        }
        
        lastKillTime = currentTime;
        
        int multiplier = Math.min(combo, 10);
        int finalScore = comboMultiplier ? baseScore * multiplier : baseScore;
        
        this.score += finalScore;
        
        if (this.score > highScore) {
            highScore = this.score;
        }
    }
    
    /**
     * 增加得分（带连击）
     */
    public void addScore(int baseScore) {
        addScore(baseScore, true);
    }
    
    /**
     * 获取当前得分
     */
    public int getScore() {
        return score;
    }
    
    /**
     * 获取最高分
     */
    public int getHighScore() {
        return highScore;
    }
    
    /**
     * 设置最高分
     */
    public void setHighScore(int highScore) {
        this.highScore = highScore;
    }
    
    /**
     * 获取当前连击
     */
    public int getCombo() {
        return combo;
    }
}
