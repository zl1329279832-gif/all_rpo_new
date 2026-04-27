package com.tankwar.engine;

import java.io.*;

public class LevelProgressManager {
    private static final String PROGRESS_FILE_NAME = "tankwar_progress.dat";
    private static LevelProgressData instance;

    private LevelProgressManager() {}

    public static LevelProgressData getProgress() {
        if (instance == null) {
            instance = loadProgress();
        }
        return instance;
    }

    private static LevelProgressData loadProgress() {
        File progressFile = new File(PROGRESS_FILE_NAME);
        if (!progressFile.exists()) {
            return new LevelProgressData();
        }

        try (ObjectInputStream ois = new ObjectInputStream(
                new FileInputStream(PROGRESS_FILE_NAME))) {
            return (LevelProgressData) ois.readObject();
        } catch (IOException | ClassNotFoundException e) {
            System.err.println("加载关卡进度失败: " + e.getMessage());
            return new LevelProgressData();
        }
    }

    public static void saveProgress(LevelProgressData progress) {
        try (ObjectOutputStream oos = new ObjectOutputStream(
                new FileOutputStream(PROGRESS_FILE_NAME))) {
            oos.writeObject(progress);
        } catch (IOException e) {
            System.err.println("保存关卡进度失败: " + e.getMessage());
        }
    }

    public static boolean isLevelUnlocked(int level) {
        return getProgress().isLevelUnlocked(level);
    }

    public static void completeLevel(int level) {
        LevelProgressData progress = getProgress();
        progress.completeLevel(level);
        saveProgress(progress);
    }

    public static void unlockLevel(int level) {
        LevelProgressData progress = getProgress();
        progress.unlockLevel(level);
        saveProgress(progress);
    }

    public static int getHighestCompletedLevel() {
        return getProgress().getHighestCompletedLevel();
    }
}
