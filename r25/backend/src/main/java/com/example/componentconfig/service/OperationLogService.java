package com.example.componentconfig.service;

import com.example.componentconfig.common.PageResult;
import com.example.componentconfig.entity.OperationLog;

import java.time.LocalDateTime;
import java.util.Optional;

public interface OperationLogService {
    PageResult<OperationLog> list(int current, int size, String keyword, String module, String action, LocalDateTime startTime, LocalDateTime endTime);
    Optional<OperationLog> getById(String id);
    void log(String userId, String username, String action, String module, String detail, String ip);
}
