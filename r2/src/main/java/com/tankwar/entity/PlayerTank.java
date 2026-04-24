package com.tankwar.entity;

import com.tankwar.util.Direction;
import com.tankwar.util.GameConstants;

import java.awt.*;

public class PlayerTank extends Tank {

    public PlayerTank(int x, int y) {
        super(x, y, Direction.UP, GameConstants.PLAYER_SPEED, 3);
    }

    @Override
    public void update() {
        checkPowerUps();
    }

    @Override
    protected Color getBodyColor() {
        return new Color(0, 150, 255);
    }

    @Override
    protected Color getTrackColor() {
        return new Color(0, 100, 180);
    }

    @Override
    protected Color getCannonColor() {
        return new Color(50, 50, 50);
    }

    @Override
    protected boolean isPlayer() {
        return true;
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
}
