package com.sokoban.ui;

import com.sokoban.config.GameConfig;
import com.sokoban.config.GraphicsConfig;
import com.sokoban.engine.GameEngine;
import com.sokoban.input.InputHandler;
import com.sokoban.level.Level;
import com.sokoban.level.LevelData;
import com.sokoban.level.LevelLoader;
import com.sokoban.storage.RankingEntry;
import com.sokoban.storage.StorageManager;
import com.sokoban.util.Direction;

import javax.swing.*;
import java.awt.*;
import java.awt.event.WindowAdapter;
import java.awt.event.WindowEvent;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class GameWindow extends JFrame {
    private final GameEngine engine;
    private final InputHandler inputHandler;
    private final LevelLoader levelLoader;
    private final StorageManager storageManager;
    private final List<LevelData> allLevels;
    
    private GameCanvas gameCanvas;
    private JPanel currentPanel;
    private int currentLevelIndex;
    private Timer uiTimer;

    public GameWindow() {
        this.engine = new GameEngine();
        this.inputHandler = new InputHandler();
        this.levelLoader = new LevelLoader();
        this.storageManager = StorageManager.getInstance();
        this.allLevels = levelLoader.loadAllLevels();
        this.currentLevelIndex = 0;
        
        initWindow();
        initUI();
        startInputLoop();
    }

    private void initWindow() {
        setTitle(GameConfig.GAME_TITLE);
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setResizable(true);
        setBackground(GraphicsConfig.COLOR_BACKGROUND);

        addWindowListener(new WindowAdapter() {
            @Override
            public void windowClosing(WindowEvent e) {
                if (gameCanvas != null) {
                    gameCanvas.stop();
                }
                if (uiTimer != null) {
                    uiTimer.stop();
                }
            }
        });

        Dimension prefSize = GameConfig.getDefaultGameDimension();
        setPreferredSize(prefSize);
        setMinimumSize(new Dimension(600, 500));
        pack();
        setLocationRelativeTo(null);
    }

    private void initUI() {
        showMainMenu();
    }

    private void startInputLoop() {
        uiTimer = new Timer(16, e -> processInput());
        uiTimer.start();
    }

    private void processInput() {
        if (engine == null || engine.isPaused() || engine.isCompleted()) {
            return;
        }

        Direction direction = inputHandler.pollDirection();
        if (direction != null) {
            engine.movePlayer(direction);
            
            if (engine.isCompleted()) {
                handleLevelComplete();
            }
        }

        if (inputHandler.pollUndo()) {
            engine.undo();
        }

        if (inputHandler.pollRestart()) {
            engine.restart();
        }

        if (inputHandler.pollPause()) {
            showPauseMenu();
        }
    }

    private void showMainMenu() {
        stopGame();
        
        MainMenuPanel menuPanel = new MainMenuPanel(new MainMenuPanel.MenuCallback() {
            @Override
            public void onStartGame() {
                startGame(getLastPlayedLevelIndex());
            }

            @Override
            public void onSelectLevel() {
                showLevelSelect();
            }

            @Override
            public void onViewRanking() {
                showRanking();
            }

            @Override
            public void onToggleSound() {
                boolean current = storageManager.isSoundEnabled();
                storageManager.setSoundEnabled(!current);
                JOptionPane.showMessageDialog(GameWindow.this,
                    "音效已" + (!current ? "开启" : "关闭"),
                    "提示",
                    JOptionPane.INFORMATION_MESSAGE);
            }

            @Override
            public void onExit() {
                dispose();
                System.exit(0);
            }
        });

        setContentPane(menuPanel);
        currentPanel = menuPanel;
        revalidate();
        repaint();
    }

    private void showLevelSelect() {
        LevelSelectPanel levelSelectPanel = new LevelSelectPanel(allLevels, 
            new LevelSelectPanel.LevelSelectCallback() {
                @Override
                public void onSelectLevel(LevelData level) {
                    int index = allLevels.indexOf(level);
                    if (index >= 0) {
                        startGame(index);
                    }
                }

                @Override
                public void onBack() {
                    showMainMenu();
                }
            });

        setContentPane(levelSelectPanel);
        currentPanel = levelSelectPanel;
        revalidate();
        repaint();
    }

    private void showRanking() {
        Map<String, List<RankingEntry>> rankingMap = new HashMap<>();
        for (LevelData level : allLevels) {
            rankingMap.put(level.getId(), storageManager.getRankingsForLevel(level.getId()));
        }

        RankingPanel rankingPanel = new RankingPanel(allLevels, rankingMap, 
            new RankingPanel.RankingCallback() {
                @Override
                public void onBack() {
                    showMainMenu();
                }
            });

        setContentPane(rankingPanel);
        currentPanel = rankingPanel;
        revalidate();
        repaint();
    }

    private void startGame(int levelIndex) {
        if (levelIndex < 0 || levelIndex >= allLevels.size()) {
            levelIndex = 0;
        }
        
        currentLevelIndex = levelIndex;
        LevelData levelData = allLevels.get(levelIndex);
        Level level = new Level(levelData);
        
        storageManager.setLastPlayedLevelId(levelData.getId());
        engine.loadLevel(level);
        
        Dimension gameSize = GameConfig.getGameDimension(level.getCols(), level.getRows());
        setSize(gameSize);
        setLocationRelativeTo(null);
        
        gameCanvas = new GameCanvas(engine);
        gameCanvas.addKeyListener(inputHandler);
        gameCanvas.setFocusable(true);
        gameCanvas.requestFocusInWindow();
        
        setContentPane(gameCanvas);
        currentPanel = gameCanvas;
        revalidate();
        repaint();
        
        gameCanvas.start();
    }

    private void stopGame() {
        if (gameCanvas != null) {
            gameCanvas.stop();
            gameCanvas = null;
        }
        inputHandler.reset();
    }

    private void showPauseMenu() {
        if (engine.isPaused()) {
            return;
        }
        
        engine.pause();
        
        JPanel layeredPanel = new JPanel(new BorderLayout());
        layeredPanel.setBackground(GraphicsConfig.COLOR_BACKGROUND);
        
        JLayeredPane layeredPane = new JLayeredPane();
        layeredPane.setLayout(new OverlayLayout(layeredPane));
        
        PauseMenuPanel pausePanel = new PauseMenuPanel(new PauseMenuPanel.PauseCallback() {
            @Override
            public void onResume() {
                engine.resume();
                setContentPane(gameCanvas);
                currentPanel = gameCanvas;
                gameCanvas.requestFocusInWindow();
                revalidate();
                repaint();
            }

            @Override
            public void onRestart() {
                engine.restart();
                engine.resume();
                setContentPane(gameCanvas);
                currentPanel = gameCanvas;
                gameCanvas.requestFocusInWindow();
                revalidate();
                repaint();
            }

            @Override
            public void onBackToMenu() {
                showMainMenu();
            }
        });
        
        layeredPane.add(pausePanel, JLayeredPane.PALETTE_LAYER);
        layeredPanel.add(layeredPane, BorderLayout.CENTER);
        
        setContentPane(layeredPanel);
        currentPanel = layeredPanel;
        revalidate();
        repaint();
    }

    private void handleLevelComplete() {
        int stars = engine.getStars();
        String message = engine.getRatingMessage();
        int moves = engine.getMoves();
        String time = engine.getFormattedTime();
        long timeSeconds = engine.getElapsedSeconds();
        boolean hasNextLevel = currentLevelIndex < allLevels.size() - 1;
        
        LevelData currentLevel = allLevels.get(currentLevelIndex);
        
        String playerName = JOptionPane.showInputDialog(this,
            "输入你的名字（可选）：",
            "记录成绩",
            JOptionPane.PLAIN_MESSAGE);
        
        if (playerName == null || playerName.trim().isEmpty()) {
            playerName = "匿名玩家";
        } else {
            playerName = playerName.trim();
        }
        
        RankingEntry entry = new RankingEntry(
            currentLevel.getId(),
            playerName,
            moves,
            timeSeconds,
            stars
        );
        storageManager.addRankingEntry(entry);
        
        LevelCompletePanel completePanel = new LevelCompletePanel(
            moves, time, stars, message, hasNextLevel,
            new LevelCompletePanel.CompleteCallback() {
                @Override
                public void onNextLevel() {
                    if (currentLevelIndex < allLevels.size() - 1) {
                        startGame(currentLevelIndex + 1);
                    } else {
                        showMainMenu();
                    }
                }

                @Override
                public void onReplay() {
                    engine.restart();
                    setContentPane(gameCanvas);
                    currentPanel = gameCanvas;
                    gameCanvas.requestFocusInWindow();
                    revalidate();
                    repaint();
                }

                @Override
                public void onBackToMenu() {
                    showMainMenu();
                }
            }
        );
        
        JPanel layeredPanel = new JPanel(new BorderLayout());
        JLayeredPane layeredPane = new JLayeredPane();
        layeredPane.setLayout(new OverlayLayout(layeredPane));
        layeredPane.add(completePanel, JLayeredPane.PALETTE_LAYER);
        layeredPanel.add(layeredPane, BorderLayout.CENTER);
        
        setContentPane(layeredPanel);
        currentPanel = layeredPanel;
        revalidate();
        repaint();
    }

    private int getLastPlayedLevelIndex() {
        String lastLevelId = storageManager.getLastPlayedLevelId();
        for (int i = 0; i < allLevels.size(); i++) {
            if (allLevels.get(i).getId().equals(lastLevelId)) {
                return i;
            }
        }
        return 0;
    }

    public void showAndStart() {
        setVisible(true);
    }
}
