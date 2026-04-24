package com.breakout.entity;

import com.breakout.config.GameConfig;

public enum BrickType {
    NORMAL(1, GameConfig.SCORE_NORMAL_BRICK, false),
    TWO_HIT(2, GameConfig.SCORE_TWO_HIT_BRICK, false),
    THREE_HIT(3, GameConfig.SCORE_THREE_HIT_BRICK, false),
    INDESTRUCTIBLE(Integer.MAX_VALUE, 0, true),
    GOLD(1, GameConfig.SCORE_NORMAL_BRICK * 3, false);

    private final int maxHealth;
    private final int scoreValue;
    private final boolean indestructible;

    BrickType(int maxHealth, int scoreValue, boolean indestructible) {
        this.maxHealth = maxHealth;
        this.scoreValue = scoreValue;
        this.indestructible = indestructible;
    }

    public int getMaxHealth() {
        return maxHealth;
    }

    public int getScoreValue() {
        return scoreValue;
    }

    public boolean isIndestructible() {
        return indestructible;
    }
}
