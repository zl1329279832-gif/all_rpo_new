package com.tankwar.engine;

import java.io.*;

public class GameSaveManager {
    private static final String SAVE_FILE_NAME = "tankwar_save.dat";

    public static void saveGame(GameSaveData saveData) {
        try (ObjectOutputStream oos = new ObjectOutputStream(
                new FileOutputStream(SAVE_FILE_NAME))) {
            oos.writeObject(saveData);
        } catch (IOException e) {
            System.err.println("保存游戏失败: " + e.getMessage());
        }
    }

    public static GameSaveData loadGame() {
        File saveFile = new File(SAVE_FILE_NAME);
        if (!saveFile.exists()) {
            return null;
        }

        try (ObjectInputStream ois = new ObjectInputStream(
                new FileInputStream(SAVE_FILE_NAME))) {
            return (GameSaveData) ois.readObject();
        } catch (IOException | ClassNotFoundException e) {
            System.err.println("加载游戏失败: " + e.getMessage());
            return null;
        }
    }

    public static boolean hasSaveData() {
        File saveFile = new File(SAVE_FILE_NAME);
        return saveFile.exists();
    }

    public static void deleteSave() {
        File saveFile = new File(SAVE_FILE_NAME);
        if (saveFile.exists()) {
            saveFile.delete();
        }
    }
}
