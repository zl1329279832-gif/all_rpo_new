package com.tankwar.map;

import java.awt.*;

public class Wall {
    public enum Type {
        BRICK, STEEL, BASE, WATER, GRASS, TARGET
    }

    private int x, y;
    private Type type;
    private boolean active;
    private int health;

    public Wall(int x, int y, Type type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.active = true;
        if (type == Type.BRICK) {
            this.health = 2;
        } else if (type == Type.BASE || type == Type.TARGET) {
            this.health = 1;
        } else {
            this.health = Integer.MAX_VALUE;
        }
    }

    public void takeDamage() {
        if (type == Type.BRICK || type == Type.BASE || type == Type.TARGET) {
            health--;
            if (health <= 0) {
                active = false;
            }
        }
    }

    public void draw(Graphics g) {
        if (!active) return;
        int size = 32;

        switch (type) {
            case BRICK:
                drawBrickWall(g, x, y, size);
                break;
            case STEEL:
                drawSteelWall(g, x, y, size);
                break;
            case BASE:
                drawBase(g, x, y, size);
                break;
            case WATER:
                drawWater(g, x, y, size);
                break;
            case GRASS:
                drawGrass(g, x, y, size);
                break;
            case TARGET:
                drawTarget(g, x, y, size);
                break;
        }
    }

    private void drawBrickWall(Graphics g, int x, int y, int size) {
        g.setColor(new Color(180, 100, 30));
        g.fillRect(x, y, size, size);
        g.setColor(new Color(120, 60, 20));
        for (int row = 0; row < 4; row++) {
            for (int col = 0; col < 4; col++) {
                if ((row + col) % 2 == 0) {
                    g.fillRect(x + col * 8, y + row * 8, 8, 8);
                }
            }
        }
        g.setColor(new Color(80, 40, 10));
        g.drawRect(x, y, size, size);
    }

    private void drawSteelWall(Graphics g, int x, int y, int size) {
        g.setColor(new Color(100, 100, 100));
        g.fillRect(x, y, size, size);
        g.setColor(new Color(150, 150, 150));
        g.drawLine(x + 4, y + 4, x + size - 4, y + size - 4);
        g.drawLine(x + size - 4, y + 4, x + 4, y + size - 4);
        g.setColor(new Color(70, 70, 70));
        g.drawRect(x, y, size, size);
    }

    private void drawBase(Graphics g, int x, int y, int size) {
        g.setColor(new Color(255, 200, 50));
        g.fillRect(x + 4, y + 4, size - 8, size - 8);
        g.setColor(new Color(200, 100, 0));
        g.fillPolygon(
            new int[]{x + size/2, x + 8, x + size - 8},
            new int[]{y + 6, y + size - 8, y + size - 8},
            3
        );
        g.setColor(new Color(100, 50, 0));
        g.drawRect(x, y, size, size);
    }

    private void drawWater(Graphics g, int x, int y, int size) {
        g.setColor(new Color(50, 100, 200));
        g.fillRect(x, y, size, size);
        g.setColor(new Color(80, 150, 255));
        float wave = (float) Math.sin(System.currentTimeMillis() / 200.0);
        g.fillRect(x, y + (int) (wave * 4 + 12), size, 8);
    }

    private void drawGrass(Graphics g, int x, int y, int size) {
        g.setColor(new Color(50, 150, 50));
        g.fillRect(x, y, size, size);
        g.setColor(new Color(80, 180, 80));
        for (int i = 0; i < 8; i++) {
            int gx = x + i * 4 + 2;
            int gy = y + size - 10;
            g.fillRect(gx, gy, 2, 10);
        }
    }

    private void drawTarget(Graphics g, int x, int y, int size) {
        g.setColor(new Color(255, 50, 50));
        g.fillRect(x, y, size, size);
        g.setColor(new Color(255, 200, 50));
        g.fillRect(x + 4, y + 4, size - 8, size - 8);
        g.setColor(new Color(255, 100, 100));
        g.fillOval(x + 8, y + 8, size - 16, size - 16);
        g.setColor(Color.WHITE);
        g.fillOval(x + 12, y + 12, size - 24, size - 24);
    }

    public boolean isActive() {
        return active;
    }

    public Type getType() {
        return type;
    }

    public Rectangle getBounds() {
        return new Rectangle(x, y, 32, 32);
    }

    public int getX() {
        return x;
    }

    public int getY() {
        return y;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public void setX(int x) {
        this.x = x;
    }

    public void setY(int y) {
        this.y = y;
    }
}
