package com.tankwar.ui;

import com.tankwar.entity.*;
import com.tankwar.map.GameMap;
import com.tankwar.util.GameConstants;

import javax.swing.*;
import java.awt.*;
import java.util.List;

public class GamePanel extends JPanel {
    private GameMap gameMap;
    private PlayerTank player;
    private List<EnemyTank> enemies;
    private List<Bullet> bullets;
    private List<Explosion> explosions;
    private List<PowerUp> powerUps;
    private int score;
    private int lives;
    private int enemiesLeft;
    private int enemiesTotal;
    private String gameState;

    private GameConstants.GameMode gameMode;
    private int level;
    private int totalTargets;
    private int destroyedTargets;
    private int selectedMenuOption;
    private int selectedLevelOption;
    private boolean hasSaveData;

    public GamePanel() {
        setPreferredSize(new Dimension(GameConstants.SCREEN_WIDTH, GameConstants.SCREEN_HEIGHT));
        setFocusable(true);
        setBackground(Color.BLACK);
    }

    public void setGameData(GameMap map, PlayerTank player, List<EnemyTank> enemies,
                            List<Bullet> bullets, List<Explosion> explosions, List<PowerUp> powerUps,
                            int score, int lives, int enemiesLeft, int enemiesTotal, String gameState) {
        this.gameMap = map;
        this.player = player;
        this.enemies = enemies;
        this.bullets = bullets;
        this.explosions = explosions;
        this.powerUps = powerUps;
        this.score = score;
        this.lives = lives;
        this.enemiesLeft = enemiesLeft;
        this.enemiesTotal = enemiesTotal;
        this.gameState = gameState;
    }

    public void setGameData(GameMap map, PlayerTank player, List<EnemyTank> enemies,
                            List<Bullet> bullets, List<Explosion> explosions, List<PowerUp> powerUps,
                            int score, int lives, int enemiesLeft, int enemiesTotal, String gameState,
                            GameConstants.GameMode gameMode, int level, int totalTargets, int destroyedTargets,
                            int selectedMenuOption, int selectedLevelOption, boolean hasSaveData) {
        this.gameMap = map;
        this.player = player;
        this.enemies = enemies;
        this.bullets = bullets;
        this.explosions = explosions;
        this.powerUps = powerUps;
        this.score = score;
        this.lives = lives;
        this.enemiesLeft = enemiesLeft;
        this.enemiesTotal = enemiesTotal;
        this.gameState = gameState;
        this.gameMode = gameMode;
        this.level = level;
        this.totalTargets = totalTargets;
        this.destroyedTargets = destroyedTargets;
        this.selectedMenuOption = selectedMenuOption;
        this.selectedLevelOption = selectedLevelOption;
        this.hasSaveData = hasSaveData;
    }

    @Override
    protected void paintComponent(Graphics g) {
        super.paintComponent(g);

        Graphics2D g2d = (Graphics2D) g;
        g2d.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_SPEED);

        if ("MENU".equals(gameState)) {
            drawMenu(g);
            return;
        }

        if ("LEVEL_SELECT".equals(gameState)) {
            drawLevelSelect(g);
            return;
        }

        drawBackground(g);

        if (gameMap != null) {
            drawWalls(g, gameMap.getWalls());
        }

        if (powerUps != null) {
            for (PowerUp powerUp : powerUps) {
                powerUp.draw(g);
            }
        }

        if (enemies != null) {
            for (EnemyTank enemy : enemies) {
                enemy.draw(g);
            }
        }

        if (player != null) {
            player.draw(g);
        }

        if (bullets != null) {
            for (Bullet bullet : bullets) {
                bullet.draw(g);
            }
        }

        if (explosions != null) {
            for (Explosion explosion : explosions) {
                explosion.draw(g);
            }
        }

        if (gameMap != null) {
            drawGrassOnTop(g, gameMap.getWalls());
        }

        drawUI(g);

