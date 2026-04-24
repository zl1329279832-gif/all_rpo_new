package com.chat.common.protocol;

public enum MessageType {
    LOGIN,
    LOGIN_RESPONSE,
    LOGOUT,
    LOGOUT_RESPONSE,
    CHAT_GROUP,
    CHAT_PRIVATE,
    USER_LIST,
    HEARTBEAT,
    HEARTBEAT_RESPONSE,
    SYSTEM_NOTICE
}
