package com.breakout.entity;

import com.breakout.config.GameConfig;

import java.awt.*;
import java.awt.geom.RoundRectangle2D;

public class Brick extends Entity {
    private BrickType type;
    private int currentHealth;
    private int maxHealth;
    private int scoreValue;
    private boolean hasPowerup;
    private boolean indestructible;

    public Brick(double x, double y, BrickType type) {
        super(x, y, GameConfig.BRICK_WIDTH, GameConfig.BRICK_HEIGHT);
        this.type = type;
        this.maxHealth = type.getMaxHealth();
        this.currentHealth = maxHealth;
        this.scoreValue = type.getScoreValue();
        this.indestructible = type.isIndestructible();
        this.hasPowerup = Math.random() < GameConfig.POWERUP_DROP_CHANCE;
    }

    public Brick(double x, double y, BrickType type, boolean hasPowerup) {
        super(x, y, GameConfig.BRICK_WIDTH, GameConfig.BRICK_HEIGHT);
        this.type = type;
        this.maxHealth = type.getMaxHealth();
        this.currentHealth = maxHealth;
        this.scoreValue = type.getScoreValue();
        this.indestructible = type.isIndestructible();
        this.hasPowerup = hasPowerup;
    }

    @Override
    public void update(double deltaTime) {
    }

    @Override
    public void render(Graphics2D g2d) {
        if (!active) return;

        RoundRectangle2D.Double brickShape = new RoundRectangle2D.Double(x, y, width, height, 4, 4);
        
        Color baseColor = getBrickColor();
        
        g2d.setColor(new Color(baseColor.getRed(), baseColor.getGreen(), baseColor.getBlue(), 40));
        g2d.fill(new RoundRectangle2D.Double(x - 2, y - 2, width + 4, height + 4, 6, 6));

        g2d.setColor(baseColor);
        g2d.fill(brickShape);

        GradientPaint gradient = new GradientPaint(
            (float) x, (float) y, new Color(255, 255, 255, 60),
            (float) x, (float) (y + height / 2), new Color(0, 0, 0, 0)
        );
        g2d.setPaint(gradient);
        g2d.fill(brickShape);

        g2d.setColor(new Color(0, 0, 0, 30));
        g2d.setStroke(new BasicStroke(1.5f));
        g2d.draw(brickShape);

        if (maxHealth > 1 && !indestructible && currentHealth < maxHealth) {
            g2d.setColor(new Color(255, 255, 255, 150));
            g2d.setFont(GameConfig.Fonts.SMALL);
            String healthText = currentHealth + "/" + maxHealth;
            FontMetrics fm = g2d.getFontMetrics();
            int textX = (int) (x + width / 2 - fm.stringWidth(healthText) / 2);
            int textY = (int) (y + height / 2 + fm.getAscent() / 2 - 2);
            g2d.drawString(healthText, textX, textY);
        }

        if (hasPowerup && active) {
            g2d.setColor(new Color(255, 215, 0, 200));
            int indicatorSize = 6;
            g2d.fillOval((int) (x + width / 2 - indicatorSize / 2), (int) (y + height - indicatorSize - 3), indicatorSize, indicatorSize);
        }

        if (indestructible) {
            g2d.setColor(new Color(200, 200, 200, 100));
            g2d.setStroke(new BasicStroke(2f));
            g2d.drawRoundRect((int) x + 3, (int) y + 3, (int) width - 6, (int) height - 6, 2, 2);
        }
    }

    private Color getBrickColor() {
        return switch (type) {
            case NORMAL -> GameConfig.Colors.BRICK_NORMAL;
            case TWO_HIT -> GameConfig.Colors.BRICK_TWO_HIT;
            case THREE_HIT -> GameConfig.Colors.BRICK_THREE_HIT;
            case INDESTRUCTIBLE -> GameConfig.Colors.BRICK_INDESTRUCTIBLE;
            case GOLD -> GameConfig.Colors.BRICK_GOLD;
        };
    }

    public int hit() {
        if (indestructible) {
            return 0;
        }
        
        currentHealth--;
        if (currentHealth <= 0) {
            active = false;
            return scoreValue;
        }
        return 0;
    }

    public BrickType getType() {
        return type;
    }

    public int getCurrentHealth() {
        return currentHealth;
    }

    public int getMaxHealth() {
        return maxHealth;
    }

    public int getScoreValue() {
        return scoreValue;
    }

    public boolean hasPowerup() {
        return hasPowerup;
    }

    public boolean isIndestructible() {
        return indestructible;
    }
}
