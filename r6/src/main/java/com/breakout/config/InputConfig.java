package com.breakout.config;

import java.awt.event.KeyEvent;

public final class InputConfig {

    public static final int KEY_MOVE_LEFT = KeyEvent.VK_LEFT;
    public static final int KEY_MOVE_LEFT_ALT = KeyEvent.VK_A;
    public static final int KEY_MOVE_RIGHT = KeyEvent.VK_RIGHT;
    public static final int KEY_MOVE_RIGHT_ALT = KeyEvent.VK_D;
    
    public static final int KEY_PAUSE = KeyEvent.VK_ESCAPE;
    public static final int KEY_PAUSE_ALT = KeyEvent.VK_P;
    public static final int KEY_START = KeyEvent.VK_SPACE;
    public static final int KEY_RESTART = KeyEvent.VK_R;
    public static final int KEY_QUIT = KeyEvent.VK_Q;
    
    public static final int KEY_MENU_UP = KeyEvent.VK_UP;
    public static final int KEY_MENU_UP_ALT = KeyEvent.VK_W;
    public static final int KEY_MENU_DOWN = KeyEvent.VK_DOWN;
    public static final int KEY_MENU_DOWN_ALT = KeyEvent.VK_S;
    public static final int KEY_MENU_SELECT = KeyEvent.VK_ENTER;

    private InputConfig() {
    }
}
