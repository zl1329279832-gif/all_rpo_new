package com.game.planewar.input;

import com.game.planewar.core.GameController;

import java.awt.event.*;
import java.util.HashMap;
import java.util.Map;

/**
 * 输入处理器 - 处理键盘和鼠标输入
 */
public class InputHandler implements KeyListener, MouseListener, MouseMotionListener {
    
    private final GameController gameController;
    private final Map<Integer, Boolean> keyStates;
    private final Map<Integer, Boolean> keyJustPressed;
    
    private int mouseX;
    private int mouseY;
    private boolean mouseLeftPressed;
    private boolean mouseRightPressed;
    
    public InputHandler(GameController gameController) {
        this.gameController = gameController;
        this.keyStates = new HashMap<>();
        this.keyJustPressed = new HashMap<>();
    }
    
    /**
     * 更新输入状态（每帧调用）
     */
    public void update() {
        keyJustPressed.clear();
    }
    
    /**
     * 检查按键是否按住
     */
    public boolean isKeyPressed(int keyCode) {
        return keyStates.getOrDefault(keyCode, false);
    }
    
    /**
     * 检查按键是否刚刚按下（上一帧未按下，这一帧按下）
     */
    public boolean isKeyJustPressed(int keyCode) {
        return keyJustPressed.getOrDefault(keyCode, false);
    }
    
    /**
     * 检查方向键或WASD的移动方向
     */
    public float getHorizontalAxis() {
        float axis = 0;
        if (isKeyPressed(KeyEvent.VK_LEFT) || isKeyPressed(KeyEvent.VK_A)) {
            axis -= 1;
        }
        if (isKeyPressed(KeyEvent.VK_RIGHT) || isKeyPressed(KeyEvent.VK_D)) {
            axis += 1;
        }
        return axis;
    }
    
    /**
     * 检查垂直方向的移动
     */
    public float getVerticalAxis() {
        float axis = 0;
        if (isKeyPressed(KeyEvent.VK_UP) || isKeyPressed(KeyEvent.VK_W)) {
            axis -= 1;
        }
        if (isKeyPressed(KeyEvent.VK_DOWN) || isKeyPressed(KeyEvent.VK_S)) {
            axis += 1;
        }
        return axis;
    }
    
    /**
     * 检查是否在射击
     */
    public boolean isShooting() {
        return isKeyPressed(KeyEvent.VK_SPACE) || mouseLeftPressed;
    }
    
    @Override
    public void keyPressed(KeyEvent e) {
        int keyCode = e.getKeyCode();
        if (!keyStates.getOrDefault(keyCode, false)) {
            keyJustPressed.put(keyCode, true);
        }
        keyStates.put(keyCode, true);
        
        if (e.getKeyCode() == KeyEvent.VK_ESCAPE) {
            gameController.togglePause();
        }
        
        if (e.getKeyCode() == KeyEvent.VK_ENTER) {
            gameController.handleEnterKey();
        }
        
        if (e.getKeyCode() == KeyEvent.VK_P) {
            gameController.togglePause();
        }
        
        e.consume();
    }
    
    @Override
    public void keyReleased(KeyEvent e) {
        keyStates.put(e.getKeyCode(), false);
        e.consume();
    }
    
    @Override
    public void keyTyped(KeyEvent e) {
        gameController.handleKeyTyped(e.getKeyChar());
        e.consume();
    }
    
    @Override
    public void mousePressed(MouseEvent e) {
        if (e.getButton() == MouseEvent.BUTTON1) {
            mouseLeftPressed = true;
        } else if (e.getButton() == MouseEvent.BUTTON3) {
            mouseRightPressed = true;
        }
        gameController.handleMouseClick(e.getX(), e.getY());
    }
    
    @Override
    public void mouseReleased(MouseEvent e) {
        if (e.getButton() == MouseEvent.BUTTON1) {
            mouseLeftPressed = false;
        } else if (e.getButton() == MouseEvent.BUTTON3) {
            mouseRightPressed = false;
        }
    }
    
    @Override
    public void mouseEntered(MouseEvent e) {
    }
    
    @Override
    public void mouseExited(MouseEvent e) {
    }
    
    @Override
    public void mouseClicked(MouseEvent e) {
    }
    
    @Override
    public void mouseMoved(MouseEvent e) {
        mouseX = e.getX();
        mouseY = e.getY();
    }
    
    @Override
    public void mouseDragged(MouseEvent e) {
        mouseX = e.getX();
        mouseY = e.getY();
    }
    
    public int getMouseX() {
        return mouseX;
    }
    
    public int getMouseY() {
        return mouseY;
    }
    
    public boolean isMouseLeftPressed() {
        return mouseLeftPressed;
    }
    
    public boolean isMouseRightPressed() {
        return mouseRightPressed;
    }
}
