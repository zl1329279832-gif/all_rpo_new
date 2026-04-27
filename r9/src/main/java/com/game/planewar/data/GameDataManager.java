package com.game.planewar.data;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

/**
 * 游戏数据管理器 - 负责本地文件持久化
 */
public class GameDataManager {
    
    private static final String SAVE_DIR = "save";
    private static final String CONFIG_FILE = "config.dat";
    private static final String LEADERBOARD_FILE = "leaderboard.dat";
    private static final String SAVE_FILE = "savegame.dat";
    
    private GameConfig config;
    private List<ScoreEntry> leaderboard;
    private SaveGame saveGame;
    
    private Path saveDirPath;
    private Path configPath;
    private Path leaderboardPath;
    private Path saveGamePath;
    
    public GameDataManager() {
        initPaths();
        this.config = new GameConfig();
        this.leaderboard = new ArrayList<>();
        this.saveGame = new SaveGame();
    }
    
    /**
     * 初始化路径
     */
    private void initPaths() {
        String userDir = System.getProperty("user.dir");
        saveDirPath = Paths.get(userDir, SAVE_DIR);
        configPath = saveDirPath.resolve(CONFIG_FILE);
        leaderboardPath = saveDirPath.resolve(LEADERBOARD_FILE);
        saveGamePath = saveDirPath.resolve(SAVE_FILE);
    }
    
