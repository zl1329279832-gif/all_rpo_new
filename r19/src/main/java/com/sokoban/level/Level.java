package com.sokoban.level;

import com.sokoban.entity.TileType;
import com.sokoban.util.Position;

import java.util.HashSet;
import java.util.Set;

public class Level {
    private final LevelData levelData;
    private final TileType[][] tiles;
    private final Set<Position> targetPositions;
    private Position playerStartPosition;
    private Set<Position> boxStartPositions;
    private final int rows;
    private final int cols;

    public Level(LevelData levelData) {
        this.levelData = levelData;
        this.rows = levelData.getRows();
        this.cols = levelData.getCols();
        this.tiles = new TileType[rows][cols];
        this.targetPositions = new HashSet<>();
        this.boxStartPositions = new HashSet<>();
        parseMap();
    }

    private void parseMap() {
        for (int row = 0; row < rows; row++) {
            String line = levelData.getMap().get(row);
            for (int col = 0; col < cols; col++) {
                char symbol = col < line.length() ? line.charAt(col) : ' ';
                Position pos = new Position(col, row);
                parseTile(symbol, pos, row, col);
            }
        }
    }

    private void parseTile(char symbol, Position pos, int row, int col) {
        switch (symbol) {
            case '#':
                tiles[row][col] = TileType.WALL;
                break;
            case '.':
                tiles[row][col] = TileType.FLOOR;
                break;
            case '@':
                tiles[row][col] = TileType.FLOOR;
                targetPositions.add(pos);
                break;
            case '$':
                tiles[row][col] = TileType.FLOOR;
                boxStartPositions.add(pos);
                break;
            case '*':
                tiles[row][col] = TileType.FLOOR;
                targetPositions.add(pos);
                boxStartPositions.add(pos);
                break;
            case 'P':
                tiles[row][col] = TileType.FLOOR;
                playerStartPosition = pos;
                break;
            case '+':
                tiles[row][col] = TileType.FLOOR;
                targetPositions.add(pos);
                playerStartPosition = pos;
                break;
            case ' ':
                tiles[row][col] = TileType.EMPTY;
                break;
            default:
                tiles[row][col] = TileType.EMPTY;
                break;
        }
    }

    public LevelData getLevelData() {
        return levelData;
    }

    public TileType getTile(int row, int col) {
        if (row < 0 || row >= rows || col < 0 || col >= cols) {
            return TileType.WALL;
        }
        return tiles[row][col];
    }

    public TileType getTile(Position position) {
        return getTile(position.getY(), position.getX());
    }

    public boolean isTarget(Position position) {
        return targetPositions.contains(position);
    }

    public Set<Position> getTargetPositions() {
        return new HashSet<>(targetPositions);
    }

    public Position getPlayerStartPosition() {
        return playerStartPosition;
    }

    public Set<Position> getBoxStartPositions() {
        return new HashSet<>(boxStartPositions);
    }

    public int getRows() {
        return rows;
    }

    public int getCols() {
        return cols;
    }

    public boolean isValidPosition(Position position) {
        int x = position.getX();
        int y = position.getY();
        return x >= 0 && x < cols && y >= 0 && y < rows;
    }

    public boolean isWall(Position position) {
        return getTile(position) == TileType.WALL;
    }

    public boolean isWalkable(Position position) {
        TileType tile = getTile(position);
        return tile != TileType.WALL && tile != TileType.EMPTY;
    }
}
