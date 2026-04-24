package com.tankwar.engine;

import com.tankwar.collision.CollisionDetector;
import com.tankwar.entity.*;
import com.tankwar.map.GameMap;
import com.tankwar.map.Wall;
import com.tankwar.ui.GamePanel;
import com.tankwar.util.Direction;
import com.tankwar.util.GameConstants;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

public class GameEngine {
    private GameMap gameMap;
    private PlayerTank player;
    private List<EnemyTank> enemies;
    private List<Bullet> bullets;
    private List<Explosion> explosions;
    private List<PowerUp> powerUps;

    private int score;
    private int lives;
    private int level;
    private int enemiesSpawned;
    private int enemiesKilled;
    private int totalEnemies;
    private long lastEnemySpawnTime;

    private String gameState;
    private boolean running;
    private boolean gameStarted;

    private Random random;

    public GameEngine() {
        this.random = new Random();
        this.level = 1;
        initGame();
    }

    private void initGame() {
        this.gameMap = new GameMap(level);
        this.player = new PlayerTank(304, 464);
        this.enemies = new ArrayList<>();
        this.bullets = new ArrayList<>();
        this.explosions = new ArrayList<>();
        this.powerUps = new ArrayList<>();

        this.score = 0;
        this.lives = 3;
        this.enemiesSpawned = 0;
        this.enemiesKilled = 0;
        this.totalEnemies = 10 + (level - 1) * 5;
        this.lastEnemySpawnTime = System.currentTimeMillis();

        this.gameState = gameStarted ? "PLAYING" : "START";
        this.running = true;
    }

    public void startGame() {
        gameStarted = true;
        gameState = "PLAYING";
    }

    public void update(boolean moveUp, boolean moveDown, boolean moveLeft, boolean moveRight,
                      boolean shoot, boolean pausePressed, boolean restartPressed) {
        if (!running) return;

        if (gameState.equals("START")) {
            if (moveUp || moveDown || moveLeft || moveRight || shoot || pausePressed || restartPressed) {
                startGame();
            }
            return;
        }

        if (pausePressed) {
            if (gameState.equals("PLAYING")) {
                gameState = "PAUSED";
            } else if (gameState.equals("PAUSED")) {
                gameState = "PLAYING";
            }
        }

        if (restartPressed) {
            if (gameState.equals("GAME_OVER")) {
                level = 1;
                gameStarted = false;
                initGame();
            } else if (gameState.equals("VICTORY")) {
                level++;
                gameStarted = false;
                initGame();
            }
        }

        if (!gameState.equals("PLAYING")) {
            return;
        }

        updatePlayer(moveUp, moveDown, moveLeft, moveRight, shoot);
        updateEnemies();
        updateBullets();
        updateExplosions();
        updatePowerUps();
        spawnEnemies();
        spawnPowerUps();
        checkGameConditions();
    }

    private void updatePlayer(boolean moveUp, boolean moveDown, boolean moveLeft, boolean moveRight, boolean shoot) {
        if (!player.isActive()) return;

        // 先设置方向
        if (moveUp) {
            player.setDirection(Direction.UP);
        } else if (moveDown) {
            player.setDirection(Direction.DOWN);
        } else if (moveLeft) {
            player.setDirection(Direction.LEFT);
        } else if (moveRight) {
            player.setDirection(Direction.RIGHT);
        }

        // 尝试移动 - 先沿Y轴再沿X轴，这样可以更好地处理碰撞
        boolean moved = false;
        int oldX = player.getX();
        int oldY = player.getY();

        if (moveUp) {
            player.moveUp();
        } else if (moveDown) {
            player.moveDown();
        }

        // 检查Y轴移动碰撞
        if (CollisionDetector.checkTankWallCollision(player, gameMap.getWalls()) ||
            CollisionDetector.checkTankBoundaryCollision(player) ||
            checkTankEnemyCollision(player)) {
            player.setY(oldY);
        } else {
            moved = true;
        }

        // 尝试X轴移动
        oldX = player.getX();
        if (moveLeft) {
            player.moveLeft();
        } else if (moveRight) {
            player.moveRight();
        }

        // 检查X轴移动碰撞
        if (CollisionDetector.checkTankWallCollision(player, gameMap.getWalls()) ||
            CollisionDetector.checkTankBoundaryCollision(player) ||
            checkTankEnemyCollision(player)) {
            player.setX(oldX);
        }

        player.update();

        if (shoot) {
            Bullet bullet = player.shoot();
            if (bullet != null) {
                bullets.add(bullet);
            }
        }

        PowerUp collected = CollisionDetector.checkPlayerPowerUpCollision(player, powerUps);
        if (collected != null) {
            applyPowerUp(collected);
        }
    }
    
    private boolean checkTankEnemyCollision(Tank tank) {
        for (EnemyTank enemy : enemies) {
            if (enemy.isActive() && tank.getBounds().intersects(enemy.getBounds())) {
                return true;
            }
        }
        return false;
    }

