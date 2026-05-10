package com.example.componentconfig.service;

import com.example.componentconfig.common.PageResult;
import com.example.componentconfig.entity.RequestHistory;

import java.util.Optional;

public interface RequestHistoryService {
    PageResult<RequestHistory> list(int current, int size, String keyword, String componentId);
    Optional<RequestHistory> getById(String id);
    void clearAll();
}
