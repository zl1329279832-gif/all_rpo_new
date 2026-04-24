package com.breakout.level;

import com.breakout.config.GameConfig;
import com.breakout.entity.Brick;
import com.breakout.entity.BrickType;

public class LevelGenerator {

    public Level generateLevel(int levelNumber) {
        int maxLevel = GameConfig.MAX_LEVELS;
        int displayLevel = levelNumber % maxLevel;
        if (displayLevel == 0) displayLevel = maxLevel;
        
        int difficultyMultiplier = ((levelNumber - 1) / maxLevel) + 1;
        
        switch (displayLevel) {
            case 1 -> {
                return generateLevel1(levelNumber, difficultyMultiplier);
            }
            case 2 -> {
                return generateLevel2(levelNumber, difficultyMultiplier);
            }
            case 3 -> {
                return generateLevel3(levelNumber, difficultyMultiplier);
            }
            case 4 -> {
                return generateLevel4(levelNumber, difficultyMultiplier);
            }
            case 5 -> {
                return generateLevel5(levelNumber, difficultyMultiplier);
            }
            case 6 -> {
                return generateLevel6(levelNumber, difficultyMultiplier);
            }
            case 7 -> {
                return generateLevel7(levelNumber, difficultyMultiplier);
            }
            case 8 -> {
                return generateLevel8(levelNumber, difficultyMultiplier);
            }
            case 9 -> {
                return generateLevel9(levelNumber, difficultyMultiplier);
            }
            case 10 -> {
                return generateLevel10(levelNumber, difficultyMultiplier);
            }
            default -> {
                return generateRandomLevel(levelNumber, difficultyMultiplier);
            }
        }
    }

    private Level generateLevel1(int levelNumber, int difficulty) {
        Level level = new Level(levelNumber, "新手入门", 4, 10);
        int brickWidth = GameConfig.BRICK_WIDTH;
        int brickHeight = GameConfig.BRICK_HEIGHT;
        int spacing = GameConfig.BRICK_SPACING;
        int topOffset = GameConfig.BRICK_TOP_OFFSET;
        int leftOffset = GameConfig.BRICK_LEFT_OFFSET;

        for (int row = 0; row < 4; row++) {
            for (int col = 0; col < 10; col++) {
                double x = leftOffset + col * (brickWidth + spacing);
                double y = topOffset + row * (brickHeight + spacing);
                Brick brick = new Brick(x, y, BrickType.NORMAL);
                level.addBrick(brick);
            }
        }
        return level;
    }

    private Level generateLevel2(int levelNumber, int difficulty) {
        Level level = new Level(levelNumber, "双色挑战", 5, 10);
        int brickWidth = GameConfig.BRICK_WIDTH;
        int brickHeight = GameConfig.BRICK_HEIGHT;
        int spacing = GameConfig.BRICK_SPACING;
        int topOffset = GameConfig.BRICK_TOP_OFFSET;
        int leftOffset = GameConfig.BRICK_LEFT_OFFSET;

        for (int row = 0; row < 5; row++) {
            for (int col = 0; col < 10; col++) {
                double x = leftOffset + col * (brickWidth + spacing);
                double y = topOffset + row * (brickHeight + spacing);
                BrickType type = (row == 0 || row == 4) ? BrickType.TWO_HIT : BrickType.NORMAL;
                Brick brick = new Brick(x, y, type);
                level.addBrick(brick);
            }
        }
        return level;
    }

