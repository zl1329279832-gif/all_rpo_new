package com.sokoban.storage;

public class RankingEntry {
    private String levelId;
    private String playerName;
    private int moves;
    private long timeSeconds;
    private int stars;
    private long timestamp;

    public RankingEntry() {
    }

    public RankingEntry(String levelId, String playerName, int moves, long timeSeconds, int stars) {
        this.levelId = levelId;
        this.playerName = playerName;
        this.moves = moves;
        this.timeSeconds = timeSeconds;
        this.stars = stars;
        this.timestamp = System.currentTimeMillis();
    }

    public String getLevelId() {
        return levelId;
    }

    public void setLevelId(String levelId) {
        this.levelId = levelId;
    }

    public String getPlayerName() {
        return playerName;
    }

    public void setPlayerName(String playerName) {
        this.playerName = playerName;
    }

    public int getMoves() {
        return moves;
    }

    public void setMoves(int moves) {
        this.moves = moves;
    }

    public long getTimeSeconds() {
        return timeSeconds;
    }

    public void setTimeSeconds(long timeSeconds) {
        this.timeSeconds = timeSeconds;
    }

    public int getStars() {
        return stars;
    }

    public void setStars(int stars) {
        this.stars = stars;
    }

    public long getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(long timestamp) {
        this.timestamp = timestamp;
    }
}
