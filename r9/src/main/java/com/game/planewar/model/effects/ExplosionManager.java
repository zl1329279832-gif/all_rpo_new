package com.game.planewar.model.effects;

import com.game.planewar.PlaneWarGame;
import com.game.planewar.core.GameController;
import com.game.planewar.model.enemies.Enemy;

import java.awt.*;
import java.util.ArrayList;
import java.util.List;

/**
 * 爆炸效果管理器
 */
public class ExplosionManager {
    
    private final GameController gameController;
    private final List<Explosion> explosions;
    private final List<Explosion> explosionPool;
    
    private static final int INITIAL_POOL_SIZE = 50;
    
    public ExplosionManager(GameController gameController) {
        this.gameController = gameController;
        this.explosions = new ArrayList<>();
        this.explosionPool = new ArrayList<>(INITIAL_POOL_SIZE);
        
        for (int i = 0; i < INITIAL_POOL_SIZE; i++) {
            explosionPool.add(new Explosion());
        }
    }
    
    /**
     * 从对象池获取爆炸效果
     */
    private Explosion acquireExplosion() {
        for (Explosion explosion : explosionPool) {
            if (!explosion.isActive()) {
                return explosion;
            }
        }
        
        Explosion newExplosion = new Explosion();
        explosionPool.add(newExplosion);
        return newExplosion;
    }
    
    /**
     * 创建小型爆炸
     */
    public void createSmallExplosion(float x, float y) {
        Explosion explosion = acquireExplosion();
        explosion.init(x, y, Explosion.ExplosionType.SMALL, Color.ORANGE, this::onExplosionComplete);
        explosions.add(explosion);
    }
    
    /**
     * 创建爆炸（根据敌人类型）
     */
    public void createExplosion(float x, float y, Enemy.EnemyType enemyType) {
        Explosion.ExplosionType type;
        if (enemyType == Enemy.EnemyType.SMALL) {
            type = Explosion.ExplosionType.SMALL;
        } else if (enemyType == Enemy.EnemyType.MEDIUM) {
            type = Explosion.ExplosionType.NORMAL;
        } else if (enemyType == Enemy.EnemyType.LARGE || enemyType == Enemy.EnemyType.ELITE) {
            type = Explosion.ExplosionType.LARGE;
        } else if (enemyType == Enemy.EnemyType.BOSS) {
            type = Explosion.ExplosionType.BOSS;
        } else {
            type = Explosion.ExplosionType.NORMAL;
        }
        
        Explosion explosion = acquireExplosion();
        explosion.init(x, y, type, Color.ORANGE, this::onExplosionComplete);
        explosions.add(explosion);
    }
    
    /**
     * 创建Boss爆炸
     */
    public void createBossExplosion(float x, float y) {
        for (int i = 0; i < 5; i++) {
            float offsetX = (gameController.getRandom().nextFloat() - 0.5f) * 100;
            float offsetY = (gameController.getRandom().nextFloat() - 0.5f) * 80;
            int delay = i * 8;
            
            Explosion explosion = acquireExplosion();
            explosion.init(x + offsetX, y + offsetY, 
                Explosion.ExplosionType.LARGE, Color.ORANGE, this::onExplosionComplete);
            explosions.add(explosion);
        }
        
        Explosion mainExplosion = acquireExplosion();
        mainExplosion.init(x, y, Explosion.ExplosionType.BOSS, Color.RED, this::onExplosionComplete);
        explosions.add(mainExplosion);
    }
    
    /**
     * 创建收集效果
     */
    public void createCollectEffect(float x, float y, Color color) {
        Explosion explosion = acquireExplosion();
        explosion.init(x, y, Explosion.ExplosionType.COLLECT, color, this::onExplosionComplete);
        explosions.add(explosion);
    }
    
    /**
     * 创建清屏效果
     */
    public void createScreenClearEffect() {
        float centerX = PlaneWarGame.WINDOW_WIDTH / 2f;
        float centerY = PlaneWarGame.WINDOW_HEIGHT / 2f;
        
        Explosion explosion = acquireExplosion();
        explosion.init(centerX, centerY, Explosion.ExplosionType.SCREEN_CLEAR, Color.WHITE, 
            this::onExplosionComplete);
        explosions.add(explosion);
    }
    
    /**
     * 爆炸完成回调
     */
    private void onExplosionComplete(Explosion explosion) {
        explosions.remove(explosion);
    }
    
    /**
     * 更新
     */
    public void update() {
        for (int i = explosions.size() - 1; i >= 0; i--) {
            Explosion explosion = explosions.get(i);
            explosion.update();
        }
    }
    
    /**
     * 渲染
     */
    public void render(Graphics2D g) {
        for (Explosion explosion : explosions) {
            if (explosion.isActive()) {
                explosion.render(g);
            }
        }
    }
    
    /**
     * 重置
     */
    public void reset() {
        explosions.clear();
        for (Explosion explosion : explosionPool) {
            explosion.setActive(false);
        }
    }
    
    /**
     * 获取活跃爆炸数量
     */
    public int getActiveExplosionCount() {
        return explosions.size();
    }
}
