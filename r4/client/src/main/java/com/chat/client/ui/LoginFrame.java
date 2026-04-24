package com.chat.client.ui;

import com.chat.client.network.ChatClient;

import javax.swing.*;
import java.awt.*;

public class LoginFrame extends JFrame {
    private JTextField hostField;
    private JTextField portField;
    private JTextField usernameField;
    private JButton loginButton;
    private ChatClient chatClient;

    public LoginFrame() {
        this.chatClient = ChatClient.getInstance();
        initUI();
    }

    private void initUI() {
        setTitle("Java 聊天系统 - 登录");
        setSize(400, 300);
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setLocationRelativeTo(null);
        setResizable(false);

        JPanel mainPanel = new JPanel(new GridBagLayout());
        mainPanel.setBorder(BorderFactory.createEmptyBorder(20, 20, 20, 20));
        GridBagConstraints gbc = new GridBagConstraints();
        gbc.insets = new Insets(10, 10, 10, 10);
        gbc.fill = GridBagConstraints.HORIZONTAL;

        JLabel titleLabel = new JLabel("欢迎使用 Java 聊天系统", SwingConstants.CENTER);
        titleLabel.setFont(new Font("微软雅黑", Font.BOLD, 18));
        gbc.gridx = 0;
        gbc.gridy = 0;
        gbc.gridwidth = 2;
        mainPanel.add(titleLabel, gbc);

        gbc.gridwidth = 1;

        JLabel hostLabel = new JLabel("服务器地址:");
        gbc.gridx = 0;
        gbc.gridy = 1;
        mainPanel.add(hostLabel, gbc);

        hostField = new JTextField("localhost", 15);
        gbc.gridx = 1;
        gbc.gridy = 1;
        mainPanel.add(hostField, gbc);

        JLabel portLabel = new JLabel("端口:");
        gbc.gridx = 0;
        gbc.gridy = 2;
        mainPanel.add(portLabel, gbc);

        portField = new JTextField("8888", 15);
        gbc.gridx = 1;
        gbc.gridy = 2;
        mainPanel.add(portField, gbc);

        JLabel usernameLabel = new JLabel("昵称:");
        gbc.gridx = 0;
        gbc.gridy = 3;
        mainPanel.add(usernameLabel, gbc);

        usernameField = new JTextField(15);
        gbc.gridx = 1;
        gbc.gridy = 3;
        mainPanel.add(usernameField, gbc);

        loginButton = new JButton("登录");
        loginButton.setFont(new Font("微软雅黑", Font.PLAIN, 14));
        loginButton.setPreferredSize(new Dimension(100, 35));
        loginButton.addActionListener(e -> login());
        gbc.gridx = 0;
        gbc.gridy = 4;
        gbc.gridwidth = 2;
        gbc.fill = GridBagConstraints.CENTER;
        mainPanel.add(loginButton, gbc);

        add(mainPanel);

        getRootPane().setDefaultButton(loginButton);
    }

    private void login() {
        String host = hostField.getText().trim();
        String portStr = portField.getText().trim();
        String username = usernameField.getText().trim();

        if (username.isEmpty()) {
            JOptionPane.showMessageDialog(this, "请输入昵称", "提示", JOptionPane.WARNING_MESSAGE);
            return;
        }

        int port;
        try {
            port = Integer.parseInt(portStr);
        } catch (NumberFormatException e) {
            JOptionPane.showMessageDialog(this, "端口格式错误", "提示", JOptionPane.WARNING_MESSAGE);
            return;
        }

        loginButton.setEnabled(false);
        SwingUtilities.invokeLater(() -> {
            boolean success = chatClient.connect(host, port, username);
            if (success) {
                openMainFrame();
            } else {
                loginButton.setEnabled(true);
            }
        });
    }

    private void openMainFrame() {
        SwingUtilities.invokeLater(() -> {
            MainFrame mainFrame = new MainFrame();
            mainFrame.setVisible(true);
            dispose();
        });
    }
}
