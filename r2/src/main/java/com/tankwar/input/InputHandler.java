package com.tankwar.input;

import java.awt.event.KeyEvent;
import java.awt.event.KeyListener;
import java.util.HashSet;
import java.util.Set;

public class InputHandler implements KeyListener {
    private Set<Integer> pressedKeys;
    private boolean shooting;
    private boolean shotThisFrame;

    public InputHandler() {
        this.pressedKeys = new HashSet<>();
        this.shooting = false;
        this.shotThisFrame = false;
    }

    @Override
    public void keyPressed(KeyEvent e) {
        pressedKeys.add(e.getKeyCode());
        if (e.getKeyCode() == KeyEvent.VK_SPACE || e.getKeyCode() == KeyEvent.VK_CONTROL) {
            if (!shooting) {
                shooting = true;
                shotThisFrame = true;
            }
        }
    }

    @Override
    public void keyReleased(KeyEvent e) {
        pressedKeys.remove(e.getKeyCode());
        if (e.getKeyCode() == KeyEvent.VK_SPACE || e.getKeyCode() == KeyEvent.VK_CONTROL) {
            shooting = false;
        }
    }

    @Override
    public void keyTyped(KeyEvent e) {
    }

    public boolean isUpPressed() {
        return pressedKeys.contains(KeyEvent.VK_W) || pressedKeys.contains(KeyEvent.VK_UP);
    }

    public boolean isDownPressed() {
        return pressedKeys.contains(KeyEvent.VK_S) || pressedKeys.contains(KeyEvent.VK_DOWN);
    }

    public boolean isLeftPressed() {
        return pressedKeys.contains(KeyEvent.VK_A) || pressedKeys.contains(KeyEvent.VK_LEFT);
    }

    public boolean isRightPressed() {
        return pressedKeys.contains(KeyEvent.VK_D) || pressedKeys.contains(KeyEvent.VK_RIGHT);
    }

    public boolean isShooting() {
        return shotThisFrame;
    }

    public void resetShotFlag() {
        shotThisFrame = false;
    }

    public boolean isPausePressed() {
        return pressedKeys.contains(KeyEvent.VK_ESCAPE) || pressedKeys.contains(KeyEvent.VK_P);
    }

    public boolean isRestartPressed() {
        return pressedKeys.contains(KeyEvent.VK_R);
    }
}
