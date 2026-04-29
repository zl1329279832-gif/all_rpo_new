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
            case KeyEvent.VK_UP, KeyEvent.VK_W -> lastDirection = Direction.UP;
            case KeyEvent.VK_DOWN, KeyEvent.VK_S -> lastDirection = Direction.DOWN;
            case KeyEvent.VK_LEFT, KeyEvent.VK_A -> lastDirection = Direction.LEFT;
            case KeyEvent.VK_RIGHT, KeyEvent.VK_D -> lastDirection = Direction.RIGHT;
            case KeyEvent.VK_Z -> {
                if (e.isControlDown() || e.isMetaDown()) {
                    undoPressed = true;
                }
            }
            case KeyEvent.VK_BACK_SPACE -> undoPressed = true;
            case KeyEvent.VK_R -> {
                if (e.isControlDown() || e.isMetaDown()) {
                    restartPressed = true;
                }
            }
            case KeyEvent.VK_ESCAPE, KeyEvent.VK_P -> pausePressed = true;
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
