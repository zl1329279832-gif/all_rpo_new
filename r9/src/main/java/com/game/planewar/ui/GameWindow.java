package com.game.planewar.ui;

import com.game.planewar.PlaneWarGame;
import com.game.planewar.core.GameController;

import javax.swing.*;
import java.awt.*;
import java.awt.event.WindowAdapter;
import java.awt.event.WindowEvent;

/**
 * 游戏窗口类
 */
public class GameWindow {
    
    private JFrame frame;
    private GamePanel gamePanel;
    private final GameController gameController;
    
    public GameWindow(GameController gameController) {
        this.gameController = gameController;
    }
    
    /**
     * 初始化游戏窗口
     */
    public void init() {
        frame = new JFrame(PlaneWarGame.GAME_TITLE);
        frame.setDefaultCloseOperation(JFrame.DO_NOTHING_ON_CLOSE);
        frame.setResizable(false);
        
        gamePanel = new GamePanel(gameController);
        gamePanel.setPreferredSize(new Dimension(PlaneWarGame.WINDOW_WIDTH, PlaneWarGame.WINDOW_HEIGHT));
        frame.add(gamePanel, BorderLayout.CENTER);
        
        frame.pack();
        frame.setLocationRelativeTo(null);
        
        frame.addWindowListener(new WindowAdapter() {
            @Override
            public void windowClosing(WindowEvent e) {
                int result = JOptionPane.showConfirmDialog(
                        frame,
                        "确定要退出游戏吗？",
                        "确认退出",
                        JOptionPane.YES_NO_OPTION
                );
                if (result == JOptionPane.YES_OPTION) {
                    PlaneWarGame.getInstance().exit();
                }
            }
        });
        
        gamePanel.setFocusable(true);
        gamePanel.requestFocusInWindow();
    }
    
    /**
     * 显示窗口
     */
    public void showWindow() {
        frame.setVisible(true);
        gamePanel.requestFocusInWindow();
    }
    
    /**
     * 隐藏窗口
     */
    public void hideWindow() {
        frame.setVisible(false);
    }
    
    /**
     * 获取游戏面板
     */
    public GamePanel getGamePanel() {
        return gamePanel;
    }
    
    /**
     * 获取 JFrame
     */
    public JFrame getFrame() {
        return frame;
    }
    
    /**
     * 重新绘制
     */
    public void repaint() {
        if (gamePanel != null) {
            gamePanel.repaint();
        }
    }
}
