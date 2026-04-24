package com.breakout.level;

import com.breakout.entity.Brick;
import com.breakout.entity.BrickType;

import java.util.ArrayList;
import java.util.List;

public class Level {
    private final int levelNumber;
    private final String name;
    private final List<Brick> bricks;
    private final int rows;
    private final int cols;

    public Level(int levelNumber, String name, int rows, int cols) {
        this.levelNumber = levelNumber;
        this.name = name;
        this.rows = rows;
        this.cols = cols;
        this.bricks = new ArrayList<>();
    }

    public void addBrick(Brick brick) {
        bricks.add(brick);
    }

    public List<Brick> getBricks() {
        return bricks;
    }

    public int getLevelNumber() {
        return levelNumber;
    }

    public String getName() {
        return name;
    }

    public int getRows() {
        return rows;
    }

    public int getCols() {
        return cols;
    }

    public int getDestroyableBrickCount() {
        int count = 0;
        for (Brick brick : bricks) {
            if (!brick.isIndestructible() && brick.isActive()) {
                count++;
            }
        }
        return count;
    }

    public int getActiveBrickCount() {
        int count = 0;
        for (Brick brick : bricks) {
            if (brick.isActive()) {
                count++;
            }
        }
        return count;
    }

    public boolean isComplete() {
        return getDestroyableBrickCount() == 0;
    }

    public void reset() {
        for (Brick brick : bricks) {
            brick.setActive(true);
        }
    }
}
