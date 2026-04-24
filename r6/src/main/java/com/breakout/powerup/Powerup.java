package com.breakout.powerup;

import com.breakout.config.GameConfig;
import com.breakout.entity.Entity;

import java.awt.*;
import java.awt.geom.RoundRectangle2D;

public class Powerup extends Entity {
    private PowerupType type;
    private double speed;
    private float rotationAngle;

    public Powerup(double x, double y, PowerupType type) {
        super(x, y, GameConfig.POWERUP_SIZE, GameConfig.POWERUP_SIZE);
        this.type = type;
        this.speed = GameConfig.POWERUP_SPEED;
        this.velocityY = speed;
        this.rotationAngle = 0;
    }

    @Override
    public void update(double deltaTime) {
        y += velocityY;
        rotationAngle += 0.05f;
        
        if (y > GameConfig.WINDOW_HEIGHT) {
            active = false;
        }
    }

    @Override
    public void render(Graphics2D g2d) {
        if (!active) return;

        int centerX = (int) (x + width / 2);
        int centerY = (int) (y + height / 2);

        Color color = type.getColor();
        
        g2d.setColor(new Color(color.getRed(), color.getGreen(), color.getBlue(), 30));
        g2d.fillOval((int) x - 4, (int) y - 4, (int) width + 8, (int) height + 8);

        g2d.setColor(new Color(color.getRed(), color.getGreen(), color.getBlue(), 60));
        g2d.fillOval((int) x - 2, (int) y - 2, (int) width + 4, (int) height + 4);

        g2d.rotate(rotationAngle, centerX, centerY);
        
        RoundRectangle2D.Double shape = new RoundRectangle2D.Double(x, y, width, height, 6, 6);
        g2d.setColor(color);
        g2d.fill(shape);

        GradientPaint gradient = new GradientPaint(
            (float) x, (float) y, new Color(255, 255, 255, 80),
            (float) (x + width), (float) (y + height), new Color(0, 0, 0, 0)
        );
        g2d.setPaint(gradient);
        g2d.fill(shape);

        g2d.setColor(new Color(255, 255, 255, 150));
        g2d.setStroke(new BasicStroke(1.5f));
        g2d.draw(shape);

        g2d.setColor(new Color(255, 255, 255, 200));
        g2d.setFont(GameConfig.Fonts.SMALL.deriveFont(Font.BOLD, 12f));
        FontMetrics fm = g2d.getFontMetrics();
        String symbol = getSymbol();
        int symbolX = centerX - fm.stringWidth(symbol) / 2;
        int symbolY = centerY + fm.getAscent() / 2 - 2;
        g2d.drawString(symbol, symbolX, symbolY);

        g2d.rotate(-rotationAngle, centerX, centerY);
    }

    private String getSymbol() {
        return switch (type) {
            case EXPAND -> "+";
            case SHRINK -> "-";
            case SPEED_UP -> ">>";
            case SLOW_DOWN -> "<<";
            case EXTRA_LIFE -> "♥";
            case PIERCE -> "✦";
            case MULTI_BALL -> "●●";
            case CATCH -> "C";
        };
    }

    public PowerupType getType() {
        return type;
    }

    public double getSpeed() {
        return speed;
    }

    public void setSpeed(double speed) {
        this.speed = speed;
        this.velocityY = speed;
    }
}
