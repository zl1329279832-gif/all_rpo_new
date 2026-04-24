package com.breakout.ui;

import com.breakout.config.GameConfig;
import com.breakout.engine.GameEngine;
import com.breakout.engine.GameState;
import com.breakout.entity.Ball;
import com.breakout.entity.Brick;
import com.breakout.input.InputHandler;
import com.breakout.level.Level;

import javax.swing.*;
import java.awt.*;
import java.awt.image.BufferedImage;

public class GamePanel extends JPanel implements Runnable, GameEngine.GameStateListener {
    private final GameEngine gameEngine;
    private final InputHandler inputHandler;
    private Thread gameThread;
    private boolean running;
    
    private BufferedImage bufferImage;
    private Graphics2D bufferGraphics;
    
    private int selectedMenuOption;
    private String[] menuOptions;
    private int finalScore;
    private int finalLevel;

    public GamePanel() {
        this.gameEngine = new GameEngine();
        this.gameEngine.setStateListener(this);
        this.inputHandler = new InputHandler();
        
        setPreferredSize(new Dimension(GameConfig.WINDOW_WIDTH, GameConfig.WINDOW_HEIGHT));
        setBackground(GameConfig.Colors.BACKGROUND);
        setFocusable(true);
        addKeyListener(inputHandler);
        
        this.menuOptions = new String[]{"开始游戏", "游戏说明", "退出游戏"};
        this.selectedMenuOption = 0;
        this.running = false;
    }

    public void startGame() {
        if (gameThread == null || !running) {
            running = true;
            gameThread = new Thread(this);
            gameThread.start();
        }
    }

