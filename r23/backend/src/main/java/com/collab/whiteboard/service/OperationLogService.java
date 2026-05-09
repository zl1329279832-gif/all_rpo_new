package com.collab.whiteboard.service;

import com.collab.whiteboard.entity.OperationLog;
import com.collab.whiteboard.repository.OperationLogRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class OperationLogService {

    private final OperationLogRepository logRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public <T> OperationLog logOperation(String roomId, String userId, String userName,
            OperationLog.OperationType operationType, String elementId, T payload) {
        try {
            String payloadJson = payload != null ? objectMapper.writeValueAsString(payload) : null;
            
            OperationLog logEntry = OperationLog.builder()
                    .roomId(roomId)
                    .userId(userId)
                    .userName(userName)
                    .operationType(operationType)
                    .elementId(elementId)
                    .payload(payloadJson)
                    .build();
            
            return logRepository.save(logEntry);
        } catch (JsonProcessingException e) {
            log.error("Error serializing operation payload", e);
            throw new RuntimeException("Failed to serialize operation log", e);
        }
    }

    @Transactional(readOnly = true)
    public List<OperationLog> getRoomLogs(String roomId) {
        return logRepository.findByRoomIdOrderByCreatedAtAsc(roomId);
    }

    @Transactional(readOnly = true)
    public List<OperationLog> getRoomLogsByTimeRange(String roomId, LocalDateTime start, LocalDateTime end) {
        return logRepository.findByRoomIdAndCreatedAtBetweenOrderByCreatedAtAsc(roomId, start, end);
    }

    @Transactional(readOnly = true)
    public List<OperationLog> getUserLogs(String userId) {
        return logRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }
}
