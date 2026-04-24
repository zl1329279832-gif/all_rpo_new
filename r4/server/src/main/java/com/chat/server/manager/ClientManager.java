package com.chat.server.manager;

import com.chat.common.protocol.Message;
import com.chat.common.protocol.MessageType;
import com.chat.server.model.ClientInfo;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class ClientManager {
    private static ClientManager instance;
    private final Map<String, ClientInfo> clients;

    private ClientManager() {
        clients = new ConcurrentHashMap<>();
    }

    public static synchronized ClientManager getInstance() {
        if (instance == null) {
            instance = new ClientManager();
        }
        return instance;
    }

    public void addClient(String username, ClientInfo clientInfo) {
        clients.put(username, clientInfo);
    }

    public void removeClient(String username) {
        clients.remove(username);
    }

    public ClientInfo getClient(String username) {
        return clients.get(username);
    }

    public List<String> getOnlineUsers() {
        return new ArrayList<>(clients.keySet());
    }

    public boolean isUserOnline(String username) {
        return clients.containsKey(username);
    }

    public void sendMessageToUser(String username, Message message) throws IOException {
        ClientInfo client = clients.get(username);
        if (client != null) {
            client.getOut().writeObject(message);
            client.getOut().flush();
        }
    }

    public void broadcastMessage(Message message) throws IOException {
        for (ClientInfo client : clients.values()) {
            try {
                client.getOut().writeObject(message);
                client.getOut().flush();
            } catch (IOException e) {
                System.err.println("发送消息给 " + client.getUsername() + " 失败: " + e.getMessage());
            }
        }
    }

    public void broadcastUserList() throws IOException {
        Message message = new Message();
        message.setType(MessageType.USER_LIST);
        message.setUserList(getOnlineUsers());
        broadcastMessage(message);
    }
}
