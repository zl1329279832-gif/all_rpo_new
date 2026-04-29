package com.sokoban.input;

import com.sokoban.util.Direction;

import java.awt.event.KeyEvent;
import java.awt.event.KeyListener;
import java.util.HashMap;
import java.util.Map;

public class InputHandler implements KeyListener {
    private final Map<Integer, Boolean> keyStates;
    private Direction lastDirection;
    private boolean undoPressed;
    private boolean restartPressed;
    private boolean pausePressed;

    public InputHandler() {
        this.keyStates = new HashMap<>();
        reset();
    }

    public void reset() {
        keyStates.clear();
        lastDirection = null;
        undoPressed = false;
        restartPressed = false;
        pausePressed = false;
    }

    public Direction pollDirection() {
        Direction dir = lastDirection;
        lastDirection = null;
        return dir;
    }

    public boolean pollUndo() {
        boolean pressed = undoPressed;
        undoPressed = false;
        return pressed;
    }

    public boolean pollRestart() {
        boolean pressed = restartPressed;
        restartPressed = false;
        return pressed;
    }

    public boolean pollPause() {
        boolean pressed = pausePressed;
        pausePressed = false;
        return pressed;
    }

    @Override
    public void keyPressed(KeyEvent e) {
        int keyCode = e.getKeyCode();
        keyStates.put(keyCode, true);

        switch (keyCode) {
            case KeyEvent.VK_UP:
            case KeyEvent.VK_W:
                lastDirection = Direction.UP;
                break;
            case KeyEvent.VK_DOWN:
            case KeyEvent.VK_S:
                lastDirection = Direction.DOWN;
                break;
            case KeyEvent.VK_LEFT:
            case KeyEvent.VK_A:
                lastDirection = Direction.LEFT;
                break;
            case KeyEvent.VK_RIGHT:
            case KeyEvent.VK_D:
                lastDirection = Direction.RIGHT;
                break;
            case KeyEvent.VK_Z:
                undoPressed = true;
                break;
            case KeyEvent.VK_BACK_SPACE:
                undoPressed = true;
                break;
            case KeyEvent.VK_R:
                restartPressed = true;
                break;
            case KeyEvent.VK_ESCAPE:
            case KeyEvent.VK_P:
                pausePressed = true;
                break;
        }
    }

    @Override
    public void keyReleased(KeyEvent e) {
        keyStates.put(e.getKeyCode(), false);
    }

    @Override
    public void keyTyped(KeyEvent e) {
    }

    public boolean isKeyPressed(int keyCode) {
        return keyStates.getOrDefault(keyCode, false);
    }
}
