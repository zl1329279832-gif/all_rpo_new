package com.tankwar.engine;

import java.io.Serializable;
import java.util.BitSet;

public class LevelProgressData implements Serializable {
    private static final long serialVersionUID = 1L;

    private BitSet unlockedLevels;
    private int highestCompletedLevel;

    public LevelProgressData() {
        this.unlockedLevels = new BitSet(5);
        this.unlockedLevels.set(0);
        this.highestCompletedLevel = 0;
    }

    public boolean isLevelUnlocked(int level) {
        if (level < 1 || level > 5) {
            return false;
        }
        return unlockedLevels.get(level - 1);
    }

    public void unlockLevel(int level) {
        if (level >= 1 && level <= 5) {
            unlockedLevels.set(level - 1);
        }
    }

    public void completeLevel(int level) {
        if (level >= 1 && level <= 5) {
            if (level > highestCompletedLevel) {
                highestCompletedLevel = level;
            }
            if (level < 5) {
                unlockLevel(level + 1);
            }
        }
    }

    public int getHighestCompletedLevel() {
        return highestCompletedLevel;
    }
}
