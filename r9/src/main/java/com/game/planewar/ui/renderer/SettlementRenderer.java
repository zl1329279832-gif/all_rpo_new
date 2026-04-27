package com.game.planewar.ui.renderer;

import com.game.planewar.PlaneWarGame;
import com.game.planewar.core.GameController;
import com.game.planewar.core.GameState;

import java.awt.*;

/**
 * 结算页面渲染器
 */
public class SettlementRenderer {
    
    private final GameController gameController;
    private boolean enteringName;
    private StringBuilder nameBuilder;
    private final String[] menuItems = {
        "再来一局",
        "返回主菜单"
    };
    
    public SettlementRenderer(GameController gameController) {
        this.gameController = gameController;
        this.enteringName = true;
        this.nameBuilder = new StringBuilder();
    }
    
    public void render(Graphics2D g) {
        int centerX = PlaneWarGame.WINDOW_WIDTH / 2;
        int y = 150;
        
        g.setColor(new Color(100, 200, 255));
        g.setFont(new Font("微软雅黑", Font.BOLD, 36));
        FontMetrics fm = g.getFontMetrics();
        String title = "战绩结算";
        g.drawString(title, centerX - fm.stringWidth(title) / 2, y);
        
        y += 60;
        
        int score = gameController.getScoreSystem().getScore();
        int level = gameController.getLevelSystem().getCurrentLevel();
        
        g.setColor(Color.WHITE);
        g.setFont(new Font("微软雅黑", Font.PLAIN, 20));
        
        String[] stats = {
            "得分: " + score,
            "到达关卡: " + level,
            "玩家: " + gameController.getPlayerNickname()
        };
        
        for (String stat : stats) {
            g.drawString(stat, centerX - 80, y);
            y += 35;
        }
        
        y += 30;
        
        if (score > gameController.getDataManager().getHighScore()) {
            g.setColor(Color.YELLOW);
            g.setFont(new Font("微软雅黑", Font.BOLD, 22));
            String newRecord = "★ 新纪录! ★";
            g.drawString(newRecord, centerX - fm.stringWidth(newRecord) / 2, y);
            y += 50;
        } else {
            g.setColor(Color.GRAY);
            g.setFont(new Font("微软雅黑", Font.PLAIN, 14));
            String highScoreText = "历史最高: " + gameController.getDataManager().getHighScore();
            g.drawString(highScoreText, centerX - 50, y);
            y += 50;
        }
        
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
        
        y += menuItems.length * 45 + 30;
        g.setColor(Color.GRAY);
        g.setFont(new Font("微软雅黑", Font.PLAIN, 12));
        g.drawString("按 Enter 确认选择", centerX - 60, y);
    }
    
    public void handleKeyTyped(char c) {
        if (!enteringName) return;
        
        if (c == '\b' && nameBuilder.length() > 0) {
            nameBuilder.deleteCharAt(nameBuilder.length() - 1);
        } else if (Character.isLetterOrDigit(c) && nameBuilder.length() < 10) {
            nameBuilder.append(c);
        }
    }
    
    public void handleMouseClick(int x, int y) {
    }
}