        if (gameState != null && !gameState.equals("PLAYING")) {
            drawOverlay(g, gameState);
        }
    }

    private void drawMenu(Graphics g) {
        g.setColor(new Color(20, 20, 30));
        g.fillRect(0, 0, GameConstants.SCREEN_WIDTH, GameConstants.SCREEN_HEIGHT);

        g.setColor(Color.WHITE);
        g.setFont(new Font("微软雅黑", Font.BOLD, 48));
        String title = "像素坦克大战";
        FontMetrics fm = g.getFontMetrics();
        int x = (GameConstants.SCREEN_WIDTH - fm.stringWidth(title)) / 2;
        g.drawString(title, x, 150);

        String[] options;
        String[] hints;

        if (hasSaveData) {
            options = new String[]{"练习模式", "对战模式", "继续游戏"};
            hints = new String[]{"按 1 或 回车选择", "按 2 或 回车选择", "按 3 或 回车选择"};
        } else {
            options = new String[]{"练习模式", "对战模式"};
            hints = new String[]{"按 1 或 回车选择", "按 2 或 回车选择"};
        }

        for (int i = 0; i < options.length; i++) {
            if (i == selectedMenuOption) {
                g.setColor(new Color(100, 200, 255));
                g.setFont(new Font("微软雅黑", Font.BOLD, 28));
            } else {
                g.setColor(Color.LIGHT_GRAY);
                g.setFont(new Font("微软雅黑", Font.PLAIN, 24));
            }

            FontMetrics fmOpt = g.getFontMetrics();
            int optX = (GameConstants.SCREEN_WIDTH - fmOpt.stringWidth(options[i])) / 2;
            g.drawString(options[i], optX, 250 + i * 60);

            if (i == selectedMenuOption) {
                g.setColor(new Color(100, 200, 255));
                g.fillRect(optX - 40, 235 + i * 60, 10, 10);
                g.fillRect(optX + fmOpt.stringWidth(options[i]) + 30, 235 + i * 60, 10, 10);
            }
        }

        g.setColor(Color.GRAY);
        g.setFont(new Font("微软雅黑", Font.PLAIN, 16));
        String hint = "使用 ↑↓ 键选择，按 回车 或 数字键 确认";
        FontMetrics fmh = g.getFontMetrics();
        g.drawString(hint, (GameConstants.SCREEN_WIDTH - fmh.stringWidth(hint)) / 2, 480);
    }

    private void drawLevelSelect(Graphics g) {
        g.setColor(new Color(20, 20, 30));
        g.fillRect(0, 0, GameConstants.SCREEN_WIDTH, GameConstants.SCREEN_HEIGHT);

        g.setColor(Color.WHITE);
        g.setFont(new Font("微软雅黑", Font.BOLD, 36));
        String title = "选择关卡";
        FontMetrics fm = g.getFontMetrics();
        int x = (GameConstants.SCREEN_WIDTH - fm.stringWidth(title)) / 2;
        g.drawString(title, x, 100);

        String[] levels = {
            "关卡 1 - 初学者",
            "关卡 2 - 简单",
            "关卡 3 - 普通",
            "关卡 4 - 困难",
            "关卡 5 - 专家"
        };

        int[] targetCounts = {8, 11, 14, 17, 20};

        for (int i = 0; i < levels.length; i++) {
            if (i == selectedLevelOption) {
                g.setColor(new Color(100, 200, 255));
                g.setFont(new Font("微软雅黑", Font.BOLD, 24));
            } else {
                g.setColor(Color.LIGHT_GRAY);
                g.setFont(new Font("微软雅黑", Font.PLAIN, 20));
            }

            FontMetrics fmOpt = g.getFontMetrics();
            int optX = (GameConstants.SCREEN_WIDTH - fmOpt.stringWidth(levels[i])) / 2;
            g.drawString(levels[i], optX, 170 + i * 55);

            if (i == selectedLevelOption) {
                g.setColor(new Color(100, 200, 255));
                g.fillRect(optX - 40, 155 + i * 55, 10, 10);
                g.fillRect(optX + fmOpt.stringWidth(levels[i]) + 30, 155 + i * 55, 10, 10);
            }

            g.setColor(Color.GRAY);
            g.setFont(new Font("微软雅黑", Font.PLAIN, 14));
            String targetInfo = "目标数量: " + targetCounts[i];
            g.drawString(targetInfo, optX + 5, 190 + i * 55);
        }

        g.setColor(Color.GRAY);
        g.setFont(new Font("微软雅黑", Font.PLAIN, 16));
        String hint = "使用 ↑↓ 键选择，按 回车 或 数字键(1-5) 开始";
        FontMetrics fmh = g.getFontMetrics();
        g.drawString(hint, (GameConstants.SCREEN_WIDTH - fmh.stringWidth(hint)) / 2, 480);

        g.setFont(new Font("微软雅黑", Font.PLAIN, 14));
        String hint2 = "按 R 键返回主菜单";
        FontMetrics fmh2 = g.getFontMetrics();
        g.drawString(hint2, (GameConstants.SCREEN_WIDTH - fmh2.stringWidth(hint2)) / 2, 510);
    }

    private void drawBackground(Graphics g) {
        g.setColor(new Color(30, 30, 35));
        g.fillRect(0, 0, GameConstants.SCREEN_WIDTH, GameConstants.GAME_HEIGHT);
        g.setColor(new Color(40, 40, 45));
        for (int x = 0; x < GameConstants.SCREEN_WIDTH; x += 32) {
            for (int y = 0; y < GameConstants.GAME_HEIGHT; y += 32) {
                if ((x / 32 + y / 32) % 2 == 0) {
                    g.fillRect(x, y, 32, 32);
                }
            }
        }
    }

    private void drawWalls(Graphics g, List<com.tankwar.map.Wall> walls) {
        for (com.tankwar.map.Wall wall : walls) {
            if (wall.getType() != com.tankwar.map.Wall.Type.GRASS) {
                wall.draw(g);
            }
        }
    }

    private void drawGrassOnTop(Graphics g, List<com.tankwar.map.Wall> walls) {
        for (com.tankwar.map.Wall wall : walls) {
            if (wall.getType() == com.tankwar.map.Wall.Type.GRASS) {
                wall.draw(g);
            }
        }
    }

    private void drawUI(Graphics g) {
        g.setColor(new Color(50, 50, 60));
        g.fillRect(0, GameConstants.GAME_HEIGHT, GameConstants.SCREEN_WIDTH, 80);
        g.setColor(new Color(80, 80, 90));
        g.drawLine(0, GameConstants.GAME_HEIGHT, GameConstants.SCREEN_WIDTH, GameConstants.GAME_HEIGHT);

        g.setColor(Color.WHITE);
        g.setFont(new Font("微软雅黑", Font.BOLD, 16));
        g.drawString("得分: " + score, 20, GameConstants.GAME_HEIGHT + 35);
        g.drawString("生命: " + lives, 20, GameConstants.GAME_HEIGHT + 60);

        if (gameMap != null) {
            g.drawString("关卡: " + gameMap.getLevel(), 180, GameConstants.GAME_HEIGHT + 35);
        }

        if (gameMode == GameConstants.GameMode.BATTLE) {
            g.setColor(new Color(255, 100, 100));
            g.drawString("目标: " + destroyedTargets + "/" + totalTargets, 180, GameConstants.GAME_HEIGHT + 60);
        } else {
            g.drawString("敌人: " + enemiesLeft + "/" + enemiesTotal, 180, GameConstants.GAME_HEIGHT + 60);
        }

        g.setFont(new Font("微软雅黑", Font.PLAIN, 12));
        g.setColor(Color.LIGHT_GRAY);
        g.drawString("WASD/方向键 - 移动 | 空格/CTRL - 射击", 380, GameConstants.GAME_HEIGHT + 35);
        g.drawString("ESC/P - 暂停 | R - 返回菜单", 380, GameConstants.GAME_HEIGHT + 55);

        if (gameMode != null) {
            g.setColor(new Color(100, 200, 255));
            g.setFont(new Font("微软雅黑", Font.BOLD, 14));
            String modeText = gameMode == GameConstants.GameMode.BATTLE ? "对战模式" : "练习模式";
            g.drawString(modeText, 320, GameConstants.GAME_HEIGHT + 35);
        }

        drawHealthBar(g);
    }

    private void drawHealthBar(Graphics g) {
        if (player == null) return;

        int barWidth = 100;
        int barHeight = 12;
        int barX = 380;
        int barY = GameConstants.GAME_HEIGHT + 10;

        g.setColor(Color.DARK_GRAY);
        g.fillRect(barX, barY, barWidth, barHeight);

        float healthPercent = (float) player.getHealth() / 3.0f;
        Color healthColor;
        if (healthPercent > 0.6f) {
            healthColor = Color.GREEN;
        } else if (healthPercent > 0.3f) {
            healthColor = Color.YELLOW;
        } else {
            healthColor = Color.RED;
        }

        g.setColor(healthColor);
        g.fillRect(barX, barY, (int) (barWidth * healthPercent), barHeight);

        g.setColor(Color.WHITE);
        g.drawRect(barX, barY, barWidth, barHeight);

        g.setColor(Color.LIGHT_GRAY);
        g.setFont(new Font("微软雅黑", Font.PLAIN, 11));
        g.drawString("血条", barX + barWidth + 5, barY + 10);
    }

    private void drawOverlay(Graphics g, String state) {
        g.setColor(new Color(0, 0, 0, 150));
        g.fillRect(0, 0, GameConstants.SCREEN_WIDTH, GameConstants.SCREEN_HEIGHT);

        g.setColor(Color.WHITE);
        g.setFont(new Font("微软雅黑", Font.BOLD, 48));
        String text;
        String subText;

        if ("PAUSED".equals(state)) {
            text = "游戏暂停";
            subText = "按 ESC/P 继续游戏";
        } else if ("GAME_OVER".equals(state)) {
            text = "游戏结束";
            subText = "按 R 返回菜单";
        } else if ("VICTORY".equals(state)) {
            if (gameMode == GameConstants.GameMode.BATTLE && level >= GameConstants.MAX_BATTLE_LEVELS) {
                text = "恭喜通关!";
                subText = "按 R 返回主菜单";
            } else {
                text = "恭喜过关!";
                subText = "按 R 进入下一关";
            }
        } else if ("START".equals(state)) {
            text = "像素坦克大战";
            subText = "按任意键开始游戏";
        } else {
            text = "";
            subText = "";
        }

        FontMetrics fm = g.getFontMetrics();
        int x = (GameConstants.SCREEN_WIDTH - fm.stringWidth(text)) / 2;
        int y = GameConstants.GAME_HEIGHT / 2;
        g.drawString(text, x, y);

        g.setFont(new Font("微软雅黑", Font.PLAIN, 20));
        FontMetrics fm2 = g.getFontMetrics();
        int x2 = (GameConstants.SCREEN_WIDTH - fm2.stringWidth(subText)) / 2;
        g.drawString(subText, x2, y + 40);

        if ("GAME_OVER".equals(state) || "VICTORY".equals(state)) {
            g.setColor(Color.YELLOW);
            g.setFont(new Font("微软雅黑", Font.BOLD, 24));
            String scoreText = "最终得分: " + score;
            FontMetrics fm3 = g.getFontMetrics();
            g.drawString(scoreText, (GameConstants.SCREEN_WIDTH - fm3.stringWidth(scoreText)) / 2, y + 80);
        }
    }
}
