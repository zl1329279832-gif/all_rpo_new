package com.sokoban.game;

import com.sokoban.ui.GameWindow;

import javax.swing.*;
import java.awt.*;

public class GameMain {
    public static void main(String[] args) {
        try {
            UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
        } catch (Exception e) {
            try {
                for (UIManager.LookAndFeelInfo info : UIManager.getInstalledLookAndFeels()) {
                    if ("Nimbus".equals(info.getName())) {
                        UIManager.setLookAndFeel(info.getClassName());
                        break;
                    }
                }
            } catch (Exception ex) {
            }
        }

        System.setProperty("sun.java2d.opengl", "true");
        System.setProperty("sun.java2d.d3d", "true");

        EventQueue.invokeLater(() -> {
            GameWindow window = new GameWindow();
            window.showAndStart();
        });
    }
}
