package com.game.planewar.core;

import com.game.planewar.PlaneWarGame;
import com.game.planewar.data.GameDataManager;
import com.game.planewar.input.InputHandler;
import com.game.planewar.model.Player;
import com.game.planewar.model.enemies.EnemyManager;
import com.game.planewar.model.items.ItemManager;
import com.game.planewar.model.projectiles.ProjectileManager;
import com.game.planewar.model.effects.ExplosionManager;
import com.game.planewar.ui.renderer.GameRenderer;

import java.awt.*;
import java.awt.event.KeyEvent;
import java.util.Random;

public class GameController {
    
    private GameState currentState;
    private GameState previousState;
    
    private InputHandler inputHandler;
    private GameRenderer gameRenderer;
    
    private Player player;
    private EnemyManager enemyManager;
    private ProjectileManager projectileManager;
    private ExplosionManager explosionManager;
    private ItemManager itemManager;
    
    private LevelSystem levelSystem;
    private ScoreSystem scoreSystem;
    private Random random;
    
    private int backgroundOffset;
    private long gameTime;
    private int menuSelectedIndex;
    private String playerNickname;
    private boolean autoShoot;
    private boolean soundEnabled;
    
    public GameController() {
        this.currentState = GameState.MENU;
        this.random = new Random();
        this.menuSelectedIndex = 0;
        this.autoShoot = true;
        this.soundEnabled = true;
        this.backgroundOffset = 0;
    }
    
    public void init() {
        inputHandler = new InputHandler(this);
        gameRenderer = new GameRenderer(this);
        
        projectileManager = new ProjectileManager(this);
        explosionManager = new ExplosionManager(this);
        enemyManager = new EnemyManager(this);
        itemManager = new ItemManager(this);
        
        player = new Player(this);
        levelSystem = new LevelSystem(this);
        scoreSystem = new ScoreSystem(this);
        
        GameDataManager dataManager = PlaneWarGame.getInstance().getDataManager();
        GameDataManager.GameConfig config = dataManager.getConfig();
        if (config != null) {
            this.autoShoot = config.autoShoot;
            this.soundEnabled = config.soundEnabled;
            this.playerNickname = config.lastPlayerName != null ? config.lastPlayerName : "Player";
        } else {
            this.playerNickname = "Player";
        }
    }
    
    public void update() {
        gameTime++;
        
        if (currentState == GameState.MENU) {
            updateMenu();
        } else if (currentState == GameState.PLAYING) {
            updatePlaying();
        } else if (currentState == GameState.PAUSED) {
            updatePaused();
        } else if (currentState == GameState.GAME_OVER) {
            updateGameOver();
        } else if (currentState == GameState.SETTLEMENT) {
            updateSettlement();
        } else if (currentState == GameState.LEADERBOARD) {
            updateLeaderboard();
        } else if (currentState == GameState.SETTINGS) {
            updateSettings();
        }
        
        inputHandler.update();
    }
    
    private void updateMenu() {
        if (inputHandler.isKeyJustPressed(KeyEvent.VK_UP)) {
            menuSelectedIndex = (menuSelectedIndex - 1 + 4) % 4;
        }
        if (inputHandler.isKeyJustPressed(KeyEvent.VK_DOWN)) {
            menuSelectedIndex = (menuSelectedIndex + 1) % 4;
        }
        
        backgroundOffset = (backgroundOffset + 1) % PlaneWarGame.WINDOW_HEIGHT;
    }
    
    private void updatePlaying() {
        backgroundOffset = (backgroundOffset + 2) % PlaneWarGame.WINDOW_HEIGHT;
        
        player.update();
        projectileManager.update();
        enemyManager.update();
        explosionManager.update();
        itemManager.update();
        levelSystem.update();
        
        checkCollisions();
    }
    
    private void updatePaused() {
        if (inputHandler.isKeyJustPressed(KeyEvent.VK_UP)) {
            menuSelectedIndex = (menuSelectedIndex - 1 + 3) % 3;
        }
        if (inputHandler.isKeyJustPressed(KeyEvent.VK_DOWN)) {
            menuSelectedIndex = (menuSelectedIndex + 1) % 3;
        }
    }
    
    private void updateGameOver() {
        if (inputHandler.isKeyJustPressed(KeyEvent.VK_UP)) {
            menuSelectedIndex = (menuSelectedIndex - 1 + 2) % 2;
        }
        if (inputHandler.isKeyJustPressed(KeyEvent.VK_DOWN)) {
            menuSelectedIndex = (menuSelectedIndex + 1) % 2;
        }
    }
    
    private void updateSettlement() {
        if (inputHandler.isKeyJustPressed(KeyEvent.VK_UP)) {
            menuSelectedIndex = (menuSelectedIndex - 1 + 2) % 2;
        }
        if (inputHandler.isKeyJustPressed(KeyEvent.VK_DOWN)) {
            menuSelectedIndex = (menuSelectedIndex + 1) % 2;
        }
    }
    
    private void updateLeaderboard() {
        if (inputHandler.isKeyJustPressed(KeyEvent.VK_ESCAPE)) {
            changeState(GameState.MENU);
        }
    }
    
    private void updateSettings() {
        if (inputHandler.isKeyJustPressed(KeyEvent.VK_UP)) {
            menuSelectedIndex = (menuSelectedIndex - 1 + 4) % 4;
        }
        if (inputHandler.isKeyJustPressed(KeyEvent.VK_DOWN)) {
            menuSelectedIndex = (menuSelectedIndex + 1) % 4;
        }
    }
    
