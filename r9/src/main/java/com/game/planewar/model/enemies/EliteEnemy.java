package com.game.planewar.model.enemies;

import com.game.planewar.model.projectiles.Projectile;

import java.awt.*;

/**
 * 精英敌机 - 快速，中等血量，追踪射击和散射
 */
public class EliteEnemy extends Enemy {
    
    private static final float BASE_WIDTH = 50;
    private static final float BASE_HEIGHT = 45;
    private static final int BASE_HEALTH = 50;
    private static final int BASE_SCORE = 800;
    private static final float BASE_SPEED = 2.5f;
    
    private int attackPattern;
    private int patternTimer;
    
    @Override
    protected void setupByType(float difficultyMultiplier) {
        this.type = EnemyType.ELITE;
        this.width = BASE_WIDTH;
        this.height = BASE_HEIGHT;
        this.maxHealth = (int) (BASE_HEALTH * difficultyMultiplier);
        this.health = this.maxHealth;
        this.scoreValue = (int) (BASE_SCORE * difficultyMultiplier);
        this.baseSpeedY = BASE_SPEED;
        this.shootInterval = (int) (80 / difficultyMultiplier);
        this.shootCooldown = 40 + (int) (Math.random() * 40);
        
        this.attackPattern = 0;
        this.patternTimer = 0;
        
        initMovementPattern();
    }
    
    @Override
    protected void shoot() {
        float difficulty = gameController.getLevelSystem().getDifficultyMultiplier();
        patternTimer++;
        
        if (patternTimer % 3 == 0) {
            shootTracking(difficulty);
        } else {
            shootSpread(difficulty);
        }
    }
    
    /**
     * 追踪射击
     */
    private void shootTracking(float difficulty) {
        float playerX = gameController.getPlayer().getCenterX();
        float playerY = gameController.getPlayer().getCenterY();
        
        float dx = playerX - getCenterX();
        float dy = playerY - getCenterY();
        float distance = (float) Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            float speed = 4.5f * difficulty;
            float speedX = (dx / distance) * speed;
            float speedY = (dy / distance) * speed;
            
            gameController.getProjectileManager().spawnEnemyBullet(
                getCenterX(), y + height,
                speedX, speedY,
                Projectile.ProjectileType.ENEMY_FAST,
                12
            );
        }
    }
    
    /**
     * 散射
     */
    private void shootSpread(float difficulty) {
        float speed = 3.5f * difficulty;
        for (int i = -1; i <= 1; i++) {
            float angle = (float) Math.PI / 2 + i * (float) Math.PI / 8;
            float speedX = (float) Math.cos(angle) * speed;
            float speedY = (float) Math.sin(angle) * speed;
            
            gameController.getProjectileManager().spawnEnemyBullet(
                getCenterX(), y + height,
                speedX, speedY,
                Projectile.ProjectileType.ENEMY_NORMAL,
                10
            );
        }
    }
    
    @Override
    public void render(Graphics2D g) {
        drawEliteEnemy(g);
        drawHealthBar(g);
    }
    
    /**
     * 绘制精英敌机
     */
    private void drawEliteEnemy(Graphics2D g) {
        float glow = (float) (0.5 + 0.5 * Math.sin(System.currentTimeMillis() * 0.005));
        
        g.setColor(new Color(50, (int) (100 + 155 * glow), 150, 100));
        g.fillOval((int) (x - 5), (int) (y - 5), (int) (width + 10), (int) (height + 10));
        
        g.setColor(new Color(0, 150, 200));
        int[] xPoints = {
            (int) (x + width / 2),
            (int) (x + width * 0.05f),
            (int) (x + width * 0.25f),
            (int) (x + width * 0.75f),
            (int) (x + width * 0.95f)
        };
        int[] yPoints = {
            (int) (y + height),
            (int) (y + height * 0.3f),
            (int) y,
            (int) y,
            (int) (y + height * 0.3f)
        };
        g.fillPolygon(xPoints, yPoints, 5);
        
        g.setColor(new Color(50, 200, 255));
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
        
        g.setColor(new Color(0, 255, 255, (int) (150 + 105 * glow)));
        g.fillOval((int) (x + width * 0.35f), (int) (y + height * 0.25f),
                   (int) (width * 0.3f), (int) (height * 0.25f));
        
        g.setColor(new Color(0, 200, 255));
        g.fillRect((int) (x + width * 0.35f), (int) (y + height * 0.85f),
                   (int) (width * 0.3f), (int) (height * 0.15f));
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
        g.setColor(new Color(0, 200, 255));
        g.fillRect((int) x, (int) barY, (int) (barWidth * healthPercent), (int) barHeight);
        
        g.setColor(Color.CYAN);
        g.drawRect((int) x, (int) barY, (int) barWidth, (int) barHeight);
    }
    
    @Override
    protected float getDropChance() {
        return 0.45f;
    }
}
