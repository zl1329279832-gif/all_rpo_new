package com.tankwar.map;

import com.tankwar.util.GameConstants;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

public class GameMap {
    private List<Wall> walls;
    private int level;
    private GameConstants.GameMode gameMode;
    private int totalTargets;
    private Random random;

    public GameMap(int level) {
        this.level = level;
        this.gameMode = GameConstants.GameMode.PRACTICE;
        this.random = new Random();
        this.walls = new ArrayList<>();
        this.totalTargets = 0;
        generateLevel(level);
    }

    public GameMap(int level, GameConstants.GameMode mode) {
        this.level = level;
        this.gameMode = mode;
        long seed = 12345L + level * 1000;
        this.random = new Random(seed);
        this.walls = new ArrayList<>();
        this.totalTargets = 0;
        generateLevel(level);
    }

    private void generateLevel(int level) {
        if (gameMode == GameConstants.GameMode.BATTLE) {
            generateBattleLevel(level);
        } else {
            generatePracticeLevel(level);
        }
    }

    private void generatePracticeLevel(int level) {
        int[][] mapData = getPracticeLevelData(level);
        for (int y = 0; y < mapData.length; y++) {
            for (int x = 0; x < mapData[y].length; x++) {
                int tile = mapData[y][x];
                if (tile > 0) {
                    Wall.Type type = getWallType(tile);
                    walls.add(new Wall(x * GameConstants.TILE_SIZE, y * GameConstants.TILE_SIZE, type));
                }
            }
        }
    }

    private void generateBattleLevel(int level) {
        int[][] baseMap = getBattleBaseMap();

        for (int y = 0; y < baseMap.length; y++) {
            for (int x = 0; x < baseMap[y].length; x++) {
                int tile = baseMap[y][x];
                if (tile > 0) {
                    Wall.Type type = getWallType(tile);
                    walls.add(new Wall(x * GameConstants.TILE_SIZE, y * GameConstants.TILE_SIZE, type));
                }
            }
        }

        generateRandomTargets(level);
    }

    private void generateRandomTargets(int level) {
        int targetCount = 5 + level * 3;
        this.totalTargets = targetCount;

        List<java.awt.Point> availablePositions = new ArrayList<>();

        for (int y = 2; y < 14; y++) {
            for (int x = 2; x < 18; x++) {
                if (isValidTargetPosition(x, y)) {
                    availablePositions.add(new java.awt.Point(x, y));
                }
            }
        }

        for (int i = 0; i < targetCount && !availablePositions.isEmpty(); i++) {
            int index = random.nextInt(availablePositions.size());
            java.awt.Point pos = availablePositions.remove(index);

            walls.add(new Wall(pos.x * GameConstants.TILE_SIZE, pos.y * GameConstants.TILE_SIZE, Wall.Type.TARGET));

            removeNearbyPositions(availablePositions, pos.x, pos.y, 2);
        }
    }

    private boolean isValidTargetPosition(int x, int y) {
        if (y >= 12 && x >= 8 && x <= 11) {
            return false;
        }

        if (y >= 9 && x >= 9 && x <= 10) {
            return false;
        }

        int pixelX = x * GameConstants.TILE_SIZE;
        int pixelY = y * GameConstants.TILE_SIZE;
        java.awt.Rectangle rect = new java.awt.Rectangle(pixelX, pixelY, GameConstants.TILE_SIZE, GameConstants.TILE_SIZE);

        for (Wall wall : walls) {
            if (wall.getBounds().intersects(rect)) {
                return false;
            }
        }

        return true;
    }

    private void removeNearbyPositions(List<java.awt.Point> positions, int x, int y, int distance) {
        positions.removeIf(p -> Math.abs(p.x - x) <= distance && Math.abs(p.y - y) <= distance);
    }

    private Wall.Type getWallType(int tile) {
        switch (tile) {
            case 1: return Wall.Type.BRICK;
            case 2: return Wall.Type.STEEL;
            case 3: return Wall.Type.WATER;
            case 4: return Wall.Type.GRASS;
            case 5: return Wall.Type.TARGET;
            case 9: return Wall.Type.BASE;
            default: return Wall.Type.BRICK;
        }
    }

