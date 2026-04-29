package com.sokoban.ui;

import com.sokoban.config.GraphicsConfig;
import com.sokoban.level.LevelData;

import javax.swing.*;
import java.awt.*;
import java.util.List;

public class LevelSelectPanel extends JPanel {
    private final Font titleFont;
    private final Font buttonFont;
    private final Font levelInfoFont;
    private final Color buttonBgColor;
    private final Color buttonHoverColor;

    public interface LevelSelectCallback {
        void onSelectLevel(LevelData level);
        void onBack();
    }

    public LevelSelectPanel(List<LevelData> levels, LevelSelectCallback callback) {
        this.titleFont = new Font("Monospaced", Font.BOLD, 36);
        this.buttonFont = new Font("Monospaced", Font.BOLD, 16);
        this.levelInfoFont = new Font("Monospaced", Font.PLAIN, 12);
        this.buttonBgColor = new Color(60, 60, 80);
        this.buttonHoverColor = new Color(80, 80, 110);

        setBackground(GraphicsConfig.COLOR_BACKGROUND);
        setLayout(new BorderLayout());

        JLabel titleLabel = new JLabel("选择关卡");
        titleLabel.setFont(titleFont);
        titleLabel.setForeground(GraphicsConfig.COLOR_HUD_ACCENT);
        titleLabel.setHorizontalAlignment(SwingConstants.CENTER);
        titleLabel.setBorder(BorderFactory.createEmptyBorder(30, 0, 30, 0));
        add(titleLabel, BorderLayout.NORTH);

        JPanel levelsPanel = new JPanel();
        levelsPanel.setLayout(new GridBagLayout());
        levelsPanel.setBackground(GraphicsConfig.COLOR_BACKGROUND);
        levelsPanel.setOpaque(true);

        GridBagConstraints gbc = new GridBagConstraints();
        gbc.insets = new Insets(15, 15, 15, 15);
        gbc.fill = GridBagConstraints.BOTH;

        int cols = 3;
        for (int i = 0; i < levels.size(); i++) {
            LevelData level = levels.get(i);
            JButton levelButton = createLevelButton(level, callback);
            
            gbc.gridx = i % cols;
            gbc.gridy = i / cols;
            gbc.weightx = 1.0 / cols;
            
            levelsPanel.add(levelButton, gbc);
        }

        JScrollPane scrollPane = new JScrollPane(levelsPanel);
        scrollPane.setHorizontalScrollBarPolicy(JScrollPane.HORIZONTAL_SCROLLBAR_NEVER);
        scrollPane.setVerticalScrollBarPolicy(JScrollPane.VERTICAL_SCROLLBAR_AS_NEEDED);
        scrollPane.getViewport().setBackground(GraphicsConfig.COLOR_BACKGROUND);
        scrollPane.setBorder(null);
        add(scrollPane, BorderLayout.CENTER);

        JPanel bottomPanel = new JPanel(new FlowLayout(FlowLayout.CENTER, 20, 20));
        bottomPanel.setBackground(GraphicsConfig.COLOR_BACKGROUND);
        bottomPanel.setOpaque(true);

        JButton backButton = createButton("返回", e -> callback.onBack());
        bottomPanel.add(backButton);

        add(bottomPanel, BorderLayout.SOUTH);
    }

    private JButton createLevelButton(LevelData level, LevelSelectCallback callback) {
        String html = "<html>" +
                "<div style='text-align: center; padding: 5px;'>" +
                "<b>" + level.getName() + "</b><br/>" +
                "<small>难度: " + getDifficultyStars(level.getDifficulty()) + "</small><br/>" +
                "<small>标准步数: " + level.getParMoves() + "</small>" +
                "</div></html>";

        JButton button = new JButton(html);
        button.setFont(buttonFont);
        button.setBackground(buttonBgColor);
        button.setForeground(GraphicsConfig.COLOR_HUD_TEXT);
        button.setFocusPainted(false);
        button.setBorderPainted(true);
        button.setBorder(BorderFactory.createLineBorder(GraphicsConfig.COLOR_HUD_ACCENT, 2));
        button.setPreferredSize(new Dimension(180, 100));
        button.setMinimumSize(new Dimension(180, 100));
        button.addActionListener(e -> callback.onSelectLevel(level));

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

    private String getDifficultyStars(int difficulty) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 3; i++) {
            if (i < difficulty) {
                sb.append("★");
            } else {
                sb.append("☆");
            }
        }
        return sb.toString();
    }

    private JButton createButton(String text, java.awt.event.ActionListener listener) {
        JButton button = new JButton(text);
        button.setFont(buttonFont);
        button.setBackground(buttonBgColor);
        button.setForeground(GraphicsConfig.COLOR_HUD_TEXT);
        button.setFocusPainted(false);
        button.setBorderPainted(true);
        button.setBorder(BorderFactory.createLineBorder(GraphicsConfig.COLOR_HUD_ACCENT, 2));
        button.setPreferredSize(new Dimension(120, 40));
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
