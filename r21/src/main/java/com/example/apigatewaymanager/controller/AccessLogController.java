package com.example.apigatewaymanager.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.apigatewaymanager.common.Result;
import com.example.apigatewaymanager.entity.AccessLog;
import com.example.apigatewaymanager.service.AccessLogService;
import com.example.apigatewaymanager.utils.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/logs")
public class AccessLogController {

    private final AccessLogService accessLogService;

    @Autowired
    public AccessLogController(AccessLogService accessLogService) {
        this.accessLogService = accessLogService;
    }

    @GetMapping
    public Result<Page<AccessLog>> listAccessLogs(
            @RequestParam(required = false) Long appId,
            @RequestParam(required = false) String apiKey,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        Long userId = SecurityUtils.getCurrentUserId();
        Page<AccessLog> logs = accessLogService.listAccessLogs(userId, appId, apiKey, page, size);
        return Result.success(logs);
    }

    @GetMapping("/today-stats")
    public Result<Map<String, Long>> getTodayStatistics() {
        Long userId = SecurityUtils.getCurrentUserId();
        long successCount = accessLogService.countSuccessToday(userId);
        long failCount = accessLogService.countFailToday(userId);
        
        Map<String, Long> stats = new HashMap<>();
        stats.put("successCount", successCount);
        stats.put("failCount", failCount);
        stats.put("totalCount", successCount + failCount);
        
        return Result.success(stats);
    }
}
