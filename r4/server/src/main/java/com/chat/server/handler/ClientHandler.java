package com.chat.server.handler;

import com.chat.common.constants.ChatConstants;
import com.chat.common.protocol.Message;
import com.chat.common.protocol.MessageType;
import com.chat.server.manager.ClientManager;
import com.chat.server.model.ClientInfo;

import java.io.IOException;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.net.Socket;
import java.util.Date;

public class ClientHandler implements Runnable {
    private final Socket socket;
    private ObjectInputStream in;
    private ObjectOutputStream out;
    private String username;
    private boolean running;
    private final ClientManager clientManager;

    public ClientHandler(Socket socket) {
        this.socket = socket;
        this.clientManager = ClientManager.getInstance();
        this.running = true;
    }

    @Override
    public void run() {
        try {
            out = new ObjectOutputStream(socket.getOutputStream());
            in = new ObjectInputStream(socket.getInputStream());

            while (running) {
                Message message = (Message) in.readObject();
                handleMessage(message);
            }
        } catch (IOException | ClassNotFoundException e) {
            System.err.println("客户端连接异常: " + e.getMessage());
        } finally {
            cleanup();
        }
    }

    private void handleMessage(Message message) throws IOException {
        switch (message.getType()) {
            case LOGIN:
                handleLogin(message);
                break;
            case LOGOUT:
                handleLogout();
                break;
            case CHAT_GROUP:
                handleGroupChat(message);
                break;
            case CHAT_PRIVATE:
                handlePrivateChat(message);
                break;
            case HEARTBEAT:
                handleHeartbeat();
                break;
            default:
                System.err.println("未知消息类型: " + message.getType());
        }
    }

    private void handleLogin(Message message) throws IOException {
        String newUsername = message.getSender();
        Message response = new Message();
        response.setType(MessageType.LOGIN_RESPONSE);

        if (clientManager.isUserOnline(newUsername)) {
            response.setSuccess(false);
            response.setErrorMessage("用户名已存在，请使用其他昵称");
            out.writeObject(response);
            out.flush();
            return;
        }

        this.username = newUsername;
        ClientInfo clientInfo = new ClientInfo(username, socket, in, out);
        clientManager.addClient(username, clientInfo);

        response.setSuccess(true);
        response.setContent("登录成功，欢迎 " + username);
        out.writeObject(response);
        out.flush();

        System.out.println("[" + new Date() + "] 用户 " + username + " 上线了");

        // 先向新登录的用户发送当前的在线用户列表
        Message userListMsg = new Message();
        userListMsg.setType(MessageType.USER_LIST);
        userListMsg.setUserList(clientManager.getOnlineUsers());
        out.writeObject(userListMsg);
        out.flush();

        // 向新登录的用户发送欢迎消息
        Message welcomeMsg = new Message();
        welcomeMsg.setType(MessageType.SYSTEM_NOTICE);
        welcomeMsg.setContent("欢迎 " + username + " 加入聊天室！");
        out.writeObject(welcomeMsg);
        out.flush();

        // 然后向所有用户广播新用户上线的通知
        Message notice = new Message();
        notice.setType(MessageType.SYSTEM_NOTICE);
        notice.setContent("用户 " + username + " 上线了");
        clientManager.broadcastMessage(notice);

        // 最后向所有用户广播更新后的在线用户列表
        clientManager.broadcastUserList();
    }

    private void handleLogout() throws IOException {
        if (username != null) {
            System.out.println("[" + new Date() + "] 用户 " + username + " 下线了");
            clientManager.removeClient(username);

            Message notice = new Message();
            notice.setType(MessageType.SYSTEM_NOTICE);
            notice.setContent("用户 " + username + " 下线了");
            clientManager.broadcastMessage(notice);

            clientManager.broadcastUserList();
        }
        running = false;
    }

    private void handleGroupChat(Message message) throws IOException {
        message.setType(MessageType.CHAT_GROUP);
        clientManager.broadcastMessage(message);
        System.out.println("[" + new Date() + "] " + message.getSender() + " 群聊: " + message.getContent());
    }

    private void handlePrivateChat(Message message) throws IOException {
        String receiver = message.getReceiver();
        if (clientManager.isUserOnline(receiver)) {
            clientManager.sendMessageToUser(receiver, message);
            clientManager.sendMessageToUser(username, message);
            System.out.println("[" + new Date() + "] " + username + " 私聊 " + receiver + ": " + message.getContent());
        } else {
            Message errorMsg = new Message();
            errorMsg.setType(MessageType.SYSTEM_NOTICE);
            errorMsg.setContent("用户 " + receiver + " 不在线");
            clientManager.sendMessageToUser(username, errorMsg);
        }
    }

    private void handleHeartbeat() throws IOException {
        ClientInfo client = clientManager.getClient(username);
        if (client != null) {
            client.setLastHeartbeat(new Date());
        }
        Message response = new Message();
        response.setType(MessageType.HEARTBEAT_RESPONSE);
        out.writeObject(response);
        out.flush();
    }

    private void cleanup() {
        try {
            if (username != null) {
                clientManager.removeClient(username);
                Message notice = new Message();
                notice.setType(MessageType.SYSTEM_NOTICE);
                notice.setContent("用户 " + username + " 断开连接");
                clientManager.broadcastMessage(notice);
                clientManager.broadcastUserList();
                System.out.println("[" + new Date() + "] 用户 " + username + " 连接关闭");
            }
            if (in != null) in.close();
            if (out != null) out.close();
            if (socket != null) socket.close();
        } catch (IOException e) {
            System.err.println("清理资源失败: " + e.getMessage());
        }
    }
}
