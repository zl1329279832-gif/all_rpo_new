package com.tankwar.entity;

import java.awt.*;

public class PowerUp {
    public enum Type {
        SPEED, SHIELD, ENHANCED_BULLETS, HEAL
    }

    private int x, y;
    private Type type;
    private boolean active;
    private long spawnTime;
    private long lifetime;

    public PowerUp(int x, int y, Type type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.active = true;
        this.spawnTime = System.currentTimeMillis();
        this.lifetime = 10000;
    }

    public void update() {
        if (System.currentTimeMillis() - spawnTime > lifetime) {
            active = false;
        }
    }

    public void draw(Graphics g) {
        if (!active) return;
        int size = 24;
        float flicker = (float) Math.sin(System.currentTimeMillis() / 100.0) * 0.3f + 0.7f;

        switch (type) {
            case SPEED:
                g.setColor(new Color(255, 200, 0, (int) (255 * flicker)));
                g.fillRect(x - size/2, y - size/2, size, size);
                g.setColor(Color.BLACK);
                g.drawString("S", x - 5, y + 5);
                break;
            case SHIELD:
                g.setColor(new Color(0, 150, 255, (int) (255 * flicker)));
                g.fillOval(x - size/2, y - size/2, size, size);
                g.setColor(Color.WHITE);
                g.drawString("S", x - 5, y + 5);
                break;
            case ENHANCED_BULLETS:
                g.setColor(new Color(255, 100, 0, (int) (255 * flicker)));
                g.fillRect(x - size/2, y - size/2, size, size);
                g.setColor(Color.BLACK);
                g.drawString("B", x - 5, y + 5);
                break;
            case HEAL:
                g.setColor(new Color(0, 255, 100, (int) (255 * flicker)));
                g.fillRect(x - size/2, y - size/2, size, size);
                g.setColor(Color.WHITE);
                g.drawString("+", x - 5, y + 5);
                break;
        }
    }

    public Rectangle getBounds() {
        return new Rectangle(x - 12, y - 12, 24, 24);
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public Type getType() {
        return type;
    }

    public int getX() {
        return x;
    }

    public int getY() {
        return y;
    }
}
