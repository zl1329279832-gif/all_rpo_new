package com.game.planewar.ui.renderer;

import com.game.planewar.PlaneWarGame;
import com.game.planewar.core.GameController;
import com.game.planewar.core.LevelSystem;
import com.game.planewar.core.ScoreSystem;
import com.game.planewar.model.Player;

import java.awt.*;

/**
 * 游戏进行中UI渲染器
 */
public class GameUIRenderer {
    
    private final GameController gameController;
    
    public GameUIRenderer(GameController gameController) {
        this.gameController = gameController;
    }
    
    public void render(Graphics2D g) {
        renderScore(g);
        renderHealth(g);
        renderLevel(g);
        renderBuffStatus(g);
        renderLevelProgress(g);
    }
    
    /**
     * 渲染分数
     */
    private void renderScore(Graphics2D g) {
        ScoreSystem scoreSystem = gameController.getScoreSystem();
        
        g.setColor(Color.WHITE);
        g.setFont(new Font("Arial", Font.BOLD, 18));
        
        String scoreText = "分数: " + scoreSystem.getScore();
        g.drawString(scoreText, 15, 30);
        
        g.setColor(Color.YELLOW);
        g.setFont(new Font("Arial", Font.PLAIN, 14));
        String highScoreText = "最高分: " + scoreSystem.getHighScore();
        g.drawString(highScoreText, 15, 50);
        
        int combo = scoreSystem.getCombo();
        if (combo >= 2) {
            g.setColor(new Color(255, 150, 0));
            g.setFont(new Font("Arial", Font.BOLD, 16));
            String comboText = combo + " 连击!";
            g.drawString(comboText, 15, 72);
        }
    }
    
    /**
     * 渲染生命值
     */
    private void renderHealth(Graphics2D g) {
        Player player = gameController.getPlayer();
        int health = player.getHealth();
        int maxHealth = player.getMaxHealth();
        
        int barX = 15;
        int barY = PlaneWarGame.WINDOW_HEIGHT - 50;
        int barWidth = 200;
        int barHeight = 20;
        
        g.setColor(Color.DARK_GRAY);
        g.fillRect(barX, barY, barWidth, barHeight);
        
        float healthPercent = (float) health / maxHealth;
        Color healthColor = healthPercent > 0.5f ? new Color(50, 200, 50) :
                            healthPercent > 0.25f ? new Color(255, 200, 0) : new Color(255, 50, 50);
        g.setColor(healthColor);
        g.fillRect(barX, barY, (int) (barWidth * healthPercent), barHeight);
        
        g.setColor(Color.WHITE);
        g.drawRect(barX, barY, barWidth, barHeight);
        
        g.setColor(Color.WHITE);
        g.setFont(new Font("Arial", Font.BOLD, 14));
        String healthText = "HP: " + health + "/" + maxHealth;
        FontMetrics fm = g.getFontMetrics();
        int textX = barX + (barWidth - fm.stringWidth(healthText)) / 2;
        int textY = barY + barHeight / 2 + fm.getAscent() / 2 - 2;
        g.drawString(healthText, textX, textY);
    }
    
    /**
     * 渲染关卡
     */
    private void renderLevel(Graphics2D g) {
        LevelSystem levelSystem = gameController.getLevelSystem();
        int level = levelSystem.getCurrentLevel();
        
        g.setColor(Color.CYAN);
        g.setFont(new Font("Arial", Font.BOLD, 18));
        String levelText = "关卡: " + level;
        g.drawString(levelText, PlaneWarGame.WINDOW_WIDTH - 100, 30);
        
        if (levelSystem.isBossActive()) {
            g.setColor(Color.RED);
            g.setFont(new Font("Arial", Font.BOLD, 14));
            g.drawString("BOSS战!", PlaneWarGame.WINDOW_WIDTH - 100, 50);
        }
    }
    
    /**
     * 渲染Buff状态
     */
    private void renderBuffStatus(Graphics2D g) {
        Player player = gameController.getPlayer();
        int x = PlaneWarGame.WINDOW_WIDTH - 100;
        int y = 70;
        
        g.setFont(new Font("Arial", Font.PLAIN, 12));
        
        if (player.isHasDoubleFire()) {
            int remaining = player.getDoubleFireTimer() / 60;
            g.setColor(Color.YELLOW);
            g.drawString("双倍火力 " + remaining + "s", x, y);
            y += 18;
        }
        
        if (player.isHasShield()) {
            int remaining = player.getShieldTimer() / 60;
            g.setColor(Color.CYAN);
            g.drawString("护盾 " + remaining + "s", x, y);
            y += 18;
        }
        
        if (player.getInvincibleTimer() > 0) {
            g.setColor(Color.WHITE);
            g.drawString("无敌中...", x, y);
        }
    }
    
    /**
     * 渲染关卡进度
     */
    private void renderLevelProgress(Graphics2D g) {
        LevelSystem levelSystem = gameController.getLevelSystem();
        if (levelSystem.isBossActive()) {
            return;
        }
        
        float progress = levelSystem.getLevelProgress();
        int barX = 15;
        int barY = 85;
        int barWidth = 150;
        int barHeight = 8;
        
        g.setColor(Color.DARK_GRAY);
        g.fillRect(barX, barY, barWidth, barHeight);
        
        g.setColor(new Color(100, 200, 255));
        g.fillRect(barX, barY, (int) (barWidth * Math.min(progress, 1.0f)), barHeight);
        
        g.setColor(Color.GRAY);
        g.setFont(new Font("Arial", Font.PLAIN, 10));
        g.drawString("下一关进度", barX, barY - 2);
    }
}
