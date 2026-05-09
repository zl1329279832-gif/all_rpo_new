package com.collab.whiteboard.websocket;

import com.collab.whiteboard.config.RedisConfig;
import com.collab.whiteboard.entity.OperationLog;
import com.collab.whiteboard.entity.WhiteboardElement;
import com.collab.whiteboard.message.*;
import com.collab.whiteboard.service.OperationLogService;
import com.collab.whiteboard.service.WhiteboardService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.springframework.web.util.UriTemplate;

import java.io.IOException;
import java.net.URI;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
@RequiredArgsConstructor
public class WhiteboardWebSocketHandler extends TextWebSocketHandler {

    private final RedisTemplate<String, Object> redisTemplate;
    private final WhiteboardService whiteboardService;
    private final OperationLogService operationLogService;
    private final ObjectMapper objectMapper;
    private final RedisConfig redisConfig;

    @Value("${whiteboard.redis.room-expire:86400}")
    private long roomExpireSeconds;

    private final Map<String, Map<String, WebSocketSession>> roomSessions = new ConcurrentHashMap<>();
    private final Map<String, UserInfo> sessionUsers = new ConcurrentHashMap<>();

    private static final UriTemplate URI_TEMPLATE = new UriTemplate("/ws/whiteboard/{roomId}");
    private static final String USER_COLORS[] = {
        "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
        "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9"
    };

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String roomId = extractRoomId(session.getUri());
        if (roomId == null) {
            session.close(CloseStatus.BAD_DATA.withReason("Invalid room ID"));
            return;
        }

        String userId = generateUserId();
        String userName = "User_" + userId.substring(0, 4);
        String color = USER_COLORS[new Random().nextInt(USER_COLORS.length)];

        UserInfo userInfo = UserInfo.builder()
                .userId(userId)
                .userName(userName)
                .color(color)
                .joinTime(System.currentTimeMillis())
                .build();

        session.getAttributes().put("roomId", roomId);
        session.getAttributes().put("userId", userId);
        session.getAttributes().put("userName", userName);

        sessionUsers.put(session.getId(), userInfo);
        roomSessions.computeIfAbsent(roomId, k -> new ConcurrentHashMap<>()).put(session.getId(), session);

        addUserToRoom(roomId, userInfo);

        log.info("User {} joined room {}", userName, roomId);

        sendMessage(session, WebSocketMessage.builder()
                .type(MessageType.JOIN_ROOM)
                .roomId(roomId)
                .userId(userId)
                .userName(userName)
                .payload(userInfo)
                .timestamp(System.currentTimeMillis())
                .build());

        broadcastUserList(roomId);
        sendRoomState(session, roomId);

        operationLogService.logOperation(roomId, userId, userName,
                OperationLog.OperationType.JOIN_ROOM, null, userInfo);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        try {
            WebSocketMessage wsMessage = objectMapper.readValue(message.getPayload(), WebSocketMessage.class);
            String roomId = (String) session.getAttributes().get("roomId");
            String userId = (String) session.getAttributes().get("userId");
            String userName = (String) session.getAttributes().get("userName");

            if (roomId == null || userId == null) {
                return;
            }

            wsMessage.setUserId(userId);
            wsMessage.setUserName(userName);
            wsMessage.setRoomId(roomId);
            wsMessage.setTimestamp(System.currentTimeMillis());

            handleMessage(wsMessage, session);
        } catch (Exception e) {
            log.error("Error handling message", e);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String roomId = (String) session.getAttributes().get("roomId");
        String userId = (String) session.getAttributes().get("userId");
        String userName = (String) session.getAttributes().get("userName");

        if (roomId != null) {
            Map<String, WebSocketSession> sessions = roomSessions.get(roomId);
            if (sessions != null) {
                sessions.remove(session.getId());
                if (sessions.isEmpty()) {
                    roomSessions.remove(roomId);
                }
            }

            if (userId != null) {
                removeUserFromRoom(roomId, userId);
                broadcastUserList(roomId);
            }
        }

        sessionUsers.remove(session.getId());

        log.info("User {} left room {}", userName, roomId);

        if (roomId != null && userId != null && userName != null) {
            operationLogService.logOperation(roomId, userId, userName,
                    OperationLog.OperationType.LEAVE_ROOM, null, null);
        }
    }

