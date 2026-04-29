package com.sokoban.storage;

public class GamePreferences {
    private boolean soundEnabled;
    private String lastPlayedLevelId;
    private int windowWidth;
    private int windowHeight;

    public GamePreferences() {
        this.soundEnabled = true;
        this.lastPlayedLevelId = "level_001";
        this.windowWidth = 800;
        this.windowHeight = 600;
    }

    public boolean isSoundEnabled() {
        return soundEnabled;
    }

    public void setSoundEnabled(boolean soundEnabled) {
        this.soundEnabled = soundEnabled;
    }

    public String getLastPlayedLevelId() {
        return lastPlayedLevelId;
    }

    public void setLastPlayedLevelId(String lastPlayedLevelId) {
        this.lastPlayedLevelId = lastPlayedLevelId;
    }

    public int getWindowWidth() {
        return windowWidth;
    }

    public void setWindowWidth(int windowWidth) {
        this.windowWidth = windowWidth;
    }

    public int getWindowHeight() {
        return windowHeight;
    }

    public void setWindowHeight(int windowHeight) {
        this.windowHeight = windowHeight;
    }
}
