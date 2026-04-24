package com.chat.websocket;

import java.time.LocalDateTime;

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

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Long getFromUserId() {
        return fromUserId;
    }

    public void setFromUserId(Long fromUserId) {
        this.fromUserId = fromUserId;
    }

    public Long getToUserId() {
        return toUserId;
    }

    public void setToUserId(Long toUserId) {
        this.toUserId = toUserId;
    }

    public Long getGroupId() {
        return groupId;
    }

    public void setGroupId(Long groupId) {
        this.groupId = groupId;
    }

    public Integer getChatType() {
        return chatType;
    }

    public void setChatType(Integer chatType) {
        this.chatType = chatType;
    }

    public Integer getMessageType() {
        return messageType;
    }

    public void setMessageType(Integer messageType) {
        this.messageType = messageType;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Object getData() {
        return data;
    }

    public void setData(Object data) {
        this.data = data;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

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
