package com.game.planewar.model.enemies;

import com.game.planewar.model.projectiles.Projectile;

import java.awt.*;

/**
 * 中型敌机 - 中等速度，中等血量，可双发射击
 */
public class MediumEnemy extends Enemy {
    
    private static final float BASE_WIDTH = 55;
    private static final float BASE_HEIGHT = 50;
    private static final int BASE_HEALTH = 30;
    private static final int BASE_SCORE = 300;
    private static final float BASE_SPEED = 2.0f;
    
    @Override
    protected void setupByType(float difficultyMultiplier) {
        this.type = EnemyType.MEDIUM;
        this.width = BASE_WIDTH;
        this.height = BASE_HEIGHT;
        this.maxHealth = (int) (BASE_HEALTH * difficultyMultiplier);
        this.health = this.maxHealth;
        this.scoreValue = (int) (BASE_SCORE * difficultyMultiplier);
        this.baseSpeedY = BASE_SPEED;
        this.shootInterval = (int) (90 / difficultyMultiplier);
        this.shootCooldown = 45 + (int) (Math.random() * 45);
        
        initMovementPattern();
    }
    
    @Override
    protected void shoot() {
        float difficulty = gameController.getLevelSystem().getDifficultyMultiplier();
        
        gameController.getProjectileManager().spawnEnemyBullet(
            getCenterX() - 12,
            y + height,
            -1.0f * difficulty,
            3.5f * difficulty,
            Projectile.ProjectileType.ENEMY_NORMAL,
            10
        );
        
        gameController.getProjectileManager().spawnEnemyBullet(
            getCenterX() + 12,
            y + height,
            1.0f * difficulty,
            3.5f * difficulty,
            Projectile.ProjectileType.ENEMY_NORMAL,
            10
        );
    }
    
    @Override
    public void render(Graphics2D g) {
        drawMediumEnemy(g);
        drawHealthBar(g);
    }
    
    /**
     * 绘制中型敌机
     */
    private void drawMediumEnemy(Graphics2D g) {
        g.setColor(new Color(160, 80, 40));
        g.fillRect((int) (x + width * 0.2f), (int) y, 
                   (int) (width * 0.6f), (int) height);
        
        g.setColor(new Color(200, 100, 50));
        g.fillRect((int) (x + width * 0.3f), (int) (y + height * 0.1f), 
                   (int) (width * 0.4f), (int) (height * 0.5f));
        
        g.setColor(new Color(180, 90, 45));
        g.fillRect((int) x, (int) (y + height * 0.4f),
                   (int) (width * 0.25f), (int) (height * 0.4f));
        g.fillRect((int) (x + width * 0.75f), (int) (y + height * 0.4f),
                   (int) (width * 0.25f), (int) (height * 0.4f));
        
        g.setColor(Color.ORANGE);
        g.fillOval((int) (x + width * 0.35f), (int) (y + height * 0.2f),
                   (int) (width * 0.3f), (int) (height * 0.25f));
        
        g.setColor(new Color(255, 150, 0));
        int[] xCannon = {
            (int) (x + width * 0.15f),
            (int) (x + width * 0.05f),
            (int) (x + width * 0.05f),
            (int) (x + width * 0.15f)
        };
        int[] yCannon = {
            (int) (y + height * 0.6f),
            (int) (y + height * 0.7f),
            (int) (y + height * 0.85f),
            (int) (y + height * 0.75f)
        };
        g.fillPolygon(xCannon, yCannon, 4);
        
        int[] xCannon2 = {
            (int) (x + width * 0.85f),
            (int) (x + width * 0.95f),
            (int) (x + width * 0.95f),
            (int) (x + width * 0.85f)
        };
        g.fillPolygon(xCannon2, yCannon, 4);
    }
    
    /**
     * 绘制血条
     */
    private void drawHealthBar(Graphics2D g) {
        float barWidth = width;
        float barHeight = 5;
        float barY = y - 10;
        
        g.setColor(Color.DARK_GRAY);
        g.fillRect((int) x, (int) barY, (int) barWidth, (int) barHeight);
        
        float healthPercent = (float) health / maxHealth;
        Color healthColor = healthPercent > 0.5f ? new Color(50, 200, 50) : 
                            healthPercent > 0.25f ? new Color(255, 200, 0) : new Color(255, 50, 50);
        g.setColor(healthColor);
        g.fillRect((int) x, (int) barY, (int) (barWidth * healthPercent), (int) barHeight);
        
        g.setColor(Color.WHITE);
        g.drawRect((int) x, (int) barY, (int) barWidth, (int) barHeight);
    }
}
