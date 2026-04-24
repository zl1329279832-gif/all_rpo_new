package com.breakout.entity;

import com.breakout.config.GameConfig;

import java.awt.*;
import java.awt.geom.RoundRectangle2D;

public class Paddle extends Entity {
    private double originalWidth;
    private double speed;
    private boolean movingLeft;
    private boolean movingRight;
    private int expandEffectTimer;
    private int shrinkEffectTimer;

    public Paddle(double x, double y) {
        super(x, y, GameConfig.PADDLE_WIDTH, GameConfig.PADDLE_HEIGHT);
        this.originalWidth = GameConfig.PADDLE_WIDTH;
        this.speed = GameConfig.PADDLE_SPEED;
        this.movingLeft = false;
        this.movingRight = false;
        this.expandEffectTimer = 0;
        this.shrinkEffectTimer = 0;
    }

    @Override
    public void update(double deltaTime) {
        if (expandEffectTimer > 0) {
            expandEffectTimer--;
            if (expandEffectTimer == 0) {
                resetWidth();
            }
        }
        if (shrinkEffectTimer > 0) {
            shrinkEffectTimer--;
            if (shrinkEffectTimer == 0) {
                resetWidth();
            }
        }

        double movement = 0;
        if (movingLeft) {
            movement -= speed;
        }
        if (movingRight) {
            movement += speed;
        }

        x += movement;

        if (x < 0) {
            x = 0;
        }
        if (x + width > GameConfig.WINDOW_WIDTH) {
            x = GameConfig.WINDOW_WIDTH - width;
        }
    }

    @Override
    public void render(Graphics2D g2d) {
        RoundRectangle2D.Double paddleShape = new RoundRectangle2D.Double(x, y, width, height, 10, 10);
        
        g2d.setColor(GameConfig.Colors.PADDLE_GLOW);
        g2d.fill(new RoundRectangle2D.Double(x - 3, y - 3, width + 6, height + 6, 12, 12));
        
        g2d.setColor(GameConfig.Colors.PADDLE);
        g2d.fill(paddleShape);
        
        GradientPaint gradient = new GradientPaint(
            (float) x, (float) y, new Color(255, 255, 255, 80),
            (float) x, (float) (y + height / 2), new Color(0, 0, 0, 0)
        );
        g2d.setPaint(gradient);
        g2d.fill(paddleShape);
        
        g2d.setColor(new Color(255, 255, 255, 100));
        g2d.setStroke(new BasicStroke(1.5f));
        g2d.draw(paddleShape);
    }

    public void setMovingLeft(boolean movingLeft) {
        this.movingLeft = movingLeft;
    }

    public void setMovingRight(boolean movingRight) {
        this.movingRight = movingRight;
    }

    public void expand() {
        this.width = Math.min(width + 40, GameConfig.PADDLE_MAX_WIDTH);
        this.expandEffectTimer = 600;
        this.shrinkEffectTimer = 0;
    }

    public void shrink() {
        this.width = Math.max(width - 30, GameConfig.PADDLE_MIN_WIDTH);
        this.shrinkEffectTimer = 600;
        this.expandEffectTimer = 0;
    }

    public void resetWidth() {
        this.width = originalWidth;
        this.expandEffectTimer = 0;
        this.shrinkEffectTimer = 0;
    }

    public void resetPosition() {
        this.x = (GameConfig.WINDOW_WIDTH - width) / 2.0;
        this.y = GameConfig.WINDOW_HEIGHT - GameConfig.PADDLE_Y_OFFSET;
    }

    public double getSpeed() {
        return speed;
    }

    public void setSpeed(double speed) {
        this.speed = speed;
    }
}
