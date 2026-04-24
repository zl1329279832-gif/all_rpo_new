package com.tankwar.entity;

import com.tankwar.util.Direction;
import com.tankwar.util.GameConstants;

import java.awt.*;

public abstract class Tank {
    protected int x, y;
    protected Direction direction;
    protected int speed;
    protected int health;
    protected int maxHealth;
    protected boolean active;
    protected boolean canShoot;
    protected long lastShotTime;
    protected long shootCooldown;
    protected boolean hasShield;
    protected long shieldEndTime;
    protected boolean speedBoost;
    protected long speedBoostEndTime;
    protected boolean enhancedBullets;
    protected long enhancedBulletsEndTime;

    public Tank(int x, int y, Direction direction, int speed, int maxHealth) {
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.speed = speed;
        this.health = maxHealth;
        this.maxHealth = maxHealth;
        this.active = true;
        this.canShoot = true;
        this.lastShotTime = 0;
        this.shootCooldown = 500;
        this.hasShield = false;
        this.speedBoost = false;
        this.enhancedBullets = false;
    }

    public abstract void update();

    public void draw(Graphics g) {
        if (!active) return;
        drawTankBody(g);
        drawTankCannon(g);
        if (hasShield && System.currentTimeMillis() < shieldEndTime) {
            drawShield(g);
        } else {
            hasShield = false;
        }
        drawHealthBar(g);
    }

    protected void drawTankBody(Graphics g) {
        g.setColor(getBodyColor());
        g.fillRect(x - 14, y - 14, 28, 28);
        g.setColor(getTrackColor());
        g.fillRect(x - 14, y - 14, 6, 28);
        g.fillRect(x + 8, y - 14, 6, 28);
        g.setColor(new Color(50, 50, 50));
        for (int i = 0; i < 5; i++) {
            g.fillRect(x - 13, y - 12 + i * 6, 4, 4);
            g.fillRect(x + 9, y - 12 + i * 6, 4, 4);
        }
    }

    protected void drawTankCannon(Graphics g) {
        g.setColor(getCannonColor());
        switch (direction) {
            case UP:
                g.fillRect(x - 3, y - 24, 6, 14);
                break;
            case DOWN:
                g.fillRect(x - 3, y + 10, 6, 14);
                break;
            case LEFT:
                g.fillRect(x - 24, y - 3, 14, 6);
                break;
            case RIGHT:
                g.fillRect(x + 10, y - 3, 14, 6);
                break;
        }
    }

    protected void drawShield(Graphics g) {
        g.setColor(new Color(100, 200, 255, 100));
        g.fillOval(x - 18, y - 18, 36, 36);
        g.setColor(new Color(50, 150, 255));
        g.drawOval(x - 18, y - 18, 36, 36);
    }

    protected void drawHealthBar(Graphics g) {
        int barWidth = 24;
        int barHeight = 4;
        int barX = x - barWidth / 2;
        int barY = y - 22;
        g.setColor(Color.DARK_GRAY);
        g.fillRect(barX, barY, barWidth, barHeight);
        g.setColor(Color.GREEN);
        g.fillRect(barX, barY, (int) (barWidth * ((float) health / maxHealth)), barHeight);
    }

    public Bullet shoot() {
        long currentTime = System.currentTimeMillis();
        if (currentTime - lastShotTime >= shootCooldown) {
            lastShotTime = currentTime;
            int bulletX = x + direction.dx * 20;
            int bulletY = y + direction.dy * 20;
            return new Bullet(bulletX, bulletY, direction, isPlayer(), enhancedBullets);
        }
        return null;
    }

    public void takeDamage(int damage) {
        if (hasShield && System.currentTimeMillis() < shieldEndTime) {
            return;
        }
        health -= damage;
        if (health <= 0) {
            active = false;
        }
    }

    public void heal(int amount) {
        health = Math.min(health + amount, maxHealth);
    }

    public void activateShield(long duration) {
        hasShield = true;
        shieldEndTime = System.currentTimeMillis() + duration;
    }

    public void activateSpeedBoost(long duration, int multiplier) {
        speedBoost = true;
        speedBoostEndTime = System.currentTimeMillis() + duration;
    }

    public void activateEnhancedBullets(long duration) {
        enhancedBullets = true;
        enhancedBulletsEndTime = System.currentTimeMillis() + duration;
    }

    protected void checkPowerUps() {
        if (speedBoost && System.currentTimeMillis() >= speedBoostEndTime) {
            speedBoost = false;
        }
        if (enhancedBullets && System.currentTimeMillis() >= enhancedBulletsEndTime) {
            enhancedBullets = false;
        }
    }

    protected int getCurrentSpeed() {
        return speedBoost ? speed * 2 : speed;
    }

    protected abstract Color getBodyColor();
    protected abstract Color getTrackColor();
    protected abstract Color getCannonColor();
    protected abstract boolean isPlayer();

    public Rectangle getBounds() {
        return new Rectangle(x - 14, y - 14, 28, 28);
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public int getX() {
        return x;
    }

    public int getY() {
        return y;
    }

    public void setX(int x) {
        this.x = x;
    }

    public void setY(int y) {
        this.y = y;
    }

    public Direction getDirection() {
        return direction;
    }

    public void setDirection(Direction direction) {
        this.direction = direction;
    }

    public int getHealth() {
        return health;
    }
}
