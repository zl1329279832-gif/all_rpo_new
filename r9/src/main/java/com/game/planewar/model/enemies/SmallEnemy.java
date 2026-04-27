package com.game.planewar.model.enemies;

import com.game.planewar.model.projectiles.Projectile;

import java.awt.*;

/**
 * 小型敌机 - 快速移动，低血量，简单直线或正弦移动
 */
public class SmallEnemy extends Enemy {
    
    private static final float BASE_WIDTH = 35;
    private static final float BASE_HEIGHT = 35;
    private static final int BASE_HEALTH = 10;
    private static final int BASE_SCORE = 100;
    private static final float BASE_SPEED = 3.0f;
    
    @Override
    protected void setupByType(float difficultyMultiplier) {
        this.type = EnemyType.SMALL;
        this.width = BASE_WIDTH;
        this.height = BASE_HEIGHT;
        this.maxHealth = (int) (BASE_HEALTH * difficultyMultiplier);
        this.health = this.maxHealth;
        this.scoreValue = (int) (BASE_SCORE * difficultyMultiplier);
        this.baseSpeedY = BASE_SPEED;
        this.shootInterval = (int) (120 / difficultyMultiplier);
        this.shootCooldown = 60 + (int) (Math.random() * 60);
        
        initMovementPattern();
    }
    
    @Override
    protected void shoot() {
        float difficulty = gameController.getLevelSystem().getDifficultyMultiplier();
        gameController.getProjectileManager().spawnEnemyBullet(
            getCenterX(),
            y + height,
            0,
            4 * difficulty,
            Projectile.ProjectileType.ENEMY_NORMAL,
            10
        );
    }
    
    @Override
    public void render(Graphics2D g) {
        drawSmallEnemy(g);
        
        if (health < maxHealth) {
            drawHealthBar(g);
        }
    }
    
    /**
     * 绘制小型敌机
     */
    private void drawSmallEnemy(Graphics2D g) {
        g.setColor(new Color(180, 60, 60));
        int[] xPoints = {
            (int) (x + width / 2),
            (int) (x + width * 0.1f),
            (int) (x + width * 0.3f),
            (int) (x + width * 0.7f),
            (int) (x + width * 0.9f)
        };
        int[] yPoints = {
            (int) (y + height),
            (int) (y + height * 0.4f),
            (int) y,
            (int) y,
            (int) (y + height * 0.4f)
        };
        g.fillPolygon(xPoints, yPoints, 5);
        
        g.setColor(new Color(220, 80, 80));
        int[] xBody = {
            (int) (x + width / 2),
            (int) (x + width * 0.3f),
            (int) (x + width * 0.5f),
            (int) (x + width * 0.7f)
        };
        int[] yBody = {
            (int) (y + height),
            (int) (y + height * 0.5f),
            (int) (y + height * 0.1f),
            (int) (y + height * 0.5f)
        };
        g.fillPolygon(xBody, yBody, 4);
        
        g.setColor(Color.YELLOW);
        g.fillOval((int) (x + width * 0.35f), (int) (y + height * 0.3f),
                   (int) (width * 0.3f), (int) (height * 0.25f));
    }
    
    /**
     * 绘制血条
     */
    private void drawHealthBar(Graphics2D g) {
        float barWidth = width;
        float barHeight = 4;
        float barY = y - 8;
        
        g.setColor(Color.DARK_GRAY);
        g.fillRect((int) x, (int) barY, (int) barWidth, (int) barHeight);
        
        float healthPercent = (float) health / maxHealth;
        g.setColor(new Color(255, 50, 50));
        g.fillRect((int) x, (int) barY, (int) (barWidth * healthPercent), (int) barHeight);
    }
}
