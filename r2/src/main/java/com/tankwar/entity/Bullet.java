package com.tankwar.entity;

import com.tankwar.util.Direction;
import com.tankwar.util.GameConstants;

import java.awt.*;

public class Bullet {
    private int x, y;
    private Direction direction;
    private int speed;
    private boolean active;
    private boolean fromPlayer;
    private boolean enhanced;

    public Bullet(int x, int y, Direction direction, boolean fromPlayer, boolean enhanced) {
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.speed = GameConstants.BULLET_SPEED;
        this.active = true;
        this.fromPlayer = fromPlayer;
        this.enhanced = enhanced;
    }

    public void update() {
        x += direction.dx * speed;
        y += direction.dy * speed;

        if (x < 0 || x > GameConstants.SCREEN_WIDTH || y < 0 || y > GameConstants.GAME_HEIGHT) {
            active = false;
        }
    }

    public void draw(Graphics g) {
        if (!active) return;
        g.setColor(fromPlayer ? Color.YELLOW : Color.RED);
        if (enhanced) {
            g.fillOval(x - 4, y - 4, 8, 8);
            g.setColor(fromPlayer ? new Color(255, 255, 100) : new Color(255, 100, 100));
            g.fillOval(x - 2, y - 2, 4, 4);
        } else {
            g.fillOval(x - 3, y - 3, 6, 6);
        }
    }

    public Rectangle getBounds() {
        return new Rectangle(x - 4, y - 4, 8, 8);
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public boolean isFromPlayer() {
        return fromPlayer;
    }

    public boolean isEnhanced() {
        return enhanced;
    }

    public int getX() {
        return x;
    }

    public int getY() {
        return y;
    }
}
