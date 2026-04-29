package com.sokoban.ui;

import com.sokoban.config.GameConfig;
import com.sokoban.config.GraphicsConfig;
import com.sokoban.engine.GameEngine;
import com.sokoban.level.Level;
import com.sokoban.util.Position;

import java.awt.*;
import java.awt.geom.Rectangle2D;
import java.util.Set;

public class PixelRenderer {
    private final int tileSize;
    private final int pixelSize;
    private long animationTime;

    public PixelRenderer() {
        this.tileSize = GameConfig.TILE_SIZE;
        this.pixelSize = GraphicsConfig.PIXEL_SIZE;
        this.animationTime = 0;
    }

    public void updateAnimation(long deltaTime) {
        animationTime += deltaTime;
    }

    public void render(Graphics2D g, GameEngine engine, int offsetX, int offsetY) {
        Level level = engine.getLevel();
        if (level == null) {
            return;
        }

        int cols = level.getCols();
        int rows = level.getRows();

        for (int row = 0; row < rows; row++) {
            for (int col = 0; col < cols; col++) {
                int x = offsetX + col * tileSize;
                int y = offsetY + row * tileSize;
                Position pos = new Position(col, row);

                drawFloor(g, x, y, col, row);

                if (level.isTarget(pos)) {
                    drawTarget(g, x, y);
                }
            }
        }

        Set<Position> boxPositions = engine.getBoxPositions();
        for (Position boxPos : boxPositions) {
            int x = offsetX + boxPos.getX() * tileSize;
            int y = offsetY + boxPos.getY() * tileSize;
            boolean onTarget = level.isTarget(boxPos);
            drawBox(g, x, y, onTarget);
        }

        Position playerPos = engine.getPlayerPosition();
        if (playerPos != null) {
            int x = offsetX + playerPos.getX() * tileSize;
            int y = offsetY + playerPos.getY() * tileSize;
            drawPlayer(g, x, y);
        }
    }

    private void drawFloor(Graphics2D g, int x, int y, int col, int row) {
        boolean isDark = (col + row) % 2 == 0;
        Color color = isDark ? GraphicsConfig.COLOR_FLOOR_DARK : GraphicsConfig.COLOR_FLOOR;
        
        g.setColor(color);
        fillPixelRect(g, x, y, tileSize, tileSize);
        
        g.setColor(isDark ? color.darker() : color.brighter());
        drawPixelBorder(g, x, y, tileSize, tileSize, 1);
    }

    private void drawTarget(Graphics2D g, int x, int y) {
        double pulse = (Math.sin(animationTime / 200.0) + 1) / 2;
        Color baseColor = GraphicsConfig.COLOR_TARGET;
        Color pulseColor = GraphicsConfig.COLOR_TARGET_PULSE;
        
        int r = (int) (baseColor.getRed() + (pulseColor.getRed() - baseColor.getRed()) * pulse);
        int gr = (int) (baseColor.getGreen() + (pulseColor.getGreen() - baseColor.getGreen()) * pulse);
        int b = (int) (baseColor.getBlue() + (pulseColor.getBlue() - baseColor.getBlue()) * pulse);
        
        Color animatedColor = new Color(r, gr, b);
        
        int margin = tileSize / 4;
        int innerSize = tileSize - margin * 2;
        
        g.setColor(animatedColor);
        fillPixelRect(g, x + margin, y + margin, innerSize, innerSize);
        
        g.setColor(animatedColor.darker());
        drawPixelBorder(g, x + margin, y + margin, innerSize, innerSize, 1);
        
        int dotSize = innerSize / 3;
        int dotMargin = (innerSize - dotSize) / 2;
        g.setColor(animatedColor.brighter());
        fillPixelRect(g, x + margin + dotMargin, y + margin + dotMargin, dotSize, dotSize);
    }

    private void drawBox(Graphics2D g, int x, int y, boolean onTarget) {
        Color boxColor = onTarget ? GraphicsConfig.COLOR_BOX_ON_TARGET : GraphicsConfig.COLOR_BOX;
        Color darkColor = onTarget ? GraphicsConfig.COLOR_BOX_ON_TARGET_DARK : GraphicsConfig.COLOR_BOX_DARK;
        Color highlightColor = onTarget ? boxColor.brighter() : GraphicsConfig.COLOR_BOX_HIGHLIGHT;
        
        int margin = tileSize / 8;
        int boxSize = tileSize - margin * 2;
        
        g.setColor(darkColor);
        fillPixelRect(g, x + margin + pixelSize, y + margin + pixelSize, boxSize, boxSize);
        
        g.setColor(boxColor);
        fillPixelRect(g, x + margin, y + margin, boxSize, boxSize);
        
        g.setColor(highlightColor);
        fillPixelRect(g, x + margin, y + margin, boxSize, pixelSize);
        fillPixelRect(g, x + margin, y + margin, pixelSize, boxSize);
        
        g.setColor(darkColor);
        fillPixelRect(g, x + margin, y + margin + boxSize - pixelSize, boxSize, pixelSize);
        fillPixelRect(g, x + margin + boxSize - pixelSize, y + margin, pixelSize, boxSize);
        
        int crossSize = boxSize / 2;
        int crossMargin = (boxSize - crossSize) / 2;
        g.setColor(darkColor);
        
        int crossX = x + margin + crossMargin;
        int crossY = y + margin + crossMargin;
        int crossThickness = pixelSize;
        
        for (int i = 0; i < crossSize; i++) {
            fillPixelRect(g, crossX + i, crossY + i, crossThickness, crossThickness);
            fillPixelRect(g, crossX + crossSize - 1 - i, crossY + i, crossThickness, crossThickness);
        }
    }

