package com.collaborative.whiteboard.service;

import com.collaborative.whiteboard.dto.WhiteboardMessage;
import com.collaborative.whiteboard.entity.OperationLog;
import com.collaborative.whiteboard.entity.WhiteboardElement;
import com.collaborative.whiteboard.repository.OperationLogRepository;
import com.collaborative.whiteboard.repository.WhiteboardElementRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class UndoRedoService {

    private final OperationLogRepository operationLogRepository;
    private final WhiteboardElementRepository elementRepository;
    private final RedisTemplate<String, Object> redisTemplate;
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;

    private static final String UNDO_STACK_KEY = "whiteboard:room:%s:undo";
    private static final String REDO_STACK_KEY = "whiteboard:room:%s:redo";
    private static final String SEQUENCE_KEY = "whiteboard:room:%s:sequence";

    private final Map<String, Long> roomSequenceMap = new ConcurrentHashMap<>();

    @Transactional
    public OperationLog saveOperation(String roomId, String userId, String operationType,
                                       String elementId, String elementType,
                                       Object beforeData, Object afterData) {
        Long sequence = getNextSequence(roomId);

        OperationLog logEntry = new OperationLog();
        logEntry.setRoomId(roomId);
        logEntry.setUserId(userId);
        logEntry.setOperationType(operationType);
        logEntry.setElementId(elementId);
        logEntry.setElementType(elementType);
        logEntry.setSequence(sequence);
        logEntry.setIsUndone(false);

        try {
            if (beforeData != null) {
                logEntry.setBeforeData(objectMapper.writeValueAsString(beforeData));
            }
            if (afterData != null) {
                logEntry.setAfterData(objectMapper.writeValueAsString(afterData));
            }
        } catch (JsonProcessingException e) {
            log.error("Error serializing operation data", e);
        }

        OperationLog saved = operationLogRepository.save(logEntry);
        pushToUndoStack(roomId, saved);

        clearRedoStack(roomId);

        return saved;
    }

    @Transactional
    public boolean undo(String roomId, String userId) {
        OperationLog operation = popFromUndoStack(roomId);
        if (operation == null) {
            log.debug("No operations to undo for room: {}", roomId);
            return false;
        }

        try {
            applyUndo(operation);
            operation.setIsUndone(true);
            operationLogRepository.save(operation);
            pushToRedoStack(roomId, operation);

            broadcastUndoRedo(roomId, operation, true);
            return true;
        } catch (Exception e) {
            log.error("Error applying undo", e);
            pushToUndoStack(roomId, operation);
            return false;
        }
    }

    @Transactional
    public boolean redo(String roomId, String userId) {
        OperationLog operation = popFromRedoStack(roomId);
        if (operation == null) {
            log.debug("No operations to redo for room: {}", roomId);
            return false;
        }

        try {
            applyRedo(operation);
            operation.setIsUndone(false);
            operationLogRepository.save(operation);
            pushToUndoStack(roomId, operation);

            broadcastUndoRedo(roomId, operation, false);
            return true;
        } catch (Exception e) {
            log.error("Error applying redo", e);
            pushToRedoStack(roomId, operation);
            return false;
        }
    }

    private void applyUndo(OperationLog operation) throws JsonProcessingException {
        String operationType = operation.getOperationType();

        switch (operationType) {
            case "ADD":
                elementRepository.deleteById(operation.getElementId());
                break;

            case "UPDATE":
                if (operation.getBeforeData() != null) {
                    WhiteboardElement element = elementRepository.findById(operation.getElementId())
                            .orElse(new WhiteboardElement());
                    element.setId(operation.getElementId());
                    element.setRoomId(operation.getRoomId());
                    element.setType(operation.getElementType());
                    element.setData(operation.getBeforeData());
                    elementRepository.save(element);
                }
                break;

            case "DELETE":
                if (operation.getBeforeData() != null) {
                    WhiteboardElement element = new WhiteboardElement();
                    element.setId(operation.getElementId());
                    element.setRoomId(operation.getRoomId());
                    element.setType(operation.getElementType());
                    element.setData(operation.getBeforeData());
                    elementRepository.save(element);
                }
                break;

            case "DRAW":
                if (operation.getBeforeData() != null) {
                    WhiteboardElement element = elementRepository.findById(operation.getElementId())
                            .orElse(new WhiteboardElement());
                    element.setId(operation.getElementId());
                    element.setRoomId(operation.getRoomId());
                    element.setType(operation.getElementType());
                    element.setData(operation.getBeforeData());
                    elementRepository.save(element);
                }
                break;

            default:
                log.warn("Unknown operation type for undo: {}", operationType);
        }
    }

    private void applyRedo(OperationLog operation) throws JsonProcessingException {
        String operationType = operation.getOperationType();

        switch (operationType) {
            case "ADD":
                if (operation.getAfterData() != null) {
                    WhiteboardElement element = new WhiteboardElement();
                    element.setId(operation.getElementId());
                    element.setRoomId(operation.getRoomId());
                    element.setType(operation.getElementType());
                    element.setData(operation.getAfterData());
                    elementRepository.save(element);
                }
                break;

            case "UPDATE":
            case "DRAW":
                if (operation.getAfterData() != null) {
                    WhiteboardElement element = elementRepository.findById(operation.getElementId())
                            .orElse(new WhiteboardElement());
                    element.setId(operation.getElementId());
                    element.setRoomId(operation.getRoomId());
                    element.setType(operation.getElementType());
                    element.setData(operation.getAfterData());
                    elementRepository.save(element);
                }
                break;

            case "DELETE":
                elementRepository.deleteById(operation.getElementId());
                break;

            default:
                log.warn("Unknown operation type for redo: {}", operationType);
        }
    }

    private void broadcastUndoRedo(String roomId, OperationLog operation, boolean isUndo) {
        try {
            WhiteboardMessage message = new WhiteboardMessage();
            message.setType(isUndo ? "UNDO" : "REDO");
            message.setRoomId(roomId);
            message.setUserId(operation.getUserId());
            message.setElementId(operation.getElementId());
            message.setTimestamp(System.currentTimeMillis());

            Map<String, Object> payload = new HashMap<>();
            payload.put("operationId", operation.getId());
            payload.put("operationType", operation.getOperationType());
            payload.put("elementType", operation.getElementType());

            String data = isUndo ? operation.getBeforeData() : operation.getAfterData();
            if (data != null) {
                payload.put("elementData", objectMapper.readValue(data, Map.class));
            }
            payload.put("isUndo", isUndo);

            message.setPayload(payload);

            String destination = "/topic/room/" + roomId;
            messagingTemplate.convertAndSend(destination, message);
        } catch (Exception e) {
            log.error("Error broadcasting undo/redo", e);
        }
    }

    @SuppressWarnings("unchecked")
    private void pushToUndoStack(String roomId, OperationLog operation) {
        String key = String.format(UNDO_STACK_KEY, roomId);
        try {
            String value = objectMapper.writeValueAsString(operation);
            redisTemplate.opsForList().rightPush(key, value);
            Long size = redisTemplate.opsForList().size(key);
            if (size != null && size > 50) {
                redisTemplate.opsForList().leftPop(key);
            }
        } catch (Exception e) {
            log.error("Error pushing to undo stack", e);
        }
    }

    @SuppressWarnings("unchecked")
    private OperationLog popFromUndoStack(String roomId) {
        String key = String.format(UNDO_STACK_KEY, roomId);
        try {
            Object value = redisTemplate.opsForList().rightPop(key);
            if (value != null) {
                return objectMapper.readValue((String) value, OperationLog.class);
            }
        } catch (Exception e) {
            log.error("Error popping from undo stack", e);
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    private void pushToRedoStack(String roomId, OperationLog operation) {
        String key = String.format(REDO_STACK_KEY, roomId);
        try {
            String value = objectMapper.writeValueAsString(operation);
            redisTemplate.opsForList().rightPush(key, value);
        } catch (Exception e) {
            log.error("Error pushing to redo stack", e);
        }
    }

    @SuppressWarnings("unchecked")
    private OperationLog popFromRedoStack(String roomId) {
        String key = String.format(REDO_STACK_KEY, roomId);
        try {
            Object value = redisTemplate.opsForList().rightPop(key);
            if (value != null) {
                return objectMapper.readValue((String) value, OperationLog.class);
            }
        } catch (Exception e) {
            log.error("Error popping from redo stack", e);
        }
        return null;
    }

    private void clearRedoStack(String roomId) {
        String key = String.format(REDO_STACK_KEY, roomId);
        redisTemplate.delete(key);
    }

    private Long getNextSequence(String roomId) {
        String key = String.format(SEQUENCE_KEY, roomId);
        Long current = roomSequenceMap.getOrDefault(roomId, 0L);
        Long next = current + 1;
        roomSequenceMap.put(roomId, next);
        return next;
    }

    public boolean canUndo(String roomId) {
        String key = String.format(UNDO_STACK_KEY, roomId);
        Long size = redisTemplate.opsForList().size(key);
        return size != null && size > 0;
    }

    public boolean canRedo(String roomId) {
        String key = String.format(REDO_STACK_KEY, roomId);
        Long size = redisTemplate.opsForList().size(key);
        return size != null && size > 0;
    }
}
