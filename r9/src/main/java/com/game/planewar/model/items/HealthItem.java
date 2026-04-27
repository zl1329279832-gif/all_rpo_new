package com.game.planewar.model.items;

import java.awt.*;

/**
 * 回血道具
 */
public class HealthItem extends Item {
    
    @Override
    protected void drawItem(Graphics2D g) {
        g.setColor(new Color(50, 200, 50, 180));
        g.fillRoundRect(2, 2, (int) width - 4, (int) height - 4, 8, 8);
        
        g.setColor(Color.GREEN);
        g.setStroke(new BasicStroke(2));
        g.drawRoundRect(2, 2, (int) width - 4, (int) height - 4, 8, 8);
        
        g.setColor(Color.WHITE);
        g.setStroke(new BasicStroke(3));
        g.drawLine((int) (width / 2), (int) (height * 0.25f),
                   (int) (width / 2), (int) (height * 0.75f));
        g.drawLine((int) (width * 0.25f), (int) (height / 2),
                   (int) (width * 0.75f), (int) (height / 2));
    }
}