    private void checkCollisions() {
        projectileManager.checkPlayerBulletsWithEnemies();
        projectileManager.checkEnemyBulletsWithPlayer();
        enemyManager.checkEnemiesWithPlayer();
        itemManager.checkItemsWithPlayer();
    }
    
    public void render(Graphics2D g) {
        gameRenderer.render(g);
    }
    
    public void changeState(GameState newState) {
        this.previousState = this.currentState;
        this.currentState = newState;
        this.menuSelectedIndex = 0;
        
        if (newState == GameState.PLAYING && previousState != GameState.PAUSED) {
            restartGame();
        }
    }
    
    public void restartGame() {
        player.reset();
        projectileManager.reset();
        enemyManager.reset();
        explosionManager.reset();
        itemManager.reset();
        levelSystem.reset();
        scoreSystem.reset();
        gameTime = 0;
    }
    
    public void togglePause() {
        if (currentState == GameState.PLAYING) {
            changeState(GameState.PAUSED);
        } else if (currentState == GameState.PAUSED) {
            changeState(GameState.PLAYING);
        }
    }
    
    public void handleEnterKey() {
        if (currentState == GameState.MENU) {
            handleMenuSelection();
        } else if (currentState == GameState.PAUSED) {
            handlePauseSelection();
        } else if (currentState == GameState.GAME_OVER) {
            handleGameOverSelection();
        } else if (currentState == GameState.SETTLEMENT) {
            handleSettlementSelection();
        } else if (currentState == GameState.SETTINGS) {
            handleSettingsSelection();
        }
    }
    
    private void handleMenuSelection() {
        switch (menuSelectedIndex) {
            case 0:
                changeState(GameState.PLAYING);
                break;
            case 1:
                menuSelectedIndex = 0;
                changeState(GameState.LEADERBOARD);
                break;
            case 2:
                menuSelectedIndex = 0;
                changeState(GameState.SETTINGS);
                break;
            case 3:
                PlaneWarGame.getInstance().exit();
                break;
        }
    }
    
    private void handlePauseSelection() {
        switch (menuSelectedIndex) {
            case 0:
                changeState(GameState.PLAYING);
                break;
            case 1:
                changeState(GameState.MENU);
                break;
            case 2:
                PlaneWarGame.getInstance().exit();
                break;
        }
    }
    
    private void handleGameOverSelection() {
        switch (menuSelectedIndex) {
            case 0:
                changeState(GameState.PLAYING);
                break;
            case 1:
                changeState(GameState.MENU);
                break;
        }
    }
    
    private void handleSettlementSelection() {
        switch (menuSelectedIndex) {
            case 0:
                changeState(GameState.PLAYING);
                break;
            case 1:
                changeState(GameState.MENU);
                break;
        }
    }
    
    private void handleSettingsSelection() {
        GameDataManager dataManager = PlaneWarGame.getInstance().getDataManager();
        
        switch (menuSelectedIndex) {
            case 0:
                autoShoot = !autoShoot;
                break;
            case 1:
                soundEnabled = !soundEnabled;
                break;
            case 2:
                dataManager.clearLeaderboard();
                break;
            case 3:
                GameDataManager.GameConfig config = new GameDataManager.GameConfig();
                config.autoShoot = autoShoot;
                config.soundEnabled = soundEnabled;
                config.lastPlayerName = playerNickname;
                dataManager.setConfig(config);
                dataManager.saveAll();
                changeState(GameState.MENU);
                break;
        }
    }
    
    public void handleMouseClick(int x, int y) {
        gameRenderer.handleMouseClick(x, y);
    }
    
    public void handleKeyTyped(char c) {
        gameRenderer.handleKeyTyped(c);
    }
    
    public void gameOver() {
        changeState(GameState.SETTLEMENT);
        
        GameDataManager dataManager = PlaneWarGame.getInstance().getDataManager();
        dataManager.addScore(playerNickname, scoreSystem.getScore());
        dataManager.saveAll();
    }
    
    public void useScreenClearBomb() {
        enemyManager.destroyAllEnemies();
        projectileManager.clearEnemyBullets();
        explosionManager.createScreenClearEffect();
    }
    
    public InputHandler getInputHandler() { return inputHandler; }
    public GameState getCurrentState() { return currentState; }
    public GameState getPreviousState() { return previousState; }
    public Player getPlayer() { return player; }
    public EnemyManager getEnemyManager() { return enemyManager; }
    public ProjectileManager getProjectileManager() { return projectileManager; }
    public ExplosionManager getExplosionManager() { return explosionManager; }
    public ItemManager getItemManager() { return itemManager; }
    public LevelSystem getLevelSystem() { return levelSystem; }
    public ScoreSystem getScoreSystem() { return scoreSystem; }
    public Random getRandom() { return random; }
    public int getBackgroundOffset() { return backgroundOffset; }
    public long getGameTime() { return gameTime; }
    public int getMenuSelectedIndex() { return menuSelectedIndex; }
    public void setMenuSelectedIndex(int index) { this.menuSelectedIndex = index; }
    public String getPlayerNickname() { return playerNickname; }
    public void setPlayerNickname(String nickname) { this.playerNickname = nickname; }
    public boolean isAutoShoot() { return autoShoot; }
    public boolean isSoundEnabled() { return soundEnabled; }
    public GameRenderer getGameRenderer() { return gameRenderer; }
    
    public com.game.planewar.data.GameDataManager getDataManager() {
        return com.game.planewar.PlaneWarGame.getInstance().getDataManager();
    }
}
