package com.game.planewar.ui.renderer;

import com.game.planewar.PlaneWarGame;
import com.game.planewar.core.GameController;
import com.game.planewar.core.GameState;
import com.game.planewar.data.GameDataManager;

import java.awt.*;
import java.util.List;

/**
 * 排行榜渲染器
 */
public class LeaderboardRenderer {
    
    private final GameController gameController;
    
    public LeaderboardRenderer(GameController gameController) {
        this.gameController = gameController;
    }
    
    public void render(Graphics2D g) {
        int centerX = PlaneWarGame.WINDOW_WIDTH / 2;
        int y = 100;
        
        g.setColor(new Color(255, 215, 0));
        g.setFont(new Font("微软雅黑", Font.BOLD, 32));
        FontMetrics fm = g.getFontMetrics();
        String title = "排行榜";
        g.drawString(title, centerX - fm.stringWidth(title) / 2, y);
        
        y += 30;
        g.setColor(new Color(150, 150, 150));
        g.setFont(new Font("Arial", Font.PLAIN, 12));
        g.drawString("────────────────────────────", centerX - 100, y);
        
        y += 40;
        
        GameDataManager dataManager = gameController.getDataManager();
        List<GameDataManager.ScoreEntry> leaderboard = dataManager.getLeaderboard();
        
        if (leaderboard == null || leaderboard.isEmpty()) {
            g.setColor(Color.GRAY);
            g.setFont(new Font("微软雅黑", Font.PLAIN, 16));
            String noData = "暂无记录";
            g.drawString(noData, centerX - fm.stringWidth(noData) / 2, y);
        } else {
            g.setFont(new Font("微软雅黑", Font.PLAIN, 16));
            
            for (int i = 0; i < Math.min(leaderboard.size(), 10); i++) {
                GameDataManager.ScoreEntry entry = leaderboard.get(i);
                
                Color rankColor;
                if (i == 0) {
                    rankColor = new Color(255, 215, 0);
                } else if (i == 1) {
                    rankColor = new Color(192, 192, 192);
                } else if (i == 2) {
                    rankColor = new Color(205, 127, 50);
                } else {
                    rankColor = Color.LIGHT_GRAY;
                }
                
                g.setColor(rankColor);
                String rank = (i + 1) + ".";
                g.drawString(rank, centerX - 150, y);
                
                g.setColor(Color.WHITE);
                String name = entry.getPlayerName();
                if (name.length() > 10) {
                    name = name.substring(0, 10) + "...";
                }
                g.drawString(name, centerX - 80, y);
                
                g.setColor(new Color(100, 200, 255));
                String score = String.format("%8d", entry.getScore());
                g.drawString(score, centerX + 50, y);
                
                g.setColor(Color.GRAY);
                g.setFont(new Font("Arial", Font.PLAIN, 10));
                String date = entry.getFormattedDate();
                g.drawString(date, centerX + 130, y);
                
                g.setFont(new Font("微软雅黑", Font.PLAIN, 16));
                y += 32;
            }
        }
        
        y += 50;
        g.setColor(Color.YELLOW);
        g.setFont(new Font("微软雅黑", Font.BOLD, 18));
        String highScoreText = "历史最高分: " + dataManager.getHighScore();
        g.drawString(highScoreText, centerX - 70, y);
        
        y += 50;
        g.setColor(Color.GRAY);
        g.setFont(new Font("微软雅黑", Font.PLAIN, 14));
        g.drawString("按 ESC 或 Enter 返回", centerX - 70, y);
    }
    
    public void handleMouseClick(int x, int y) {
    }
}
