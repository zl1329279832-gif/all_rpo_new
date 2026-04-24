package com.chat.websocket;

import com.chat.service.FriendService;
import com.chat.service.GroupService;
import com.chat.service.MessageService;
import com.chat.service.UserService;
import com.chat.utils.JwtUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketHandler extends TextWebSocketHandler {

    private static final int CHAT_TYPE_PRIVATE = 1;
    private static final int CHAT_TYPE_GROUP = 2;

    private final WebSocketSessionManager sessionManager;
    private final JwtUtil jwtUtil;
    private final UserService userService;
    private final FriendService friendService;
    private final GroupService groupService;
    private final MessageService messageService;

    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule());

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String token = extractToken(session);
        if (token == null) {
            session.close(CloseStatus.POLICY_VIOLATION.withReason("未授权"));
            return;
        }

        Long userId = jwtUtil.getUserId(token);
        if (userId == null) {
            session.close(CloseStatus.POLICY_VIOLATION.withReason("Token 无效"));
            return;
        }

        sessionManager.addSession(userId, session);
        userService.updateOnlineStatus(userId, true);

        notifyFriendsOnlineStatus(userId, true);

        List<Long> myGroupIds = groupService.getMyGroups(userId).stream()
                .map(g -> g.getId())
                .toList();
        for (Long groupId : myGroupIds) {
            notifyGroupMembersOnlineStatus(userId, groupId, true);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        Long userId = findUserIdBySession(session);
        if (userId != null) {
            sessionManager.removeSession(userId);
            userService.updateOnlineStatus(userId, false);

            notifyFriendsOnlineStatus(userId, false);

            List<Long> myGroupIds = groupService.getMyGroups(userId).stream()
                    .map(g -> g.getId())
                    .toList();
            for (Long groupId : myGroupIds) {
                notifyGroupMembersOnlineStatus(userId, groupId, false);
            }
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        try {
            WebSocketMessage msg = objectMapper.readValue(message.getPayload(), WebSocketMessage.class);
            
            Long userId = findUserIdBySession(session);
            if (userId == null) {
                return;
            }

            switch (msg.getType()) {
                case "chat" -> handleChatMessage(userId, msg);
                case "heartbeat" -> handleHeartbeat(session);
                case "read" -> handleReadMessage(userId, msg);
                case "typing" -> handleTypingMessage(userId, msg);
                default -> log.warn("未知的消息类型: {}", msg.getType());
            }
        } catch (Exception e) {
            log.error("处理 WebSocket 消息失败: ", e);
        }
    }

    private void handleChatMessage(Long fromUserId, WebSocketMessage msg) {
        if (msg.getChatType() == CHAT_TYPE_PRIVATE) {
            handlePrivateChat(fromUserId, msg);
        } else if (msg.getChatType() == CHAT_TYPE_GROUP) {
            handleGroupChat(fromUserId, msg);
        }
    }

    private void handlePrivateChat(Long fromUserId, WebSocketMessage msg) {
        Long toUserId = msg.getToUserId();
        if (toUserId == null) {
            return;
        }

        if (!friendService.isFriend(fromUserId, toUserId)) {
            log.warn("非好友关系无法发送消息: from={}, to={}", fromUserId, toUserId);
            return;
        }

        WebSocketSession toSession = sessionManager.getSession(toUserId);
        if (toSession != null && toSession.isOpen()) {
            try {
                msg.setFromUserId(fromUserId);
                sendMessage(toSession, msg);
            } catch (IOException e) {
                log.error("发送私聊消息失败: ", e);
            }
        }
    }

    private void handleGroupChat(Long fromUserId, WebSocketMessage msg) {
        Long groupId = msg.getGroupId();
        if (groupId == null) {
            return;
        }

        if (!groupService.isGroupMember(fromUserId, groupId)) {
            log.warn("非群成员无法发送消息: userId={}, groupId={}", fromUserId, groupId);
            return;
        }

        var members = groupService.getGroupMembers(groupId);
        for (var member : members) {
            Long memberId = member.getUserId();
            if (memberId.equals(fromUserId)) {
                continue;
            }

            WebSocketSession session = sessionManager.getSession(memberId);
            if (session != null && session.isOpen()) {
                try {
                    msg.setFromUserId(fromUserId);
                    sendMessage(session, msg);
                } catch (IOException e) {
                    log.error("发送群聊消息失败: ", e);
                }
            }
        }
    }

    private void handleHeartbeat(WebSocketSession session) throws IOException {
        WebSocketMessage heartbeat = WebSocketMessage.createHeartbeat();
        sendMessage(session, heartbeat);
    }

    private void handleReadMessage(Long userId, WebSocketMessage msg) {
        if (msg.getChatType() == CHAT_TYPE_PRIVATE) {
            messageService.markAsRead(userId, msg.getFromUserId(), CHAT_TYPE_PRIVATE);
            
            WebSocketSession fromSession = sessionManager.getSession(msg.getFromUserId());
            if (fromSession != null && fromSession.isOpen()) {
                try {
                    WebSocketMessage readNotify = WebSocketMessage.createReadNotify(
                            userId, msg.getFromUserId(), null, CHAT_TYPE_PRIVATE
                    );
                    sendMessage(fromSession, readNotify);
                } catch (IOException e) {
                    log.error("发送已读通知失败: ", e);
                }
            }
        } else if (msg.getChatType() == CHAT_TYPE_GROUP) {
            messageService.markAsRead(userId, msg.getGroupId(), CHAT_TYPE_GROUP);
        }
    }

    private void handleTypingMessage(Long fromUserId, WebSocketMessage msg) {
        if (msg.getChatType() == CHAT_TYPE_PRIVATE) {
            Long toUserId = msg.getToUserId();
            WebSocketSession toSession = sessionManager.getSession(toUserId);
            if (toSession != null && toSession.isOpen()) {
                try {
                    WebSocketMessage typingMsg = WebSocketMessage.createTypingNotify(
                            fromUserId, toUserId, null, CHAT_TYPE_PRIVATE, (Boolean) msg.getData()
                    );
                    sendMessage(toSession, typingMsg);
                } catch (IOException e) {
                    log.error("发送正在输入通知失败: ", e);
                }
            }
        } else if (msg.getChatType() == CHAT_TYPE_GROUP) {
            Long groupId = msg.getGroupId();
            var members = groupService.getGroupMembers(groupId);
            for (var member : members) {
                Long memberId = member.getUserId();
                if (memberId.equals(fromUserId)) {
                    continue;
                }

                WebSocketSession session = sessionManager.getSession(memberId);
                if (session != null && session.isOpen()) {
                    try {
                        WebSocketMessage typingMsg = WebSocketMessage.createTypingNotify(
                                fromUserId, null, groupId, CHAT_TYPE_GROUP, (Boolean) msg.getData()
                        );
                        sendMessage(session, typingMsg);
                    } catch (IOException e) {
                        log.error("发送正在输入通知失败: ", e);
                    }
                }
            }
        }
    }

    private void notifyFriendsOnlineStatus(Long userId, boolean online) {
        var friends = friendService.getFriendList(userId);
        WebSocketMessage notify = WebSocketMessage.createOnlineNotify(userId, online);

        for (var friend : friends) {
            Long friendId = friend.getFriendId();
            WebSocketSession session = sessionManager.getSession(friendId);
            if (session != null && session.isOpen()) {
                try {
                    sendMessage(session, notify);
                } catch (IOException e) {
                    log.error("发送在线状态通知失败: ", e);
                }
            }
        }
    }

    private void notifyGroupMembersOnlineStatus(Long userId, Long groupId, boolean online) {
        var members = groupService.getGroupMembers(groupId);
        WebSocketMessage notify = WebSocketMessage.createOnlineNotify(userId, online);

        for (var member : members) {
            Long memberId = member.getUserId();
            if (memberId.equals(userId)) {
                continue;
            }

            WebSocketSession session = sessionManager.getSession(memberId);
            if (session != null && session.isOpen()) {
                try {
                    sendMessage(session, notify);
                } catch (IOException e) {
                    log.error("发送群成员在线状态通知失败: ", e);
                }
            }
        }
    }

    private void sendMessage(WebSocketSession session, WebSocketMessage message) throws IOException {
        String json = objectMapper.writeValueAsString(message);
        session.sendMessage(new TextMessage(json));
    }

    private String extractToken(WebSocketSession session) {
        String query = session.getUri().getQuery();
        if (query != null) {
            String[] params = query.split("&");
            for (String param : params) {
                if (param.startsWith("token=")) {
                    return param.substring(6);
                }
            }
        }
        return null;
    }

    private Long findUserIdBySession(WebSocketSession session) {
        for (var entry : sessionManager.getAllSessions().entrySet()) {
            if (entry.getValue().equals(session)) {
                return entry.getKey();
            }
        }
        return null;
    }
}
