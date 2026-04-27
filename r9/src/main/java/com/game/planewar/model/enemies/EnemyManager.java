package com.game.planewar.model.enemies;

import com.game.planewar.PlaneWarGame;
import com.game.planewar.core.GameController;
import com.game.planewar.core.LevelSystem;
import com.game.planewar.model.GameObject;
import com.game.planewar.model.ObjectPool;
import com.game.planewar.model.Player;
import com.game.planewar.model.projectiles.Projectile;

import java.awt.*;
import java.awt.geom.Rectangle2D;
import java.util.List;

/**
 * 敌机管理器 - 管理所有敌机的生成、更新、渲染和碰撞检测
 */
public class EnemyManager {
    
    private final GameController gameController;
    private final ObjectPool<SmallEnemy> smallEnemyPool;
    private final ObjectPool<MediumEnemy> mediumEnemyPool;
    private final ObjectPool<LargeEnemy> largeEnemyPool;
    private final ObjectPool<EliteEnemy> eliteEnemyPool;
    private final ObjectPool<BossEnemy> bossEnemyPool;
    
    private int spawnCooldown;
    private int spawnInterval;
    private int enemiesSpawned;
    private BossEnemy activeBoss;
    
    private static final int INITIAL_SPAWN_INTERVAL = 60;
    private static final int MIN_SPAWN_INTERVAL = 20;
    
    private static final int INITIAL_SMALL_POOL = 30;
    private static final int INITIAL_MEDIUM_POOL = 15;
    private static final int INITIAL_LARGE_POOL = 8;
    private static final int INITIAL_ELITE_POOL = 5;
    private static final int INITIAL_BOSS_POOL = 2;
    
    public EnemyManager(GameController gameController) {
        this.gameController = gameController;
        
        this.smallEnemyPool = new ObjectPool<>(SmallEnemy::new, INITIAL_SMALL_POOL);
        this.mediumEnemyPool = new ObjectPool<>(MediumEnemy::new, INITIAL_MEDIUM_POOL);
        this.largeEnemyPool = new ObjectPool<>(LargeEnemy::new, INITIAL_LARGE_POOL);
        this.eliteEnemyPool = new ObjectPool<>(EliteEnemy::new, INITIAL_ELITE_POOL);
        this.bossEnemyPool = new ObjectPool<>(BossEnemy::new, INITIAL_BOSS_POOL);
        
        reset();
    }
    
    /**
     * 重置
     */
    public void reset() {
        smallEnemyPool.reset();
        mediumEnemyPool.reset();
        largeEnemyPool.reset();
        eliteEnemyPool.reset();
        bossEnemyPool.reset();
        
        this.spawnCooldown = 60;
        this.spawnInterval = INITIAL_SPAWN_INTERVAL;
        this.enemiesSpawned = 0;
        this.activeBoss = null;
    }
    
    /**
     * 更新
     */
    public void update() {
        LevelSystem levelSystem = gameController.getLevelSystem();
        
        if (levelSystem.isBossActive()) {
            if (activeBoss != null && activeBoss.isActive()) {
                activeBoss.update();
            }
            return;
        }
        
        updateSpawnInterval();
        
        if (spawnCooldown > 0) {
            spawnCooldown--;
        } else {
            spawnEnemy();
            spawnCooldown = spawnInterval;
        }
        
        for (SmallEnemy enemy : smallEnemyPool.getActiveObjects()) {
            if (enemy.isActive()) {
                enemy.update();
            }
        }
        for (MediumEnemy enemy : mediumEnemyPool.getActiveObjects()) {
            if (enemy.isActive()) {
                enemy.update();
            }
        }
        for (LargeEnemy enemy : largeEnemyPool.getActiveObjects()) {
            if (enemy.isActive()) {
                enemy.update();
            }
        }
        for (EliteEnemy enemy : eliteEnemyPool.getActiveObjects()) {
            if (enemy.isActive()) {
                enemy.update();
            }
        }
    }
    
    /**
     * 更新生成间隔（难度递增）
     */
    private void updateSpawnInterval() {
        float difficulty = gameController.getLevelSystem().getDifficultyMultiplier();
        this.spawnInterval = Math.max(
            MIN_SPAWN_INTERVAL,
            (int) (INITIAL_SPAWN_INTERVAL / difficulty)
        );
    }
    
