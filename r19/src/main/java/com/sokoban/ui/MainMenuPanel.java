package com.sokoban.ui;

import com.sokoban.config.GameConfig;
import com.sokoban.config.GraphicsConfig;

import javax.swing.*;
import java.awt.*;
import java.awt.event.ActionListener;

public class MainMenuPanel extends JPanel {
    private final Font titleFont;
    private final Font buttonFont;
    private final Color buttonBgColor;
    private final Color buttonHoverColor;

    public interface MenuCallback {
        void onStartGame();
        void onSelectLevel();
        void onViewRanking();
        void onToggleSound();
        void onExit();
    }

    public MainMenuPanel(MenuCallback callback) {
        this.titleFont = new Font("Monospaced", Font.BOLD, 48);
        this.buttonFont = new Font("Monospaced", Font.BOLD, 20);
        this.buttonBgColor = new Color(60, 60, 80);
        this.buttonHoverColor = new Color(80, 80, 110);

        setBackground(GraphicsConfig.COLOR_BACKGROUND);
        setLayout(new BorderLayout());

        JPanel centerPanel = new JPanel();
        centerPanel.setLayout(new BoxLayout(centerPanel, BoxLayout.Y_AXIS));
        centerPanel.setBackground(GraphicsConfig.COLOR_BACKGROUND);
        centerPanel.setOpaque(true);

        centerPanel.add(Box.createVerticalStrut(80));

        JLabel titleLabel = createTitleLabel();
        titleLabel.setAlignmentX(Component.CENTER_ALIGNMENT);
        centerPanel.add(titleLabel);

        centerPanel.add(Box.createVerticalStrut(60));

        JButton startButton = createButton("开始游戏", e -> callback.onStartGame());
        startButton.setAlignmentX(Component.CENTER_ALIGNMENT);
        centerPanel.add(startButton);

        centerPanel.add(Box.createVerticalStrut(20));

        JButton levelSelectButton = createButton("选择关卡", e -> callback.onSelectLevel());
        levelSelectButton.setAlignmentX(Component.CENTER_ALIGNMENT);
        centerPanel.add(levelSelectButton);

        centerPanel.add(Box.createVerticalStrut(20));

        JButton rankingButton = createButton("排行榜", e -> callback.onViewRanking());
        rankingButton.setAlignmentX(Component.CENTER_ALIGNMENT);
        centerPanel.add(rankingButton);

        centerPanel.add(Box.createVerticalStrut(20));

        JButton soundButton = createButton("音效", e -> callback.onToggleSound());
        soundButton.setAlignmentX(Component.CENTER_ALIGNMENT);
        centerPanel.add(soundButton);

        centerPanel.add(Box.createVerticalStrut(20));

        JButton exitButton = createButton("退出游戏", e -> callback.onExit());
        exitButton.setAlignmentX(Component.CENTER_ALIGNMENT);
        centerPanel.add(exitButton);

        centerPanel.add(Box.createVerticalGlue());

        add(centerPanel, BorderLayout.CENTER);

        JPanel bottomPanel = createBottomPanel();
        add(bottomPanel, BorderLayout.SOUTH);
    }

    private JLabel createTitleLabel() {
        JLabel label = new JLabel("像素推箱子");
        label.setFont(titleFont);
        label.setForeground(GraphicsConfig.COLOR_HUD_ACCENT);
        label.setHorizontalAlignment(SwingConstants.CENTER);
        return label;
    }

    private JButton createButton(String text, ActionListener listener) {
        JButton button = new JButton(text);
        button.setFont(buttonFont);
        button.setBackground(buttonBgColor);
        button.setForeground(GraphicsConfig.COLOR_HUD_TEXT);
        button.setFocusPainted(false);
        button.setBorderPainted(true);
        button.setBorder(BorderFactory.createLineBorder(GraphicsConfig.COLOR_HUD_ACCENT, 2));
        button.setPreferredSize(new Dimension(200, 50));
        button.setMaximumSize(new Dimension(200, 50));
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

    private JPanel createBottomPanel() {
        JPanel panel = new JPanel(new FlowLayout(FlowLayout.CENTER, 10, 10));
        panel.setBackground(GraphicsConfig.COLOR_HUD_BACKGROUND);
        panel.setOpaque(true);

        JLabel helpLabel = new JLabel("方向键/WASD: 移动 | Z: 撤销 | R: 重开 | ESC/P: 暂停");
        helpLabel.setFont(new Font("Monospaced", Font.PLAIN, 14));
        helpLabel.setForeground(GraphicsConfig.COLOR_HUD_TEXT);
        panel.add(helpLabel);

        return panel;
    }
}
