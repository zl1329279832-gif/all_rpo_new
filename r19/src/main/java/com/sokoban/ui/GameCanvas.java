package com.sokoban.ui;

import com.sokoban.config.GameConfig;
import com.sokoban.config.GraphicsConfig;
import com.sokoban.engine.GameEngine;
import com.sokoban.level.Level;

import javax.swing.*;
import java.awt.*;
import java.awt.image.BufferStrategy;

public class GameCanvas extends Canvas implements Runnable {
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
        setIgnoreRepaint(true);
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
            render();

            try {
                Thread.sleep(GameConfig.FRAME_TIME);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }
    }

    private void render() {
        BufferStrategy bs = getBufferStrategy();
        if (bs == null) {
            createBufferStrategy(3);
            return;
        }

        Graphics2D g = (Graphics2D) bs.getDrawGraphics();
        try {
            g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_OFF);
            g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_SPEED);

            g.setColor(GraphicsConfig.COLOR_BACKGROUND);
            g.fillRect(0, 0, getWidth(), getHeight());

            Level level = engine.getLevel();
            if (level != null) {
                int tileSize = renderer.getTileSize();
                int levelWidth = level.getCols() * tileSize;
                int levelHeight = level.getRows() * tileSize;
                
                int offsetX = (getWidth() - levelWidth) / 2;
                int offsetY = (getHeight() - GameConfig.HUD_HEIGHT - levelHeight) / 2;
                offsetY = Math.max(offsetY, GameConfig.WINDOW_PADDING);

                renderer.render(g, engine, offsetX, offsetY);
            }

            renderer.drawHUD(g, engine, getWidth(), getHeight());

        } finally {
            g.dispose();
        }

        bs.show();
        Toolkit.getDefaultToolkit().sync();
    }
}
