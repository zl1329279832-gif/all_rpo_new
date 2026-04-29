package com.sokoban.ui;

import com.sokoban.config.GraphicsConfig;
import com.sokoban.engine.RatingSystem;
import com.sokoban.level.LevelData;
import com.sokoban.storage.RankingEntry;

import javax.swing.*;
import javax.swing.table.DefaultTableCellRenderer;
import javax.swing.table.DefaultTableModel;
import java.awt.*;
import java.util.List;

public class RankingPanel extends JPanel {
    private final Font titleFont;
    private final Font buttonFont;
    private final Font tableFont;
    private final Color buttonBgColor;
    private final Color buttonHoverColor;

    public interface RankingCallback {
        void onBack();
    }

    public RankingPanel(List<LevelData> levels, 
                        java.util.Map<String, List<RankingEntry>> rankingMap,
                        RankingCallback callback) {
        this.titleFont = new Font("Monospaced", Font.BOLD, 36);
        this.buttonFont = new Font("Monospaced", Font.BOLD, 16);
        this.tableFont = new Font("Monospaced", Font.PLAIN, 14);
        this.buttonBgColor = new Color(60, 60, 80);
        this.buttonHoverColor = new Color(80, 80, 110);

        setBackground(GraphicsConfig.COLOR_BACKGROUND);
        setLayout(new BorderLayout());

        JLabel titleLabel = new JLabel("排行榜");
        titleLabel.setFont(titleFont);
        titleLabel.setForeground(GraphicsConfig.COLOR_HUD_ACCENT);
        titleLabel.setHorizontalAlignment(SwingConstants.CENTER);
        titleLabel.setBorder(BorderFactory.createEmptyBorder(20, 0, 20, 0));
        add(titleLabel, BorderLayout.NORTH);

        JTabbedPane tabbedPane = new JTabbedPane();
        tabbedPane.setFont(buttonFont);
        tabbedPane.setBackground(GraphicsConfig.COLOR_BACKGROUND);
        tabbedPane.setOpaque(true);

        for (LevelData level : levels) {
            List<RankingEntry> entries = rankingMap.getOrDefault(level.getId(), List.of());
            JScrollPane levelScroll = createLevelRankingTable(entries);
            tabbedPane.addTab(level.getName(), levelScroll);
        }

        if (levels.isEmpty()) {
            JPanel emptyPanel = new JPanel(new GridBagLayout());
            emptyPanel.setBackground(GraphicsConfig.COLOR_BACKGROUND);
            JLabel emptyLabel = new JLabel("暂无关卡数据");
            emptyLabel.setFont(buttonFont);
            emptyLabel.setForeground(GraphicsConfig.COLOR_HUD_TEXT);
            emptyPanel.add(emptyLabel);
            tabbedPane.addTab("无数据", emptyPanel);
        }

        add(tabbedPane, BorderLayout.CENTER);

        JPanel bottomPanel = new JPanel(new FlowLayout(FlowLayout.CENTER, 20, 20));
        bottomPanel.setBackground(GraphicsConfig.COLOR_BACKGROUND);
        bottomPanel.setOpaque(true);

        JButton backButton = createButton("返回", e -> callback.onBack());
        bottomPanel.add(backButton);

        add(bottomPanel, BorderLayout.SOUTH);
    }

    private JScrollPane createLevelRankingTable(List<RankingEntry> entries) {
        String[] columnNames = {"排名", "玩家", "步数", "时间", "星级"};
        DefaultTableModel model = new DefaultTableModel(columnNames, 0) {
            @Override
            public boolean isCellEditable(int row, int column) {
                return false;
            }
        };

        for (int i = 0; i < entries.size(); i++) {
            RankingEntry entry = entries.get(i);
            String timeStr = String.format("%02d:%02d", 
                entry.getTimeSeconds() / 60, entry.getTimeSeconds() % 60);
            model.addRow(new Object[]{
                (i + 1) + ".",
                entry.getPlayerName(),
                entry.getMoves(),
                timeStr,
                RatingSystem.formatStars(entry.getStars())
            });
        }

        if (entries.isEmpty()) {
            model.addRow(new Object[]{"-", "暂无记录", "-", "-", "-"});
        }

        JTable table = new JTable(model);
        table.setFont(tableFont);
        table.setRowHeight(30);
        table.setBackground(GraphicsConfig.COLOR_BACKGROUND);
        table.setForeground(GraphicsConfig.COLOR_HUD_TEXT);
        table.setGridColor(new Color(80, 80, 100));
        table.setSelectionBackground(new Color(80, 80, 120));
        table.setSelectionForeground(GraphicsConfig.COLOR_HUD_TEXT);

        table.getTableHeader().setFont(new Font("Monospaced", Font.BOLD, 14));
        table.getTableHeader().setBackground(GraphicsConfig.COLOR_HUD_BACKGROUND);
        table.getTableHeader().setForeground(GraphicsConfig.COLOR_HUD_ACCENT);

        DefaultTableCellRenderer renderer = new DefaultTableCellRenderer();
        renderer.setHorizontalAlignment(SwingConstants.CENTER);
        renderer.setBackground(GraphicsConfig.COLOR_BACKGROUND);
        renderer.setForeground(GraphicsConfig.COLOR_HUD_TEXT);
        
        for (int i = 0; i < table.getColumnCount(); i++) {
            table.getColumnModel().getColumn(i).setCellRenderer(renderer);
        }

        JScrollPane scrollPane = new JScrollPane(table);
        scrollPane.getViewport().setBackground(GraphicsConfig.COLOR_BACKGROUND);
        scrollPane.setBorder(BorderFactory.createEmptyBorder(10, 10, 10, 10));
        
        return scrollPane;
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
