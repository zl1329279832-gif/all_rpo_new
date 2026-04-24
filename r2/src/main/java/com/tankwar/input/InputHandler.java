package com.tankwar.input;

import java.awt.event.KeyEvent;
import java.awt.event.KeyListener;
import java.util.HashSet;
import java.util.Set;

public class InputHandler implements KeyListener {
    private Set<Integer> pressedKeys;
    private Set<Integer> pressedThisFrame;

    public InputHandler() {
        this.pressedKeys = new HashSet<>();
        this.pressedThisFrame = new HashSet<>();
    }

    @Override
    public void keyPressed(KeyEvent e) {
        if (!pressedKeys.contains(e.getKeyCode())) {
            pressedThisFrame.add(e.getKeyCode());
        }
        pressedKeys.add(e.getKeyCode());
    }

    @Override
    public void keyReleased(KeyEvent e) {
        pressedKeys.remove(e.getKeyCode());
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
        return pressedThisFrame.contains(KeyEvent.VK_SPACE) ||
               pressedThisFrame.contains(KeyEvent.VK_CONTROL);
    }

    public boolean isPausePressed() {
        return pressedThisFrame.contains(KeyEvent.VK_ESCAPE) ||
               pressedThisFrame.contains(KeyEvent.VK_P);
    }

    public boolean isRestartPressed() {
        return pressedThisFrame.contains(KeyEvent.VK_R);
    }

    public void resetFrameState() {
        pressedThisFrame.clear();
    }
}
