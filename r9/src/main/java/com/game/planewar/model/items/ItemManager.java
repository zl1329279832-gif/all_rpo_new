package com.game.planewar.model.items;

import com.game.planewar.core.GameController;
import com.game.planewar.model.ObjectPool;
import com.game.planewar.model.Player;

import java.awt.*;
import java.awt.geom.Rectangle2D;
import java.util.List;

/**
 * 道具管理器
 */
public class ItemManager {
    
    private final GameController gameController;
    private final ObjectPool<DoubleFireItem> doubleFirePool;
    private final ObjectPool<ShieldItem> shieldPool;
    private final ObjectPool<HealthItem> healthPool;
    private final ObjectPool<BombItem> bombPool;
    private final ObjectPool<ScoreBonusItem> scoreBonusPool;
    
    private static final int INITIAL_POOL_SIZE = 10;
    
    public ItemManager(GameController gameController) {
        this.gameController = gameController;
        
        this.doubleFirePool = new ObjectPool<>(DoubleFireItem::new, INITIAL_POOL_SIZE);
        this.shieldPool = new ObjectPool<>(ShieldItem::new, INITIAL_POOL_SIZE);
        this.healthPool = new ObjectPool<>(HealthItem::new, INITIAL_POOL_SIZE);
        this.bombPool = new ObjectPool<>(BombItem::new, INITIAL_POOL_SIZE);
        this.scoreBonusPool = new ObjectPool<>(ScoreBonusItem::new, INITIAL_POOL_SIZE);
    }
    
    /**
     * 重置
     */
    public void reset() {
        doubleFirePool.reset();
        shieldPool.reset();
        healthPool.reset();
        bombPool.reset();
        scoreBonusPool.reset();
    }
    
    /**
     * 生成随机道具
     */
    public void spawnRandomItem(float x, float y) {
        float roll = gameController.getRandom().nextFloat();
        Item.ItemType type;
        
        if (roll < 0.25f) {
            type = Item.ItemType.DOUBLE_FIRE;
        } else if (roll < 0.45f) {
            type = Item.ItemType.SHIELD;
        } else if (roll < 0.7f) {
            type = Item.ItemType.HEALTH;
        } else if (roll < 0.85f) {
            type = Item.ItemType.SCORE_BONUS;
        } else {
            type = Item.ItemType.BOMB;
        }
        
        spawnItem(x, y, type);
    }
    
    /**
     * 生成指定类型的道具
     */
    public void spawnItem(float x, float y, Item.ItemType type) {
        if (type == Item.ItemType.DOUBLE_FIRE) {
            DoubleFireItem item = doubleFirePool.acquire();
            item.init(gameController, x, y, type, this::onItemCollect);
        } else if (type == Item.ItemType.SHIELD) {
            ShieldItem item = shieldPool.acquire();
            item.init(gameController, x, y, type, this::onItemCollect);
        } else if (type == Item.ItemType.HEALTH) {
            HealthItem item = healthPool.acquire();
            item.init(gameController, x, y, type, this::onItemCollect);
        } else if (type == Item.ItemType.BOMB) {
            BombItem item = bombPool.acquire();
            item.init(gameController, x, y, type, this::onItemCollect);
        } else if (type == Item.ItemType.SCORE_BONUS) {
            ScoreBonusItem item = scoreBonusPool.acquire();
            item.init(gameController, x, y, type, this::onItemCollect);
        }
    }
    
    /**
     * 道具收集回调
     */
    private void onItemCollect(Item item) {
    }
    
    /**
     * 更新
     */
    public void update() {
        for (DoubleFireItem item : doubleFirePool.getActiveObjects()) {
            if (item.isActive()) item.update();
        }
        for (ShieldItem item : shieldPool.getActiveObjects()) {
            if (item.isActive()) item.update();
        }
        for (HealthItem item : healthPool.getActiveObjects()) {
            if (item.isActive()) item.update();
        }
        for (BombItem item : bombPool.getActiveObjects()) {
            if (item.isActive()) item.update();
        }
        for (ScoreBonusItem item : scoreBonusPool.getActiveObjects()) {
            if (item.isActive()) item.update();
        }
    }
    
    /**
     * 渲染
     */
    public void render(Graphics2D g) {
        for (DoubleFireItem item : doubleFirePool.getActiveObjects()) {
            if (item.isActive()) item.render(g);
        }
        for (ShieldItem item : shieldPool.getActiveObjects()) {
            if (item.isActive()) item.render(g);
        }
        for (HealthItem item : healthPool.getActiveObjects()) {
            if (item.isActive()) item.render(g);
        }
        for (BombItem item : bombPool.getActiveObjects()) {
            if (item.isActive()) item.render(g);
        }
        for (ScoreBonusItem item : scoreBonusPool.getActiveObjects()) {
            if (item.isActive()) item.render(g);
        }
    }
    
    /**
     * 检查道具与玩家碰撞
     */
    public void checkItemsWithPlayer() {
        Player player = gameController.getPlayer();
        if (!player.isActive()) return;
        
        Rectangle2D playerBounds = player.getBounds();
        
        for (DoubleFireItem item : doubleFirePool.getActiveObjects()) {
            if (!item.isActive()) continue;
            if (playerBounds.intersects(item.getBounds())) {
                item.applyEffect(player);
            }
        }
        
        for (ShieldItem item : shieldPool.getActiveObjects()) {
            if (!item.isActive()) continue;
            if (playerBounds.intersects(item.getBounds())) {
                item.applyEffect(player);
            }
        }
        
        for (HealthItem item : healthPool.getActiveObjects()) {
            if (!item.isActive()) continue;
            if (playerBounds.intersects(item.getBounds())) {
                item.applyEffect(player);
            }
        }
        
        for (BombItem item : bombPool.getActiveObjects()) {
            if (!item.isActive()) continue;
            if (playerBounds.intersects(item.getBounds())) {
                item.applyEffect(player);
            }
        }
        
        for (ScoreBonusItem item : scoreBonusPool.getActiveObjects()) {
            if (!item.isActive()) continue;
            if (playerBounds.intersects(item.getBounds())) {
                item.applyEffect(player);
            }
        }
    }
    
    /**
     * 获取活跃道具数量
     */
    public int getActiveItemCount() {
        return doubleFirePool.getActiveCount() +
               shieldPool.getActiveCount() +
               healthPool.getActiveCount() +
               bombPool.getActiveCount() +
               scoreBonusPool.getActiveCount();
    }
}