    private Level generateLevel3(int levelNumber, int difficulty) {
        Level level = new Level(levelNumber, "金字塔", 6, 11);
        int brickWidth = GameConfig.BRICK_WIDTH;
        int brickHeight = GameConfig.BRICK_HEIGHT;
        int spacing = GameConfig.BRICK_SPACING;
        int topOffset = GameConfig.BRICK_TOP_OFFSET;
        int centerX = GameConfig.WINDOW_WIDTH / 2;

        for (int row = 0; row < 6; row++) {
            int bricksInRow = row + 1;
            double rowWidth = bricksInRow * brickWidth + (bricksInRow - 1) * spacing;
            double startX = centerX - rowWidth / 2;

            for (int col = 0; col < bricksInRow; col++) {
                double x = startX + col * (brickWidth + spacing);
                double y = topOffset + row * (brickHeight + spacing);
                BrickType type;
                if (row < 2) {
                    type = BrickType.NORMAL;
                } else if (row < 4) {
                    type = BrickType.TWO_HIT;
                } else {
                    type = BrickType.THREE_HIT;
                }
                Brick brick = new Brick(x, y, type);
                level.addBrick(brick);
            }
        }
        return level;
    }

    private Level generateLevel4(int levelNumber, int difficulty) {
        Level level = new Level(levelNumber, "迷宫", 6, 10);
        int brickWidth = GameConfig.BRICK_WIDTH;
        int brickHeight = GameConfig.BRICK_HEIGHT;
        int spacing = GameConfig.BRICK_SPACING;
        int topOffset = GameConfig.BRICK_TOP_OFFSET;
        int leftOffset = GameConfig.BRICK_LEFT_OFFSET;

        boolean[][] pattern = {
            {true, true, true, true, true, true, true, true, true, true},
            {true, false, false, false, false, false, false, false, false, true},
            {true, false, true, true, true, true, true, true, false, true},
            {true, false, true, false, false, false, false, true, false, true},
            {true, false, false, false, true, true, false, false, false, true},
            {true, true, true, true, true, true, true, true, true, true}
        };

        for (int row = 0; row < 6; row++) {
            for (int col = 0; col < 10; col++) {
                if (pattern[row][col]) {
                    double x = leftOffset + col * (brickWidth + spacing);
                    double y = topOffset + row * (brickHeight + spacing);
                    BrickType type;
                    if (row == 0 || row == 5 || col == 0 || col == 9) {
                        type = BrickType.INDESTRUCTIBLE;
                    } else if ((row + col) % 3 == 0) {
                        type = BrickType.TWO_HIT;
                    } else {
                        type = BrickType.NORMAL;
                    }
                    Brick brick = new Brick(x, y, type);
                    level.addBrick(brick);
                }
            }
        }
        return level;
    }

    private Level generateLevel5(int levelNumber, int difficulty) {
        Level level = new Level(levelNumber, "阶梯", 5, 10);
        int brickWidth = GameConfig.BRICK_WIDTH;
        int brickHeight = GameConfig.BRICK_HEIGHT;
        int spacing = GameConfig.BRICK_SPACING;
        int topOffset = GameConfig.BRICK_TOP_OFFSET;
        int leftOffset = GameConfig.BRICK_LEFT_OFFSET;

        for (int row = 0; row < 5; row++) {
            for (int col = row; col < 10 - row; col++) {
                double x = leftOffset + col * (brickWidth + spacing);
                double y = topOffset + row * (brickHeight + spacing);
                BrickType type;
                if (row == 4) {
                    type = BrickType.THREE_HIT;
                } else if (row == 3) {
                    type = BrickType.TWO_HIT;
                } else {
                    type = BrickType.NORMAL;
                }
                Brick brick = new Brick(x, y, type);
                level.addBrick(brick);
            }
        }
        return level;
    }

