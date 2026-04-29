package com.sokoban.entity;

public enum TileType {
    EMPTY(' ', false),
    FLOOR('.', true),
    WALL('#', false),
    TARGET('@', true),
    BOX('$', true),
    BOX_ON_TARGET('*', true),
    PLAYER('P', true),
    PLAYER_ON_TARGET('+', true);

    private final char symbol;
    private final boolean walkable;

    TileType(char symbol, boolean walkable) {
        this.symbol = symbol;
        this.walkable = walkable;
    }

    public char getSymbol() {
        return symbol;
    }

    public boolean isWalkable() {
        return walkable;
    }

    public static TileType fromSymbol(char symbol) {
        for (TileType type : values()) {
            if (type.symbol == symbol) {
                return type;
            }
        }
        return EMPTY;
    }
}