    /**
     * 确保保存目录存在
     */
    private void ensureSaveDirectory() {
        try {
            if (!Files.exists(saveDirPath)) {
                Files.createDirectories(saveDirPath);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
    
    /**
     * 加载所有数据
     */
    public void loadAll() {
        ensureSaveDirectory();
        loadConfig();
        loadLeaderboard();
        loadSaveGame();
    }
    
    /**
     * 保存所有数据
     */
    public void saveAll() {
        ensureSaveDirectory();
        saveConfig();
        saveLeaderboard();
        saveSaveGame();
    }
    
    /**
     * 加载配置
     */
    public void loadConfig() {
        if (!Files.exists(configPath)) {
            this.config = new GameConfig();
            return;
        }
        
        try (BufferedReader reader = Files.newBufferedReader(configPath, StandardCharsets.UTF_8)) {
            StringBuilder content = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                content.append(line);
            }
            
            this.config = GameConfig.fromString(content.toString());
        } catch (Exception e) {
            e.printStackTrace();
            this.config = new GameConfig();
        }
    }
    
    /**
     * 保存配置
     */
    public void saveConfig() {
        if (config == null) return;
        
        try (BufferedWriter writer = Files.newBufferedWriter(configPath, StandardCharsets.UTF_8)) {
            writer.write(config.toString());
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
    
    /**
     * 加载排行榜
     */
    public void loadLeaderboard() {
        this.leaderboard = new ArrayList<>();
        
        if (!Files.exists(leaderboardPath)) {
            return;
        }
        
        try (BufferedReader reader = Files.newBufferedReader(leaderboardPath, StandardCharsets.UTF_8)) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (!line.trim().isEmpty()) {
                    ScoreEntry entry = ScoreEntry.fromString(line);
                    if (entry != null) {
                        leaderboard.add(entry);
                    }
                }
            }
            
            sortLeaderboard();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    
    /**
     * 保存排行榜
     */
    public void saveLeaderboard() {
        if (leaderboard == null) return;
        
        sortLeaderboard();
        
        int maxEntries = 100;
        if (leaderboard.size() > maxEntries) {
            leaderboard = new ArrayList<>(leaderboard.subList(0, maxEntries));
        }
        
        try (BufferedWriter writer = Files.newBufferedWriter(leaderboardPath, StandardCharsets.UTF_8)) {
            for (ScoreEntry entry : leaderboard) {
                writer.write(entry.toString());
                writer.newLine();
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
    
    /**
     * 加载存档
     */
    public void loadSaveGame() {
        this.saveGame = new SaveGame();
        
        if (!Files.exists(saveGamePath)) {
            return;
        }
        
        try (BufferedReader reader = Files.newBufferedReader(saveGamePath, StandardCharsets.UTF_8)) {
            StringBuilder content = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                content.append(line);
            }
            
            this.saveGame = SaveGame.fromString(content.toString());
        } catch (Exception e) {
            e.printStackTrace();
            this.saveGame = new SaveGame();
        }
    }
    
    /**
     * 保存存档
     */
    public void saveSaveGame() {
        if (saveGame == null) return;
        
        try (BufferedWriter writer = Files.newBufferedWriter(saveGamePath, StandardCharsets.UTF_8)) {
            writer.write(saveGame.toString());
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
    
    /**
     * 添加分数到排行榜
     */
    public void addScore(String playerName, int score) {
        if (leaderboard == null) {
            leaderboard = new ArrayList<>();
        }
        
        ScoreEntry entry = new ScoreEntry(playerName, score);
        leaderboard.add(entry);
        sortLeaderboard();
    }
    
    /**
     * 排序排行榜
     */
    private void sortLeaderboard() {
        if (leaderboard == null) return;
        
        leaderboard.sort((a, b) -> {
            int scoreCompare = Integer.compare(b.getScore(), a.getScore());
            if (scoreCompare != 0) {
                return scoreCompare;
            }
            return b.getDateTime().compareTo(a.getDateTime());
        });
    }
    
    /**
     * 清空排行榜
     */
    public void clearLeaderboard() {
        if (leaderboard != null) {
            leaderboard.clear();
        }
    }
    
    /**
     * 获取最高分
     */
    public int getHighScore() {
        if (leaderboard == null || leaderboard.isEmpty()) {
            return 0;
        }
        return leaderboard.get(0).getScore();
    }
    
    /**
     * 获取排行榜前N名
     */
    public List<ScoreEntry> getTopScores(int count) {
        if (leaderboard == null || leaderboard.isEmpty()) {
            return new ArrayList<>();
        }
        
        int endIndex = Math.min(count, leaderboard.size());
        return new ArrayList<>(leaderboard.subList(0, endIndex));
    }
    
    // Getters and Setters
    public GameConfig getConfig() {
        return config;
    }
    
    public void setConfig(GameConfig config) {
        this.config = config;
    }
    
    public List<ScoreEntry> getLeaderboard() {
        return leaderboard != null ? leaderboard : new ArrayList<>();
    }
    
    public void setLeaderboard(List<ScoreEntry> leaderboard) {
        this.leaderboard = leaderboard;
    }
    
    public SaveGame getSaveGame() {
        return saveGame;
    }
    
    public void setSaveGame(SaveGame saveGame) {
        this.saveGame = saveGame;
    }
    
    /**
     * 配置类
     */
    public static class GameConfig implements Serializable {
        public boolean autoShoot;
        public boolean soundEnabled;
        public String lastPlayerName;
        public int windowWidth;
        public int windowHeight;
        
        public GameConfig() {
            this.autoShoot = true;
            this.soundEnabled = true;
            this.lastPlayerName = "Player";
            this.windowWidth = 480;
            this.windowHeight = 720;
        }
        
        @Override
        public String toString() {
            return String.format(
                "autoShoot=%b\n" +
                "soundEnabled=%b\n" +
                "lastPlayerName=%s\n" +
                "windowWidth=%d\n" +
                "windowHeight=%d",
                autoShoot, soundEnabled, lastPlayerName, windowWidth, windowHeight
            );
        }
        
        public static GameConfig fromString(String str) {
            GameConfig config = new GameConfig();
            String[] lines = str.split("\n");
            
            for (String line : lines) {
                String[] parts = line.split("=", 2);
                if (parts.length == 2) {
                    String key = parts[0].trim();
                    String value = parts[1].trim();
                    
                    if ("autoShoot".equals(key)) {
                        config.autoShoot = Boolean.parseBoolean(value);
                    } else if ("soundEnabled".equals(key)) {
                        config.soundEnabled = Boolean.parseBoolean(value);
                    } else if ("lastPlayerName".equals(key)) {
                        config.lastPlayerName = value;
                    } else if ("windowWidth".equals(key)) {
                        config.windowWidth = parseInt(value, 480);
                    } else if ("windowHeight".equals(key)) {
                        config.windowHeight = parseInt(value, 720);
                    }
                }
            }
            
            return config;
        }
        
        private static int parseInt(String str, int defaultValue) {
            try {
                return Integer.parseInt(str);
            } catch (NumberFormatException e) {
                return defaultValue;
            }
        }
    }
    
    /**
     * 分数条目
     */
    public static class ScoreEntry implements Serializable {
        private String playerName;
        private int score;
        private LocalDateTime dateTime;
        
        private static final DateTimeFormatter FORMATTER = 
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        
        public ScoreEntry() {
            this.playerName = "Player";
            this.score = 0;
            this.dateTime = LocalDateTime.now();
        }
        
        public ScoreEntry(String playerName, int score) {
            this.playerName = playerName != null ? playerName : "Player";
            this.score = score;
            this.dateTime = LocalDateTime.now();
        }
        
        public ScoreEntry(String playerName, int score, LocalDateTime dateTime) {
            this.playerName = playerName != null ? playerName : "Player";
            this.score = score;
            this.dateTime = dateTime != null ? dateTime : LocalDateTime.now();
        }
        
        @Override
        public String toString() {
            return String.format(
                "%s|%d|%s",
                playerName, score, dateTime.format(FORMATTER)
            );
        }
        
        public static ScoreEntry fromString(String str) {
            try {
                String[] parts = str.split("\\|");
                if (parts.length >= 2) {
                    String playerName = parts[0];
                    int score = Integer.parseInt(parts[1]);
                    LocalDateTime dateTime = parts.length >= 3 ?
                        LocalDateTime.parse(parts[2], FORMATTER) : LocalDateTime.now();
                    return new ScoreEntry(playerName, score, dateTime);
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
            return null;
        }
        
        public String getFormattedDate() {
            return dateTime.format(DateTimeFormatter.ofPattern("MM-dd HH:mm"));
        }
        
        // Getters
        public String getPlayerName() { return playerName; }
        public int getScore() { return score; }
        public LocalDateTime getDateTime() { return dateTime; }
        
        // Setters
        public void setPlayerName(String playerName) { this.playerName = playerName; }
        public void setScore(int score) { this.score = score; }
        public void setDateTime(LocalDateTime dateTime) { this.dateTime = dateTime; }
    }
    
    /**
     * 存档类
     */
    public static class SaveGame implements Serializable {
        public String playerName;
        public int score;
        public int level;
        public int health;
        public LocalDateTime savedAt;
        
        public SaveGame() {
            this.playerName = "Player";
            this.score = 0;
            this.level = 1;
            this.health = 100;
            this.savedAt = LocalDateTime.now();
        }
        
        @Override
        public String toString() {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
            return String.format(
                "playerName=%s\n" +
                "score=%d\n" +
                "level=%d\n" +
                "health=%d\n" +
                "savedAt=%s",
                playerName, score, level, health, savedAt.format(formatter)
            );
        }
        
        public static SaveGame fromString(String str) {
            SaveGame save = new SaveGame();
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
            String[] lines = str.split("\n");
            
            for (String line : lines) {
                String[] parts = line.split("=", 2);
                if (parts.length == 2) {
                    String key = parts[0].trim();
                    String value = parts[1].trim();
                    
                    if ("playerName".equals(key)) {
                        save.playerName = value;
                    } else if ("score".equals(key)) {
                        save.score = parseInt(value, 0);
                    } else if ("level".equals(key)) {
                        save.level = parseInt(value, 1);
                    } else if ("health".equals(key)) {
                        save.health = parseInt(value, 100);
                    } else if ("savedAt".equals(key)) {
                        try {
                            save.savedAt = LocalDateTime.parse(value, formatter);
                        } catch (Exception e) {
                            save.savedAt = LocalDateTime.now();
                        }
                    }
                }
            }
            
            return save;
        }
        
        private static int parseInt(String str, int defaultValue) {
            try {
                return Integer.parseInt(str);
            } catch (NumberFormatException e) {
                return defaultValue;
            }
        }
    }
}