    private Level generateLevel6(int levelNumber, int difficulty) {
        Level level = new Level(levelNumber, "淘金热", 5, 10);
        int brickWidth = GameConfig.BRICK_WIDTH;
        int brickHeight = GameConfig.BRICK_HEIGHT;
        int spacing = GameConfig.BRICK_SPACING;
        int topOffset = GameConfig.BRICK_TOP_OFFSET;
        int leftOffset = GameConfig.BRICK_LEFT_OFFSET;

        for (int row = 0; row < 5; row++) {
            for (int col = 0; col < 10; col++) {
                double x = leftOffset + col * (brickWidth + spacing);
                double y = topOffset + row * (brickHeight + spacing);
                BrickType type;
                if ((row == 2 && (col == 3 || col == 4 || col == 5 || col == 6)) ||
                    (row == 0 && col == 0) || (row == 0 && col == 9) ||
                    (row == 4 && col == 0) || (row == 4 && col == 9)) {
                    type = BrickType.GOLD;
                } else if (row == 0 || row == 4) {
                    type = BrickType.TWO_HIT;
                } else {
                    type = BrickType.NORMAL;
                }
                Brick brick = new Brick(x, y, type, type == BrickType.GOLD);
                level.addBrick(brick);
            }
        }
        return level;
    }

    private Level generateLevel7(int levelNumber, int difficulty) {
        Level level = new Level(levelNumber, "钻石", 5, 9);
        int brickWidth = GameConfig.BRICK_WIDTH;
        int brickHeight = GameConfig.BRICK_HEIGHT;
        int spacing = GameConfig.BRICK_SPACING;
        int topOffset = GameConfig.BRICK_TOP_OFFSET;
        int centerX = GameConfig.WINDOW_WIDTH / 2;

        int[] rowPattern = {1, 3, 5, 7, 9, 7, 5, 3, 1};
        int startY = topOffset;

        for (int i = 0; i < rowPattern.length; i++) {
            int bricksInRow = rowPattern[i];
            double rowWidth = bricksInRow * brickWidth + (bricksInRow - 1) * spacing;
            double startX = centerX - rowWidth / 2;

            for (int col = 0; col < bricksInRow; col++) {
                double x = startX + col * (brickWidth + spacing);
                double y = startY + i * (brickHeight + spacing);
                BrickType type;
                if (i == 0 || i == rowPattern.length - 1) {
                    type = BrickType.THREE_HIT;
                } else if (i == 1 || i == rowPattern.length - 2) {
                    type = BrickType.TWO_HIT;
                } else {
                    type = BrickType.NORMAL;
                }
                Brick brick = new Brick(x, y, type);
                level.addBrick(brick);
            }
        }
        return level;
    }

    private Level generateLevel8(int levelNumber, int difficulty) {
        Level level = new Level(levelNumber, "堡垒", 6, 10);
        int brickWidth = GameConfig.BRICK_WIDTH;
        int brickHeight = GameConfig.BRICK_HEIGHT;
        int spacing = GameConfig.BRICK_SPACING;
        int topOffset = GameConfig.BRICK_TOP_OFFSET;
        int leftOffset = GameConfig.BRICK_LEFT_OFFSET;

        for (int row = 0; row < 6; row++) {
            for (int col = 0; col < 10; col++) {
                double x = leftOffset + col * (brickWidth + spacing);
                double y = topOffset + row * (brickHeight + spacing);
                BrickType type;
                
                if (row == 0) {
                    type = BrickType.INDESTRUCTIBLE;
                } else if (col == 0 || col == 9) {
                    type = BrickType.INDESTRUCTIBLE;
                } else if (row == 5) {
                    type = BrickType.THREE_HIT;
                } else if (row == 4) {
                    type = BrickType.TWO_HIT;
                } else {
                    type = BrickType.NORMAL;
                }
                
                if (!(row > 0 && row < 5 && col >= 4 && col <= 5)) {
                    Brick brick = new Brick(x, y, type);
                    level.addBrick(brick);
                }
            }
        }
        return level;
    }

