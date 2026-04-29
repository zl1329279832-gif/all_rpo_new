package com.sokoban.engine;

import com.sokoban.config.GameConfig;
import com.sokoban.level.LevelData;

public class RatingSystem {
    private final LevelData levelData;

    public RatingSystem(LevelData levelData) {
        this.levelData = levelData;
    }

    public int calculateStars(int moves, long timeSeconds) {
        int parMoves = levelData.getParMoves();
        int parTime = levelData.getParTime();
        
        double moveRatio = (double) moves / parMoves;
        double timeRatio = (double) timeSeconds / parTime;
        
        double overallRatio = Math.max(moveRatio, timeRatio);
        
        if (overallRatio <= GameConfig.RATING_THREE_STAR_MULTIPLIER) {
            return 3;
        } else if (overallRatio <= GameConfig.RATING_TWO_STAR_MULTIPLIER) {
            return 2;
        } else if (overallRatio <= GameConfig.RATING_ONE_STAR_MULTIPLIER) {
            return 1;
        }
        
        return 1;
    }

    public String getRatingMessage(int stars) {
        switch (stars) {
            case 3:
                return "完美通关！";
            case 2:
                return "做得不错！";
            case 1:
                return "还可以更好！";
            default:
                return "继续努力！";
        }
    }

    public static String formatStars(int stars) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 3; i++) {
            if (i < stars) {
                sb.append("★");
            } else {
                sb.append("☆");
            }
        }
        return sb.toString();
    }
}