    private void handleMessage(WebSocketMessage message, WebSocketSession senderSession) {
        String roomId = message.getRoomId();
        String userId = message.getUserId();
        String userName = message.getUserName();

        switch (message.getType()) {
            case DRAW_LINE:
                handleDrawLine(message, roomId, userId, userName);
                break;
            case ADD_STICKER:
                handleAddSticker(message, roomId, userId, userName);
                break;
            case MOVE_ELEMENT:
                handleMoveElement(message, roomId, userId, userName);
                break;
            case DELETE_ELEMENT:
                handleDeleteElement(message, roomId, userId, userName);
                break;
            case CLEAR_CANVAS:
                handleClearCanvas(message, roomId, userId, userName);
                break;
            case USER_LIST:
                sendUserList(senderSession, roomId);
                break;
            case SYNC_STATE:
                sendRoomState(senderSession, roomId);
                break;
            default:
                log.warn("Unknown message type: {}", message.getType());
        }
    }

    private void handleDrawLine(WebSocketMessage message, String roomId, String userId, String userName) {
        DrawLinePayload payload = objectMapper.convertValue(message.getPayload(), DrawLinePayload.class);
        
        String elementKey = getElementKey(roomId, payload.getElementId());
        redisTemplate.opsForValue().set(elementKey, payload, roomExpireSeconds, TimeUnit.SECONDS);
        
        Set<String> elements = getRoomElementsSet(roomId);
        elements.add(payload.getElementId());
        redisTemplate.opsForSet().add(getRoomElementsKey(roomId), payload.getElementId());

        broadcastToRoom(roomId, message);

        whiteboardService.saveElement(roomId, payload.getElementId(),
                WhiteboardElement.ElementType.LINE, payload, userId);

        operationLogService.logOperation(roomId, userId, userName,
                OperationLog.OperationType.DRAW_LINE, payload.getElementId(), payload);
    }

    private void handleAddSticker(WebSocketMessage message, String roomId, String userId, String userName) {
        StickerPayload payload = objectMapper.convertValue(message.getPayload(), StickerPayload.class);
        
        String elementKey = getElementKey(roomId, payload.getElementId());
        redisTemplate.opsForValue().set(elementKey, payload, roomExpireSeconds, TimeUnit.SECONDS);
        
        redisTemplate.opsForSet().add(getRoomElementsKey(roomId), payload.getElementId());

        broadcastToRoom(roomId, message);

        whiteboardService.saveElement(roomId, payload.getElementId(),
                WhiteboardElement.ElementType.STICKER, payload, userId);

        operationLogService.logOperation(roomId, userId, userName,
                OperationLog.OperationType.ADD_STICKER, payload.getElementId(), payload);
    }

    private void handleMoveElement(WebSocketMessage message, String roomId, String userId, String userName) {
        MoveElementPayload payload = objectMapper.convertValue(message.getPayload(), MoveElementPayload.class);
        
        String elementKey = getElementKey(roomId, payload.getElementId());
        Object element = redisTemplate.opsForValue().get(elementKey);
        
        if (element != null) {
            if (element instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> elementMap = (Map<String, Object>) element;
                elementMap.put("x", payload.getNewX());
                elementMap.put("y", payload.getNewY());
                redisTemplate.opsForValue().set(elementKey, elementMap, roomExpireSeconds, TimeUnit.SECONDS);
            }
        }

        broadcastToRoom(roomId, message);

        operationLogService.logOperation(roomId, userId, userName,
                OperationLog.OperationType.MOVE_ELEMENT, payload.getElementId(), payload);
    }

    private void handleDeleteElement(WebSocketMessage message, String roomId, String userId, String userName) {
        DeleteElementPayload payload = objectMapper.convertValue(message.getPayload(), DeleteElementPayload.class);
        
        String elementKey = getElementKey(roomId, payload.getElementId());
        redisTemplate.delete(elementKey);
        redisTemplate.opsForSet().remove(getRoomElementsKey(roomId), payload.getElementId());

        broadcastToRoom(roomId, message);

        whiteboardService.deleteElement(payload.getElementId());

        operationLogService.logOperation(roomId, userId, userName,
                OperationLog.OperationType.DELETE_ELEMENT, payload.getElementId(), payload);
    }

    private void handleClearCanvas(WebSocketMessage message, String roomId, String userId, String userName) {
        Set<Object> elements = redisTemplate.opsForSet().members(getRoomElementsKey(roomId));
        if (elements != null) {
            for (Object elementId : elements) {
                redisTemplate.delete(getElementKey(roomId, (String) elementId));
            }
        }
        redisTemplate.delete(getRoomElementsKey(roomId));

        broadcastToRoom(roomId, message);

        whiteboardService.clearRoomElements(roomId);

        operationLogService.logOperation(roomId, userId, userName,
                OperationLog.OperationType.CLEAR_CANVAS, null, null);
    }

