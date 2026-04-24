package com.chat.server.model;

import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.net.Socket;
import java.time.LocalDateTime;

public class ClientInfo {
    private String username;
    private Socket socket;
    private ObjectInputStream in;
    private ObjectOutputStream out;
    private LocalDateTime lastHeartbeat;

    public ClientInfo(String username, Socket socket, ObjectInputStream in, ObjectOutputStream out) {
        this.username = username;
        this.socket = socket;
        this.in = in;
        this.out = out;
        this.lastHeartbeat = LocalDateTime.now();
    }

    public String getUsername() {
        return username;
    }

    public Socket getSocket() {
        return socket;
    }

    public ObjectInputStream getIn() {
        return in;
    }

    public ObjectOutputStream getOut() {
        return out;
    }

    public LocalDateTime getLastHeartbeat() {
        return lastHeartbeat;
    }

    public void setLastHeartbeat(LocalDateTime lastHeartbeat) {
        this.lastHeartbeat = lastHeartbeat;
    }
}
