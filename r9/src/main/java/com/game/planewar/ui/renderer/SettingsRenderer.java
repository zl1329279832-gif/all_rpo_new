package com.game.planewar.ui.renderer;

import com.game.planewar.PlaneWarGame;
import com.game.planewar.core.GameController;
import com.game.planewar.core.GameState;

import java.awt.*;

/**
 * 设置页面渲染器
 */
public class SettingsRenderer {
    
    private final GameController gameController;
    private final String[] menuItems = {
        "自动射击",
        "音效开关",
        "清空排行榜",
        "返回主菜单"
    };
    
    public SettingsRenderer(GameController gameController) {
        this.gameController = gameController;
    }
    
    public void render(Graphics2D g) {
        int centerX = PlaneWarGame.WINDOW_WIDTH / 2;
        int y = 150;
        
        g.setColor(new Color(100, 200, 255));
        g.setFont(new Font("微软雅黑", Font.BOLD, 32));
        FontMetrics fm = g.getFontMetrics();
        String title = "游戏设置";
        g.drawString(title, centerX - fm.stringWidth(title) / 2, y);
        
        y += 60;
        g.setFont(new Font("微软雅黑", Font.PLAIN, 20));
        int selectedIndex = gameController.getMenuSelectedIndex();
        
        boolean autoShoot = gameController.isAutoShoot();
        boolean soundEnabled = gameController.isSoundEnabled();
        
        for (int i = 0; i < menuItems.length; i++) {
            String item = menuItems[i];
            
            if (i == 0) {
                item += " [" + (autoShoot ? "开启" : "关闭") + "]";
            } else if (i == 1) {
                item += " [" + (soundEnabled ? "开启" : "关闭") + "]";
            } else if (i == 2) {
                item += " (需确认)";
            }
            
            if (i == selectedIndex) {
                g.setColor(new Color(255, 215, 0));
                g.setFont(new Font("微软雅黑", Font.BOLD, 22));
            } else {
                g.setColor(Color.LIGHT_GRAY);
                g.setFont(new Font("微软雅黑", Font.PLAIN, 20));
            }
            
            fm = g.getFontMetrics();
            g.drawString(item, centerX - 100, y + i * 45);
            
            if (i == selectedIndex) {
                g.setColor(new Color(255, 215, 0));
                g.drawString(">", centerX - 130, y + i * 45);
            }
        }
        
        y += menuItems.length * 45 + 40;
        g.setColor(Color.GRAY);
        g.setFont(new Font("微软雅黑", Font.PLAIN, 12));
        g.drawString("按 Enter 切换选项或确认", centerX - 80, y);
        
        y += 20;
        g.drawString("按 ESC 返回主菜单", centerX - 60, y);
        
        y += 40;
        g.setColor(new Color(80, 80, 80));
        g.drawString("────────────────────────────", centerX - 100, y);
        
        y += 25;
        g.setColor(Color.GRAY);
        g.setFont(new Font("微软雅黑", Font.PLAIN, 11));
        g.drawString("当前玩家: " + gameController.getPlayerNickname(), centerX - 60, y);
    }
    
    public void handleMouseClick(int x, int y) {
    }
}
