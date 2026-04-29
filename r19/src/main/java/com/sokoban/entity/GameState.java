package com.sokoban.entity;

import com.sokoban.util.Position;

import java.util.HashSet;
import java.util.Set;

public class GameState {
    private final Position playerPosition;
    private final Set<Position> boxPositions;
    private final int moves;

    public GameState(Position playerPosition, Set<Position> boxPositions, int moves) {
        this.playerPosition = playerPosition;
        this.boxPositions = new HashSet<>(boxPositions);
        this.moves = moves;
    }

    public Position getPlayerPosition() {
        return playerPosition;
    }

    public Set<Position> getBoxPositions() {
        return new HashSet<>(boxPositions);
    }

    public int getMoves() {
        return moves;
    }
}
