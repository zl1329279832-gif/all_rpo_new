package com.breakout.entity;

import com.breakout.config.GameConfig;

import java.awt.*;
import java.awt.geom.Ellipse2D;

public class Ball extends Entity {
    private double baseSpeed;
    private double currentSpeed;
    private boolean pierceMode;
    private int pierceTimer;
    private boolean glowing;

    public Ball(double x, double y) {
        super(x, y, GameConfig.BALL_RADIUS * 2, GameConfig.BALL_RADIUS * 2);
        this.baseSpeed = GameConfig.BALL_BASE_SPEED;
        this.currentSpeed = baseSpeed;
        this.pierceMode = false;
        this.pierceTimer = 0;
        this.glowing = false;
    }

    @Override
    public void update(double deltaTime) {
        if (pierceTimer > 0) {
            pierceTimer--;
            if (pierceTimer == 0) {
                pierceMode = false;
                glowing = false;
            }
        }

        x += velocityX;
        y += velocityY;
    }

    @Override
    public void render(Graphics2D g2d) {
        Ellipse2D.Double ballShape = new Ellipse2D.Double(x, y, width, height);
        double radius = width / 2;
        double centerX = x + radius;
        double centerY = y + radius;
        
        int maxGlowLayers = 4;
        int maxGlowSize = maxGlowLayers * 2;
        
        int glowStartX = (int) (centerX - radius - maxGlowSize);
        int glowStartY = (int) (centerY - radius - maxGlowSize);
        int glowSize = (int) (width + maxGlowSize * 2);
        
        int clampedGlowX = Math.max(0, glowStartX);
        int clampedGlowY = Math.max(0, glowStartY);
        int clampedGlowWidth = Math.min(glowSize, GameConfig.WINDOW_WIDTH - clampedGlowX);
        int clampedGlowHeight = Math.min(glowSize, GameConfig.WINDOW_HEIGHT - clampedGlowY);
        
        if (glowing || pierceMode) {
            Color glowColor = pierceMode ? GameConfig.Colors.POWERUP_PIERCE : GameConfig.Colors.BALL_GLOW;
            
            for (int i = maxGlowLayers; i > 0; i--) {
                int layerX = (int) (centerX - radius - i * 2);
                int layerY = (int) (centerY - radius - i * 2);
                int layerSize = (int) (width + i * 4);
                
                int clampedX = Math.max(0, layerX);
                int clampedY = Math.max(0, layerY);
                int clampedSizeW = Math.min(layerSize, GameConfig.WINDOW_WIDTH - clampedX);
                int clampedSizeH = Math.min(layerSize, GameConfig.WINDOW_HEIGHT - clampedY);
                
                if (clampedSizeW > 0 && clampedSizeH > 0) {
                    g2d.setColor(new Color(glowColor.getRed(), glowColor.getGreen(), glowColor.getBlue(), 15 + i * 5));
                    g2d.fillOval(clampedX, clampedY, clampedSizeW, clampedSizeH);
                }
            }
        }

        g2d.setColor(GameConfig.Colors.BALL_GLOW);
        int baseGlowX = (int) Math.max(0, x - 2);
        int baseGlowY = (int) Math.max(0, y - 2);
        int baseGlowW = (int) Math.min(width + 4, GameConfig.WINDOW_WIDTH - baseGlowX);
        int baseGlowH = (int) Math.min(height + 4, GameConfig.WINDOW_HEIGHT - baseGlowY);
        if (baseGlowW > 0 && baseGlowH > 0) {
            g2d.fillOval(baseGlowX, baseGlowY, baseGlowW, baseGlowH);
        }

        Color ballColor = pierceMode ? GameConfig.Colors.POWERUP_PIERCE : GameConfig.Colors.BALL;
        g2d.setColor(ballColor);
        g2d.fill(ballShape);

        GradientPaint gradient = new GradientPaint(
            (float) (x + width * 0.3), (float) (y + height * 0.3),
            new Color(255, 255, 255, 200),
            (float) (x + width), (float) (y + height),
            new Color(200, 200, 255, 100)
        );
        g2d.setPaint(gradient);
        g2d.fill(ballShape);
    }

    public void launch(double angle) {
        velocityX = Math.cos(angle) * currentSpeed;
        velocityY = -Math.abs(Math.sin(angle) * currentSpeed);
    }

    public void launchFromPaddle(Paddle paddle) {
        double relativeHitX = (getCenterX() - paddle.getCenterX()) / (paddle.getWidth() / 2);
        relativeHitX = Math.max(-1.0, Math.min(1.0, relativeHitX));
        
        double angle = relativeHitX * Math.PI / 3;
        launch(angle);
    }

    public void speedUp() {
        currentSpeed = Math.min(currentSpeed + GameConfig.BALL_SPEED_INCREMENT, GameConfig.BALL_MAX_SPEED);
        updateVelocitySpeed();
    }

    public void slowDown() {
        currentSpeed = Math.max(currentSpeed - GameConfig.BALL_SPEED_INCREMENT, GameConfig.BALL_MIN_SPEED);
        updateVelocitySpeed();
    }

    private void updateVelocitySpeed() {
        double currentMagnitude = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
        if (currentMagnitude > 0) {
            velocityX = (velocityX / currentMagnitude) * currentSpeed;
            velocityY = (velocityY / currentMagnitude) * currentSpeed;
        }
    }

    public void activatePierceMode() {
        pierceMode = true;
        pierceTimer = 600;
        glowing = true;
    }

    public boolean isPierceMode() {
        return pierceMode;
    }

    public void resetSpeed() {
        currentSpeed = baseSpeed;
        updateVelocitySpeed();
    }

    public double getCurrentSpeed() {
        return currentSpeed;
    }

    public void setCurrentSpeed(double currentSpeed) {
        this.currentSpeed = currentSpeed;
    }

    public void resetVelocity() {
        velocityX = 0;
        velocityY = 0;
    }

    public void resetPosition(Paddle paddle) {
        x = paddle.getCenterX() - width / 2;
        y = paddle.getTop() - height;
        resetVelocity();
    }

    public Ellipse2D.Double getShape() {
        return new Ellipse2D.Double(x, y, width, height);
    }
}
