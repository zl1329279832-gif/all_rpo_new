package com.breakout.level;

import java.util.ArrayList;
import java.util.List;

public class LevelManager {
    private final LevelGenerator levelGenerator;
    private Level currentLevel;
    private int currentLevelNumber;
    private final List<Level> loadedLevels;

    public LevelManager() {
        this.levelGenerator = new LevelGenerator();
        this.currentLevelNumber = 1;
        this.loadedLevels = new ArrayList<>();
        loadLevel(1);
    }

    public void loadLevel(int levelNumber) {
        this.currentLevelNumber = levelNumber;
        this.currentLevel = levelGenerator.generateLevel(levelNumber);
        loadedLevels.add(currentLevel);
    }

    public void nextLevel() {
        loadLevel(currentLevelNumber + 1);
    }

    public void resetCurrentLevel() {
        if (currentLevel != null) {
            currentLevel.reset();
        }
    }

    public void restartFromBeginning() {
        currentLevelNumber = 1;
        loadedLevels.clear();
        loadLevel(1);
    }

    public Level getCurrentLevel() {
        return currentLevel;
    }

    public int getCurrentLevelNumber() {
        return currentLevelNumber;
    }

    public boolean isLevelComplete() {
        return currentLevel != null && currentLevel.isComplete();
    }

    public int getDestroyableBrickCount() {
        return currentLevel != null ? currentLevel.getDestroyableBrickCount() : 0;
    }

    public int getActiveBrickCount() {
        return currentLevel != null ? currentLevel.getActiveBrickCount() : 0;
    }

    public String getCurrentLevelName() {
        return currentLevel != null ? currentLevel.getName() : "未知关卡";
    }
}
