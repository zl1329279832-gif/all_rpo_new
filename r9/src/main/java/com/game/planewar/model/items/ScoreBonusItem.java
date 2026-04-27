package com.game.planewar.model.items;

import java.awt.*;

/**
 * 分数加成道具
 */
public class ScoreBonusItem extends Item {
    
    @Override
    protected void drawItem(Graphics2D g) {
        g.setColor(new Color(255, 165, 0, 180));
        int[] xStar = {
            (int) (width / 2),
            (int) (width * 0.35f),
            (int) (width * 0.1f),
            (int) (width * 0.28f),
            (int) (width * 0.15f),
            (int) (width / 2),
            (int) (width * 0.85f),
            (int) (width * 0.72f),
            (int) (width * 0.9f),
            (int) (width * 0.65f)
        };
        int[] yStar = {
            (int) (height * 0.1f),
            (int) (height * 0.35f),
            (int) (height * 0.35f),
            (int) (height * 0.55f),
            (int) (height * 0.85f),
            (int) (height * 0.68f),
            (int) (height * 0.85f),
            (int) (height * 0.55f),
            (int) (height * 0.35f),
            (int) (height * 0.35f)
        };
        g.fillPolygon(xStar, yStar, 10);
        
        g.setColor(Color.YELLOW);
        g.setStroke(new BasicStroke(1.5f));
        g.drawPolygon(xStar, yStar, 10);
        
        g.setColor(Color.WHITE);
        g.setFont(new Font("Arial", Font.BOLD, 10));
        FontMetrics fm = g.getFontMetrics();
        String text = "+500";
        int textX = (int) ((width - fm.stringWidth(text)) / 2);
        int textY = (int) (height * 0.55f + fm.getAscent() / 2);
        g.drawString(text, textX, textY);
    }
}
