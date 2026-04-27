package com.game.planewar.ui.renderer;

import com.game.planewar.PlaneWarGame;
import com.game.planewar.core.GameController;
import com.game.planewar.core.GameState;
import com.game.planewar.model.Player;

import java.awt.*;
import java.awt.geom.Rectangle2D;
import java.util.List;

/**
 * 游戏渲染器 - 负责所有UI和游戏画面的渲染
 */
public class GameRenderer {
    
    private final GameController gameController;
    private MenuRenderer menuRenderer;
    private GameUIRenderer gameUIRenderer;
    private PauseRenderer pauseRenderer;
    private GameOverRenderer gameOverRenderer;
    private SettlementRenderer settlementRenderer;
    private LeaderboardRenderer leaderboardRenderer;
    private SettingsRenderer settingsRenderer;
    
    public GameRenderer(GameController gameController) {
        this.gameController = gameController;
        initRenderers();
    }
    
    /**
     * 初始化各状态渲染器
     */
    private void initRenderers() {
        this.menuRenderer = new MenuRenderer(gameController);
        this.gameUIRenderer = new GameUIRenderer(gameController);
        this.pauseRenderer = new PauseRenderer(gameController);
        this.gameOverRenderer = new GameOverRenderer(gameController);
        this.settlementRenderer = new SettlementRenderer(gameController);
        this.leaderboardRenderer = new LeaderboardRenderer(gameController);
        this.settingsRenderer = new SettingsRenderer(gameController);
    }
    
    /**
     * 主渲染方法
     */
    public void render(Graphics2D g) {
        GameState state = gameController.getCurrentState();
        
        switch (state) {
            case MENU:
                renderMenu(g);
                break;
            case PLAYING:
                renderPlaying(g);
                break;
            case PAUSED:
                renderPaused(g);
                break;
            case GAME_OVER:
                renderGameOver(g);
                break;
            case SETTLEMENT:
                renderSettlement(g);
                break;
            case LEADERBOARD:
                renderLeaderboard(g);
                break;
            case SETTINGS:
                renderSettings(g);
                break;
        }
    }
    
    /**
     * 渲染主菜单
     */
    private void renderMenu(Graphics2D g) {
        renderBackground(g);
        menuRenderer.render(g);
    }
    
    /**
     * 渲染游戏进行中
     */
    private void renderPlaying(Graphics2D g) {
        renderBackground(g);
        renderGameObjects(g);
        gameUIRenderer.render(g);
    }
    
    /**
     * 渲染暂停
     */
    private void renderPaused(Graphics2D g) {
        renderBackground(g);
        renderGameObjects(g);
        gameUIRenderer.render(g);
        
        g.setColor(new Color(0, 0, 0, 150));
        g.fillRect(0, 0, PlaneWarGame.WINDOW_WIDTH, PlaneWarGame.WINDOW_HEIGHT);
        
        pauseRenderer.render(g);
    }
    
    /**
     * 渲染游戏结束
     */
    private void renderGameOver(Graphics2D g) {
        renderBackground(g);
        gameOverRenderer.render(g);
    }
    
    /**
     * 渲染结算
     */
    private void renderSettlement(Graphics2D g) {
        renderBackground(g);
        settlementRenderer.render(g);
    }
    
    /**
     * 渲染排行榜
     */
    private void renderLeaderboard(Graphics2D g) {
        renderBackground(g);
        leaderboardRenderer.render(g);
    }
    
    /**
     * 渲染设置
     */
    private void renderSettings(Graphics2D g) {
        renderBackground(g);
        settingsRenderer.render(g);
    }
    
    /**
     * 渲染滚动背景
     */
    private void renderBackground(Graphics2D g) {
        int offset = gameController.getBackgroundOffset();
        
        g.setColor(new Color(10, 10, 40));
        g.fillRect(0, 0, PlaneWarGame.WINDOW_WIDTH, PlaneWarGame.WINDOW_HEIGHT);
        
        g.setColor(Color.WHITE);
        drawStars(g, offset);
        drawStars(g, offset - PlaneWarGame.WINDOW_HEIGHT);
        
        g.setColor(new Color(50, 50, 80, 50));
        g.fillRect(0, 0, PlaneWarGame.WINDOW_WIDTH, 2);
        g.fillRect(0, PlaneWarGame.WINDOW_HEIGHT - 2, PlaneWarGame.WINDOW_WIDTH, 2);
    }
    
    /**
     * 绘制星星
     */
    private void drawStars(Graphics2D g, int yOffset) {
        int seed = 42;
        java.util.Random random = new java.util.Random(seed);
        
        for (int i = 0; i < 50; i++) {
            int x = random.nextInt(PlaneWarGame.WINDOW_WIDTH);
            int y = random.nextInt(PlaneWarGame.WINDOW_HEIGHT) + yOffset;
            int size = random.nextInt(3) + 1;
            float alpha = 0.3f + random.nextFloat() * 0.7f;
            
            g.setColor(new Color(1.0f, 1.0f, 1.0f, alpha));
            g.fillOval(x, y, size, size);
        }
    }
    
    /**
     * 渲染所有游戏对象
     */
    private void renderGameObjects(Graphics2D g) {
        gameController.getEnemyManager().render(g);
        gameController.getPlayer().render(g);
        gameController.getProjectileManager().render(g);
        gameController.getItemManager().render(g);
        gameController.getExplosionManager().render(g);
    }
    
    /**
     * 处理鼠标点击
     */
    public void handleMouseClick(int x, int y) {
        GameState state = gameController.getCurrentState();
        
        switch (state) {
            case MENU:
                menuRenderer.handleMouseClick(x, y);
                break;
            case PAUSED:
                pauseRenderer.handleMouseClick(x, y);
                break;
            case SETTLEMENT:
                settlementRenderer.handleMouseClick(x, y);
                break;
            case LEADERBOARD:
                leaderboardRenderer.handleMouseClick(x, y);
                break;
            case SETTINGS:
                settingsRenderer.handleMouseClick(x, y);
                break;
        }
    }
    
    /**
     * 处理键盘输入字符
     */
    public void handleKeyTyped(char c) {
        GameState state = gameController.getCurrentState();
        
        if (state == GameState.SETTLEMENT) {
            settlementRenderer.handleKeyTyped(c);
        }
    }
}
