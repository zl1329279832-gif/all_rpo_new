package com.sokoban.ui;

import com.sokoban.config.GraphicsConfig;
import com.sokoban.engine.RatingSystem;

import javax.swing.*;
import java.awt.*;

public class LevelCompletePanel extends JPanel {
    private final Font titleFont;
    private final Font starFont;
    private final Font infoFont;
    private final Font buttonFont;
    private final Color buttonBgColor;
    private final Color buttonHoverColor;
    private final Color overlayColor;

    public interface CompleteCallback {
        void onNextLevel();
        void onReplay();
        void onBackToMenu();
    }

    public LevelCompletePanel(int moves, String time, int stars, String ratingMessage,
                               boolean hasNextLevel, CompleteCallback callback) {
        this.titleFont = new Font("Monospaced", Font.BOLD, 36);
        this.starFont = new Font("Monospaced", Font.BOLD, 72);
        this.infoFont = new Font("Monospaced", Font.BOLD, 20);
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
                BorderFactory.createLineBorder(GraphicsConfig.COLOR_STAR_FILLED, 3),
                BorderFactory.createEmptyBorder(40, 60, 40, 60)
        ));

        JLabel titleLabel = new JLabel("关卡完成！");
        titleLabel.setFont(titleFont);
        titleLabel.setForeground(GraphicsConfig.COLOR_HUD_ACCENT);
        titleLabel.setAlignmentX(Component.CENTER_ALIGNMENT);
        contentPanel.add(titleLabel);

        contentPanel.add(Box.createVerticalStrut(20));

        JLabel starsLabel = new JLabel(RatingSystem.formatStars(stars));
        starsLabel.setFont(starFont);
        starsLabel.setForeground(GraphicsConfig.COLOR_STAR_FILLED);
        starsLabel.setAlignmentX(Component.CENTER_ALIGNMENT);
        contentPanel.add(starsLabel);

        contentPanel.add(Box.createVerticalStrut(10));

        JLabel messageLabel = new JLabel(ratingMessage);
        messageLabel.setFont(infoFont);
        messageLabel.setForeground(GraphicsConfig.COLOR_HUD_TEXT);
        messageLabel.setAlignmentX(Component.CENTER_ALIGNMENT);
        contentPanel.add(messageLabel);

        contentPanel.add(Box.createVerticalStrut(30));

        JLabel movesLabel = new JLabel("总步数: " + moves);
        movesLabel.setFont(infoFont);
        movesLabel.setForeground(GraphicsConfig.COLOR_HUD_TEXT);
        movesLabel.setAlignmentX(Component.CENTER_ALIGNMENT);
        contentPanel.add(movesLabel);

        contentPanel.add(Box.createVerticalStrut(10));

        JLabel timeLabel = new JLabel("用时: " + time);
        timeLabel.setFont(infoFont);
        timeLabel.setForeground(GraphicsConfig.COLOR_HUD_TEXT);
        timeLabel.setAlignmentX(Component.CENTER_ALIGNMENT);
        contentPanel.add(timeLabel);

        contentPanel.add(Box.createVerticalStrut(40));

        JPanel buttonsPanel = new JPanel();
        buttonsPanel.setLayout(new BoxLayout(buttonsPanel, BoxLayout.X_AXIS));
        buttonsPanel.setBackground(GraphicsConfig.COLOR_BACKGROUND);
        buttonsPanel.setOpaque(true);

        if (hasNextLevel) {
            JButton nextButton = createButton("下一关", e -> callback.onNextLevel());
            buttonsPanel.add(nextButton);
            buttonsPanel.add(Box.createHorizontalStrut(15));
        }

        JButton replayButton = createButton("重玩", e -> callback.onReplay());
        buttonsPanel.add(replayButton);
        buttonsPanel.add(Box.createHorizontalStrut(15));

        JButton menuButton = createButton("菜单", e -> callback.onBackToMenu());
        buttonsPanel.add(menuButton);

        buttonsPanel.setAlignmentX(Component.CENTER_ALIGNMENT);
        contentPanel.add(buttonsPanel);

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
        button.setPreferredSize(new Dimension(120, 45));
        button.setMaximumSize(new Dimension(120, 45));
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