    /**
     * 生成敌机
     */
    private void spawnEnemy() {
        float difficulty = gameController.getLevelSystem().getDifficultyMultiplier();
        int level = gameController.getLevelSystem().getCurrentLevel();
        
        float roll = gameController.getRandom().nextFloat();
        Enemy.EnemyType type;
        
        if (roll < 0.5f - level * 0.02f) {
            type = Enemy.EnemyType.SMALL;
        } else if (roll < 0.75f - level * 0.01f) {
            type = Enemy.EnemyType.MEDIUM;
        } else if (roll < 0.9f) {
            type = Enemy.EnemyType.LARGE;
        } else {
            type = Enemy.EnemyType.ELITE;
        }
        
        float x = 30 + gameController.getRandom().nextFloat() * (PlaneWarGame.WINDOW_WIDTH - 90);
        float y = -50;
        
        int movementPattern = gameController.getRandom().nextInt(4);
        
        if (type == Enemy.EnemyType.SMALL) {
            SmallEnemy enemy = smallEnemyPool.acquire();
            enemy.init(gameController, x, y, Enemy.EnemyType.SMALL, movementPattern, this::onEnemyDeath);
        } else if (type == Enemy.EnemyType.MEDIUM) {
            MediumEnemy enemy = mediumEnemyPool.acquire();
            enemy.init(gameController, x, y, Enemy.EnemyType.MEDIUM, movementPattern, this::onEnemyDeath);
        } else if (type == Enemy.EnemyType.LARGE) {
            LargeEnemy enemy = largeEnemyPool.acquire();
            enemy.init(gameController, x, y, Enemy.EnemyType.LARGE, movementPattern, this::onEnemyDeath);
        } else if (type == Enemy.EnemyType.ELITE) {
            EliteEnemy enemy = eliteEnemyPool.acquire();
            enemy.init(gameController, x, y, Enemy.EnemyType.ELITE, movementPattern, this::onEnemyDeath);
        }
        
        enemiesSpawned++;
    }
    
    /**
     * 生成Boss
     */
    public void spawnBoss() {
        BossEnemy boss = bossEnemyPool.acquire();
        float x = (PlaneWarGame.WINDOW_WIDTH - 180) / 2;
        float y = -150;
        boss.init(gameController, x, y, Enemy.EnemyType.BOSS, 0, this::onBossDeath);
        this.activeBoss = boss;
    }
    
    /**
     * 敌机死亡回调
     */
    private void onEnemyDeath(Enemy enemy) {
    }
    
    /**
     * Boss死亡回调
     */
    private void onBossDeath(Enemy enemy) {
        this.activeBoss = null;
    }
    
    /**
     * 渲染所有敌机
     */
    public void render(Graphics2D g) {
        LevelSystem levelSystem = gameController.getLevelSystem();
        
        if (levelSystem.isBossActive() && activeBoss != null && activeBoss.isActive()) {
            activeBoss.render(g);
            return;
        }
        
        for (SmallEnemy enemy : smallEnemyPool.getActiveObjects()) {
            if (enemy.isActive()) {
                enemy.render(g);
            }
        }
        for (MediumEnemy enemy : mediumEnemyPool.getActiveObjects()) {
            if (enemy.isActive()) {
                enemy.render(g);
            }
        }
        for (LargeEnemy enemy : largeEnemyPool.getActiveObjects()) {
            if (enemy.isActive()) {
                enemy.render(g);
            }
        }
        for (EliteEnemy enemy : eliteEnemyPool.getActiveObjects()) {
            if (enemy.isActive()) {
                enemy.render(g);
            }
        }
    }
    
