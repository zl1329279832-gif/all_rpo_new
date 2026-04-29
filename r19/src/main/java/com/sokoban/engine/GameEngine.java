package com.sokoban.engine;

import com.sokoban.entity.GameState;
import com.sokoban.level.Level;
import com.sokoban.level.LevelData;
import com.sokoban.util.Direction;
import com.sokoban.util.Position;
import com.sokoban.util.Timer;

import java.util.HashSet;
import java.util.Set;

public class GameEngine {
    private Level level;
    private Position playerPosition;
    private Set<Position> boxPositions;
    private int moves;
    private final Timer timer;
    private final UndoStack undoStack;
    private DeadlockDetector deadlockDetector;
    private RatingSystem ratingSystem;
    private boolean isPaused;
    private boolean isCompleted;
    private boolean isDeadlocked;

    public GameEngine() {
        this.timer = new Timer();
        this.undoStack = new UndoStack();
        this.isPaused = false;
        this.isCompleted = false;
        this.isDeadlocked = false;
    }

    public void loadLevel(Level level) {
        this.level = level;
        this.playerPosition = level.getPlayerStartPosition();
        this.boxPositions = new HashSet<>(level.getBoxStartPositions());
        this.moves = 0;
        this.deadlockDetector = new DeadlockDetector(level);
        this.ratingSystem = new RatingSystem(level.getLevelData());
        this.undoStack.clear();
        this.isCompleted = false;
        this.isDeadlocked = false;
        this.isPaused = false;
        timer.reset();
        timer.start();
    }

    public boolean movePlayer(Direction direction) {
        if (isCompleted || isPaused) {
            return false;
        }

        Position newPlayerPos = playerPosition.add(direction);

        if (!level.isWalkable(newPlayerPos)) {
            return false;
        }

        if (boxPositions.contains(newPlayerPos)) {
            Position newBoxPos = newPlayerPos.add(direction);

            if (!level.isWalkable(newBoxPos) || boxPositions.contains(newBoxPos)) {
                return false;
            }

            saveState();
            boxPositions.remove(newPlayerPos);
            boxPositions.add(newBoxPos);
        } else {
            saveState();
        }

        playerPosition = newPlayerPos;
        moves++;
        checkConditions();
        return true;
    }

    private void saveState() {
        GameState state = new GameState(playerPosition, boxPositions, moves);
        undoStack.push(state);
    }

    public boolean undo() {
        if (!undoStack.canUndo() || isCompleted) {
            return false;
        }

        GameState state = undoStack.pop();
        playerPosition = state.getPlayerPosition();
        boxPositions = state.getBoxPositions();
        moves = state.getMoves();
        isDeadlocked = false;
        return true;
    }

    public void restart() {
        if (level != null) {
            loadLevel(level);
        }
    }

    private void checkConditions() {
        if (checkWinCondition()) {
            isCompleted = true;
            timer.stop();
        } else if (deadlockDetector != null && deadlockDetector.isDeadlocked(boxPositions)) {
            isDeadlocked = true;
        }
    }

    private boolean checkWinCondition() {
        Set<Position> targets = level.getTargetPositions();
        for (Position target : targets) {
            if (!boxPositions.contains(target)) {
                return false;
            }
        }
        return true;
    }

    public void pause() {
        if (!isPaused && !isCompleted) {
            isPaused = true;
            timer.pause();
        }
    }

    public void resume() {
        if (isPaused) {
            isPaused = false;
            timer.resume();
        }
    }

    public int getStars() {
        if (!isCompleted || ratingSystem == null) {
            return 0;
        }
        return ratingSystem.calculateStars(moves, timer.getElapsedSeconds());
    }

    public String getRatingMessage() {
        if (ratingSystem == null) {
            return "";
        }
        return ratingSystem.getRatingMessage(getStars());
    }

    public Level getLevel() {
        return level;
    }

    public LevelData getLevelData() {
        return level != null ? level.getLevelData() : null;
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

    public String getFormattedTime() {
        return timer.getFormattedTime();
    }

    public long getElapsedSeconds() {
        return timer.getElapsedSeconds();
    }

    public boolean isPaused() {
        return isPaused;
    }

    public boolean isCompleted() {
        return isCompleted;
    }

    public boolean isDeadlocked() {
        return isDeadlocked;
    }

    public boolean canUndo() {
        return undoStack.canUndo();
    }

    public int getUndoCount() {
        return undoStack.size();
    }
}
