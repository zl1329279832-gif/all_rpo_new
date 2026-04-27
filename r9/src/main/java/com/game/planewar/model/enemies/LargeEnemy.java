package com.game.planewar.model.enemies;

import com.game.planewar.model.projectiles.Projectile;

import java.awt.*;

/**
 * 大型敌机 - 慢速，高血量，三发射击
 */
public class LargeEnemy extends Enemy {
    
    private static final float BASE_WIDTH = 75;
    private static final float BASE_HEIGHT = 70;
    private static final int BASE_HEALTH = 80;
    private static final int BASE_SCORE = 500;
    private static final float BASE_SPEED = 1.2f;
    
    @Override
    protected void setupByType(float difficultyMultiplier) {
        this.type = EnemyType.LARGE;
        this.width = BASE_WIDTH;
        this.height = BASE_HEIGHT;
        this.maxHealth = (int) (BASE_HEALTH * difficultyMultiplier);
        this.health = this.maxHealth;
        this.scoreValue = (int) (BASE_SCORE * difficultyMultiplier);
        this.baseSpeedY = BASE_SPEED;
        this.shootInterval = (int) (150 / difficultyMultiplier);
        this.shootCooldown = 75 + (int) (Math.random() * 75);
        
        initMovementPattern();
    }
    
    @Override
    protected void shoot() {
        float difficulty = gameController.getLevelSystem().getDifficultyMultiplier();
        
        gameController.getProjectileManager().spawnEnemyBullet(
            getCenterX(),
            y + height,
            0,
            3.0f * difficulty,
            Projectile.ProjectileType.ENEMY_LASER,
            20
        );
        
        gameController.getProjectileManager().spawnEnemyBullet(
            getCenterX() - 20,
            y + height,
            -1.5f * difficulty,
            3.0f * difficulty,
            Projectile.ProjectileType.ENEMY_NORMAL,
            10
        );
        
        gameController.getProjectileManager().spawnEnemyBullet(
            getCenterX() + 20,
            y + height,
            1.5f * difficulty,
            3.0f * difficulty,
            Projectile.ProjectileType.ENEMY_NORMAL,
            10
        );
    }
    
    @Override
    public void render(Graphics2D g) {
        drawLargeEnemy(g);
        drawHealthBar(g);
    }
    
    /**
     * 绘制大型敌机
     */
    private void drawLargeEnemy(Graphics2D g) {
        g.setColor(new Color(120, 60, 120));
        g.fillRoundRect((int) (x + width * 0.15f), (int) (y + height * 0.1f),
                        (int) (width * 0.7f), (int) (height * 0.8f), 10, 10);
        
        g.setColor(new Color(150, 80, 150));
        g.fillRoundRect((int) (x + width * 0.25f), (int) (y + height * 0.2f),
                        (int) (width * 0.5f), (int) (height * 0.5f), 8, 8);
        
        g.setColor(new Color(100, 50, 100));
        g.fillRect((int) x, (int) (y + height * 0.35f),
                   (int) (width * 0.2f), (int) (height * 0.4f));
        g.fillRect((int) (x + width * 0.8f), (int) (y + height * 0.35f),
                   (int) (width * 0.2f), (int) (height * 0.4f));
        
        g.setColor(new Color(255, 0, 255, 200));
        g.fillOval((int) (x + width * 0.35f), (int) (y + height * 0.25f),
                   (int) (width * 0.3f), (int) (height * 0.25f));
        
        g.setColor(new Color(200, 0, 200));
        g.fillRect((int) (x + width * 0.4f), (int) (y + height * 0.8f),
                   (int) (width * 0.2f), (int) (height * 0.15f));
        
        g.setColor(new Color(180, 0, 180));
        g.fillOval((int) (x + width * 0.05f), (int) (y + height * 0.5f),
                   (int) (width * 0.1f), (int) (height * 0.1f));
        g.fillOval((int) (x + width * 0.85f), (int) (y + height * 0.5f),
                   (int) (width * 0.1f), (int) (height * 0.1f));
    }
    
    /**
     * 绘制血条
     */
    private void drawHealthBar(Graphics2D g) {
        float barWidth = width;
        float barHeight = 6;
        float barY = y - 12;
        
        g.setColor(Color.DARK_GRAY);
        g.fillRect((int) x, (int) barY, (int) barWidth, (int) barHeight);
        
        float healthPercent = (float) health / maxHealth;
        Color healthColor = healthPercent > 0.5f ? new Color(50, 200, 50) :
                            healthPercent > 0.25f ? new Color(255, 200, 0) : new Color(255, 50, 50);
        g.setColor(healthColor);
        g.fillRect((int) x, (int) barY, (int) (barWidth * healthPercent), (int) barHeight);
        
        g.setColor(Color.LIGHT_GRAY);
        g.drawRect((int) x, (int) barY, (int) barWidth, (int) barHeight);
        
        g.setColor(Color.WHITE);
        g.setFont(new Font("Arial", Font.BOLD, 10));
        String healthText = health + "/" + maxHealth;
        FontMetrics fm = g.getFontMetrics();
        int textX = (int) (x + (width - fm.stringWidth(healthText)) / 2);
        g.drawString(healthText, textX, (int) (barY - 2));
    }
    
    @Override
    protected float getDropChance() {
        return 0.35f;
    }
}
