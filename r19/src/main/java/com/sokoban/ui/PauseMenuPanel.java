package com.sokoban.ui;

import com.sokoban.config.GraphicsConfig;

import javax.swing.*;
import java.awt.*;

public class PauseMenuPanel extends JPanel {
    private final Font titleFont;
    private final Font buttonFont;
    private final Color buttonBgColor;
    private final Color buttonHoverColor;
    private final Color overlayColor;

    public interface PauseCallback {
        void onResume();
        void onRestart();
        void onBackToMenu();
    }

    public PauseMenuPanel(PauseCallback callback) {
        this.titleFont = new Font("Monospaced", Font.BOLD, 36);
        this.buttonFont = new Font("Monospaced", Font.BOLD, 18);
        this.buttonBgColor = new Color(60, 60, 80);
        this.buttonHoverColor = new Color(80, 80, 110);
        this.overlayColor = new Color(0, 0, 0, 180);

        setBackground(overlayColor);
        setLayout(new GridBagLayout());
        setOpaque(true);

        JPanel contentPanel = new JPanel();
        contentPanel.setLayout(new BoxLayout(contentPanel, BoxLayout.Y_AXIS));
        contentPanel.setBackground(GraphicsConfig.COLOR_BACKGROUND);
        contentPanel.setOpaque(true);
        contentPanel.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(GraphicsConfig.COLOR_HUD_ACCENT, 3),
                BorderFactory.createEmptyBorder(40, 60, 40, 60)
        ));

        JLabel titleLabel = new JLabel("游戏暂停");
        titleLabel.setFont(titleFont);
        titleLabel.setForeground(GraphicsConfig.COLOR_HUD_ACCENT);
        titleLabel.setAlignmentX(Component.CENTER_ALIGNMENT);
        contentPanel.add(titleLabel);

        contentPanel.add(Box.createVerticalStrut(40));

        JButton resumeButton = createButton("继续游戏", e -> callback.onResume());
        resumeButton.setAlignmentX(Component.CENTER_ALIGNMENT);
        contentPanel.add(resumeButton);

        contentPanel.add(Box.createVerticalStrut(20));

        JButton restartButton = createButton("重新开始", e -> callback.onRestart());
        restartButton.setAlignmentX(Component.CENTER_ALIGNMENT);
        contentPanel.add(restartButton);

        contentPanel.add(Box.createVerticalStrut(20));

        JButton menuButton = createButton("返回菜单", e -> callback.onBackToMenu());
        menuButton.setAlignmentX(Component.CENTER_ALIGNMENT);
        contentPanel.add(menuButton);

        add(contentPanel, new GridBagConstraints());
    }

    private JButton createButton(String text, java.awt.event.ActionListener listener) {
        JButton button = new JButton(text);
        button.setFont(buttonFont);
        button.setBackground(buttonBgColor);
        button.setForeground(GraphicsConfig.COLOR_HUD_TEXT);
        button.setFocusPainted(false);
        button.setBorderPainted(true);
        button.setBorder(BorderFactory.createLineBorder(GraphicsConfig.COLOR_HUD_ACCENT, 2));
        button.setPreferredSize(new Dimension(180, 50));
        button.setMaximumSize(new Dimension(180, 50));
        button.addActionListener(listener);

        button.addMouseListener(new java.awt.event.MouseAdapter() {
            @Override
            public void mouseEntered(java.awt.event.MouseEvent evt) {
                button.setBackground(buttonHoverColor);
            }

            @Override
            public void mouseExited(java.awt.event.MouseEvent evt) {
                button.setBackground(buttonBgColor);
            }
        });

        return button;
    }
}