    private void drawPlayer(Graphics2D g, int x, int y) {
        Color playerColor = GraphicsConfig.COLOR_PLAYER;
        Color darkColor = GraphicsConfig.COLOR_PLAYER_DARK;
        Color highlightColor = GraphicsConfig.COLOR_PLAYER_HIGHLIGHT;
        
        int margin = tileSize / 6;
        int playerSize = tileSize - margin * 2;
        
        g.setColor(darkColor);
        fillPixelRect(g, x + margin + pixelSize, y + margin + pixelSize, playerSize, playerSize);
        
        g.setColor(playerColor);
        fillPixelRect(g, x + margin, y + margin, playerSize, playerSize);
        
        g.setColor(highlightColor);
        fillPixelRect(g, x + margin, y + margin, playerSize, pixelSize);
        fillPixelRect(g, x + margin, y + margin, pixelSize, playerSize);
        
        g.setColor(darkColor);
        fillPixelRect(g, x + margin, y + margin + playerSize - pixelSize, playerSize, pixelSize);
        fillPixelRect(g, x + margin + playerSize - pixelSize, y + margin, pixelSize, playerSize);
        
        int eyeSize = playerSize / 5;
        int eyeY = y + margin + playerSize / 3;
        int eyeMargin = playerSize / 4;
        
        g.setColor(Color.WHITE);
        fillPixelRect(g, x + margin + eyeMargin, eyeY, eyeSize, eyeSize);
        fillPixelRect(g, x + margin + playerSize - eyeMargin - eyeSize, eyeY, eyeSize, eyeSize);
        
        g.setColor(Color.BLACK);
        int pupilSize = eyeSize / 2;
        fillPixelRect(g, x + margin + eyeMargin + pixelSize, eyeY + pixelSize, pupilSize, pupilSize);
        fillPixelRect(g, x + margin + playerSize - eyeMargin - eyeSize + pixelSize, eyeY + pixelSize, pupilSize, pupilSize);
    }

    public void drawHUD(Graphics2D g, GameEngine engine, int width, int height) {
        int hudHeight = GameConfig.HUD_HEIGHT;
        int hudY = height - hudHeight;
        
        g.setColor(GraphicsConfig.COLOR_HUD_BACKGROUND);
        g.fillRect(0, hudY, width, hudHeight);
        
        g.setColor(GraphicsConfig.COLOR_HUD_ACCENT);
        g.fillRect(0, hudY, width, pixelSize);
        
        g.setColor(GraphicsConfig.COLOR_HUD_TEXT);
        g.setFont(new Font("Monospaced", Font.BOLD, 16));
        
        FontMetrics fm = g.getFontMetrics();
        int padding = 20;
        int textY = hudY + hudHeight / 2 + fm.getAscent() / 2;
        
        String movesText = "步数: " + engine.getMoves();
        g.drawString(movesText, padding, textY);
        
        String timeText = "时间: " + engine.getFormattedTime();
        int timeX = width / 2 - fm.stringWidth(timeText) / 2;
        g.drawString(timeText, timeX, textY);
        
        String undoText = "撤销: " + engine.getUndoCount();
        int undoX = width - padding - fm.stringWidth(undoText);
        g.drawString(undoText, undoX, textY);
        
        if (engine.isDeadlocked()) {
            g.setColor(GraphicsConfig.COLOR_DEADLOCK_INDICATOR);
            String deadlockText = "死局！按 R 重新开始";
            int deadlockX = width / 2 - fm.stringWidth(deadlockText) / 2;
            g.drawString(deadlockText, deadlockX, textY - 25);
        }
    }

    private void fillPixelRect(Graphics2D g, int x, int y, int width, int height) {
        int alignedX = (x / pixelSize) * pixelSize;
        int alignedY = (y / pixelSize) * pixelSize;
        int alignedWidth = ((width + pixelSize - 1) / pixelSize) * pixelSize;
        int alignedHeight = ((height + pixelSize - 1) / pixelSize) * pixelSize;
        
        g.fillRect(alignedX, alignedY, alignedWidth, alignedHeight);
    }

    private void drawPixelBorder(Graphics2D g, int x, int y, int width, int height, int thickness) {
        int t = thickness * pixelSize;
        g.fillRect(x, y, width, t);
        g.fillRect(x, y, t, height);
        g.fillRect(x, y + height - t, width, t);
        g.fillRect(x + width - t, y, t, height);
    }

    public int getTileSize() {
        return tileSize;
    }
}
