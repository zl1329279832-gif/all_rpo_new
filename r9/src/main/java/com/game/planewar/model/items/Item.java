package com.game.planewar.model.items;

import com.game.planewar.PlaneWarGame;
import com.game.planewar.core.GameController;
import com.game.planewar.model.GameObject;
import com.game.planewar.model.Player;

import java.awt.*;
import java.util.function.Consumer;

/**
 * 道具基类
 */
public abstract class Item extends GameObject {
    
    public enum ItemType {
        DOUBLE_FIRE,
        SHIELD,
        HEALTH,
        BOMB,
        SCORE_BONUS
    }
    
    protected GameController gameController;
    protected ItemType type;
    protected Consumer<Item> onCollectCallback;
    protected float floatOffset;
    protected float rotation;
    
    protected Item() {
        super();
        this.floatOffset = 0;
        this.rotation = 0;
    }
    
    /**
     * 初始化道具
     */
    public void init(GameController controller, float x, float y, 
                     ItemType type, Consumer<Item> onCollectCallback) {
        this.gameController = controller;
        this.type = type;
        this.onCollectCallback = onCollectCallback;
        
        float width = 30;
        float height = 30;
        float speedY = 1.5f;
        
        super.init(x - width / 2, y - height / 2, width, height);
        this.speedY = speedY;
        this.maxHealth = 1;
        this.health = 1;
        this.floatOffset = gameController.getRandom().nextFloat() * (float) Math.PI * 2;
    }
    
    @Override
    public void update() {
        y += speedY;
        floatOffset += 0.05f;
        rotation += 0.02f;
        
        if (y > PlaneWarGame.WINDOW_HEIGHT + 50) {
            returnToPool();
        }
    }
    
    @Override
    public void render(Graphics2D g) {
        float floatY = y + (float) Math.sin(floatOffset) * 5;
        
        Graphics2D g2d = (Graphics2D) g.create();
        g2d.translate(x + width / 2, floatY + height / 2);
        g2d.rotate(rotation);
        g2d.translate(-width / 2, -height / 2);
        
        drawItem(g2d);
        
        g2d.dispose();
    }
    
    /**
     * 绘制道具
     */
    protected abstract void drawItem(Graphics2D g);
    
    @Override
    protected void onDeath() {
        returnToPool();
    }
    
    /**
     * 应用道具效果
     */
    public void applyEffect(Player player) {
        if (type == ItemType.DOUBLE_FIRE) {
            player.activateDoubleFire();
            gameController.getExplosionManager().createCollectEffect(
                getCenterX(), getCenterY(), Color.YELLOW
            );
        } else if (type == ItemType.SHIELD) {
            player.activateShield();
            gameController.getExplosionManager().createCollectEffect(
                getCenterX(), getCenterY(), Color.CYAN
            );
        } else if (type == ItemType.HEALTH) {
            player.heal(30);
            gameController.getExplosionManager().createCollectEffect(
                getCenterX(), getCenterY(), Color.GREEN
            );
        } else if (type == ItemType.BOMB) {
            gameController.useScreenClearBomb();
            gameController.getExplosionManager().createCollectEffect(
                getCenterX(), getCenterY(), Color.RED
            );
        } else if (type == ItemType.SCORE_BONUS) {
            gameController.getScoreSystem().addScore(500, false);
            gameController.getExplosionManager().createCollectEffect(
                getCenterX(), getCenterY(), Color.ORANGE
            );
        }
        
        if (onCollectCallback != null) {
            onCollectCallback.accept(this);
        }
        
        setActive(false);
        returnToPool();
    }
    
    // Getters
    public ItemType getType() { return type; }
}
