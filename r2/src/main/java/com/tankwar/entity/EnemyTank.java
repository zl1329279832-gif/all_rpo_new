package com.tankwar.entity;

import com.tankwar.ai.EnemyAI;
import com.tankwar.util.Direction;
import com.tankwar.util.GameConstants;

import java.awt.*;

public class EnemyTank extends Tank {
    private EnemyAI ai;
    private int aiLevel;

    public EnemyTank(int x, int y, int aiLevel) {
        super(x, y, Direction.DOWN, GameConstants.ENEMY_SPEED, 2);
        this.aiLevel = aiLevel;
        this.ai = new EnemyAI(this, aiLevel);
    }

    @Override
    public void update() {
        checkPowerUps();
        ai.update();
    }

    @Override
    protected Color getBodyColor() {
        return new Color(200, 50, 50);
    }

    @Override
    protected Color getTrackColor() {
        return new Color(150, 30, 30);
    }

    @Override
    protected Color getCannonColor() {
        return new Color(80, 20, 20);
    }

    @Override
    protected boolean isPlayer() {
        return false;
    }

    public void moveUp() {
        direction = Direction.UP;
        y -= getCurrentSpeed();
    }

    public void moveDown() {
        direction = Direction.DOWN;
        y += getCurrentSpeed();
    }

    public void moveLeft() {
        direction = Direction.LEFT;
        x -= getCurrentSpeed();
    }

    public void moveRight() {
        direction = Direction.RIGHT;
        x += getCurrentSpeed();
    }

    public EnemyAI getAI() {
        return ai;
    }

    public int getAiLevel() {
        return aiLevel;
    }
}
