package com.game.planewar.model;

import com.game.planewar.PlaneWarGame;
import com.game.planewar.core.GameController;
import com.game.planewar.input.InputHandler;

import java.awt.*;
import java.awt.geom.Ellipse2D;

/**
 * 玩家飞机类
 */
public class Player extends GameObject {
    
    private static final float PLAYER_SPEED = 5.0f;
    private static final float PLAYER_WIDTH = 50;
    private static final float PLAYER_HEIGHT = 60;
    private static final int SHOOT_COOLDOWN = 8;
    private static final int MAX_HEALTH = 100;
    private static final int SHIELD_DURATION = 300;
    
    private final GameController gameController;
    private int shootCooldown;
    private int doubleFireTimer;
    private int shieldTimer;
    private int invincibleTimer;
    private boolean hasShield;
    private boolean hasDoubleFire;
    private int score;
    
    public Player(GameController gameController) {
        super();
        this.gameController = gameController;
        this.maxHealth = MAX_HEALTH;
        reset();
    }
    
    /**
     * 重置玩家状态
     */
    @Override
    public void reset() {
        float startX = (PlaneWarGame.WINDOW_WIDTH - PLAYER_WIDTH) / 2;
        float startY = PlaneWarGame.WINDOW_HEIGHT - PLAYER_HEIGHT - 50;
        init(startX, startY, PLAYER_WIDTH, PLAYER_HEIGHT);
        
        this.health = MAX_HEALTH;
        this.shootCooldown = 0;
        this.doubleFireTimer = 0;
        this.shieldTimer = 0;
        this.invincibleTimer = 60;
        this.hasShield = false;
        this.hasDoubleFire = false;
        this.score = 0;
    }
    
    @Override
    public void update() {
        InputHandler input = gameController.getInputHandler();
        
        float moveX = input.getHorizontalAxis() * PLAYER_SPEED;
        float moveY = input.getVerticalAxis() * PLAYER_SPEED;
        
        x += moveX;
        y += moveY;
        
        x = Math.max(0, Math.min(x, PlaneWarGame.WINDOW_WIDTH - width));
        y = Math.max(0, Math.min(y, PlaneWarGame.WINDOW_HEIGHT - height));
        
        if (shootCooldown > 0) {
            shootCooldown--;
        }
        
        if ((gameController.isAutoShoot() || input.isShooting()) && shootCooldown <= 0) {
            shoot();
            shootCooldown = SHOOT_COOLDOWN;
        }
        
        if (doubleFireTimer > 0) {
            doubleFireTimer--;
            if (doubleFireTimer <= 0) {
                hasDoubleFire = false;
            }
        }
        
        if (shieldTimer > 0) {
            shieldTimer--;
            if (shieldTimer <= 0) {
                hasShield = false;
            }
        }
        
        if (invincibleTimer > 0) {
            invincibleTimer--;
        }
    }
    
    /**
     * 发射子弹
     */
    private void shoot() {
        if (hasDoubleFire) {
            gameController.getProjectileManager().spawnPlayerBullet(
                getCenterX() - 15, y, -10, true
            );
            gameController.getProjectileManager().spawnPlayerBullet(
                getCenterX() + 15, y, -10, true
            );
        } else {
            gameController.getProjectileManager().spawnPlayerBullet(
                getCenterX(), y, -10, false
            );
        }
    }
    
    @Override
    public void render(Graphics2D g) {
        if (invincibleTimer > 0 && (invincibleTimer / 5) % 2 == 0) {
            return;
        }
        
        if (hasShield) {
            g.setColor(new Color(100, 200, 255, 100));
            Ellipse2D.Float shieldCircle = new Ellipse2D.Float(
                x - 10, y - 10, width + 20, height + 20
            );
            g.fill(shieldCircle);
            g.setColor(new Color(100, 200, 255, 200));
            g.setStroke(new BasicStroke(2));
            g.draw(shieldCircle);
        }
        
        drawPlayerPlane(g);
        
        if (hasDoubleFire) {
            g.setColor(Color.YELLOW);
            g.setFont(new Font("Arial", Font.BOLD, 12));
            g.drawString("双倍火力", x - 5, y - 10);
        }
    }
    
    /**
     * 绘制玩家飞机
     */
    private void drawPlayerPlane(Graphics2D g) {
        g.setColor(new Color(50, 150, 255));
        int[] xPoints = {
            (int) (x + width / 2),
            (int) (x + width * 0.1f),
            (int) (x + width * 0.3f),
            (int) (x + width * 0.7f),
            (int) (x + width * 0.9f)
        };
        int[] yPoints = {
            (int) y,
            (int) (y + height * 0.6f),
            (int) (y + height),
            (int) (y + height),
            (int) (y + height * 0.6f)
        };
        g.fillPolygon(xPoints, yPoints, 5);
        
        g.setColor(new Color(100, 200, 255));
        int[] xBody = {
            (int) (x + width / 2),
            (int) (x + width * 0.3f),
            (int) (x + width * 0.5f),
            (int) (x + width * 0.7f)
        };
        int[] yBody = {
            (int) y,
            (int) (y + height * 0.5f),
            (int) (y + height * 0.9f),
            (int) (y + height * 0.5f)
        };
        g.fillPolygon(xBody, yBody, 4);
        
        g.setColor(Color.CYAN);
        g.fillOval((int) (x + width * 0.35f), (int) (y + height * 0.2f), 
                   (int) (width * 0.3f), (int) (height * 0.25f));
        
        g.setColor(new Color(255, 100, 50, 200));
        int flameHeight = 10 + (int) (Math.random() * 8);
        g.fillRect((int) (x + width * 0.35f), (int) (y + height),
                   (int) (width * 0.3f), flameHeight);
        
        g.setColor(new Color(255, 200, 50, 200));
        g.fillRect((int) (x + width * 0.4f), (int) (y + height),
                   (int) (width * 0.2f), (int) (flameHeight * 0.6f));
    }
    
    @Override
    protected void onDeath() {
        gameController.gameOver();
    }
    
    @Override
    public void takeDamage(int damage) {
        if (invincibleTimer > 0) {
            return;
        }
        
        if (hasShield) {
            shieldTimer = 0;
            hasShield = false;
            return;
        }
        
        super.takeDamage(damage);
        invincibleTimer = 30;
    }
    
    /**
     * 激活双倍火力
     */
    public void activateDoubleFire() {
        this.hasDoubleFire = true;
        this.doubleFireTimer = 600;
    }
    
    /**
     * 激活护盾
     */
    public void activateShield() {
        this.hasShield = true;
        this.shieldTimer = SHIELD_DURATION;
    }
    
    /**
     * 恢复生命值
     */
    public void heal(int amount) {
        this.health = Math.min(this.health + amount, this.maxHealth);
    }
    
    // Getters
    public boolean isHasShield() { return hasShield; }
    public boolean isHasDoubleFire() { return hasDoubleFire; }
    public int getDoubleFireTimer() { return doubleFireTimer; }
    public int getShieldTimer() { return shieldTimer; }
    public int getInvincibleTimer() { return invincibleTimer; }
}
