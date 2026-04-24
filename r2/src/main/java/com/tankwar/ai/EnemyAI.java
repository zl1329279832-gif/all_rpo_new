package com.tankwar.ai;

import com.tankwar.entity.EnemyTank;
import com.tankwar.util.Direction;

import java.util.Random;

public class EnemyAI {
    private EnemyTank tank;
    private int aiLevel;
    private Random random;
    private Direction currentDirection;
    private int moveTimer;
    private int shootTimer;
    private int changeDirectionInterval;

    public EnemyAI(EnemyTank tank, int aiLevel) {
        this.tank = tank;
        this.aiLevel = aiLevel;
        this.random = new Random();
        this.currentDirection = Direction.values()[random.nextInt(4)];
        this.moveTimer = 0;
        this.shootTimer = 0;
        this.changeDirectionInterval = 60 + random.nextInt(120);
    }

    public void update() {
        moveTimer++;
        shootTimer++;

        if (moveTimer >= changeDirectionInterval) {
            changeDirection();
            moveTimer = 0;
            changeDirectionInterval = 60 + random.nextInt(120);
        }

        moveInDirection();

        if (shootTimer >= getShootInterval()) {
            tank.shoot();
            shootTimer = 0;
        }
    }

    private void changeDirection() {
        if (aiLevel >= 2 && random.nextBoolean()) {
            currentDirection = getPriorityDirection();
        } else {
            Direction[] directions = Direction.values();
            currentDirection = directions[random.nextInt(directions.length)];
        }
    }

    private Direction getPriorityDirection() {
        int px = 304;
        int py = 464;
        int ex = tank.getX();
        int ey = tank.getY();

        if (Math.abs(px - ex) > Math.abs(py - ey)) {
            return px > ex ? Direction.RIGHT : Direction.LEFT;
        } else {
            return py > ey ? Direction.DOWN : Direction.UP;
        }
    }

    private void moveInDirection() {
        switch (currentDirection) {
            case UP:
                tank.moveUp();
                break;
            case DOWN:
                tank.moveDown();
                break;
            case LEFT:
                tank.moveLeft();
                break;
            case RIGHT:
                tank.moveRight();
                break;
        }
    }

    private int getShootInterval() {
        switch (aiLevel) {
            case 1: return 120 + random.nextInt(60);
            case 2: return 90 + random.nextInt(45);
            case 3: return 60 + random.nextInt(30);
            default: return 120;
        }
    }

    public void onCollision() {
        Direction[] directions = Direction.values();
        currentDirection = directions[random.nextInt(directions.length)];
    }

    public Direction getCurrentDirection() {
        return currentDirection;
    }
}
