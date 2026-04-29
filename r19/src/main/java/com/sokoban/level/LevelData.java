package com.sokoban.level;

import java.util.List;

public class LevelData {
    private String id;
    private String name;
    private int difficulty;
    private int parMoves;
    private int parTime;
    private List<String> map;

    public LevelData() {
    }

    public LevelData(String id, String name, int difficulty, int parMoves, int parTime, List<String> map) {
        this.id = id;
        this.name = name;
        this.difficulty = difficulty;
        this.parMoves = parMoves;
        this.parTime = parTime;
        this.map = map;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(int difficulty) {
        this.difficulty = difficulty;
    }

    public int getParMoves() {
        return parMoves;
    }

    public void setParMoves(int parMoves) {
        this.parMoves = parMoves;
    }

    public int getParTime() {
        return parTime;
    }

    public void setParTime(int parTime) {
        this.parTime = parTime;
    }

    public List<String> getMap() {
        return map;
    }

    public void setMap(List<String> map) {
        this.map = map;
    }

    public int getRows() {
        return map != null ? map.size() : 0;
    }

    public int getCols() {
        if (map == null || map.isEmpty()) {
            return 0;
        }
        return map.stream()
                .mapToInt(String::length)
                .max()
                .orElse(0);
    }
}
