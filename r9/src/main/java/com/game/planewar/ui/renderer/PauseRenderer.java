package com.game.planewar.ui.renderer;

import com.game.planewar.PlaneWarGame;
import com.game.planewar.core.GameController;
import com.game.planewar.core.GameState;

import java.awt.*;

/**
 * 暂停菜单渲染器
 */
public class PauseRenderer {
    
    private final GameController gameController;
    private final String[] menuItems = {
        "继续游戏",
        "返回主菜单",
        "退出游戏"
    };
    
    public PauseRenderer(GameController gameController) {
        this.gameController = gameController;
    }
    
    public void render(Graphics2D g) {
        int centerX = PlaneWarGame.WINDOW_WIDTH / 2;
        int y = 250;
        
        g.setColor(new Color(255, 215, 0));
        g.setFont(new Font("微软雅黑", Font.BOLD, 40));
        FontMetrics fm = g.getFontMetrics();
        String title = "游戏暂停";
        g.drawString(title, centerX - fm.stringWidth(title) / 2, y);
        
        y += 60;
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
        
        y += menuItems.length * 45 + 40;
        g.setColor(Color.GRAY);
        g.setFont(new Font("微软雅黑", Font.PLAIN, 14));
        g.drawString("按 P 或 ESC 继续游戏", centerX - 80, y);
    }
    
    public void handleMouseClick(int x, int y) {
    }
}
