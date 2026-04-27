package com.game.planewar.model;

import java.awt.*;
import java.awt.geom.Rectangle2D;

/**
 * 游戏对象基类
 */
public abstract class GameObject {
    
    protected float x;
    protected float y;
    protected float width;
    protected float height;
    protected float speedX;
    protected float speedY;
    protected boolean active;
    protected int health;
    protected int maxHealth;
    protected ObjectPool objectPool;
    
    protected GameObject() {
        this.active = true;
    }
    
    /**
     * 初始化对象
     */
    public void init(float x, float y, float width, float height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speedX = 0;
        this.speedY = 0;
        this.active = true;
    }
    
    /**
     * 更新对象逻辑
     */
    public abstract void update();
    
    /**
     * 渲染对象
     */
    public abstract void render(Graphics2D g);
    
    /**
     * 获取碰撞边界
     */
    public Rectangle2D.Float getBounds() {
        return new Rectangle2D.Float(x, y, width, height);
    }
    
    /**
     * 获取中心点X
     */
    public float getCenterX() {
        return x + width / 2;
    }
    
    /**
     * 获取中心点Y
     */
    public float getCenterY() {
        return y + height / 2;
    }
    
    /**
     * 检查是否与另一个对象碰撞
     */
    public boolean collidesWith(GameObject other) {
        if (!this.active || !other.active) {
            return false;
        }
        return this.getBounds().intersects(other.getBounds());
    }
    
    /**
     * 检查是否超出屏幕
     */
    public boolean isOutOfScreen(int screenWidth, int screenHeight) {
        return x + width < 0 || x > screenWidth || y + height < 0 || y > screenHeight;
    }
    
    /**
     * 受到伤害
     */
    public void takeDamage(int damage) {
        this.health -= damage;
        if (this.health <= 0) {
            this.health = 0;
            this.active = false;
            onDeath();
        }
    }
    
    /**
     * 对象死亡时的回调
     */
    protected abstract void onDeath();
    
    /**
     * 重置对象（用于对象池）
     */
    public void reset() {
        this.x = 0;
        this.y = 0;
        this.speedX = 0;
        this.speedY = 0;
        this.active = true;
        this.health = this.maxHealth;
    }
    
    /**
     * 归还到对象池
     */
    public void returnToPool() {
        if (objectPool != null) {
            objectPool.returnObject(this);
        } else {
            this.active = false;
        }
    }
    
    // Getters and Setters
    public float getX() { return x; }
    public void setX(float x) { this.x = x; }
    public float getY() { return y; }
    public void setY(float y) { this.y = y; }
    public float getWidth() { return width; }
    public void setWidth(float width) { this.width = width; }
    public float getHeight() { return height; }
    public void setHeight(float height) { this.height = height; }
    public float getSpeedX() { return speedX; }
    public void setSpeedX(float speedX) { this.speedX = speedX; }
    public float getSpeedY() { return speedY; }
    public void setSpeedY(float speedY) { this.speedY = speedY; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public int getHealth() { return health; }
    public void setHealth(int health) { this.health = health; }
    public int getMaxHealth() { return maxHealth; }
    public void setMaxHealth(int maxHealth) { this.maxHealth = maxHealth; }
    public ObjectPool getObjectPool() { return objectPool; }
    public void setObjectPool(ObjectPool objectPool) { this.objectPool = objectPool; }
}
