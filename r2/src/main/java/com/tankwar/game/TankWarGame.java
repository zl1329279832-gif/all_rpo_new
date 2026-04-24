package com.tankwar.game;

import com.tankwar.engine.GameEngine;
import com.tankwar.input.InputHandler;
import com.tankwar.ui.GamePanel;
import com.tankwar.util.GameConstants;

import javax.swing.*;
import java.awt.*;

public class TankWarGame extends JFrame {
    private GameEngine engine;
    private GamePanel gamePanel;
    private InputHandler inputHandler;
    private Thread gameThread;

    public TankWarGame() {
        setTitle("像素坦克大战");
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setResizable(false);

        engine = new GameEngine();
        gamePanel = new GamePanel();
        inputHandler = new InputHandler();

        gamePanel.addKeyListener(inputHandler);
        add(gamePanel, BorderLayout.CENTER);

        pack();
        setLocationRelativeTo(null);
    }

    public void start() {
        setVisible(true);
        gamePanel.requestFocusInWindow();

        gameThread = new Thread(this::gameLoop);
        gameThread.start();
    }

    private void gameLoop() {
        long lastTime = System.currentTimeMillis();
        long accumulator = 0;

        while (true) {
            long currentTime = System.currentTimeMillis();
            long frameTime = currentTime - lastTime;
            lastTime = currentTime;
            accumulator += frameTime;

            while (accumulator >= GameConstants.FRAME_TIME) {
                update();
                accumulator -= GameConstants.FRAME_TIME;
            }

            render();

            try {
                long sleepTime = GameConstants.FRAME_TIME - (System.currentTimeMillis() - currentTime);
                if (sleepTime > 0) {
                    Thread.sleep(sleepTime);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }
    }

    private void update() {
        engine.update(
            inputHandler.isUpPressed(),
            inputHandler.isDownPressed(),
            inputHandler.isLeftPressed(),
            inputHandler.isRightPressed(),
            inputHandler.isShooting(),
            inputHandler.isPausePressed(),
            inputHandler.isRestartPressed()
        );
        inputHandler.resetFrameState();
    }

    private void render() {
        engine.render(gamePanel);
    }

    public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> {
            try {
                UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
            } catch (Exception e) {
                e.printStackTrace();
            }

            TankWarGame game = new TankWarGame();
            game.start();
        });
    }
}
