package com.chat.client.network;

import com.chat.common.constants.ChatConstants;
import com.chat.common.protocol.Message;
import com.chat.common.protocol.MessageType;

import javax.swing.*;
import java.io.IOException;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.net.Socket;
import java.util.List;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

public class ChatClient {
    private static ChatClient instance;
    private String serverHost;
    private int serverPort;
    private Socket socket;
    private ObjectInputStream in;
    private ObjectOutputStream out;
    private String currentUsername;
    private boolean connected;
    private MessageListener messageListener;
    private ScheduledExecutorService heartbeatExecutor;

    private ChatClient() {
        this.serverHost = ChatConstants.DEFAULT_HOST;
        this.serverPort = ChatConstants.DEFAULT_PORT;
    }

    public static synchronized ChatClient getInstance() {
        if (instance == null) {
            instance = new ChatClient();
        }
        return instance;
    }

    public void setMessageListener(MessageListener listener) {
        this.messageListener = listener;
    }

    public boolean connect(String host, int port, String username) {
        this.serverHost = host;
        this.serverPort = port;
        this.currentUsername = username;

        try {
            socket = new Socket(serverHost, serverPort);
            out = new ObjectOutputStream(socket.getOutputStream());
            in = new ObjectInputStream(socket.getInputStream());
            connected = true;

            Message loginMsg = new Message();
            loginMsg.setType(MessageType.LOGIN);
            loginMsg.setSender(username);
            sendMessage(loginMsg);

            Message response = (Message) in.readObject();
            if (response.getType() == MessageType.LOGIN_RESPONSE) {
                if (response.isSuccess()) {
                    new Thread(this::receiveMessages).start();
                    startHeartbeat();
                    return true;
                } else {
                    JOptionPane.showMessageDialog(null, response.getErrorMessage(), "登录失败", JOptionPane.ERROR_MESSAGE);
                    disconnect();
                    return false;
                }
            }
            return false;
        } catch (IOException | ClassNotFoundException e) {
            JOptionPane.showMessageDialog(null, "连接服务器失败: " + e.getMessage(), "错误", JOptionPane.ERROR_MESSAGE);
            return false;
        }
    }

    private void receiveMessages() {
        try {
            while (connected) {
                Message message = (Message) in.readObject();
                handleMessage(message);
            }
        } catch (IOException | ClassNotFoundException e) {
            if (connected) {
                System.err.println("接收消息异常: " + e.getMessage());
                if (messageListener != null) {
                    messageListener.onDisconnect();
                }
            }
        }
    }

    private void handleMessage(Message message) {
        if (messageListener == null) return;

        switch (message.getType()) {
            case CHAT_GROUP:
                messageListener.onGroupMessage(message);
                break;
            case CHAT_PRIVATE:
                messageListener.onPrivateMessage(message);
                break;
            case USER_LIST:
                messageListener.onUserListUpdate(message.getUserList());
                break;
            case SYSTEM_NOTICE:
                messageListener.onSystemNotice(message.getContent());
                break;
            case HEARTBEAT_RESPONSE:
                break;
            default:
                System.err.println("未知消息类型: " + message.getType());
        }
    }

    public void sendMessage(Message message) {
        try {
            out.writeObject(message);
            out.flush();
        } catch (IOException e) {
            System.err.println("发送消息失败: " + e.getMessage());
        }
    }

    public void sendGroupMessage(String content) {
        Message message = new Message();
        message.setType(MessageType.CHAT_GROUP);
        message.setSender(currentUsername);
        message.setContent(content);
        sendMessage(message);
    }

    public void sendPrivateMessage(String receiver, String content) {
        Message message = new Message();
        message.setType(MessageType.CHAT_PRIVATE);
        message.setSender(currentUsername);
        message.setReceiver(receiver);
        message.setContent(content);
        sendMessage(message);
    }

    private void startHeartbeat() {
        heartbeatExecutor = Executors.newSingleThreadScheduledExecutor();
        heartbeatExecutor.scheduleAtFixedRate(() -> {
            if (connected) {
                Message heartbeatMsg = new Message();
                heartbeatMsg.setType(MessageType.HEARTBEAT);
                sendMessage(heartbeatMsg);
            }
        }, ChatConstants.HEARTBEAT_INTERVAL, ChatConstants.HEARTBEAT_INTERVAL, TimeUnit.MILLISECONDS);
    }

    private void stopHeartbeat() {
        if (heartbeatExecutor != null && !heartbeatExecutor.isShutdown()) {
            heartbeatExecutor.shutdown();
        }
    }

    public void disconnect() {
        if (connected) {
            try {
                Message logoutMsg = new Message();
                logoutMsg.setType(MessageType.LOGOUT);
                logoutMsg.setSender(currentUsername);
                sendMessage(logoutMsg);
            } catch (Exception e) {
                System.err.println("发送登出消息失败: " + e.getMessage());
            }
        }

        connected = false;
        stopHeartbeat();

        try {
            if (in != null) in.close();
            if (out != null) out.close();
            if (socket != null) socket.close();
        } catch (IOException e) {
            System.err.println("关闭连接失败: " + e.getMessage());
        }
    }

    public String getCurrentUsername() {
        return currentUsername;
    }

    public boolean isConnected() {
        return connected;
    }

    public interface MessageListener {
        void onGroupMessage(Message message);
        void onPrivateMessage(Message message);
        void onUserListUpdate(List<String> users);
        void onSystemNotice(String notice);
        void onDisconnect();
    }
}
