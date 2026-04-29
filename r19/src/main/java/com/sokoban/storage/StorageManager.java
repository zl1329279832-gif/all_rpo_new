package com.sokoban.storage;

import com.fasterxml.jackson.core.type.TypeReference;
import com.sokoban.config.GameConfig;
import com.sokoban.util.JsonUtil;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

public class StorageManager {
    private static StorageManager instance;
    private final Path dataDir;
    private final Path configPath;
    private final Path rankingPath;
    private GamePreferences preferences;
    private List<RankingEntry> rankings;

    private StorageManager() {
        this.dataDir = Paths.get(GameConfig.DATA_DIR);
        this.configPath = dataDir.resolve(GameConfig.CONFIG_FILE);
        this.rankingPath = dataDir.resolve(GameConfig.RANKING_FILE);
        ensureDataDirectory();
        loadAll();
    }

    public static synchronized StorageManager getInstance() {
        if (instance == null) {
            instance = new StorageManager();
        }
        return instance;
    }

    private void ensureDataDirectory() {
        try {
            if (!Files.exists(dataDir)) {
                Files.createDirectories(dataDir);
            }
        } catch (IOException e) {
            System.err.println("无法创建数据目录: " + e.getMessage());
        }
    }

    private void loadAll() {
        loadPreferences();
        loadRankings();
    }

    private void loadPreferences() {
        try {
            if (Files.exists(configPath)) {
                preferences = JsonUtil.readFromPath(configPath, GamePreferences.class);
            } else {
                preferences = new GamePreferences();
                savePreferences();
            }
        } catch (IOException e) {
            System.err.println("无法加载配置: " + e.getMessage());
            preferences = new GamePreferences();
        }
    }

    private void loadRankings() {
        try {
            if (Files.exists(rankingPath)) {
                rankings = JsonUtil.readFromPath(rankingPath, new TypeReference<List<RankingEntry>>() {});
            } else {
                rankings = new ArrayList<>();
                saveRankings();
            }
        } catch (IOException e) {
            System.err.println("无法加载排行榜: " + e.getMessage());
            rankings = new ArrayList<>();
        }
    }

    public void savePreferences() {
        try {
            JsonUtil.writeToPath(configPath, preferences);
        } catch (IOException e) {
            System.err.println("无法保存配置: " + e.getMessage());
        }
    }

    public void saveRankings() {
        try {
            JsonUtil.writeToPath(rankingPath, rankings);
        } catch (IOException e) {
            System.err.println("无法保存排行榜: " + e.getMessage());
        }
    }

    public GamePreferences getPreferences() {
        return preferences;
    }

    public List<RankingEntry> getRankings() {
        return new ArrayList<>(rankings);
    }

    public List<RankingEntry> getRankingsForLevel(String levelId) {
        return rankings.stream()
                .filter(entry -> entry.getLevelId().equals(levelId))
                .sorted((a, b) -> {
                    int starCompare = Integer.compare(b.getStars(), a.getStars());
                    if (starCompare != 0) return starCompare;
                    int moveCompare = Integer.compare(a.getMoves(), b.getMoves());
                    if (moveCompare != 0) return moveCompare;
                    return Long.compare(a.getTimeSeconds(), b.getTimeSeconds());
                })
                .limit(GameConfig.RANKING_ENTRY_COUNT)
                .toList();
    }

    public void addRankingEntry(RankingEntry entry) {
        rankings.add(entry);
        saveRankings();
    }

    public boolean isSoundEnabled() {
        return preferences.isSoundEnabled();
    }

    public void setSoundEnabled(boolean enabled) {
        preferences.setSoundEnabled(enabled);
        savePreferences();
    }

    public String getLastPlayedLevelId() {
        return preferences.getLastPlayedLevelId();
    }

    public void setLastPlayedLevelId(String levelId) {
        preferences.setLastPlayedLevelId(levelId);
        savePreferences();
    }
}
