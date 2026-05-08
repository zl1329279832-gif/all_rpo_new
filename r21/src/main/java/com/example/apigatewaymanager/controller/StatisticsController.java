package com.example.apigatewaymanager.controller;

import com.example.apigatewaymanager.common.Result;
import com.example.apigatewaymanager.entity.CallStatistics;
import com.example.apigatewaymanager.service.CallStatisticsService;
import com.example.apigatewaymanager.utils.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/statistics")
public class StatisticsController {

    private final CallStatisticsService callStatisticsService;

    @Autowired
    public StatisticsController(CallStatisticsService callStatisticsService) {
        this.callStatisticsService = callStatisticsService;
    }

    @GetMapping("/date-range")
    public Result<List<CallStatistics>> getStatisticsByDateRange(
            @RequestParam(required = false) Long appId,
            @RequestParam(required = false) String apiKey,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        Long userId = SecurityUtils.getCurrentUserId();
        List<CallStatistics> statistics = callStatisticsService.getStatisticsByDateRange(
                userId, appId, apiKey, startDate, endDate);
        return Result.success(statistics);
    }

    @GetMapping("/today")
    public Result<CallStatistics> getTodayStatistics(
            @RequestParam(required = false) Long appId,
            @RequestParam(required = false) String apiKey) {
        Long userId = SecurityUtils.getCurrentUserId();
        CallStatistics statistics = callStatisticsService.getTodayStatistics(userId, appId, apiKey);
        return Result.success(statistics);
    }
}
