package com.chat.websocket;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class WebSocketMessage {

    private String type;

    private Long fromUserId;

    private Long toUserId;

    private Long groupId;

    private Integer chatType;

    private Integer messageType;

    private String content;

    private Object data;

    private LocalDateTime timestamp;

    public static WebSocketMessage createChatMessage(Long fromUserId, Long toUserId, Long groupId, 
                                                       Integer chatType, Integer messageType, String content) {
        WebSocketMessage msg = new WebSocketMessage();
        msg.setType("chat");
        msg.setFromUserId(fromUserId);
        msg.setToUserId(toUserId);
        msg.setGroupId(groupId);
        msg.setChatType(chatType);
        msg.setMessageType(messageType);
        msg.setContent(content);
        msg.setTimestamp(LocalDateTime.now());
        return msg;
    }

    public static WebSocketMessage createOnlineNotify(Long userId, boolean online) {
        WebSocketMessage msg = new WebSocketMessage();
        msg.setType(online ? "online" : "offline");
        msg.setFromUserId(userId);
        msg.setData(online);
        msg.setTimestamp(LocalDateTime.now());
        return msg;
    }

    public static WebSocketMessage createReadNotify(Long fromUserId, Long toUserId, Long groupId, Integer chatType) {
        WebSocketMessage msg = new WebSocketMessage();
        msg.setType("read");
        msg.setFromUserId(fromUserId);
        msg.setToUserId(toUserId);
        msg.setGroupId(groupId);
        msg.setChatType(chatType);
        msg.setTimestamp(LocalDateTime.now());
        return msg;
    }

    public static WebSocketMessage createTypingNotify(Long fromUserId, Long toUserId, Long groupId, Integer chatType, boolean typing) {
        WebSocketMessage msg = new WebSocketMessage();
        msg.setType("typing");
        msg.setFromUserId(fromUserId);
        msg.setToUserId(toUserId);
        msg.setGroupId(groupId);
        msg.setChatType(chatType);
        msg.setData(typing);
        msg.setTimestamp(LocalDateTime.now());
        return msg;
    }

    public static WebSocketMessage createHeartbeat() {
        WebSocketMessage msg = new WebSocketMessage();
        msg.setType("heartbeat");
        msg.setTimestamp(LocalDateTime.now());
        return msg;
    }
}