    private void broadcastToRoom(String roomId, WebSocketMessage message) {
        Map<String, WebSocketSession> sessions = roomSessions.get(roomId);
        if (sessions == null) return;

        try {
            String json = objectMapper.writeValueAsString(message);
            TextMessage textMessage = new TextMessage(json);

            for (WebSocketSession session : sessions.values()) {
                if (session.isOpen()) {
                    try {
                        session.sendMessage(textMessage);
                    } catch (IOException e) {
                        log.error("Error sending message to session", e);
                    }
                }
            }
        } catch (JsonProcessingException e) {
            log.error("Error serializing message", e);
        }
    }

    private void sendMessage(WebSocketSession session, WebSocketMessage message) {
        try {
            String json = objectMapper.writeValueAsString(message);
            session.sendMessage(new TextMessage(json));
        } catch (Exception e) {
            log.error("Error sending message", e);
        }
    }

    private void broadcastUserList(String roomId) {
        List<UserInfo> users = getRoomUsers(roomId);
        WebSocketMessage message = WebSocketMessage.builder()
                .type(MessageType.USER_LIST)
                .roomId(roomId)
                .payload(users)
                .timestamp(System.currentTimeMillis())
                .build();
        broadcastToRoom(roomId, message);
    }

    private void sendUserList(WebSocketSession session, String roomId) {
        List<UserInfo> users = getRoomUsers(roomId);
        sendMessage(session, WebSocketMessage.builder()
                .type(MessageType.USER_LIST)
                .roomId(roomId)
                .payload(users)
                .timestamp(System.currentTimeMillis())
                .build());
    }

    private void sendRoomState(WebSocketSession session, String roomId) {
        List<Object> elements = new ArrayList<>();
        Set<Object> elementIds = redisTemplate.opsForSet().members(getRoomElementsKey(roomId));
        
        if (elementIds != null && !elementIds.isEmpty()) {
            for (Object elementId : elementIds) {
                Object element = redisTemplate.opsForValue().get(getElementKey(roomId, (String) elementId));
                if (element != null) {
                    elements.add(element);
                }
            }
        }

        sendMessage(session, WebSocketMessage.builder()
                .type(MessageType.SYNC_STATE)
                .roomId(roomId)
                .payload(elements)
                .timestamp(System.currentTimeMillis())
                .build());
    }

    private void addUserToRoom(String roomId, UserInfo userInfo) {
        String userKey = getRoomUsersKey(roomId);
        redisTemplate.opsForHash().put(userKey, userInfo.getUserId(), userInfo);
        redisTemplate.expire(userKey, roomExpireSeconds, TimeUnit.SECONDS);
    }

    private void removeUserFromRoom(String roomId, String userId) {
        String userKey = getRoomUsersKey(roomId);
        redisTemplate.opsForHash().delete(userKey, userId);
    }

    @SuppressWarnings("unchecked")
    private List<UserInfo> getRoomUsers(String roomId) {
        String userKey = getRoomUsersKey(roomId);
        Map<Object, Object> userMap = redisTemplate.opsForHash().entries(userKey);
        List<UserInfo> users = new ArrayList<>();
        
        for (Object value : userMap.values()) {
            if (value instanceof Map) {
                users.add(objectMapper.convertValue(value, UserInfo.class));
            }
        }
        
        return users;
    }

    @SuppressWarnings("unchecked")
    private Set<String> getRoomElementsSet(String roomId) {
        Set<Object> members = redisTemplate.opsForSet().members(getRoomElementsKey(roomId));
        Set<String> elements = new HashSet<>();
        if (members != null) {
            for (Object member : members) {
                elements.add((String) member);
            }
        }
        return elements;
    }

    private String getRoomUsersKey(String roomId) {
        return redisConfig.getRedisPrefix() + "room:" + roomId + ":users";
    }

    private String getRoomElementsKey(String roomId) {
        return redisConfig.getRedisPrefix() + "room:" + roomId + ":elements";
    }

    private String getElementKey(String roomId, String elementId) {
        return redisConfig.getRedisPrefix() + "room:" + roomId + ":element:" + elementId;
    }

    private String extractRoomId(URI uri) {
        if (uri == null) return null;
        Map<String, String> variables = URI_TEMPLATE.match(uri.getPath());
        return variables.get("roomId");
    }

    private String generateUserId() {
        return UUID.randomUUID().toString().substring(0, 8);
    }
}
