package com.breakout;

import com.breakout.ui.GameWindow;

import javax.swing.*;

public class Main {
    
    public static void main(String[] args) {
        System.out.println("========================================");
        System.out.println("         BREAKOUT 打砖块游戏");
        System.out.println("========================================");
        System.out.println();
        System.out.println("【游戏说明】");
        System.out.println("  - 使用 ← / A 或 → / D 控制挡板移动");
        System.out.println("  - 按 空格键 发射小球");
        System.out.println("  - 按 ESC / P 暂停游戏");
        System.out.println("  - 按 R 重新开始游戏");
        System.out.println();
        System.out.println("【运行方式】");
        System.out.println("  - mvn clean package");
        System.out.println("  - mvn exec:java");
        System.out.println("  - 或者直接运行生成的 jar 文件");
        System.out.println();
        System.out.println("游戏正在启动...");
        
        try {
            UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
        } catch (Exception e) {
            System.err.println("警告: 无法设置系统外观: " + e.getMessage());
        }
        
        SwingUtilities.invokeLater(() -> {
            GameWindow window = new GameWindow();
            window.start();
            System.out.println("游戏窗口已打开!");
        });
    }
}
