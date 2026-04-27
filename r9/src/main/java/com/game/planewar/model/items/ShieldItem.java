package com.game.planewar.model.items;

import java.awt.*;
import java.awt.geom.Ellipse2D;

/**
 * 护盾道具
 */
public class ShieldItem extends Item {
    
    @Override
    protected void drawItem(Graphics2D g) {
        g.setColor(new Color(100, 200, 255, 180));
        g.fillOval(2, 2, (int) width - 4, (int) height - 4);
        
        g.setColor(Color.CYAN);
        g.setStroke(new BasicStroke(2));
        g.drawOval(2, 2, (int) width - 4, (int) height - 4);
        
        g.setColor(new Color(50, 150, 200));
        int[] xShield = {
            (int) (width / 2),
            (int) (width * 0.2f),
            (int) (width * 0.2f),
            (int) (width / 2),
            (int) (width * 0.8f),
            (int) (width * 0.8f)
        };
        int[] yShield = {
            (int) (height * 0.15f),
            (int) (height * 0.3f),
            (int) (height * 0.65f),
            (int) (height * 0.9f),
            (int) (height * 0.65f),
            (int) (height * 0.3f)
        };
        g.fillPolygon(xShield, yShield, 6);
        
        g.setColor(Color.CYAN);
        g.drawPolygon(xShield, yShield, 6);
    }
}
