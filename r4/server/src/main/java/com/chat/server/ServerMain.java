package com.chat.server;

import com.chat.common.constants.ChatConstants;
import com.chat.server.handler.ClientHandler;

import java.io.IOException;
import java.net.ServerSocket;
import java.net.Socket;
import java.time.LocalDateTime;

public class ServerMain {
    private static final int PORT = ChatConstants.DEFAULT_PORT;
    private static boolean running = true;

    public static void main(String[] args) {
        try (ServerSocket serverSocket = new ServerSocket(PORT)) {
            System.out.println("========================================");
            System.out.println("      Java 聊天系统 - 服务端启动");
            System.out.println("========================================");
            System.out.println("[" + LocalDateTime.now() + "] 服务端启动成功，监听端口: " + PORT);
            System.out.println("等待客户端连接...");

            while (running) {
                try {
                    Socket clientSocket = serverSocket.accept();
                    System.out.println("[" + LocalDateTime.now() + "] 新客户端连接: " + clientSocket.getInetAddress());
                    ClientHandler handler = new ClientHandler(clientSocket);
                    new Thread(handler).start();
                } catch (IOException e) {
                    if (running) {
                        System.err.println("接受客户端连接失败: " + e.getMessage());
                    }
                }
            }
        } catch (IOException e) {
            System.err.println("服务端启动失败: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
