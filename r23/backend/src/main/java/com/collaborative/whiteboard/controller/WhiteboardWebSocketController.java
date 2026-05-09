package com.collaborative.whiteboard.controller;

import com.collaborative.whiteboard.dto.WhiteboardMessage;
import com.collaborative.whiteboard.entity.RoomMember;
import com.collaborative.whiteboard.service.PermissionService;
import com.collaborative.whiteboard.service.RoomService;
import com.collaborative.whiteboard.service.UndoRedoService;
import com.collaborative.whiteboard.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Controller
@RequiredArgsConstructor
public class WhiteboardWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final RoomService roomService;
    private final UserService userService;
    private final PermissionService permissionService;
    private final UndoRedoService undoRedoService;
    private final ObjectMapper objectMapper;

    @MessageMapping("/whiteboard/join")
    public void handleJoin(@Payload WhiteboardMessage message) {
        log.debug("Received join message: {}", message);

        String roomId = message.getRoomId();
        String userId = message.getUserId();

        Map<String, Object> payload = (Map<String, Object>) message.getPayload();
        String username = (String) payload.get("username");
        String roleStr = (String) payload.get("role");

        RoomMember.Role role = RoomMember.Role.VIEWER;
        if (roleStr != null) {
            try {
                role = RoomMember.Role.valueOf(roleStr.toUpperCase());
            } catch (IllegalArgumentException e) {
                log.warn("Invalid role: {}, using VIEWER", roleStr);
            }
        }

        if (!permissionService.isMember(roomId, userId)) {
            permissionService.addMember(roomId, userId, username, role);
        }

        userService.userJoin(roomId, userId, username);

        WhiteboardMessage userListMsg = new WhiteboardMessage();
        userListMsg.setType("USER_LIST");
        userListMsg.setRoomId(roomId);
        userListMsg.setPayload(userService.getOnlineUsers(roomId));
        broadcastToRoom(userListMsg);

        RoomMember.Role userRole = permissionService.getUserRole(roomId, userId);
        WhiteboardMessage roleMsg = new WhiteboardMessage();
        roleMsg.setType("ROLE_ASSIGNED");
        roleMsg.setRoomId(roomId);
        roleMsg.setUserId(userId);
        Map<String, Object> rolePayload = new HashMap<>();
        rolePayload.put("role", userRole.name());
        rolePayload.put("canEdit", permissionService.canEdit(roomId, userId));
        rolePayload.put("isOwner", permissionService.isOwner(roomId, userId));
        roleMsg.setPayload(rolePayload);

        String userDestination = "/topic/room/" + roomId + "/user/" + userId;
        messagingTemplate.convertAndSend(userDestination, roleMsg);
    }

    @MessageMapping("/whiteboard/leave")
    public void handleLeave(@Payload WhiteboardMessage message) {
        log.debug("Received leave message: {}", message);

        userService.userLeave(message.getRoomId(), message.getUserId());

        WhiteboardMessage response = new WhiteboardMessage();
        response.setType("USER_LIST");
        response.setRoomId(message.getRoomId());
        response.setPayload(userService.getOnlineUsers(message.getRoomId()));
        broadcastToRoom(response);
    }

    @MessageMapping("/whiteboard/draw")
    public void handleDraw(@Payload WhiteboardMessage message) {
        log.debug("Received draw message: {}", message);

        if (!checkEditPermission(message)) {
            log.warn("User {} has no edit permission for room {}", message.getUserId(), message.getRoomId());
            return;
        }

        Object existingData = getElementDataBefore(message);

        broadcastToRoom(message);
        saveUndoRedoOperation(message, "DRAW", existingData, message.getPayload());
    }

    @MessageMapping("/whiteboard/add")
    public void handleAdd(@Payload WhiteboardMessage message) {
        log.debug("Received add message: {}", message);

        if (!checkEditPermission(message)) {
            log.warn("User {} has no edit permission for room {}", message.getUserId(), message.getRoomId());
            return;
        }

        Map<String, Object> payload = (Map<String, Object>) message.getPayload();
        roomService.saveElement(
            message.getRoomId(),
            message.getElementId(),
            message.getType(),
            payload,
            message.getUserId()
        );

        broadcastToRoom(message);
        saveUndoRedoOperation(message, "ADD", null, message.getPayload());
    }

    @MessageMapping("/whiteboard/update")
    public void handleUpdate(@Payload WhiteboardMessage message) {
        log.debug("Received update message: {}", message);

        if (!checkEditPermission(message)) {
            log.warn("User {} has no edit permission for room {}", message.getUserId(), message.getRoomId());
            return;
        }

        Object existingData = getElementDataBefore(message);

        Map<String, Object> payload = (Map<String, Object>) message.getPayload();
        roomService.saveElement(
            message.getRoomId(),
            message.getElementId(),
            (String) payload.get("type"),
            payload,
            message.getUserId()
        );

        broadcastToRoom(message);
        saveUndoRedoOperation(message, "UPDATE", existingData, message.getPayload());
    }

    @MessageMapping("/whiteboard/delete")
    public void handleDelete(@Payload WhiteboardMessage message) {
        log.debug("Received delete message: {}", message);

        if (!checkEditPermission(message)) {
            log.warn("User {} has no edit permission for room {}", message.getUserId(), message.getRoomId());
            return;
        }

        Object existingData = getElementDataBefore(message);

        roomService.deleteElement(message.getElementId());

        broadcastToRoom(message);
        saveUndoRedoOperation(message, "DELETE", existingData, null);
    }

    @MessageMapping("/whiteboard/cursor")
    public void handleCursor(@Payload WhiteboardMessage message) {
        broadcastToRoom(message);
    }

    @MessageMapping("/whiteboard/undo")
    public void handleUndo(@Payload WhiteboardMessage message) {
        log.debug("Received undo message: {}", message);

        if (!checkEditPermission(message)) {
            log.warn("User {} has no edit permission for room {}", message.getUserId(), message.getRoomId());
            return;
        }

        boolean success = undoRedoService.undo(message.getRoomId(), message.getUserId());
        log.debug("Undo operation result: {}", success);
    }

    @MessageMapping("/whiteboard/redo")
    public void handleRedo(@Payload WhiteboardMessage message) {
        log.debug("Received redo message: {}", message);

        if (!checkEditPermission(message)) {
            log.warn("User {} has no edit permission for room {}", message.getUserId(), message.getRoomId());
            return;
        }

        boolean success = undoRedoService.redo(message.getRoomId(), message.getUserId());
        log.debug("Redo operation result: {}", success);
    }

    @MessageMapping("/whiteboard/clear")
    public void handleClear(@Payload WhiteboardMessage message) {
        log.debug("Received clear message: {}", message);

        if (!permissionService.isOwner(message.getRoomId(), message.getUserId())) {
            log.warn("User {} is not owner, cannot clear room {}", message.getUserId(), message.getRoomId());
            return;
        }

        roomService.getRoomElements(message.getRoomId()).forEach(elem -> {
            roomService.deleteElement(elem.get("id").toString());
        });

        WhiteboardMessage clearMsg = new WhiteboardMessage();
        clearMsg.setType("CLEAR");
        clearMsg.setRoomId(message.getRoomId());
        clearMsg.setUserId(message.getUserId());
        broadcastToRoom(clearMsg);
    }

    private boolean checkEditPermission(WhiteboardMessage message) {
        return permissionService.canEdit(message.getRoomId(), message.getUserId());
    }

    private Object getElementDataBefore(WhiteboardMessage message) {
        try {
            var elements = roomService.getRoomElements(message.getRoomId());
            for (var elem : elements) {
                if (message.getElementId() != null && message.getElementId().equals(elem.get("id"))) {
                    return elem.get("data");
                }
            }
        } catch (Exception e) {
            log.error("Error getting element data before", e);
        }
        return null;
    }

    private void saveUndoRedoOperation(WhiteboardMessage message, String operationType,
                                        Object beforeData, Object afterData) {
        try {
            String elementType = null;
            if (message.getPayload() != null && message.getPayload() instanceof Map) {
                elementType = (String) ((Map<?, ?>) message.getPayload()).get("type");
            }

            undoRedoService.saveOperation(
                message.getRoomId(),
                message.getUserId(),
                operationType,
                message.getElementId(),
                elementType,
                beforeData,
                afterData
            );
        } catch (Exception e) {
            log.error("Error saving undo/redo operation", e);
        }
    }

    private void broadcastToRoom(WhiteboardMessage message) {
        String destination = "/topic/room/" + message.getRoomId();
        messagingTemplate.convertAndSend(destination, message);
        log.debug("Broadcasted to {}: {}", destination, message);
    }
}
