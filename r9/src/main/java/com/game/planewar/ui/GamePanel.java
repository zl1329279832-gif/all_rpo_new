package com.game.planewar.ui;

import com.game.planewar.PlaneWarGame;
import com.game.planewar.core.GameController;
import com.game.planewar.input.InputHandler;

import javax.swing.*;
import java.awt.*;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.awt.image.BufferedImage;

/**
 * 游戏面板 - 负责所有游戏渲染
 */
public class GamePanel extends JPanel implements ActionListener {
    
    private final GameController gameController;
    private BufferedImage bufferImage;
    private Graphics2D bufferGraphics;
    private Timer repaintTimer;
    
    public GamePanel(GameController gameController) {
        this.gameController = gameController;
        setBackground(Color.BLACK);
        setDoubleBuffered(true);
        
        InputHandler inputHandler = gameController.getInputHandler();
        addKeyListener(inputHandler);
        addMouseListener(inputHandler);
        addMouseMotionListener(inputHandler);
        
        repaintTimer = new Timer(1000 / 60, this);
    }
    
    /**
     * 启动重绘计时器
     */
    public void startRepaint() {
        repaintTimer.start();
    }
    
    /**
     * 停止重绘计时器
     */
    public void stopRepaint() {
        repaintTimer.stop();
    }
    
    @Override
    public void actionPerformed(ActionEvent e) {
        repaint();
    }
    
    @Override
    protected void paintComponent(Graphics g) {
        super.paintComponent(g);
        
        if (bufferImage == null || 
            bufferImage.getWidth() != getWidth() || 
            bufferImage.getHeight() != getHeight()) {
            bufferImage = new BufferedImage(getWidth(), getHeight(), BufferedImage.TYPE_INT_ARGB);
            bufferGraphics = bufferImage.createGraphics();
            bufferGraphics.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            bufferGraphics.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        }
        
        if (bufferGraphics != null) {
            bufferGraphics.setColor(Color.BLACK);
            bufferGraphics.fillRect(0, 0, getWidth(), getHeight());
            
            gameController.render(bufferGraphics);
        }
        
        g.drawImage(bufferImage, 0, 0, null);
    }
    
    /**
     * 获取游戏控制器
     */
    public GameController getGameController() {
        return gameController;
    }
}
