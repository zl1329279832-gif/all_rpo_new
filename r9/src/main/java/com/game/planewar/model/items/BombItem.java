package com.game.planewar.model.items;

import java.awt.*;

/**
 * 清屏炸弹道具
 */
public class BombItem extends Item {
    
    @Override
    protected void drawItem(Graphics2D g) {
        g.setColor(new Color(200, 50, 50, 180));
        g.fillOval(2, 2, (int) width - 4, (int) height - 4);
        
        g.setColor(Color.RED);
        g.setStroke(new BasicStroke(2));
        g.drawOval(2, 2, (int) width - 4, (int) height - 4);
        
        g.setColor(new Color(255, 150, 50));
        g.fillRect((int) (width * 0.4f), (int) (height * 0.05f),
                   (int) (width * 0.2f), (int) (height * 0.2f));
        
        g.setColor(Color.ORANGE);
        int[] xSpark = {
            (int) (width * 0.45f),
            (int) (width * 0.5f),
            (int) (width * 0.55f),
            (int) (width * 0.5f)
        };
        int[] ySpark = {
            (int) (height * 0.05f),
            (int) (height * -0.1f),
            (int) (height * 0.05f),
            (int) (height * 0.02f)
        };
        g.fillPolygon(xSpark, ySpark, 4);
        
        g.setColor(Color.WHITE);
        g.setFont(new Font("Arial", Font.BOLD, 12));
        FontMetrics fm = g.getFontMetrics();
        String text = "B";
        int textX = (int) ((width - fm.stringWidth(text)) / 2);
        int textY = (int) (height * 0.65f + fm.getAscent() / 2);
        g.drawString(text, textX, textY);
    }
}
