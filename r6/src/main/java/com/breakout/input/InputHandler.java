package com.breakout.input;

import com.breakout.config.InputConfig;

import java.awt.event.KeyEvent;
import java.awt.event.KeyListener;
import java.util.BitSet;

public class InputHandler implements KeyListener {
    private final BitSet keys;
    private final BitSet keysPressed;
    private final BitSet keysReleased;

    public InputHandler() {
        this.keys = new BitSet(256);
        this.keysPressed = new BitSet(256);
        this.keysReleased = new BitSet(256);
    }

    @Override
    public void keyTyped(KeyEvent e) {
    }

    @Override
    public void keyPressed(KeyEvent e) {
        int keyCode = e.getKeyCode();
        if (keyCode >= 0 && keyCode < 256) {
            if (!keys.get(keyCode)) {
                keysPressed.set(keyCode);
            }
            keys.set(keyCode);
        }
    }

    @Override
    public void keyReleased(KeyEvent e) {
        int keyCode = e.getKeyCode();
        if (keyCode >= 0 && keyCode < 256) {
            keysReleased.set(keyCode);
            keys.clear(keyCode);
        }
    }

    public boolean isKeyDown(int keyCode) {
        return keys.get(keyCode);
    }

    public boolean isKeyPressed(int keyCode) {
        boolean pressed = keysPressed.get(keyCode);
        keysPressed.clear(keyCode);
        return pressed;
    }

    public boolean isKeyReleased(int keyCode) {
        boolean released = keysReleased.get(keyCode);
        keysReleased.clear(keyCode);
        return released;
    }

    public boolean isMoveLeft() {
        return isKeyDown(InputConfig.KEY_MOVE_LEFT) || isKeyDown(InputConfig.KEY_MOVE_LEFT_ALT);
    }

    public boolean isMoveRight() {
        return isKeyDown(InputConfig.KEY_MOVE_RIGHT) || isKeyDown(InputConfig.KEY_MOVE_RIGHT_ALT);
    }

    public boolean isPause() {
        return isKeyPressed(InputConfig.KEY_PAUSE) || isKeyPressed(InputConfig.KEY_PAUSE_ALT);
    }

    public boolean isStart() {
        return isKeyPressed(InputConfig.KEY_START);
    }

    public boolean isRestart() {
        return isKeyPressed(InputConfig.KEY_RESTART);
    }

    public boolean isQuit() {
        return isKeyPressed(InputConfig.KEY_QUIT);
    }

    public boolean isMenuUp() {
        return isKeyPressed(InputConfig.KEY_MENU_UP) || isKeyPressed(InputConfig.KEY_MENU_UP_ALT);
    }

    public boolean isMenuDown() {
        return isKeyPressed(InputConfig.KEY_MENU_DOWN) || isKeyPressed(InputConfig.KEY_MENU_DOWN_ALT);
    }

    public boolean isMenuSelect() {
        return isKeyPressed(InputConfig.KEY_MENU_SELECT);
    }

    public void clearPressed() {
        keysPressed.clear();
        keysReleased.clear();
    }

    public void update() {
        keysPressed.clear();
        keysReleased.clear();
    }
}
