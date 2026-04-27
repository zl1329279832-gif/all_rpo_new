package com.game.planewar.model.projectiles;

import com.game.planewar.PlaneWarGame;
import com.game.planewar.model.GameObject;

import java.awt.*;
import java.awt.geom.Rectangle2D;

/**
 * 子弹基类
 */
public class Projectile extends GameObject {
    
    public enum ProjectileType {
        PLAYER_NORMAL,
        PLAYER_POWER,
        ENEMY_NORMAL,
        ENEMY_FAST,
        ENEMY_LASER,
        BOSS_NORMAL,
        BOSS_SPREAD
    }
    
    private ProjectileType type;
    private int damage;
    private boolean isPlayerBullet;
    
    public Projectile() {
        super();
        this.maxHealth = 1;
        this.health = 1;
    }
    
    /**
     * 初始化子弹
     */
    public void init(float x, float y, float width, float height,
                     float speedX, float speedY, 
                     ProjectileType type, int damage, boolean isPlayerBullet) {
        super.init(x, y, width, height);
        this.speedX = speedX;
        this.speedY = speedY;
        this.type = type;
        this.damage = damage;
        this.isPlayerBullet = isPlayerBullet;
        this.health = 1;
        this.maxHealth = 1;
    }
    
    @Override
    public void update() {
        x += speedX;
        y += speedY;
        
        if (isOutOfScreen(PlaneWarGame.WINDOW_WIDTH + 50, PlaneWarGame.WINDOW_HEIGHT + 50)) {
            returnToPool();
        }
    }
    
    @Override
    public void render(Graphics2D g) {
        drawProjectile(g);
    }
    
    /**
     * 绘制子弹
     */
    private void drawProjectile(Graphics2D g) {
        if (isPlayerBullet) {
            drawPlayerBullet(g);
        } else {
            drawEnemyBullet(g);
        }
    }
    
    /**
     * 绘制玩家子弹
     */
    private void drawPlayerBullet(Graphics2D g) {
        if (type == ProjectileType.PLAYER_NORMAL) {
            g.setColor(Color.CYAN);
            g.fillOval((int) x, (int) y, (int) width, (int) height);
            g.setColor(new Color(200, 255, 255));
            g.fillOval((int) x + 2, (int) y + 2, (int) width - 4, (int) height - 4);
        } else if (type == ProjectileType.PLAYER_POWER) {
            g.setColor(new Color(255, 200, 50));
            g.fillRect((int) x, (int) y, (int) width, (int) height);
            g.setColor(Color.YELLOW);
            g.fillRect((int) x + 2, (int) y + 2, (int) width - 4, (int) height - 4);
        }
    }
    
    /**
     * 绘制敌人子弹
     */
    private void drawEnemyBullet(Graphics2D g) {
        if (type == ProjectileType.ENEMY_NORMAL || type == ProjectileType.BOSS_NORMAL) {
            g.setColor(new Color(255, 80, 80));
            g.fillOval((int) x, (int) y, (int) width, (int) height);
            g.setColor(new Color(255, 150, 150));
            g.fillOval((int) x + 2, (int) y + 2, (int) width - 4, (int) height - 4);
        } else if (type == ProjectileType.ENEMY_FAST) {
            g.setColor(Color.MAGENTA);
            g.fillRect((int) x, (int) y, (int) width, (int) height);
        } else if (type == ProjectileType.ENEMY_LASER) {
            g.setColor(new Color(255, 0, 100, 200));
            g.fillRect((int) x, (int) y, (int) width, (int) height);
        } else if (type == ProjectileType.BOSS_SPREAD) {
            g.setColor(new Color(255, 100, 0));
            g.fillOval((int) x, (int) y, (int) width, (int) height);
            g.setColor(Color.ORANGE);
            g.fillOval((int) x + 2, (int) y + 2, (int) width - 4, (int) height - 4);
        }
    }
    
    @Override
    protected void onDeath() {
        returnToPool();
    }
    
    @Override
    public Rectangle2D.Float getBounds() {
        return new Rectangle2D.Float(x, y, width, height);
    }
    
    /**
     * 获取子弹碰撞边界（优化后的，比视觉范围小）
     */
    public Rectangle2D.Float getCollisionBounds() {
        float margin = 0.2f;
        return new Rectangle2D.Float(
            x + width * margin,
            y + height * margin,
            width * (1 - 2 * margin),
            height * (1 - 2 * margin)
        );
    }
    
    // Getters
    public ProjectileType getType() { return type; }
    public int getDamage() { return damage; }
    public boolean isPlayerBullet() { return isPlayerBullet; }
}