    public void stopGame() {
        running = false;
        gameEngine.setRunning(false);
        if (gameThread != null) {
            try {
                gameThread.join();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
    }

    @Override
    public void run() {
        while (running) {
            processInput();
            update();
            render();
            
            try {
                Thread.sleep(1000 / GameConfig.FPS);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }
    }

    private void processInput() {
        GameState currentState = gameEngine.getCurrentState();
        
        switch (currentState) {
            case MENU -> processMenuInput();
            case PLAYING, PAUSED, GAME_OVER, LEVEL_COMPLETE, VICTORY -> {
                gameEngine.handleInput(inputHandler);
            }
        }
        
        inputHandler.update();
    }

    private void processMenuInput() {
        if (inputHandler.isMenuUp()) {
            selectedMenuOption = (selectedMenuOption - 1 + menuOptions.length) % menuOptions.length;
        }
        if (inputHandler.isMenuDown()) {
            selectedMenuOption = (selectedMenuOption + 1) % menuOptions.length;
        }
        if (inputHandler.isMenuSelect() || inputHandler.isStart()) {
            executeMenuOption();
        }
    }

    private void executeMenuOption() {
        switch (selectedMenuOption) {
            case 0 -> gameEngine.startGame();
            case 1 -> showHelpDialog();
            case 2 -> System.exit(0);
        }
    }

    private void showHelpDialog() {
        String helpText = """
            【游戏操作】
            ← / A : 向左移动挡板
            → / D : 向右移动挡板
            空格 : 发射小球
            ESC / P : 暂停游戏
            R : 重新开始游戏
            Q : 返回主菜单
            
            【道具说明】
            + : 挡板变长
            - : 挡板变短
            >> : 小球加速
            << : 小球减速
            ♥ : 额外生命
            ✦ : 穿透球
            ●● : 多球
            C : 接球模式
            
            【砖块说明】
            绿色 : 普通砖块（1次击打）
            橙色 : 2血砖块（2次击打）
            红色 : 3血砖块（3次击打）
            金色 : 高分砖块
            灰色 : 不可破坏砖块
            """;
        
        JOptionPane.showMessageDialog(this, helpText, "游戏说明", JOptionPane.INFORMATION_MESSAGE);
    }

    private void update() {
        gameEngine.update();
    }

    private void render() {
        if (bufferImage == null || bufferImage.getWidth() != getWidth() || bufferImage.getHeight() != getHeight()) {
            bufferImage = new BufferedImage(getWidth(), getHeight(), BufferedImage.TYPE_INT_ARGB);
            bufferGraphics = bufferImage.createGraphics();
            bufferGraphics.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            bufferGraphics.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        }

        bufferGraphics.setColor(GameConfig.Colors.BACKGROUND);
        bufferGraphics.fillRect(0, 0, getWidth(), getHeight());

        GameState currentState = gameEngine.getCurrentState();
        
        switch (currentState) {
            case MENU -> renderMenu(bufferGraphics);
            case PLAYING, PAUSED -> renderGame(bufferGraphics);
            case GAME_OVER -> renderGameOver(bufferGraphics);
            case LEVEL_COMPLETE -> renderLevelComplete(bufferGraphics);
            case VICTORY -> renderVictory(bufferGraphics);
        }

        Graphics g = getGraphics();
        if (g != null) {
            g.drawImage(bufferImage, 0, 0, null);
            g.dispose();
        }
    }

    private void renderMenu(Graphics2D g2d) {
        renderBackgroundParticles(g2d);
        
        g2d.setColor(GameConfig.Colors.TEXT_HIGHLIGHT);
        g2d.setFont(GameConfig.Fonts.TITLE);
        String title = "BREAKOUT";
        FontMetrics fm = g2d.getFontMetrics();
        int titleX = (getWidth() - fm.stringWidth(title)) / 2;
        int titleY = 120;
        
        g2d.setColor(new Color(255, 215, 0, 50));
        g2d.fillRoundRect(titleX - 30, titleY - fm.getAscent() - 10, fm.stringWidth(title) + 60, fm.getHeight() + 20, 20, 20);
        
        g2d.setColor(GameConfig.Colors.TEXT_HIGHLIGHT);
        g2d.drawString(title, titleX, titleY);

        g2d.setColor(GameConfig.Colors.TEXT);
        g2d.setFont(GameConfig.Fonts.MENU);
        fm = g2d.getFontMetrics();
        
        int startY = 250;
        int spacing = 60;
        
        for (int i = 0; i < menuOptions.length; i++) {
            String option = menuOptions[i];
            int x = (getWidth() - fm.stringWidth(option)) / 2;
            int y = startY + i * spacing;
            
            if (i == selectedMenuOption) {
                g2d.setColor(GameConfig.Colors.TEXT_HIGHLIGHT);
                g2d.fillRoundRect(x - 30, y - fm.getAscent() - 5, fm.stringWidth(option) + 60, fm.getHeight() + 10, 10, 10);
                g2d.setColor(new Color(20, 20, 40));
            } else {
                g2d.setColor(GameConfig.Colors.TEXT);
            }
            
            g2d.drawString(option, x, y);
        }

        g2d.setColor(new Color(150, 150, 150));
        g2d.setFont(GameConfig.Fonts.SMALL);
        String hint = "使用 ↑↓ 选择，Enter 确认";
        fm = g2d.getFontMetrics();
        g2d.drawString(hint, (getWidth() - fm.stringWidth(hint)) / 2, getHeight() - 50);
    }

    private void renderGame(Graphics2D g2d) {
        renderBackgroundParticles(g2d);
        renderHUD(g2d);
        
        Level currentLevel = gameEngine.getLevelManager().getCurrentLevel();
        if (currentLevel != null) {
            for (Brick brick : currentLevel.getBricks()) {
                brick.render(g2d);
            }
        }
        
        gameEngine.getPowerupManager().render(g2d);
        
        gameEngine.getPaddle().render(g2d);
        
        for (Ball ball : gameEngine.getBalls()) {
            ball.render(g2d);
        }
        
        if (!gameEngine.isBallLaunched() && gameEngine.getCurrentState() == GameState.PLAYING) {
            g2d.setColor(new Color(255, 255, 255, 200));
            g2d.setFont(GameConfig.Fonts.HUD);
            String message = "按 空格 发射小球";
            FontMetrics fm = g2d.getFontMetrics();
            g2d.drawString(message, (getWidth() - fm.stringWidth(message)) / 2, getHeight() / 2 + 100);
        }
        
        if (gameEngine.getCurrentState() == GameState.PAUSED) {
            renderPauseOverlay(g2d);
        }
    }

    private void renderHUD(Graphics2D g2d) {
        g2d.setColor(new Color(30, 30, 50, 200));
        g2d.fillRect(0, 0, getWidth(), 35);
        
        g2d.setColor(GameConfig.Colors.TEXT);
        g2d.setFont(GameConfig.Fonts.HUD);
        FontMetrics fm = g2d.getFontMetrics();
        
        String scoreText = "分数: " + gameEngine.getScore();
        int scoreX = 20;
        int scoreY = 25;
        g2d.drawString(scoreText, scoreX, scoreY);
        
        String levelText = "关卡: " + gameEngine.getLevelManager().getCurrentLevelNumber();
        int levelX = (getWidth() - fm.stringWidth(levelText)) / 2;
        g2d.drawString(levelText, levelX, scoreY);
        
        g2d.drawString("生命: ", getWidth() - 120, scoreY);
        int startX = getWidth() - 60;
        for (int i = 0; i < gameEngine.getLives(); i++) {
            g2d.setColor(new Color(255, 100, 100));
            g2d.fillOval(startX + i * 25, 8, 18, 18);
            g2d.setColor(new Color(255, 50, 50, 150));
            g2d.fillOval(startX + i * 25 + 3, 11, 12, 12);
        }
    }

    private void renderPauseOverlay(Graphics2D g2d) {
        g2d.setColor(new Color(0, 0, 0, 150));
        g2d.fillRect(0, 0, getWidth(), getHeight());
        
        g2d.setColor(GameConfig.Colors.TEXT_HIGHLIGHT);
        g2d.setFont(GameConfig.Fonts.GAME_OVER);
        String pauseText = "游戏暂停";
        FontMetrics fm = g2d.getFontMetrics();
        g2d.drawString(pauseText, (getWidth() - fm.stringWidth(pauseText)) / 2, getHeight() / 2 - 50);
        
        g2d.setColor(GameConfig.Colors.TEXT);
        g2d.setFont(GameConfig.Fonts.MENU);
        fm = g2d.getFontMetrics();
        
        String resumeText = "按 ESC 或 空格 继续";
        g2d.drawString(resumeText, (getWidth() - fm.stringWidth(resumeText)) / 2, getHeight() / 2 + 20);
        
        String restartText = "按 R 重新开始";
        g2d.drawString(restartText, (getWidth() - fm.stringWidth(restartText)) / 2, getHeight() / 2 + 70);
    }

    private void renderGameOver(Graphics2D g2d) {
        renderBackgroundParticles(g2d);
        
        g2d.setColor(new Color(0, 0, 0, 180));
        g2d.fillRect(0, 0, getWidth(), getHeight());
        
        g2d.setColor(new Color(255, 80, 80));
        g2d.setFont(GameConfig.Fonts.GAME_OVER);
        String title = "游戏结束";
        FontMetrics fm = g2d.getFontMetrics();
        g2d.drawString(title, (getWidth() - fm.stringWidth(title)) / 2, getHeight() / 2 - 100);
        
        g2d.setColor(GameConfig.Colors.TEXT);
        g2d.setFont(GameConfig.Fonts.MENU);
        fm = g2d.getFontMetrics();
        
        String scoreText = "最终分数: " + gameEngine.getScore();
        g2d.drawString(scoreText, (getWidth() - fm.stringWidth(scoreText)) / 2, getHeight() / 2 - 20);
        
        String levelText = "到达关卡: " + gameEngine.getLevelManager().getCurrentLevelNumber();
        g2d.drawString(levelText, (getWidth() - fm.stringWidth(levelText)) / 2, getHeight() / 2 + 30);
        
        g2d.setColor(new Color(150, 150, 150));
        g2d.setFont(GameConfig.Fonts.SMALL);
        fm = g2d.getFontMetrics();
        
        String hint1 = "按 空格 或 R 重新开始";
        g2d.drawString(hint1, (getWidth() - fm.stringWidth(hint1)) / 2, getHeight() / 2 + 100);
        
        String hint2 = "按 Q 返回主菜单";
        g2d.drawString(hint2, (getWidth() - fm.stringWidth(hint2)) / 2, getHeight() / 2 + 130);
    }

    private void renderLevelComplete(Graphics2D g2d) {
        renderBackgroundParticles(g2d);
        renderGame(g2d);
        
        g2d.setColor(new Color(0, 0, 0, 180));
        g2d.fillRect(0, 0, getWidth(), getHeight());
        
        g2d.setColor(GameConfig.Colors.TEXT_HIGHLIGHT);
        g2d.setFont(GameConfig.Fonts.GAME_OVER);
        String title = "关卡完成!";
        FontMetrics fm = g2d.getFontMetrics();
        g2d.drawString(title, (getWidth() - fm.stringWidth(title)) / 2, getHeight() / 2 - 80);
        
        g2d.setColor(GameConfig.Colors.TEXT);
        g2d.setFont(GameConfig.Fonts.MENU);
        fm = g2d.getFontMetrics();
        
        String levelName = gameEngine.getLevelManager().getCurrentLevelName();
        g2d.drawString(levelName, (getWidth() - fm.stringWidth(levelName)) / 2, getHeight() / 2 - 10);
        
        String bonusText = "奖励分数: +" + GameConfig.SCORE_LEVEL_COMPLETE;
        g2d.drawString(bonusText, (getWidth() - fm.stringWidth(bonusText)) / 2, getHeight() / 2 + 40);
        
        g2d.setColor(new Color(150, 150, 150));
        g2d.setFont(GameConfig.Fonts.SMALL);
        fm = g2d.getFontMetrics();
        
        String hint = "按 空格 或 Enter 进入下一关";
        g2d.drawString(hint, (getWidth() - fm.stringWidth(hint)) / 2, getHeight() / 2 + 100);
    }

    private void renderVictory(Graphics2D g2d) {
        renderBackgroundParticles(g2d);
        
        g2d.setColor(new Color(0, 30, 0, 180));
        g2d.fillRect(0, 0, getWidth(), getHeight());
        
        g2d.setColor(new Color(100, 255, 100));
        g2d.setFont(GameConfig.Fonts.TITLE);
        String title = "恭喜通关!";
        FontMetrics fm = g2d.getFontMetrics();
        g2d.drawString(title, (getWidth() - fm.stringWidth(title)) / 2, getHeight() / 2 - 120);
        
        g2d.setColor(GameConfig.Colors.TEXT_HIGHLIGHT);
        g2d.setFont(GameConfig.Fonts.GAME_OVER);
        String subTitle = "你是真正的打砖块大师!";
        fm = g2d.getFontMetrics();
        g2d.drawString(subTitle, (getWidth() - fm.stringWidth(subTitle)) / 2, getHeight() / 2 - 50);
        
        g2d.setColor(GameConfig.Colors.TEXT);
        g2d.setFont(GameConfig.Fonts.MENU);
        fm = g2d.getFontMetrics();
        
        String scoreText = "最终分数: " + gameEngine.getScore();
        g2d.drawString(scoreText, (getWidth() - fm.stringWidth(scoreText)) / 2, getHeight() / 2 + 30);
        
        g2d.setColor(new Color(150, 150, 150));
        g2d.setFont(GameConfig.Fonts.SMALL);
        fm = g2d.getFontMetrics();
        
        String hint1 = "按 空格 或 R 重新挑战";
        g2d.drawString(hint1, (getWidth() - fm.stringWidth(hint1)) / 2, getHeight() / 2 + 100);
        
        String hint2 = "按 Q 返回主菜单";
        g2d.drawString(hint2, (getWidth() - fm.stringWidth(hint2)) / 2, getHeight() / 2 + 130);
    }

    private void renderBackgroundParticles(Graphics2D g2d) {
        int particleCount = 30;
        for (int i = 0; i < particleCount; i++) {
            int x = (int) (System.currentTimeMillis() * 0.01 + i * 100) % getWidth();
            int y = (i * 50 + (int) (System.currentTimeMillis() * 0.005)) % getHeight();
            int size = (i % 3) + 1;
            
            int alpha = 30 + (i % 20);
            g2d.setColor(new Color(100, 150, 255, alpha));
            g2d.fillOval(x, y, size, size);
        }
    }

    @Override
    public void onStateChange(GameState newState) {
        selectedMenuOption = 0;
    }

    @Override
    public void onScoreChange(int newScore) {
    }

    @Override
    public void onLivesChange(int newLives) {
    }

    @Override
    public void onLevelChange(int newLevel) {
    }

    public GameEngine getGameEngine() {
        return gameEngine;
    }
}
