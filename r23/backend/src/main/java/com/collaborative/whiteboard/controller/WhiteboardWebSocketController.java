package com.collaborative.whiteboard.controller;

import com.collaborative.whiteboard.dto.WhiteboardMessage;
import com.collaborative.whiteboard.entity.OperationLog;
import com.collaborative.whiteboard.repository.OperationLogRepository;
import com.collaborative.whiteboard.service.RoomService;
import com.collaborative.whiteboard.service.UserService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Slf4j
@Controller
@RequiredArgsConstructor
public class WhiteboardWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final RoomService roomService;
    private final UserService userService;
    private final OperationLogRepository operationLogRepository;
    private final ObjectMapper objectMapper;

    @MessageMapping("/whiteboard/draw")
    public void handleDraw(@Payload WhiteboardMessage message) {
        log.debug("Received draw message: {}", message);
        
        broadcastToRoom(message);
        saveOperation(message);
    }

    @MessageMapping("/whiteboard/add")
    public void handleAdd(@Payload WhiteboardMessage message) {
        log.debug("Received add message: {}", message);
        
        Map<String, Object> payload = (Map<String, Object>) message.getPayload();
        roomService.saveElement(
            message.getRoomId(),
            message.getElementId(),
            message.getType(),
            payload,
            message.getUserId()
        );
        
        broadcastToRoom(message);
        saveOperation(message);
    }

    @MessageMapping("/whiteboard/update")
    public void handleUpdate(@Payload WhiteboardMessage message) {
        log.debug("Received update message: {}", message);
        
        Map<String, Object> payload = (Map<String, Object>) message.getPayload();
        roomService.saveElement(
            message.getRoomId(),
            message.getElementId(),
            (String) payload.get("type"),
            payload,
            message.getUserId()
        );
        
        broadcastToRoom(message);
        saveOperation(message);
    }

    @MessageMapping("/whiteboard/delete")
    public void handleDelete(@Payload WhiteboardMessage message) {
        log.debug("Received delete message: {}", message);
        
        roomService.deleteElement(message.getElementId());
        broadcastToRoom(message);
        saveOperation(message);
    }

    @MessageMapping("/whiteboard/join")
    public void handleJoin(@Payload WhiteboardMessage message) {
        log.debug("Received join message: {}", message);
        
        Map<String, Object> payload = (Map<String, Object>) message.getPayload();
        String username = (String) payload.get("username");
        userService.userJoin(message.getRoomId(), message.getUserId(), username);
        
        WhiteboardMessage response = new WhiteboardMessage();
        response.setType("USER_LIST");
        response.setRoomId(message.getRoomId());
        response.setPayload(userService.getOnlineUsers(message.getRoomId()));
        
        broadcastToRoom(response);
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

    @MessageMapping("/whiteboard/cursor")
    public void handleCursor(@Payload WhiteboardMessage message) {
        broadcastToRoom(message);
    }

    private void broadcastToRoom(WhiteboardMessage message) {
        String destination = "/topic/room/" + message.getRoomId();
        messagingTemplate.convertAndSend(destination, message);
        log.debug("Broadcasted to {}: {}", destination, message);
    }

    private void saveOperation(WhiteboardMessage message) {
        try {
            OperationLog logEntry = new OperationLog();
            logEntry.setRoomId(message.getRoomId());
            logEntry.setUserId(message.getUserId());
            logEntry.setOperationType(message.getType());
            logEntry.setElementId(message.getElementId());
            
            if (message.getPayload() != null) {
                logEntry.setOperationData(objectMapper.writeValueAsString(message.getPayload()));
            }
            
            operationLogRepository.save(logEntry);
        } catch (JsonProcessingException e) {
            log.error("Error saving operation log", e);
        }
    }
}
