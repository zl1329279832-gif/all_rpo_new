package com.breakout.powerup;

import com.breakout.config.GameConfig;

import java.awt.*;

public enum PowerupType {
    EXPAND(GameConfig.Colors.POWERUP_EXPAND, "挡板变长"),
    SHRINK(GameConfig.Colors.POWERUP_SHRINK, "挡板变短"),
    SPEED_UP(GameConfig.Colors.POWERUP_SPEED_UP, "小球加速"),
    SLOW_DOWN(GameConfig.Colors.POWERUP_SLOW_DOWN, "小球减速"),
    EXTRA_LIFE(GameConfig.Colors.POWERUP_EXTRA_LIFE, "额外生命"),
    PIERCE(GameConfig.Colors.POWERUP_PIERCE, "穿透球"),
    MULTI_BALL(GameConfig.Colors.POWERUP_MULTI_BALL, "多球"),
    CATCH(GameConfig.Colors.POWERUP_CATCH, "接球");

    private final Color color;
    private final String description;

    PowerupType(Color color, String description) {
        this.color = color;
        this.description = description;
    }

    public Color getColor() {
        return color;
    }

    public String getDescription() {
        return description;
    }

    public static PowerupType getRandom() {
        PowerupType[] types = values();
        return types[(int) (Math.random() * types.length)];
    }
}
