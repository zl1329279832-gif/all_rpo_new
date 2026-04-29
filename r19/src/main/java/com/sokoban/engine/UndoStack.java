package com.sokoban.engine;

import com.sokoban.config.GameConfig;
import com.sokoban.entity.GameState;

import java.util.Stack;

public class UndoStack {
    private final Stack<GameState> states;
    private final int maxSize;

    public UndoStack() {
        this.states = new Stack<>();
        this.maxSize = GameConfig.MAX_UNDO_STEPS;
    }

    public void push(GameState state) {
        states.push(state);
        while (states.size() > maxSize) {
            states.remove(0);
        }
    }

    public GameState pop() {
        if (isEmpty()) {
            return null;
        }
        return states.pop();
    }

    public GameState peek() {
        if (isEmpty()) {
            return null;
        }
        return states.peek();
    }

    public boolean isEmpty() {
        return states.isEmpty();
    }

    public int size() {
        return states.size();
    }

    public void clear() {
        states.clear();
    }

    public boolean canUndo() {
        return !isEmpty();
    }
}
