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

    private GameConstants.GameMode gameMode;
    private String gameState;
    private boolean running;
    private boolean gameStarted;

    private int totalTargets;
    private int destroyedTargets;

    private int selectedMenuOption;
    private int selectedLevelOption;

    private Random random;

    public GameEngine() {
        this.random = new Random();
        this.level = 1;
        this.gameMode = GameConstants.GameMode.PRACTICE;
        this.selectedMenuOption = 0;
        this.selectedLevelOption = 0;
        initGame();
    }

    private void initGame() {
        this.gameMap = new GameMap(level, gameMode);
        this.player = new PlayerTank(304, 336);
        this.enemies = new ArrayList<>();
        this.bullets = new ArrayList<>();
        this.explosions = new ArrayList<>();
        this.powerUps = new ArrayList<>();

        this.score = 0;
        this.lives = 3;
        this.enemiesSpawned = 0;
        this.enemiesKilled = 0;
        this.totalEnemies = gameMode == GameConstants.GameMode.PRACTICE ? 10 + (level - 1) * 5 : 5 + level * 2;
        this.lastEnemySpawnTime = System.currentTimeMillis();

        this.totalTargets = gameMap.getTotalTargets();
        this.destroyedTargets = 0;

        this.gameState = gameStarted ? "PLAYING" : "MENU";
        this.running = true;
    }

    public void startGame() {
        gameStarted = true;
        gameState = "PLAYING";
    }

    public void selectGameMode(GameConstants.GameMode mode) {
        this.gameMode = mode;
        if (mode == GameConstants.GameMode.BATTLE) {
            gameState = "LEVEL_SELECT";
        } else {
            level = 1;
            gameStarted = false;
            initGame();
        }
    }

    public void selectLevel(int levelNum) {
        this.level = levelNum;
        gameStarted = false;
        initGame();
    }

    public void update(boolean moveUp, boolean moveDown, boolean moveLeft, boolean moveRight,
                      boolean shoot, boolean pausePressed, boolean restartPressed,
                      boolean upPressedOnce, boolean downPressedOnce, boolean selectPressedOnce,
                      boolean num1Pressed, boolean num2Pressed, boolean num3Pressed,
                      boolean num4Pressed, boolean num5Pressed) {
        if (!running) return;

        if (gameState.equals("MENU")) {
            handleMenuInput(upPressedOnce, downPressedOnce, selectPressedOnce, num1Pressed, num2Pressed);
            return;
        }

        if (gameState.equals("LEVEL_SELECT")) {
            handleLevelSelectInput(upPressedOnce, downPressedOnce, selectPressedOnce,
                                   num1Pressed, num2Pressed, num3Pressed, num4Pressed, num5Pressed);
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
                if (gameMode == GameConstants.GameMode.BATTLE) {
                    gameState = "LEVEL_SELECT";
                } else {
                    level = 1;
                    gameStarted = false;
                    initGame();
                }
            } else if (gameState.equals("VICTORY")) {
                if (gameMode == GameConstants.GameMode.BATTLE) {
                    if (level < GameConstants.MAX_BATTLE_LEVELS) {
                        level++;
                        gameStarted = false;
                        initGame();
                    } else {
                        gameState = "MENU";
                        gameStarted = false;
                        level = 1;
                    }
                } else {
                    level++;
                    gameStarted = false;
                    initGame();
                }
            } else if (gameState.equals("PLAYING") || gameState.equals("PAUSED")) {
                gameState = "MENU";
                gameStarted = false;
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

    private void handleMenuInput(boolean upPressedOnce, boolean downPressedOnce,
                                  boolean selectPressedOnce, boolean num1Pressed, boolean num2Pressed) {
        if (upPressedOnce) {
            selectedMenuOption = (selectedMenuOption - 1 + 3) % 3;
        }
        if (downPressedOnce) {
            selectedMenuOption = (selectedMenuOption + 1) % 3;
        }
        if (num1Pressed) {
            selectedMenuOption = 0;
            selectGameMode(GameConstants.GameMode.PRACTICE);
        }
        if (num2Pressed) {
            selectedMenuOption = 1;
            selectGameMode(GameConstants.GameMode.BATTLE);
        }

        if (selectPressedOnce) {
            switch (selectedMenuOption) {
                case 0:
                    selectGameMode(GameConstants.GameMode.PRACTICE);
                    break;
                case 1:
                    selectGameMode(GameConstants.GameMode.BATTLE);
                    break;
                case 2:
                    gameStarted = true;
                    gameState = "PLAYING";
                    break;
            }
        }
    }

    private void handleLevelSelectInput(boolean upPressedOnce, boolean downPressedOnce,
                                         boolean selectPressedOnce,
                                         boolean num1Pressed, boolean num2Pressed, boolean num3Pressed,
                                         boolean num4Pressed, boolean num5Pressed) {
        if (upPressedOnce) {
            selectedLevelOption = (selectedLevelOption - 1 + GameConstants.MAX_BATTLE_LEVELS) % GameConstants.MAX_BATTLE_LEVELS;
        }
        if (downPressedOnce) {
            selectedLevelOption = (selectedLevelOption + 1) % GameConstants.MAX_BATTLE_LEVELS;
        }

        if (num1Pressed) {
            selectLevel(1);
        } else if (num2Pressed) {
            selectLevel(2);
        } else if (num3Pressed) {
            selectLevel(3);
        } else if (num4Pressed) {
            selectLevel(4);
        } else if (num5Pressed) {
            selectLevel(5);
        }

        if (selectPressedOnce) {
            selectLevel(selectedLevelOption + 1);
        }
    }

    private void updatePlayer(boolean moveUp, boolean moveDown, boolean moveLeft, boolean moveRight, boolean shoot) {
        if (!player.isActive()) return;

        int oldX = player.getX();
        int oldY = player.getY();

        if (moveUp) {
            player.moveUp();
        } else if (moveDown) {
            player.moveDown();
        } else if (moveLeft) {
            player.moveLeft();
        } else if (moveRight) {
            player.moveRight();
        }

        boolean collision = CollisionDetector.checkTankWallCollision(player, gameMap.getWalls()) ||
                           CollisionDetector.checkTankBoundaryCollision(player) ||
                           checkTankEnemyCollision(player);

        if (collision) {
            player.setX(oldX);
            player.setY(oldY);
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

            checkTargetDestruction();

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

    private void checkTargetDestruction() {
        if (gameMode == GameConstants.GameMode.BATTLE) {
            int currentDestroyed = gameMap.getDestroyedTargets();
            if (currentDestroyed > destroyedTargets) {
                score += (currentDestroyed - destroyedTargets) * 50;
                destroyedTargets = currentDestroyed;
            }
        }
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
        } else if (gameMode == GameConstants.GameMode.BATTLE) {
            if (gameMap.allTargetsDestroyed()) {
                gameState = "VICTORY";
            }
        } else {
            if (enemiesKilled >= totalEnemies && enemies.isEmpty()) {
                gameState = "VICTORY";
            }
        }
    }

    public void render(GamePanel panel) {
        panel.setGameData(gameMap, player, enemies, bullets, explosions, powerUps,
                          score, lives, totalEnemies - enemiesKilled, totalEnemies, gameState,
                          gameMode, level, totalTargets, destroyedTargets,
                          selectedMenuOption, selectedLevelOption);
        panel.repaint();
    }

    public String getGameState() {
        return gameState;
    }
}
