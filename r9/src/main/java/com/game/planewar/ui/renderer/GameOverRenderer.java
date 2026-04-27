package com.game.planewar.ui.renderer;

import com.game.planewar.PlaneWarGame;
import com.game.planewar.core.GameController;
import com.game.planewar.core.GameState;

import java.awt.*;

/**
 * 游戏结束渲染器
 */
public class GameOverRenderer {
    
    private final GameController gameController;
    private final String[] menuItems = {
        "重新开始",
        "返回主菜单"
    };
    
    public GameOverRenderer(GameController gameController) {
        this.gameController = gameController;
    }
    
    public void render(Graphics2D g) {
        int centerX = PlaneWarGame.WINDOW_WIDTH / 2;
        int y = 200;
        
        g.setColor(new Color(255, 50, 50));
        g.setFont(new Font("微软雅黑", Font.BOLD, 48));
        FontMetrics fm = g.getFontMetrics();
        String title = "游戏结束";
        g.drawString(title, centerX - fm.stringWidth(title) / 2, y);
        
        y += 80;
        g.setColor(Color.WHITE);
        g.setFont(new Font("Arial", Font.BOLD, 24));
        int score = gameController.getScoreSystem().getScore();
        String scoreText = "最终得分: " + score;
        g.drawString(scoreText, centerX - fm.stringWidth(scoreText) / 2, y);
        
        y += 40;
        int highScore = gameController.getScoreSystem().getHighScore();
        g.setColor(Color.YELLOW);
        g.setFont(new Font("Arial", Font.PLAIN, 18));
        String highScoreText = "历史最高: " + highScore;
        g.drawString(highScoreText, centerX - fm.stringWidth(highScoreText) / 2, y);
        
        y += 50;
        g.setFont(new Font("微软雅黑", Font.PLAIN, 22));
        int selectedIndex = gameController.getMenuSelectedIndex();
        
        for (int i = 0; i < menuItems.length; i++) {
            if (i == selectedIndex) {
                g.setColor(new Color(255, 215, 0));
                g.setFont(new Font("微软雅黑", Font.BOLD, 24));
            } else {
                g.setColor(Color.LIGHT_GRAY);
                g.setFont(new Font("微软雅黑", Font.PLAIN, 22));
            }
            
            fm = g.getFontMetrics();
            String item = menuItems[i];
            g.drawString(item, centerX - fm.stringWidth(item) / 2, y + i * 45);
            
            if (i == selectedIndex) {
                g.setColor(new Color(255, 215, 0));
                int arrowX = centerX - fm.stringWidth(item) / 2 - 30;
                g.drawString(">", arrowX, y + i * 45);
            }
        }
    }
    
    public void handleMouseClick(int x, int y) {
    }
}
