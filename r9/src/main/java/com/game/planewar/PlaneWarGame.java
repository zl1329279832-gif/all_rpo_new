package com.game.planewar;

import com.game.planewar.core.GameController;
import com.game.planewar.core.GameLoop;
import com.game.planewar.ui.GameWindow;
import com.game.planewar.data.GameDataManager;

/**
 * 飞机大战游戏主类 - 程序入口
 */
public class PlaneWarGame {
    
    /**
     * 游戏窗口宽度
     */
    public static final int WINDOW_WIDTH = 480;
    
    /**
     * 游戏窗口高度
     */
    public static final int WINDOW_HEIGHT = 720;
    
    /**
     * 游戏标题
     */
    public static final String GAME_TITLE = "飞机大战 - Java2D";
    
    /**
     * 目标 FPS
     */
    public static final int TARGET_FPS = 60;
    
    private static PlaneWarGame instance;
    private GameWindow gameWindow;
    private GameLoop gameLoop;
    private GameController gameController;
    private GameDataManager dataManager;
    
    /**
     * 游戏主方法
     */
    public static void main(String[] args) {
        instance = new PlaneWarGame();
        instance.init();
        instance.start();
    }
    
    /**
     * 获取游戏单例
     */
    public static PlaneWarGame getInstance() {
        return instance;
    }
    
    /**
     * 初始化游戏
     */
    private void init() {
        dataManager = new GameDataManager();
        dataManager.loadAll();
        
        gameController = new GameController();
        gameController.init();
        
        gameLoop = new GameLoop(gameController);
        
        gameWindow = new GameWindow(gameController);
        gameWindow.init();
    }
    
    /**
     * 启动游戏
     */
    private void start() {
        gameWindow.showWindow();
        gameLoop.start();
    }
    
    /**
     * 获取游戏控制器
     */
    public GameController getGameController() {
        return gameController;
    }
    
    /**
     * 获取游戏窗口
     */
    public GameWindow getGameWindow() {
        return gameWindow;
    }
    
    /**
     * 获取数据管理器
     */
    public GameDataManager getDataManager() {
        return dataManager;
    }
    
    /**
     * 退出游戏
     */
    public void exit() {
        gameLoop.stop();
        dataManager.saveAll();
        System.exit(0);
    }
}