    private Level generateLevel9(int levelNumber, int difficulty) {
        Level level = new Level(levelNumber, "彩虹", 7, 10);
        int brickWidth = GameConfig.BRICK_WIDTH;
        int brickHeight = GameConfig.BRICK_HEIGHT;
        int spacing = GameConfig.BRICK_SPACING;
        int topOffset = GameConfig.BRICK_TOP_OFFSET;
        int leftOffset = GameConfig.BRICK_LEFT_OFFSET;

        for (int row = 0; row < 7; row++) {
            for (int col = 0; col < 10; col++) {
                double x = leftOffset + col * (brickWidth + spacing);
                double y = topOffset + row * (brickHeight + spacing);
                BrickType type;
                
                switch (row) {
                    case 0:
                        type = BrickType.INDESTRUCTIBLE;
                        break;
                    case 1:
                        type = BrickType.THREE_HIT;
                        break;
                    case 2:
                        type = BrickType.TWO_HIT;
                        break;
                    case 3:
                        type = BrickType.GOLD;
                        break;
                    case 4:
                        type = BrickType.NORMAL;
                        break;
                    case 5:
                        type = BrickType.NORMAL;
                        break;
                    default:
                        type = BrickType.NORMAL;
                }
                
                Brick brick = new Brick(x, y, type, type == BrickType.GOLD);
                level.addBrick(brick);
            }
        }
        return level;
    }

    private Level generateLevel10(int levelNumber, int difficulty) {
        Level level = new Level(levelNumber, "终极挑战", 8, 10);
        int brickWidth = GameConfig.BRICK_WIDTH;
        int brickHeight = GameConfig.BRICK_HEIGHT;
        int spacing = GameConfig.BRICK_SPACING;
        int topOffset = GameConfig.BRICK_TOP_OFFSET;
        int leftOffset = GameConfig.BRICK_LEFT_OFFSET;

        for (int row = 0; row < 8; row++) {
            for (int col = 0; col < 10; col++) {
                double x = leftOffset + col * (brickWidth + spacing);
                double y = topOffset + row * (brickHeight + spacing);
                BrickType type;
                
                if (row == 0 || row == 7) {
                    type = BrickType.INDESTRUCTIBLE;
                } else if (col == 0 || col == 9) {
                    type = BrickType.INDESTRUCTIBLE;
                } else if (row == 1 || row == 6) {
                    type = BrickType.THREE_HIT;
                } else if (row == 2 || row == 5) {
                    type = BrickType.TWO_HIT;
                } else if ((row + col) % 5 == 0) {
                    type = BrickType.GOLD;
                } else {
                    type = BrickType.NORMAL;
                }
                
                if (!(row > 0 && row < 7 && col >= 4 && col <= 5 && row != 3 && row != 4)) {
                    Brick brick = new Brick(x, y, type, type == BrickType.GOLD);
                    level.addBrick(brick);
                }
            }
        }
        return level;
    }

    private Level generateRandomLevel(int levelNumber, int difficulty) {
        Level level = new Level(levelNumber, "随机关卡", 6, 10);
        int brickWidth = GameConfig.BRICK_WIDTH;
        int brickHeight = GameConfig.BRICK_HEIGHT;
        int spacing = GameConfig.BRICK_SPACING;
        int topOffset = GameConfig.BRICK_TOP_OFFSET;
        int leftOffset = GameConfig.BRICK_LEFT_OFFSET;

        for (int row = 0; row < 6; row++) {
            for (int col = 0; col < 10; col++) {
                if (Math.random() > 0.2) {
                    double x = leftOffset + col * (brickWidth + spacing);
                    double y = topOffset + row * (brickHeight + spacing);
                    
                    double rand = Math.random();
                    BrickType type;
                    if (rand < 0.5) {
                        type = BrickType.NORMAL;
                    } else if (rand < 0.7) {
                        type = BrickType.TWO_HIT;
                    } else if (rand < 0.85) {
                        type = BrickType.THREE_HIT;
                    } else if (rand < 0.95) {
                        type = BrickType.GOLD;
                    } else {
                        type = BrickType.INDESTRUCTIBLE;
                    }
                    
                    Brick brick = new Brick(x, y, type, type == BrickType.GOLD);
                    level.addBrick(brick);
                }
            }
        }
        return level;
    }
}
