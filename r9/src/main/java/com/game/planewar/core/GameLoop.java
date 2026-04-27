package com.game.planewar.core;

/**
 * 游戏主循环 - 固定时间步长，60 FPS
 */
public class GameLoop {
    
    private static final long OPTIMAL_TIME = 1000000000L / 60; // 60 FPS, 约16.666ms per frame
    private static final int MAX_UPDATES_BEFORE_RENDER = 5;
    
    private final GameController gameController;
    private boolean running = false;
    private Thread gameThread;
    
    private int fpsCount;
    private int fps;
    private long lastFpsCheck;
    
    public GameLoop(GameController gameController) {
        this.gameController = gameController;
    }
    
    /**
     * 启动游戏循环
     */
    public void start() {
        if (running) {
            return;
        }
        running = true;
        gameThread = new Thread(this::runLoop, "Game-Loop");
        gameThread.start();
    }
    
    /**
     * 停止游戏循环
     */
    public void stop() {
        running = false;
        if (gameThread != null) {
            try {
                gameThread.join();
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }
    
    /**
     * 游戏循环主逻辑 - 固定时间步长
     */
    private void runLoop() {
        long lastUpdateTime = System.nanoTime();
        long lastRenderTime = lastUpdateTime;
        lastFpsCheck = System.currentTimeMillis();
        fpsCount = 0;
        
        while (running) {
            long now = System.nanoTime();
            int updateCount = 0;
            
            while (now - lastUpdateTime > OPTIMAL_TIME && updateCount < MAX_UPDATES_BEFORE_RENDER) {
                gameController.update();
                lastUpdateTime += OPTIMAL_TIME;
                updateCount++;
            }
            
            if (now - lastUpdateTime > OPTIMAL_TIME) {
                lastUpdateTime = now - OPTIMAL_TIME;
            }
            
            fpsCount++;
            
            if (System.currentTimeMillis() - lastFpsCheck >= 1000) {
                fps = fpsCount;
                fpsCount = 0;
                lastFpsCheck = System.currentTimeMillis();
            }
            
            long renderTime = System.nanoTime();
            long sleepTime = OPTIMAL_TIME - (renderTime - lastRenderTime);
            
            if (sleepTime > 0) {
                try {
                    Thread.sleep(sleepTime / 1000000, (int) (sleepTime % 1000000));
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
            
            lastRenderTime = renderTime;
        }
    }
    
    /**
     * 获取当前 FPS
     */
    public int getFps() {
        return fps;
    }
    
    /**
     * 检查游戏循环是否运行中
     */
    public boolean isRunning() {
        return running;
    }
}
