package com.game.planewar.model.projectiles;

import com.game.planewar.PlaneWarGame;
import com.game.planewar.core.GameController;
import com.game.planewar.model.GameObject;
import com.game.planewar.model.ObjectPool;
import com.game.planewar.model.Player;
import com.game.planewar.model.enemies.Enemy;

import java.awt.*;
import java.awt.geom.Rectangle2D;
import java.util.List;

/**
 * 子弹管理器 - 管理所有子弹的生成、更新、渲染和碰撞检测
 */
public class ProjectileManager {
    
    private final GameController gameController;
    private final ObjectPool<Projectile> playerBulletPool;
    private final ObjectPool<Projectile> enemyBulletPool;
    
    private static final int INITIAL_PLAYER_BULLETS = 50;
    private static final int INITIAL_ENEMY_BULLETS = 100;
    
    public ProjectileManager(GameController gameController) {
        this.gameController = gameController;
        
        this.playerBulletPool = new ObjectPool<>(Projectile::new, INITIAL_PLAYER_BULLETS);
        this.enemyBulletPool = new ObjectPool<>(Projectile::new, INITIAL_ENEMY_BULLETS);
    }
    
    /**
     * 生成玩家子弹
     */
    public void spawnPlayerBullet(float x, float y, float speedY, boolean isPower) {
        Projectile bullet = playerBulletPool.acquire();
        float width = isPower ? 8 : 6;
        float height = isPower ? 18 : 15;
        int damage = isPower ? 20 : 10;
        Projectile.ProjectileType type = isPower ? 
            Projectile.ProjectileType.PLAYER_POWER : 
            Projectile.ProjectileType.PLAYER_NORMAL;
        
        bullet.init(
            x - width / 2,
            y - height,
            width, height,
            0, speedY,
            type, damage, true
        );
    }
    
    /**
     * 生成敌人子弹
     */
    public void spawnEnemyBullet(float x, float y, float speedX, float speedY, 
                                  Projectile.ProjectileType type, int damage) {
        Projectile bullet = enemyBulletPool.acquire();
        float width = 10;
        float height = 10;
        
        if (type == Projectile.ProjectileType.ENEMY_FAST) {
            width = 8;
            height = 8;
        } else if (type == Projectile.ProjectileType.ENEMY_LASER) {
            width = 6;
            height = 25;
        } else if (type == Projectile.ProjectileType.BOSS_NORMAL || type == Projectile.ProjectileType.BOSS_SPREAD) {
            width = 12;
            height = 12;
        }
        
        bullet.init(
            x - width / 2,
            y - height / 2,
            width, height,
            speedX, speedY,
            type, damage, false
        );
    }
    
    /**
     * 生成 Boss 散射子弹
     */
    public void spawnBossSpread(float centerX, float centerY, int bulletCount, float speed) {
        float angleStep = (float) Math.PI * 2 / bulletCount;
        for (int i = 0; i < bulletCount; i++) {
            float angle = angleStep * i;
            float speedX = (float) Math.cos(angle) * speed;
            float speedY = (float) Math.sin(angle) * speed;
            spawnEnemyBullet(centerX, centerY, speedX, speedY, 
                Projectile.ProjectileType.BOSS_SPREAD, 15);
        }
    }
    
    /**
     * 更新所有子弹
     */
    public void update() {
        for (Projectile bullet : playerBulletPool.getActiveObjects()) {
            bullet.update();
        }
        for (Projectile bullet : enemyBulletPool.getActiveObjects()) {
            bullet.update();
        }
    }
    
    /**
     * 渲染所有子弹
     */
    public void render(Graphics2D g) {
        for (Projectile bullet : playerBulletPool.getActiveObjects()) {
            bullet.render(g);
        }
        for (Projectile bullet : enemyBulletPool.getActiveObjects()) {
            bullet.render(g);
        }
    }
    
    /**
     * 检测玩家子弹与敌人的碰撞
     */
    public void checkPlayerBulletsWithEnemies() {
        List<Projectile> activeBullets = playerBulletPool.getActiveObjects();
        for (Projectile bullet : activeBullets) {
            if (!bullet.isActive()) continue;
            
            boolean hit = gameController.getEnemyManager().checkBulletHit(bullet);
            if (hit) {
                bullet.setActive(false);
                bullet.returnToPool();
            }
        }
    }
    
    /**
     * 检测敌人子弹与玩家的碰撞
     */
    public void checkEnemyBulletsWithPlayer() {
        Player player = gameController.getPlayer();
        if (!player.isActive()) return;
        
        Rectangle2D playerBounds = player.getBounds();
        List<Projectile> activeBullets = enemyBulletPool.getActiveObjects();
        
        for (Projectile bullet : activeBullets) {
            if (!bullet.isActive()) continue;
            
            Rectangle2D bulletBounds = bullet.getCollisionBounds();
            if (playerBounds.intersects(bulletBounds)) {
                player.takeDamage(bullet.getDamage());
                bullet.setActive(false);
                bullet.returnToPool();
                
                gameController.getExplosionManager().createSmallExplosion(
                    bullet.getCenterX(), bullet.getCenterY()
                );
            }
        }
    }
    
    /**
     * 清空敌人子弹
     */
    public void clearEnemyBullets() {
        for (Projectile bullet : enemyBulletPool.getActiveObjects()) {
            if (bullet.isActive()) {
                gameController.getExplosionManager().createSmallExplosion(
                    bullet.getCenterX(), bullet.getCenterY()
                );
                bullet.setActive(false);
                bullet.returnToPool();
            }
        }
    }
    
    /**
     * 重置
     */
    public void reset() {
        playerBulletPool.reset();
        enemyBulletPool.reset();
    }
    
    /**
     * 获取活跃玩家子弹数量
     */
    public int getActivePlayerBulletCount() {
        return playerBulletPool.getActiveCount();
    }
    
    /**
     * 获取活跃敌人子弹数量
     */
    public int getActiveEnemyBulletCount() {
        return enemyBulletPool.getActiveCount();
    }
}
