package com.game.planewar.model.items;

import java.awt.*;

/**
 * 双倍火力道具
 */
public class DoubleFireItem extends Item {
    
    @Override
    protected void drawItem(Graphics2D g) {
        g.setColor(new Color(255, 215, 0, 200));
        g.fillRoundRect(2, 2, (int) width - 4, (int) height - 4, 8, 8);
        
        g.setColor(Color.YELLOW);
        g.setStroke(new BasicStroke(2));
        g.drawRoundRect(2, 2, (int) width - 4, (int) height - 4, 8, 8);
        
        g.setColor(Color.ORANGE);
        g.setFont(new Font("Arial", Font.BOLD, 14));
        FontMetrics fm = g.getFontMetrics();
        String text = "×2";
        int textX = (int) ((width - fm.stringWidth(text)) / 2);
        int textY = (int) (height / 2 + fm.getAscent() / 2 - 2);
        g.drawString(text, textX, textY);
    }
}
