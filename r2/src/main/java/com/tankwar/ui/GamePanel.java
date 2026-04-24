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

    @Override
    protected void paintComponent(Graphics g) {
        super.paintComponent(g);

        Graphics2D g2d = (Graphics2D) g;
        g2d.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_SPEED);

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
        g.setFont(new Font("Arial", Font.BOLD, 16));
        g.drawString("得分: " + score, 20, GameConstants.GAME_HEIGHT + 35);
        g.drawString("生命: " + lives, 20, GameConstants.GAME_HEIGHT + 60);

        if (gameMap != null) {
            g.drawString("关卡: " + gameMap.getLevel(), 180, GameConstants.GAME_HEIGHT + 35);
        }

        g.drawString("敌人: " + enemiesLeft + "/" + enemiesTotal, 180, GameConstants.GAME_HEIGHT + 60);

        g.setFont(new Font("Arial", Font.PLAIN, 12));
        g.setColor(Color.LIGHT_GRAY);
        g.drawString("WASD/方向键 - 移动 | 空格/CTRL - 射击", 380, GameConstants.GAME_HEIGHT + 35);
        g.drawString("ESC/P - 暂停 | R - 重新开始", 380, GameConstants.GAME_HEIGHT + 55);
    }

    private void drawOverlay(Graphics g, String state) {
        g.setColor(new Color(0, 0, 0, 150));
        g.fillRect(0, 0, GameConstants.SCREEN_WIDTH, GameConstants.SCREEN_HEIGHT);

        g.setColor(Color.WHITE);
        g.setFont(new Font("Arial", Font.BOLD, 48));
        String text;
        if ("PAUSED".equals(state)) {
            text = "游戏暂停";
        } else if ("GAME_OVER".equals(state)) {
            text = "游戏结束";
        } else if ("VICTORY".equals(state)) {
            text = "恭喜过关!";
        } else if ("START".equals(state)) {
            text = "像素坦克大战";
        } else {
            text = "";
        }

        FontMetrics fm = g.getFontMetrics();
        int x = (GameConstants.SCREEN_WIDTH - fm.stringWidth(text)) / 2;
        int y = GameConstants.GAME_HEIGHT / 2;
        g.drawString(text, x, y);

        g.setFont(new Font("Arial", Font.PLAIN, 20));
        String subText;
        if ("PAUSED".equals(state)) {
            subText = "按 ESC/P 继续游戏";
        } else if ("GAME_OVER".equals(state)) {
            subText = "按 R 重新开始";
        } else if ("VICTORY".equals(state)) {
            subText = "按 R 进入下一关";
        } else if ("START".equals(state)) {
            subText = "按任意键开始游戏";
        } else {
            subText = "";
        }

        FontMetrics fm2 = g.getFontMetrics();
        int x2 = (GameConstants.SCREEN_WIDTH - fm2.stringWidth(subText)) / 2;
        g.drawString(subText, x2, y + 40);
    }
}
