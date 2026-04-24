package com.tankwar.entity;

import java.awt.*;

public class Explosion {
    private int x, y;
    private int frame;
    private int maxFrames;
    private boolean active;

    public Explosion(int x, int y, int maxFrames) {
        this.x = x;
        this.y = y;
        this.frame = 0;
        this.maxFrames = maxFrames;
        this.active = true;
    }

    public void update() {
        frame++;
        if (frame >= maxFrames) {
            active = false;
        }
    }

    public void draw(Graphics g) {
        if (!active) return;
        float progress = (float) frame / maxFrames;
        int size = (int) (32 + 32 * progress);
        int alpha = (int) (255 * (1 - progress));
        int centerX = x - size / 2;
        int centerY = y - size / 2;

        Color color = new Color(255, 200, 50, alpha);
        g.setColor(color);
        g.fillOval(centerX, centerY, size, size);

        Color innerColor = new Color(255, 100, 0, alpha);
        int innerSize = (int) (size * 0.6);
        g.setColor(innerColor);
        g.fillOval(x - innerSize / 2, y - innerSize / 2, innerSize, innerSize);
    }

    public boolean isActive() {
        return active;
    }
}
