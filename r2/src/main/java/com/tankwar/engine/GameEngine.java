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
    private boolean practiceInvincible;

    private int totalTargets;
    private int destroyedTargets;

    private int selectedMenuOption;
    private int selectedLevelOption;

    private boolean hasSaveData;

    private Random random;

    public GameEngine() {
        this.random = new Random();
        this.level = 1;
        this.gameMode = GameConstants.GameMode.BATTLE;
        this.selectedMenuOption = 0;
        this.selectedLevelOption = 0;
        this.hasSaveData = GameSaveManager.hasSaveData();
        this.practiceInvincible = true;
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

        if (gameMode == GameConstants.GameMode.PRACTICE) {
            this.totalEnemies = Integer.MAX_VALUE;
            this.practiceInvincible = true;
            player.activateShield(Long.MAX_VALUE);
        } else {
            this.totalEnemies = 5 + level * 2;
            this.practiceInvincible = false;
        }

        this.lastEnemySpawnTime = System.currentTimeMillis();
        this.totalTargets = gameMap.getTotalTargets();
        this.destroyedTargets = 0;
        this.gameState = "MENU";
        this.running = true;
    }

    public void startGame() {
        gameStarted = true;
        gameState = "PLAYING";
    }

    public void startPracticeMode() {
        this.gameMode = GameConstants.GameMode.PRACTICE;
        this.level = 1;
        this.gameStarted = true;
        initGameForMode();
        this.gameState = "PLAYING";
    }

    public void startBattleMode() {
        this.gameMode = GameConstants.GameMode.BATTLE;
        this.gameState = "LEVEL_SELECT";
    }

    public void startBattleLevel(int levelNum) {
        if (!LevelProgressManager.isLevelUnlocked(levelNum)) {
            return;
        }
        this.level = levelNum;
        this.gameMode = GameConstants.GameMode.BATTLE;
        this.gameStarted = true;
        initGameForMode();
        this.gameState = "PLAYING";
    }

    private void initGameForMode() {
        this.gameMap = new GameMap(level, gameMode);
        this.player = new PlayerTank(304, 336);
        this.enemies = new ArrayList<>();
        this.bullets = new ArrayList<>();
        this.explosions = new ArrayList<>();
        this.powerUps = new ArrayList<>();

        if (gameMode == GameConstants.GameMode.PRACTICE) {
            this.totalEnemies = Integer.MAX_VALUE;
            this.practiceInvincible = true;
            player.activateShield(Long.MAX_VALUE);
        } else {
            this.totalEnemies = 5 + level * 2;
            this.practiceInvincible = false;
        }

        this.lastEnemySpawnTime = System.currentTimeMillis();
        this.totalTargets = gameMap.getTotalTargets();
        this.destroyedTargets = 0;
        this.running = true;
    }

    public void goToMainMenu() {
        this.gameState = "MENU";
        this.gameStarted = false;
        this.hasSaveData = GameSaveManager.hasSaveData();
    }

    public void goToLevelSelect() {
        this.gameState = "LEVEL_SELECT";
    }

    public void update(boolean moveUp, boolean moveDown, boolean moveLeft, boolean moveRight,
                      boolean shoot, boolean pausePressed, boolean restartPressed,
                      boolean upPressedOnce, boolean downPressedOnce, boolean selectPressedOnce,
                      boolean num1Pressed, boolean num2Pressed, boolean num3Pressed,
                      boolean num4Pressed, boolean num5Pressed) {
        if (!running) return;

        if (gameState.equals("MENU")) {
            handleMenuInput(upPressedOnce, downPressedOnce, selectPressedOnce, num1Pressed, num2Pressed, num3Pressed);
            return;
        }

        if (gameState.equals("LEVEL_SELECT")) {
            handleLevelSelectInput(upPressedOnce, downPressedOnce, selectPressedOnce,
                                   num1Pressed, num2Pressed, num3Pressed, num4Pressed, num5Pressed, restartPressed);
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
                    goToLevelSelect();
                } else {
                    startPracticeMode();
                }
            } else if (gameState.equals("VICTORY")) {
                if (gameMode == GameConstants.GameMode.BATTLE) {
                    if (level < GameConstants.MAX_BATTLE_LEVELS) {
                        startBattleLevel(level + 1);
                    } else {
                        goToMainMenu();
                    }
                } else {
                    startPracticeMode();
                }
            } else if (gameState.equals("PLAYING") || gameState.equals("PAUSED")) {
                saveGame();
                goToMainMenu();
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
                                  boolean selectPressedOnce, boolean num1Pressed, boolean num2Pressed, boolean num3Pressed) {
        int menuOptionCount = hasSaveData ? 3 : 2;

        if (upPressedOnce) {
            selectedMenuOption = (selectedMenuOption - 1 + menuOptionCount) % menuOptionCount;
        }
        if (downPressedOnce) {
            selectedMenuOption = (selectedMenuOption + 1) % menuOptionCount;
        }

        if (num1Pressed) {
            selectedMenuOption = 0;
            startPracticeMode();
            return;
        }
        if (num2Pressed) {
            if (hasSaveData && selectedMenuOption == 2) {
                loadGame();
            } else {
                selectedMenuOption = 1;
                startBattleMode();
            }
            return;
        }
        if (num3Pressed && hasSaveData) {
            loadGame();
            return;
        }

        if (selectPressedOnce) {
            if (hasSaveData) {
                switch (selectedMenuOption) {
                    case 0:
                        startPracticeMode();
                        break;
                    case 1:
                        startBattleMode();
                        break;
                    case 2:
                        loadGame();
                        break;
                }
            } else {
                switch (selectedMenuOption) {
                    case 0:
                        startPracticeMode();
                        break;
                    case 1:
                        startBattleMode();
                        break;
                }
            }
        }
    }

    private void handleLevelSelectInput(boolean upPressedOnce, boolean downPressedOnce,
                                         boolean selectPressedOnce,
                                         boolean num1Pressed, boolean num2Pressed, boolean num3Pressed,
                                         boolean num4Pressed, boolean num5Pressed, boolean restartPressed) {
        if (restartPressed) {
            goToMainMenu();
            return;
        }

        if (upPressedOnce) {
            int newOption = (selectedLevelOption - 1 + GameConstants.MAX_BATTLE_LEVELS) % GameConstants.MAX_BATTLE_LEVELS;
            int attempts = 0;
            while (!LevelProgressManager.isLevelUnlocked(newOption + 1) && attempts < GameConstants.MAX_BATTLE_LEVELS) {
                newOption = (newOption - 1 + GameConstants.MAX_BATTLE_LEVELS) % GameConstants.MAX_BATTLE_LEVELS;
                attempts++;
            }
            if (LevelProgressManager.isLevelUnlocked(newOption + 1)) {
                selectedLevelOption = newOption;
            }
        }
        if (downPressedOnce) {
            int newOption = (selectedLevelOption + 1) % GameConstants.MAX_BATTLE_LEVELS;
            int attempts = 0;
            while (!LevelProgressManager.isLevelUnlocked(newOption + 1) && attempts < GameConstants.MAX_BATTLE_LEVELS) {
                newOption = (newOption + 1) % GameConstants.MAX_BATTLE_LEVELS;
                attempts++;
            }
            if (LevelProgressManager.isLevelUnlocked(newOption + 1)) {
                selectedLevelOption = newOption;
            }
        }

        if (num1Pressed && LevelProgressManager.isLevelUnlocked(1)) {
            startBattleLevel(1);
            return;
        } else if (num2Pressed && LevelProgressManager.isLevelUnlocked(2)) {
            startBattleLevel(2);
            return;
        } else if (num3Pressed && LevelProgressManager.isLevelUnlocked(3)) {
            startBattleLevel(3);
            return;
        } else if (num4Pressed && LevelProgressManager.isLevelUnlocked(4)) {
            startBattleLevel(4);
            return;
        } else if (num5Pressed && LevelProgressManager.isLevelUnlocked(5)) {
            startBattleLevel(5);
            return;
        }

        if (selectPressedOnce && LevelProgressManager.isLevelUnlocked(selectedLevelOption + 1)) {
            startBattleLevel(selectedLevelOption + 1);
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
                player.activateShield(practiceInvincible ? Long.MAX_VALUE : 8000);
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
                    if (practiceInvincible) {
                        player = new PlayerTank(304, 336);
                        player.activateShield(Long.MAX_VALUE);
                    } else {
                        lives--;
                        if (lives <= 0) {
                            gameState = "GAME_OVER";
                        } else {
                            player = new PlayerTank(304, 464);
                        }
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
        if (gameMode == GameConstants.GameMode.PRACTICE) {
            spawnPracticeEnemies();
            return;
        }

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

    private void spawnPracticeEnemies() {
        long now = System.currentTimeMillis();
        if (enemies.size() < GameConstants.MAX_ENEMIES &&
            now - lastEnemySpawnTime >= GameConstants.ENEMY_SPAWN_DELAY / 2) {

            int spawnX = 64 + (enemiesSpawned % 3) * 224;
            int spawnY = 64;
            int aiLevel = random.nextInt(3) + 1;

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
        if (gameMode == GameConstants.GameMode.PRACTICE) {
            return;
        }

        if (gameMap.isBaseDestroyed()) {
            gameState = "GAME_OVER";
        } else if (gameMode == GameConstants.GameMode.BATTLE) {
            if (gameMap.allTargetsDestroyed()) {
                gameState = "VICTORY";
                LevelProgressManager.completeLevel(level);
            }
        } else {
            if (enemiesKilled >= totalEnemies && enemies.isEmpty()) {
                gameState = "VICTORY";
            }
        }
    }

    private void saveGame() {
        GameSaveData saveData = new GameSaveData(
            gameMode,
            level,
            score,
            lives,
            player.getHealth(),
            enemiesKilled,
            totalEnemies,
            totalTargets,
            destroyedTargets,
            gameState,
            player.getX(),
            player.getY()
        );

        for (com.tankwar.map.Wall wall : gameMap.getWalls()) {
            if (!wall.isActive()) {
                saveData.destroyedWalls.add(new GameSaveData.WallState(
                    wall.getX(),
                    wall.getY(),
                    wall.getType().name()
                ));
            }
        }

        GameSaveManager.saveGame(saveData);
        hasSaveData = true;
    }

    private void loadGame() {
        GameSaveData saveData = GameSaveManager.loadGame();
        if (saveData != null) {
            this.gameMode = saveData.gameMode;
            this.level = saveData.level;
            this.score = saveData.score;
            this.lives = saveData.lives;
            this.enemiesKilled = saveData.enemiesKilled;
            this.totalEnemies = saveData.totalEnemies;
            this.totalTargets = saveData.totalTargets;
            this.destroyedTargets = saveData.destroyedTargets;

            initGameForMode();

            if (saveData.destroyedWalls != null && !saveData.destroyedWalls.isEmpty()) {
                for (GameSaveData.WallState destroyed : saveData.destroyedWalls) {
                    for (com.tankwar.map.Wall wall : gameMap.getWalls()) {
                        if (wall.getX() == destroyed.x && wall.getY() == destroyed.y) {
                            wall.setActive(false);
                        }
                    }
                }
            }

            this.score = saveData.score;
            this.lives = saveData.lives;

            if (saveData.playerX > 0 && saveData.playerY > 0) {
                player.setX(saveData.playerX);
                player.setY(saveData.playerY);
            }

            if (gameMode == GameConstants.GameMode.PRACTICE) {
                player.activateShield(Long.MAX_VALUE);
            }

            if ("PAUSED".equals(saveData.gameState)) {
                this.gameState = "PAUSED";
            } else {
                this.gameState = "PLAYING";
            }
            this.gameStarted = true;
        }
    }

    public void render(GamePanel panel) {
        boolean[] levelUnlocked = new boolean[GameConstants.MAX_BATTLE_LEVELS];
        for (int i = 0; i < GameConstants.MAX_BATTLE_LEVELS; i++) {
            levelUnlocked[i] = LevelProgressManager.isLevelUnlocked(i + 1);
        }
        panel.setGameData(gameMap, player, enemies, bullets, explosions, powerUps,
                          score, lives, totalEnemies - enemiesKilled, totalEnemies, gameState,
                          gameMode, level, totalTargets, destroyedTargets,
                          selectedMenuOption, selectedLevelOption, hasSaveData, levelUnlocked);
        panel.repaint();
    }

    public String getGameState() {
        return gameState;
    }
}