    private void applyPowerUp(PowerUp powerUp) {
        switch (powerUp.getType()) {
            case SPEED:
                player.activateSpeedBoost(8000, 2);
                break;
            case SHIELD:
                player.activateShield(8000);
                break;
            case ENHANCED_BULLETS:
                player.activateEnhancedBullets(10000);
                break;
            case HEAL:
                player.heal(1);
                break;
        }
        score += 50;
    }

    private void updateEnemies() {
        for (EnemyTank enemy : enemies) {
            if (!enemy.isActive()) continue;

            int oldX = enemy.getX();
            int oldY = enemy.getY();

            enemy.update();

            boolean collision = CollisionDetector.checkTankWallCollision(enemy, gameMap.getWalls()) ||
                               CollisionDetector.checkTankBoundaryCollision(enemy);
            
            if (!collision) {
                for (EnemyTank other : enemies) {
                    if (other != enemy && other.isActive() &&
                        enemy.getBounds().intersects(other.getBounds())) {
                        collision = true;
                        break;
                    }
                }
            }

            if (collision) {
                enemy.setX(oldX);
                enemy.setY(oldY);
                enemy.getAI().onCollision();
            }

            Bullet bullet = enemy.shoot();
            if (bullet != null) {
                bullets.add(bullet);
            }
        }
    }

    private void updateBullets() {
        for (Bullet bullet : bullets) {
            if (!bullet.isActive()) continue;

            bullet.update();

            Bullet hitWall = CollisionDetector.checkBulletWallCollision(bullet, gameMap.getWalls());
            if (hitWall != null) {
                explosions.add(new Explosion(hitWall.getX(), hitWall.getY(), GameConstants.EXPLOSION_FRAMES));
            }

            Tank hitTank = CollisionDetector.checkBulletTankCollision(bullet, player, enemies);
            if (hitTank != null) {
                explosions.add(new Explosion(hitTank.getX(), hitTank.getY(), GameConstants.EXPLOSION_FRAMES));

                if (hitTank instanceof EnemyTank) {
                    enemiesKilled++;
                    score += 100;
                } else if (hitTank instanceof PlayerTank && !player.isActive()) {
                    lives--;
                    if (lives <= 0) {
                        gameState = "GAME_OVER";
                    } else {
                        player = new PlayerTank(304, 464);
                    }
                }
            }
        }

        bullets.removeIf(b -> !b.isActive());
        enemies.removeIf(e -> !e.isActive());
    }

    private void updateExplosions() {
        for (Explosion explosion : explosions) {
            explosion.update();
        }
        explosions.removeIf(e -> !e.isActive());
    }

    private void updatePowerUps() {
        for (PowerUp powerUp : powerUps) {
            powerUp.update();
        }
        powerUps.removeIf(p -> !p.isActive());
    }

    private void spawnEnemies() {
        long now = System.currentTimeMillis();
        if (enemiesSpawned < totalEnemies &&
            enemies.size() < GameConstants.MAX_ENEMIES &&
            now - lastEnemySpawnTime >= GameConstants.ENEMY_SPAWN_DELAY) {

            int spawnX = 64 + (enemiesSpawned % 3) * 224;
            int spawnY = 64;
            int aiLevel = Math.min(3, 1 + level / 2);

            boolean positionClear = true;
            for (Wall wall : gameMap.getWalls()) {
                if (wall.isActive() && wall.getBounds().intersects(
                    new java.awt.Rectangle(spawnX - 14, spawnY - 14, 28, 28))) {
                    positionClear = false;
                    break;
                }
            }

            if (positionClear) {
                enemies.add(new EnemyTank(spawnX, spawnY, aiLevel));
                enemiesSpawned++;
                lastEnemySpawnTime = now;
            }
        }
    }

    private void spawnPowerUps() {
        if (random.nextDouble() < 0.002) {
            int x = 64 + random.nextInt(GameConstants.SCREEN_WIDTH - 128);
            int y = 96 + random.nextInt(GameConstants.GAME_HEIGHT - 192);

            PowerUp.Type[] types = PowerUp.Type.values();
            PowerUp.Type type = types[random.nextInt(types.length)];

            boolean valid = true;
            for (Wall wall : gameMap.getWalls()) {
                if (wall.isActive() && wall.getBounds().intersects(
                    new java.awt.Rectangle(x - 12, y - 12, 24, 24))) {
                    valid = false;
                    break;
                }
            }

            if (valid) {
                powerUps.add(new PowerUp(x, y, type));
            }
        }
    }

    private void checkGameConditions() {
        if (gameMap.isBaseDestroyed()) {
            gameState = "GAME_OVER";
        } else if (enemiesKilled >= totalEnemies && enemies.isEmpty()) {
            gameState = "VICTORY";
        }
    }

    public void render(GamePanel panel) {
        panel.setGameData(gameMap, player, enemies, bullets, explosions, powerUps,
                          score, lives, totalEnemies - enemiesKilled, totalEnemies, gameState);
        panel.repaint();
    }

    public String getGameState() {
        return gameState;
    }
}
