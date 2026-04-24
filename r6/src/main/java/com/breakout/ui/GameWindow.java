package com.breakout.ui;

import com.breakout.config.GameConfig;

import javax.swing.*;
import java.awt.*;
import java.awt.event.WindowAdapter;
import java.awt.event.WindowEvent;

public class GameWindow extends JFrame {
    private final GamePanel gamePanel;

    public GameWindow() {
        setTitle(GameConfig.WINDOW_TITLE);
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setResizable(false);

        gamePanel = new GamePanel();
        add(gamePanel, BorderLayout.CENTER);

        pack();
        setLocationRelativeTo(null);

        addWindowListener(new WindowAdapter() {
            @Override
            public void windowOpened(WindowEvent e) {
                gamePanel.requestFocusInWindow();
                gamePanel.startGame();
            }

            @Override
            public void windowClosing(WindowEvent e) {
                gamePanel.stopGame();
            }
        });
    }

    public void start() {
        setVisible(true);
    }

    public GamePanel getGamePanel() {
        return gamePanel;
    }
}
