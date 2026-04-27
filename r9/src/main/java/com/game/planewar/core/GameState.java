package com.game.planewar.core;

/**
 * 游戏状态枚举
 */
public enum GameState {
    /**
     * 主菜单
     */
    MENU,
    
    /**
     * 游戏进行中
     */
    PLAYING,
    
    /**
     * 游戏暂停
     */
    PAUSED,
    
    /**
     * 游戏失败
     */
    GAME_OVER,
    
    /**
     * 结算页面
     */
    SETTLEMENT,
    
    /**
     * 排行榜
     */
    LEADERBOARD,
    
    /**
     * 游戏设置
     */
    SETTINGS
}
