package com.chat.server.model;

import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.net.Socket;
import java.util.Date;

public class ClientInfo {
    private String username;
    private Socket socket;
    private ObjectInputStream in;
    private ObjectOutputStream out;
    private Date lastHeartbeat;

    public ClientInfo(String username, Socket socket, ObjectInputStream in, ObjectOutputStream out) {
        this.username = username;
        this.socket = socket;
        this.in = in;
        this.out = out;
        this.lastHeartbeat = new Date();
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

    public Date getLastHeartbeat() {
        return lastHeartbeat;
    }

    public void setLastHeartbeat(Date lastHeartbeat) {
        this.lastHeartbeat = lastHeartbeat;
    }
}
