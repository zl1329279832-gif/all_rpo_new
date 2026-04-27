package com.game.planewar.model.enemies;

import com.game.planewar.PlaneWarGame;
import com.game.planewar.core.GameController;
import com.game.planewar.model.GameObject;
import com.game.planewar.model.projectiles.Projectile;

import java.awt.*;
import java.util.function.Consumer;

/**
 * 敌机基类
 */
public abstract class Enemy extends GameObject {
    
    public enum EnemyType {
        SMALL,
        MEDIUM,
        LARGE,
        ELITE,
        BOSS
    }
    
    protected GameController gameController;
    protected EnemyType type;
    protected int scoreValue;
    protected int shootCooldown;
    protected int shootInterval;
    protected float baseSpeedY;
    protected int movementPattern;
    protected long spawnTime;
    protected float startX;
    protected float amplitude;
    protected float frequency;
    protected Consumer<Enemy> onDeathCallback;
    
    protected Enemy() {
        super();
        this.spawnTime = System.currentTimeMillis();
    }
    
    /**
     * 初始化敌机
     */
    public void init(GameController controller, float x, float y, 
                     EnemyType type, int movementPattern,
                     Consumer<Enemy> onDeathCallback) {
        this.gameController = controller;
        this.type = type;
        this.movementPattern = movementPattern;
        this.startX = x;
        this.onDeathCallback = onDeathCallback;
        this.spawnTime = System.currentTimeMillis();
        
        float difficulty = controller.getLevelSystem().getDifficultyMultiplier();
        setupByType(difficulty);
        
        super.init(x, y, width, height);
    }
    
    /**
     * 根据类型设置属性
     */
    protected abstract void setupByType(float difficultyMultiplier);
    
    /**
     * 初始化移动模式参数
     */
    protected void initMovementPattern() {
        if (movementPattern == 1) {
            amplitude = 50 + gameController.getRandom().nextFloat() * 50;
            frequency = 0.02f + gameController.getRandom().nextFloat() * 0.02f;
        } else if (movementPattern == 2) {
            amplitude = 80 + gameController.getRandom().nextFloat() * 40;
            frequency = 0.03f;
        } else if (movementPattern == 3) {
            amplitude = 30;
            frequency = 0.05f;
        }
    }
    
    @Override
    public void update() {
        float time = System.currentTimeMillis() - spawnTime;
        updatePosition(time);
        
        if (shootCooldown > 0) {
            shootCooldown--;
        } else if (shouldShoot()) {
            shoot();
            shootCooldown = shootInterval;
        }
        
        if (y > PlaneWarGame.WINDOW_HEIGHT + 100) {
            returnToPool();
        }
    }
    
    /**
     * 更新位置
     */
    protected void updatePosition(float time) {
        y += baseSpeedY * gameController.getLevelSystem().getDifficultyMultiplier();
        
        if (movementPattern == 1) {
            x = startX + (float) Math.sin(time * frequency) * amplitude;
        } else if (movementPattern == 2) {
            x = startX + (float) Math.sin(time * frequency) * amplitude;
            if (x > PlaneWarGame.WINDOW_WIDTH - width) {
                startX = PlaneWarGame.WINDOW_WIDTH - width;
                amplitude = -amplitude;
            }
            if (x < 0) {
                startX = 0;
                amplitude = -amplitude;
            }
        } else if (movementPattern == 3) {
            x = startX + (float) Math.sin(time * frequency * 2) * amplitude + 
                (float) Math.cos(time * frequency) * amplitude * 0.5f;
        }
        
        x = Math.max(0, Math.min(x, PlaneWarGame.WINDOW_WIDTH - width));
    }
    
    /**
     * 检查是否应该射击
     */
    protected boolean shouldShoot() {
        return y > 50 && y < PlaneWarGame.WINDOW_HEIGHT * 0.6f;
    }
    
    /**
     * 射击
     */
    protected abstract void shoot();
    
    @Override
    public abstract void render(Graphics2D g);
    
    @Override
    protected void onDeath() {
        gameController.getScoreSystem().addScore(scoreValue);
        gameController.getLevelSystem().onEnemyKilled();
        
        gameController.getExplosionManager().createExplosion(getCenterX(), getCenterY(), type);
        
        if (gameController.getRandom().nextFloat() < getDropChance()) {
            gameController.getItemManager().spawnRandomItem(getCenterX(), getCenterY());
        }
        
        if (onDeathCallback != null) {
            onDeathCallback.accept(this);
        }
        
        returnToPool();
    }
    
    /**
     * 获取道具掉落概率
     */
    protected float getDropChance() {
        return 0.15f;
    }
    
    /**
     * 被子弹击中
     */
    public void onHit(Projectile bullet) {
        takeDamage(bullet.getDamage());
        gameController.getExplosionManager().createSmallExplosion(
            bullet.getCenterX(), bullet.getCenterY()
        );
    }
    
    // Getters
    public EnemyType getType() { return type; }
    public int getScoreValue() { return scoreValue; }
}
