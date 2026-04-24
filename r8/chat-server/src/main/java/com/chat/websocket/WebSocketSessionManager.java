package com.chat.websocket;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketSession;

import java.util.concurrent.ConcurrentHashMap;

@Component
public class WebSocketSessionManager {

    private static final Logger log = LoggerFactory.getLogger(WebSocketSessionManager.class);

    private final ConcurrentHashMap<Long, WebSocketSession> sessionMap = new ConcurrentHashMap<>();

    public void addSession(Long userId, WebSocketSession session) {
        sessionMap.put(userId, session);
        log.info("WebSocket 连接建立: userId={}, sessionId={}", userId, session.getId());
    }

    public void removeSession(Long userId) {
        sessionMap.remove(userId);
        log.info("WebSocket 连接关闭: userId={}", userId);
    }

    public WebSocketSession getSession(Long userId) {
        return sessionMap.get(userId);
    }

    public boolean isConnected(Long userId) {
        return sessionMap.containsKey(userId);
    }

    public int getOnlineCount() {
        return sessionMap.size();
    }

    public ConcurrentHashMap<Long, WebSocketSession> getAllSessions() {
        return sessionMap;
    }
}
