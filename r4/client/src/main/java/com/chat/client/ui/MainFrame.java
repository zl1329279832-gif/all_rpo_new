package com.chat.client.ui;

import com.chat.client.network.ChatClient;
import com.chat.common.protocol.Message;
import com.chat.common.util.DateUtil;

import javax.swing.*;
import javax.swing.border.EmptyBorder;
import javax.swing.border.TitledBorder;
import java.awt.*;
import java.awt.event.WindowAdapter;
import java.awt.event.WindowEvent;
import java.util.List;

public class MainFrame extends JFrame implements ChatClient.MessageListener {
    private ChatClient chatClient;
    private JTextArea groupChatArea;
    private JTextArea privateChatArea;
    private JList<String> userList;
    private DefaultListModel<String> userListModel;
    private JTextField groupInputField;
    private JTextField privateInputField;
    private JLabel statusLabel;
    private JTextArea systemArea;
    private JTabbedPane tabbedPane;
    private String currentPrivateChatUser;

    public MainFrame() {
        this.chatClient = ChatClient.getInstance();
        this.chatClient.setMessageListener(this);
        initUI();
    }

    private void initUI() {
        setTitle("Java 聊天系统 - " + chatClient.getCurrentUsername());
        setSize(900, 600);
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setLocationRelativeTo(null);

        addWindowListener(new WindowAdapter() {
            @Override
            public void windowClosing(WindowEvent e) {
                chatClient.disconnect();
            }
        });

        JSplitPane splitPane = new JSplitPane(JSplitPane.HORIZONTAL_SPLIT);
        splitPane.setResizeWeight(0.75);

        JPanel chatPanel = createChatPanel();
        JPanel userPanel = createUserPanel();

        splitPane.setLeftComponent(chatPanel);
        splitPane.setRightComponent(userPanel);

        JPanel statusPanel = new JPanel(new BorderLayout());
        statusLabel = new JLabel("状态: 已连接 | 用户: " + chatClient.getCurrentUsername());
        statusLabel.setBorder(new EmptyBorder(5, 10, 5, 10));
        statusPanel.add(statusLabel, BorderLayout.WEST);

        add(splitPane, BorderLayout.CENTER);
        add(statusPanel, BorderLayout.SOUTH);
    }

    private JPanel createChatPanel() {
        JPanel panel = new JPanel(new BorderLayout());
        panel.setBorder(new EmptyBorder(10, 10, 10, 10));

        tabbedPane = new JTabbedPane();

        JPanel groupPanel = createGroupChatPanel();
        JPanel privatePanel = createPrivateChatPanel();
        JPanel systemPanel = createSystemPanel();

        tabbedPane.addTab("群聊", groupPanel);
        tabbedPane.addTab("私聊", privatePanel);
        tabbedPane.addTab("系统消息", systemPanel);

        panel.add(tabbedPane, BorderLayout.CENTER);

        return panel;
    }

    private JPanel createGroupChatPanel() {
        JPanel panel = new JPanel(new BorderLayout());

        groupChatArea = new JTextArea();
        groupChatArea.setEditable(false);
        groupChatArea.setLineWrap(true);
        groupChatArea.setFont(new Font("微软雅黑", Font.PLAIN, 14));
        JScrollPane groupScroll = new JScrollPane(groupChatArea);
        groupScroll.setBorder(new TitledBorder("群聊消息"));

        JPanel inputPanel = new JPanel(new BorderLayout(5, 5));
        groupInputField = new JTextField();
        groupInputField.setFont(new Font("微软雅黑", Font.PLAIN, 14));
        JButton sendButton = new JButton("发送");
        sendButton.addActionListener(e -> sendGroupMessage());
        groupInputField.addActionListener(e -> sendGroupMessage());

        inputPanel.add(groupInputField, BorderLayout.CENTER);
        inputPanel.add(sendButton, BorderLayout.EAST);
        inputPanel.setBorder(new EmptyBorder(5, 0, 0, 0));

        panel.add(groupScroll, BorderLayout.CENTER);
        panel.add(inputPanel, BorderLayout.SOUTH);

        return panel;
    }