    /**
     * 检查子弹击中敌人
     */
    public boolean checkBulletHit(Projectile bullet) {
        if (!bullet.isActive()) return false;
        
        Rectangle2D bulletBounds = bullet.getCollisionBounds();
        
        if (activeBoss != null && activeBoss.isActive()) {
            if (bulletBounds.intersects(activeBoss.getBounds())) {
                activeBoss.onHit(bullet);
                return true;
            }
            return false;
        }
        
        for (SmallEnemy enemy : smallEnemyPool.getActiveObjects()) {
            if (!enemy.isActive()) continue;
            if (bulletBounds.intersects(enemy.getBounds())) {
                enemy.onHit(bullet);
                return true;
            }
        }
        
        for (MediumEnemy enemy : mediumEnemyPool.getActiveObjects()) {
            if (!enemy.isActive()) continue;
            if (bulletBounds.intersects(enemy.getBounds())) {
                enemy.onHit(bullet);
                return true;
            }
        }
        
        for (LargeEnemy enemy : largeEnemyPool.getActiveObjects()) {
            if (!enemy.isActive()) continue;
            if (bulletBounds.intersects(enemy.getBounds())) {
                enemy.onHit(bullet);
                return true;
            }
        }
        
        for (EliteEnemy enemy : eliteEnemyPool.getActiveObjects()) {
            if (!enemy.isActive()) continue;
            if (bulletBounds.intersects(enemy.getBounds())) {
                enemy.onHit(bullet);
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * 检查敌人与玩家碰撞
     */
    public void checkEnemiesWithPlayer() {
        Player player = gameController.getPlayer();
        if (!player.isActive()) return;
        
        Rectangle2D playerBounds = player.getBounds();
        
        if (activeBoss != null && activeBoss.isActive()) {
            if (playerBounds.intersects(activeBoss.getBounds())) {
                player.takeDamage(50);
            }
            return;
        }
        
        for (SmallEnemy enemy : smallEnemyPool.getActiveObjects()) {
            if (!enemy.isActive()) continue;
            if (playerBounds.intersects(enemy.getBounds())) {
                player.takeDamage(15);
                enemy.setActive(false);
                enemy.returnToPool();
                gameController.getExplosionManager().createSmallExplosion(
                    enemy.getCenterX(), enemy.getCenterY()
                );
            }
        }
        
        for (MediumEnemy enemy : mediumEnemyPool.getActiveObjects()) {
            if (!enemy.isActive()) continue;
            if (playerBounds.intersects(enemy.getBounds())) {
                player.takeDamage(25);
                enemy.setActive(false);
                enemy.returnToPool();
                gameController.getExplosionManager().createExplosion(
                    enemy.getCenterX(), enemy.getCenterY(), Enemy.EnemyType.MEDIUM
                );
            }
        }
        
        for (LargeEnemy enemy : largeEnemyPool.getActiveObjects()) {
            if (!enemy.isActive()) continue;
            if (playerBounds.intersects(enemy.getBounds())) {
                player.takeDamage(40);
                enemy.setActive(false);
                enemy.returnToPool();
                gameController.getExplosionManager().createExplosion(
                    enemy.getCenterX(), enemy.getCenterY(), Enemy.EnemyType.LARGE
                );
            }
        }
        
        for (EliteEnemy enemy : eliteEnemyPool.getActiveObjects()) {
            if (!enemy.isActive()) continue;
            if (playerBounds.intersects(enemy.getBounds())) {
                player.takeDamage(35);
                enemy.setActive(false);
                enemy.returnToPool();
                gameController.getExplosionManager().createExplosion(
                    enemy.getCenterX(), enemy.getCenterY(), Enemy.EnemyType.ELITE
                );
            }
        }
    }
    
    /**
     * 摧毁所有敌人（清屏炸弹）
     */
    public void destroyAllEnemies() {
        int bonusScore = 0;
        
        if (activeBoss != null && activeBoss.isActive()) {
            activeBoss.takeDamage(activeBoss.getHealth() / 2);
            gameController.getExplosionManager().createExplosion(
                activeBoss.getCenterX(), activeBoss.getCenterY(), Enemy.EnemyType.BOSS
            );
        }
        
        for (SmallEnemy enemy : smallEnemyPool.getActiveObjects()) {
            if (enemy.isActive()) {
                bonusScore += enemy.getScoreValue();
                gameController.getExplosionManager().createExplosion(
                    enemy.getCenterX(), enemy.getCenterY(), Enemy.EnemyType.SMALL
                );
                enemy.setActive(false);
                enemy.returnToPool();
            }
        }
        
        for (MediumEnemy enemy : mediumEnemyPool.getActiveObjects()) {
            if (enemy.isActive()) {
                bonusScore += enemy.getScoreValue();
                gameController.getExplosionManager().createExplosion(
                    enemy.getCenterX(), enemy.getCenterY(), Enemy.EnemyType.MEDIUM
                );
                enemy.setActive(false);
                enemy.returnToPool();
            }
        }
        
        for (LargeEnemy enemy : largeEnemyPool.getActiveObjects()) {
            if (enemy.isActive()) {
                bonusScore += enemy.getScoreValue();
                gameController.getExplosionManager().createExplosion(
                    enemy.getCenterX(), enemy.getCenterY(), Enemy.EnemyType.LARGE
                );
                enemy.setActive(false);
                enemy.returnToPool();
            }
        }
        
        for (EliteEnemy enemy : eliteEnemyPool.getActiveObjects()) {
            if (enemy.isActive()) {
                bonusScore += enemy.getScoreValue();
                gameController.getExplosionManager().createExplosion(
                    enemy.getCenterX(), enemy.getCenterY(), Enemy.EnemyType.ELITE
                );
                enemy.setActive(false);
                enemy.returnToPool();
            }
        }
        
        if (bonusScore > 0) {
            gameController.getScoreSystem().addScore(bonusScore, false);
        }
    }
    
    /**
     * 获取活跃Boss
     */
    public BossEnemy getActiveBoss() {
        return activeBoss;
    }
    
    /**
     * 获取活跃敌人数量
     */
    public int getActiveEnemyCount() {
        int count = 0;
        if (activeBoss != null && activeBoss.isActive()) count++;
        count += smallEnemyPool.getActiveCount();
        count += mediumEnemyPool.getActiveCount();
        count += largeEnemyPool.getActiveCount();
        count += eliteEnemyPool.getActiveCount();
        return count;
    }
}
