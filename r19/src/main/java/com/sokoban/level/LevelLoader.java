package com.sokoban.level;

import com.fasterxml.jackson.core.type.TypeReference;
import com.sokoban.config.GameConfig;
import com.sokoban.util.JsonUtil;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class LevelLoader {
    private static final String DEFAULT_LEVELS_RESOURCE = "/levels/default_levels.json";

    public List<LevelData> loadAllLevels() {
        List<LevelData> levels = new ArrayList<>();
        
        try {
            levels.addAll(loadFromDataDirectory());
        } catch (IOException e) {
            System.err.println("无法从 data 目录加载关卡: " + e.getMessage());
        }
        
        if (levels.isEmpty()) {
            try {
                levels.addAll(loadFromResources());
            } catch (IOException e) {
                System.err.println("无法从资源加载关卡: " + e.getMessage());
                levels = getBuiltInLevels();
            }
        }
        
        return levels;
    }

    private List<LevelData> loadFromDataDirectory() throws IOException {
        Path levelsDir = Paths.get(GameConfig.DATA_DIR, GameConfig.LEVELS_DIR);
        if (!Files.exists(levelsDir)) {
            return new ArrayList<>();
        }
        
        List<LevelData> allLevels = new ArrayList<>();
        Files.list(levelsDir)
                .filter(path -> path.toString().endsWith(".json"))
                .forEach(path -> {
                    try {
                        List<LevelData> levels = JsonUtil.readFromPath(path, new TypeReference<List<LevelData>>() {});
                        allLevels.addAll(levels);
                    } catch (IOException e) {
                        System.err.println("无法加载关卡文件 " + path + ": " + e.getMessage());
                    }
                });
        
        return allLevels;
    }

    private List<LevelData> loadFromResources() throws IOException {
        try (InputStream is = getClass().getResourceAsStream(DEFAULT_LEVELS_RESOURCE)) {
            if (is == null) {
                throw new IOException("资源文件不存在: " + DEFAULT_LEVELS_RESOURCE);
            }
            byte[] buffer = new byte[1024];
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            int bytesRead;
            while ((bytesRead = is.read(buffer)) != -1) {
                baos.write(buffer, 0, bytesRead);
            }
            return JsonUtil.fromJson(baos.toString("UTF-8"), new TypeReference<List<LevelData>>() {});
        }
    }

    private List<LevelData> getBuiltInLevels() {
        List<LevelData> levels = new ArrayList<>();
        
        levels.add(createLevel1());
        levels.add(createLevel2());
        levels.add(createLevel3());
        levels.add(createLevel4());
        levels.add(createLevel5());
        
        return levels;
    }

    private LevelData createLevel1() {
        LevelData level = new LevelData();
        level.setId("level_001");
        level.setName("入门教程");
        level.setDifficulty(1);
        level.setParMoves(8);
        level.setParTime(30);
        level.setMap(Arrays.asList(
                "  #####  ",
                "###   ###",
                "# P $ @ #",
                "###   ###",
                "  #####  "
        ));
        return level;
    }

    private LevelData createLevel2() {
        LevelData level = new LevelData();
        level.setId("level_002");
        level.setName("双箱起步");
        level.setDifficulty(1);
        level.setParMoves(20);
        level.setParTime(60);
        level.setMap(Arrays.asList(
                "  ######  ",
                "###    ###",
                "# P  $   #",
                "#  $ @ @ #",
                "#        #",
                "##########"
        ));
        return level;
    }

    private LevelData createLevel3() {
        LevelData level = new LevelData();
        level.setId("level_003");
        level.setName("回廊初探");
        level.setDifficulty(2);
        level.setParMoves(35);
        level.setParTime(90);
        level.setMap(Arrays.asList(
                "########",
                "#      #",
                "# @##@ #",
                "# #  # #",
                "# $  $ #",
                "#  P   #",
                "########"
        ));
        return level;
    }

    private LevelData createLevel4() {
        LevelData level = new LevelData();
        level.setId("level_004");
        level.setName("迷宫深处");
        level.setDifficulty(2);
        level.setParMoves(50);
        level.setParTime(120);
        level.setMap(Arrays.asList(
                "  #######",
                "  #     #",
                "### # # #",
                "#   $ $ #",
                "# # # # #",
                "# @P  @ #",
                "#########"
        ));
        return level;
    }

    private LevelData createLevel5() {
        LevelData level = new LevelData();
        level.setId("level_005");
        level.setName("三箱挑战");
        level.setDifficulty(3);
        level.setParMoves(60);
        level.setParTime(150);
        level.setMap(Arrays.asList(
                "  ########",
                "  #      #",
                "### # ## #",
                "#    $   #",
                "# #  $ # #",
                "# @  P@  #",
                "# @   $  #",
                "##########"
        ));
        return level;
    }
}