    private int[][] getPracticeLevelData(int level) {
        int mod = level % 3;
        if (mod == 1) {
            return getLevel1Data();
        } else if (mod == 2) {
            return getLevel2Data();
        } else {
            return getLevel3Data();
        }
    }

    private int[][] getBattleBaseMap() {
        int[][] map = new int[16][20];

        for (int x = 0; x < 20; x++) {
            map[0][x] = 2;
            map[15][x] = 2;
        }
        for (int y = 0; y < 16; y++) {
            map[y][0] = 2;
            map[y][19] = 2;
        }

        map[14][9] = 9;
        map[14][10] = 9;
        map[13][9] = 9;
        map[13][10] = 9;
        map[12][8] = 1;
        map[12][11] = 1;
        map[13][8] = 1;
        map[13][11] = 1;
        map[14][8] = 1;
        map[14][11] = 1;

        return map;
    }

    private int[][] getLevel1Data() {
        int[][] map = new int[16][20];

        for (int x = 0; x < 20; x++) {
            map[0][x] = 2;
            map[15][x] = 2;
        }
        for (int y = 0; y < 16; y++) {
            map[y][0] = 2;
            map[y][19] = 2;
        }

        for (int y = 2; y < 6; y++) {
            for (int x = 2; x < 6; x++) {
                map[y][x] = 1;
            }
        }

        for (int y = 10; y < 14; y++) {
            for (int x = 14; x < 18; x++) {
                map[y][x] = 1;
            }
        }

        for (int x = 8; x < 12; x++) {
            map[7][x] = 1;
            map[8][x] = 1;
        }

        map[14][9] = 9;
        map[14][10] = 9;
        map[13][9] = 9;
        map[13][10] = 9;
        map[12][8] = 1;
        map[12][11] = 1;
        map[13][8] = 1;
        map[13][11] = 1;
        map[14][8] = 1;
        map[14][11] = 1;

        return map;
    }

    private int[][] getLevel2Data() {
        int[][] map = getLevel1Data();

        for (int y = 4; y < 12; y += 2) {
            for (int x = 4; x < 16; x += 4) {
                map[y][x] = 2;
                map[y][x + 1] = 2;
            }
        }

        for (int y = 5; y < 9; y++) {
            for (int x = 5; x < 9; x++) {
                map[y][x] = 3;
            }
        }

        return map;
    }

    private int[][] getLevel3Data() {
        int[][] map = getLevel2Data();

        for (int y = 2; y < 5; y++) {
            for (int x = 14; x < 18; x++) {
                map[y][x] = 4;
            }
        }

        for (int y = 11; y < 14; y++) {
            for (int x = 2; x < 6; x++) {
                map[y][x] = 4;
            }
        }

        return map;
    }

    public void update() {
        walls.removeIf(wall -> !wall.isActive());
    }

    public List<Wall> getWalls() {
        return walls;
    }

    public int getLevel() {
        return level;
    }

    public GameConstants.GameMode getGameMode() {
        return gameMode;
    }

    public int getTotalTargets() {
        return totalTargets;
    }

    public int getDestroyedTargets() {
        if (gameMode != GameConstants.GameMode.BATTLE) return 0;
        int total = 0;
        int destroyed = 0;
        for (Wall wall : walls) {
            if (wall.getType() == Wall.Type.TARGET) {
                total++;
                if (!wall.isActive()) {
                    destroyed++;
                }
            }
        }
        return totalTargets - total;
    }

    public boolean allTargetsDestroyed() {
        if (gameMode != GameConstants.GameMode.BATTLE) return false;
        for (Wall wall : walls) {
            if (wall.getType() == Wall.Type.TARGET && wall.isActive()) {
                return false;
            }
        }
        return true;
    }

    public boolean isBaseDestroyed() {
        return walls.stream()
                .filter(w -> w.getType() == Wall.Type.BASE)
                .allMatch(w -> !w.isActive());
    }
}
