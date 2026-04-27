package com.game.planewar.ui.renderer;

import com.game.planewar.PlaneWarGame;
import com.game.planewar.core.GameController;
import com.game.planewar.core.GameState;

import java.awt.*;

/**
 * 主菜单渲染器
 */
public class MenuRenderer {
    
    private final GameController gameController;
    private final String[] menuItems = {
        "开始游戏",
        "排行榜",
        "设置",
        "退出游戏"
    };
    
    public MenuRenderer(GameController gameController) {
        this.gameController = gameController;
    }
    
    public void render(Graphics2D g) {
        int centerX = PlaneWarGame.WINDOW_WIDTH / 2;
        int y = 180;
        
        g.setColor(new Color(255, 200, 50));
        g.setFont(new Font("微软雅黑", Font.BOLD, 48));
        FontMetrics fm = g.getFontMetrics();
        String title = "飞机大战";
        g.drawString(title, centerX - fm.stringWidth(title) / 2, y);
        
        y += 30;
        g.setColor(new Color(150, 150, 150));
        g.setFont(new Font("Arial", Font.PLAIN, 14));
        String version = "Java2D Edition v1.0";
        g.drawString(version, centerX - fm.stringWidth(version) / 2, y);
        
        y += 60;
        g.setFont(new Font("微软雅黑", Font.PLAIN, 24));
        int selectedIndex = gameController.getMenuSelectedIndex();
        
        for (int i = 0; i < menuItems.length; i++) {
            if (i == selectedIndex) {
                g.setColor(new Color(255, 215, 0));
                g.setFont(new Font("微软雅黑", Font.BOLD, 26));
            } else {
                g.setColor(Color.LIGHT_GRAY);
                g.setFont(new Font("微软雅黑", Font.PLAIN, 24));
            }
            
            fm = g.getFontMetrics();
            String item = menuItems[i];
            g.drawString(item, centerX - fm.stringWidth(item) / 2, y + i * 50);
            
            if (i == selectedIndex) {
                g.setColor(new Color(255, 215, 0));
                int arrowX = centerX - fm.stringWidth(item) / 2 - 35;
                g.drawString(">", arrowX, y + i * 50);
            }
        }
        
        y += menuItems.length * 50 + 40;
        g.setColor(Color.GRAY);
        g.setFont(new Font("微软雅黑", Font.PLAIN, 14));
        String[] instructions = {
            "操作说明：",
            "  方向键 / WASD - 移动飞机",
            "  空格键 - 发射子弹",
            "  P / ESC - 暂停游戏",
            "  自动射击 - 开启后自动发射"
        };
        
        for (String line : instructions) {
            g.drawString(line, 50, y);
            y += 22;
        }
        
        String playerName = gameController.getPlayerNickname();
        g.setColor(Color.CYAN);
        g.setFont(new Font("微软雅黑", Font.PLAIN, 16));
        g.drawString("当前玩家: " + playerName, 50, 150);
    }
    
    public void handleMouseClick(int x, int y) {
    }
}
