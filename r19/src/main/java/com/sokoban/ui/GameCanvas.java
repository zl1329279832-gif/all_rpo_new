package com.sokoban.ui;

import com.sokoban.config.GameConfig;
import com.sokoban.config.GraphicsConfig;
import com.sokoban.engine.GameEngine;
import com.sokoban.level.Level;

import javax.swing.*;
import java.awt.*;

public class GameCanvas extends JPanel implements Runnable {
    private final GameEngine engine;
    private final PixelRenderer renderer;
    private Thread gameThread;
    private boolean running;
    private long lastTime;

    public GameCanvas(GameEngine engine) {
        this.engine = engine;
        this.renderer = new PixelRenderer();
        this.running = false;
        setBackground(GraphicsConfig.COLOR_BACKGROUND);
        setDoubleBuffered(true);
        setOpaque(true);
    }

    public void start() {
        if (running) {
            return;
        }
        running = true;
        lastTime = System.nanoTime();
        gameThread = new Thread(this, "Game Loop");
        gameThread.start();
    }

    public void stop() {
        running = false;
        if (gameThread != null) {
            try {
                gameThread.join();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
    }

    @Override
    public void run() {
        while (running) {
            long now = System.nanoTime();
            long deltaTime = (now - lastTime) / 1_000_000;
            lastTime = now;

            renderer.updateAnimation(deltaTime);
            repaint();

            try {
                Thread.sleep(GameConfig.FRAME_TIME);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }
    }

    @Override
    protected void paintComponent(Graphics g) {
        super.paintComponent(g);
        Graphics2D g2d = (Graphics2D) g.create();
        try {
            g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_OFF);
            g2d.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_SPEED);

            g2d.setColor(GraphicsConfig.COLOR_BACKGROUND);
            g2d.fillRect(0, 0, getWidth(), getHeight());

            Level level = engine.getLevel();
            if (level != null) {
                int tileSize = renderer.getTileSize();
                int levelWidth = level.getCols() * tileSize;
                int levelHeight = level.getRows() * tileSize;
                
                int offsetX = (getWidth() - levelWidth) / 2;
                int offsetY = (getHeight() - GameConfig.HUD_HEIGHT - levelHeight) / 2;
                offsetY = Math.max(offsetY, GameConfig.WINDOW_PADDING);

                renderer.render(g2d, engine, offsetX, offsetY);
            }

            renderer.drawHUD(g2d, engine, getWidth(), getHeight());

        } finally {
            g2d.dispose();
        }
    }
}