    private JPanel createPrivateChatPanel() {
        JPanel panel = new JPanel(new BorderLayout());

        privateChatArea = new JTextArea();
        privateChatArea.setEditable(false);
        privateChatArea.setLineWrap(true);
        privateChatArea.setFont(new Font("微软雅黑", Font.PLAIN, 14));
        JScrollPane privateScroll = new JScrollPane(privateChatArea);
        privateScroll.setBorder(new TitledBorder("私聊消息"));

        JPanel inputPanel = new JPanel(new BorderLayout(5, 5));
        privateInputField = new JTextField();
        privateInputField.setFont(new Font("微软雅黑", Font.PLAIN, 14));
        JButton sendButton = new JButton("发送");
        sendButton.addActionListener(e -> sendPrivateMessage());
        privateInputField.addActionListener(e -> sendPrivateMessage());

        inputPanel.add(privateInputField, BorderLayout.CENTER);
        inputPanel.add(sendButton, BorderLayout.EAST);
        inputPanel.setBorder(new EmptyBorder(5, 0, 0, 0));

        panel.add(privateScroll, BorderLayout.CENTER);
        panel.add(inputPanel, BorderLayout.SOUTH);

        return panel;
    }

    private JPanel createSystemPanel() {
        JPanel panel = new JPanel(new BorderLayout());

        systemArea = new JTextArea();
        systemArea.setEditable(false);
        systemArea.setLineWrap(true);
        systemArea.setFont(new Font("微软雅黑", Font.PLAIN, 14));
        JScrollPane systemScroll = new JScrollPane(systemArea);
        systemScroll.setBorder(new TitledBorder("系统提示"));

        panel.add(systemScroll, BorderLayout.CENTER);

        return panel;
    }

    private JPanel createUserPanel() {
        JPanel panel = new JPanel(new BorderLayout());
        panel.setBorder(new EmptyBorder(10, 0, 10, 10));

        userListModel = new DefaultListModel<>();
        userList = new JList<>(userListModel);
        userList.setFont(new Font("微软雅黑", Font.PLAIN, 14));
        userList.setSelectionMode(ListSelectionModel.SINGLE_SELECTION);
        userList.addListSelectionListener(e -> {
            if (!e.getValueIsAdjusting()) {
                String selectedUser = userList.getSelectedValue();
                if (selectedUser != null && !selectedUser.equals(chatClient.getCurrentUsername())) {
                    currentPrivateChatUser = selectedUser;
                    tabbedPane.setSelectedIndex(1);
                }
            }
        });

        JScrollPane userScroll = new JScrollPane(userList);
        userScroll.setBorder(new TitledBorder("在线用户"));

        panel.add(userScroll, BorderLayout.CENTER);

        return panel;
    }

    private void sendGroupMessage() {
        String content = groupInputField.getText().trim();
        if (!content.isEmpty()) {
            chatClient.sendGroupMessage(content);
            groupInputField.setText("");
        }
    }

    private void sendPrivateMessage() {
        String content = privateInputField.getText().trim();
        if (currentPrivateChatUser == null) {
            JOptionPane.showMessageDialog(this, "请先在右侧选择私聊用户", "提示", JOptionPane.WARNING_MESSAGE);
            return;
        }
        if (!content.isEmpty()) {
            chatClient.sendPrivateMessage(currentPrivateChatUser, content);
            privateInputField.setText("");
        }
    }

    @Override
    public void onGroupMessage(Message message) {
        SwingUtilities.invokeLater(() -> {
            String time = DateUtil.formatTime(message.getTimestamp());
            String display = String.format("[%s] %s: %s\n", time, message.getSender(), message.getContent());
            groupChatArea.append(display);
            groupChatArea.setCaretPosition(groupChatArea.getDocument().getLength());
        });
    }

    @Override
    public void onPrivateMessage(Message message) {
        SwingUtilities.invokeLater(() -> {
            String time = DateUtil.formatTime(message.getTimestamp());
            String otherUser = message.getSender().equals(chatClient.getCurrentUsername()) 
                    ? message.getReceiver() 
                    : message.getSender();
            String display = String.format("[%s] %s: %s\n", time, message.getSender(), message.getContent());
            privateChatArea.append(display);
            privateChatArea.setCaretPosition(privateChatArea.getDocument().getLength());
        });
    }

    @Override
    public void onUserListUpdate(List<String> users) {
        SwingUtilities.invokeLater(() -> {
            userListModel.clear();
            for (String user : users) {
                userListModel.addElement(user);
            }
        });
    }

    @Override
    public void onSystemNotice(String notice) {
        SwingUtilities.invokeLater(() -> {
            String display = String.format("[系统] %s\n", notice);
            systemArea.append(display);
            systemArea.setCaretPosition(systemArea.getDocument().getLength());
        });
    }

    @Override
    public void onDisconnect() {
        SwingUtilities.invokeLater(() -> {
            statusLabel.setText("状态: 已断开连接");
            JOptionPane.showMessageDialog(this, "与服务器断开连接", "错误", JOptionPane.ERROR_MESSAGE);
            System.exit(0);
        });
    }
}
