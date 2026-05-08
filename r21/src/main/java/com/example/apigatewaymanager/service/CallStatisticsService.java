package com.example.apigatewaymanager.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.apigatewaymanager.entity.CallStatistics;
import com.example.apigatewaymanager.mapper.CallStatisticsMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CallStatisticsService {

    private final CallStatisticsMapper callStatisticsMapper;

    public List<CallStatistics> getStatisticsByDateRange(Long userId, Long appId, String apiKey,
                                                        LocalDate startDate, LocalDate endDate) {
        LambdaQueryWrapper<CallStatistics> queryWrapper = new LambdaQueryWrapper<>();
        
        if (userId != null) {
            queryWrapper.eq(CallStatistics::getUserId, userId);
        }
        if (appId != null) {
            queryWrapper.eq(CallStatistics::getAppId, appId);
        }
        if (apiKey != null && !apiKey.isEmpty()) {
            queryWrapper.like(CallStatistics::getApiKey, apiKey);
        }
        if (startDate != null) {
            queryWrapper.ge(CallStatistics::getStatDate, startDate);
        }
        if (endDate != null) {
            queryWrapper.le(CallStatistics::getStatDate, endDate);
        }
        
        queryWrapper.orderByAsc(CallStatistics::getStatDate);
        return callStatisticsMapper.selectList(queryWrapper);
    }

    public CallStatistics getTodayStatistics(Long userId, Long appId, String apiKey) {
        LocalDate today = LocalDate.now();
        LambdaQueryWrapper<CallStatistics> queryWrapper = new LambdaQueryWrapper<>();
        
        queryWrapper.eq(CallStatistics::getStatDate, today);
        if (userId != null) {
            queryWrapper.eq(CallStatistics::getUserId, userId);
        }
        if (appId != null) {
            queryWrapper.eq(CallStatistics::getAppId, appId);
        }
        if (apiKey != null && !apiKey.isEmpty()) {
            queryWrapper.eq(CallStatistics::getApiKey, apiKey);
        }
        
        return callStatisticsMapper.selectOne(queryWrapper);
    }
}
