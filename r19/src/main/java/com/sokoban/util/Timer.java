package com.sokoban.util;

public class Timer {
    private long startTime;
    private long pausedTime;
    private boolean isRunning;
    private boolean isPaused;

    public Timer() {
        reset();
    }

    public void start() {
        if (!isRunning) {
            startTime = System.currentTimeMillis();
            isRunning = true;
            isPaused = false;
        }
    }

    public void pause() {
        if (isRunning && !isPaused) {
            pausedTime = System.currentTimeMillis() - startTime;
            isPaused = true;
        }
    }

    public void resume() {
        if (isRunning && isPaused) {
            startTime = System.currentTimeMillis() - pausedTime;
            isPaused = false;
        }
    }

    public void stop() {
        if (isRunning) {
            isRunning = false;
            isPaused = false;
        }
    }

    public void reset() {
        startTime = 0;
        pausedTime = 0;
        isRunning = false;
        isPaused = false;
    }

    public long getElapsedMillis() {
        if (!isRunning) {
            return 0;
        }
        if (isPaused) {
            return pausedTime;
        }
        return System.currentTimeMillis() - startTime;
    }

    public long getElapsedSeconds() {
        return getElapsedMillis() / 1000;
    }

    public String getFormattedTime() {
        long seconds = getElapsedSeconds();
        long minutes = seconds / 60;
        long remainingSeconds = seconds % 60;
        return String.format("%02d:%02d", minutes, remainingSeconds);
    }

    public boolean isRunning() {
        return isRunning;
    }

    public boolean isPaused() {
        return isPaused;
    }
}
