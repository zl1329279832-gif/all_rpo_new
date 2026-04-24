package com.tankwar.map;

import com.tankwar.util.GameConstants;

import java.util.ArrayList;
import java.util.List;

public class GameMap {
    private List<Wall> walls;
    private int level;

    public GameMap(int level) {
        this.level = level;
        this.walls = new ArrayList<>();
        generateLevel(level);
    }

    private void generateLevel(int level) {
        int[][] mapData = getLevelData(level);
        for (int y = 0; y < mapData.length; y++) {
            for (int x = 0; x < mapData[y].length; x++) {
                int tile = mapData[y][x];
                if (tile > 0) {
                    Wall.Type type;
                    switch (tile) {
                        case 1: type = Wall.Type.BRICK; break;
                        case 2: type = Wall.Type.STEEL; break;
                        case 3: type = Wall.Type.WATER; break;
                        case 4: type = Wall.Type.GRASS; break;
                        case 9: type = Wall.Type.BASE; break;
                        default: type = Wall.Type.BRICK;
                    }
                    walls.add(new Wall(x * GameConstants.TILE_SIZE, y * GameConstants.TILE_SIZE, type));
                }
            }
        }
    }

    private int[][] getLevelData(int level) {
        int mod = level % 3;
        if (mod == 1) {
            return getLevel1Data();
        } else if (mod == 2) {
            return getLevel2Data();
        } else {
            return getLevel3Data();
        }
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

    public boolean isBaseDestroyed() {
        return walls.stream()
                .filter(w -> w.getType() == Wall.Type.BASE)
                .allMatch(w -> !w.isActive());
    }
}
