package com.example.apigatewaymanager.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.example.apigatewaymanager.entity.CallStatistics;
import com.example.apigatewaymanager.mapper.CallStatisticsMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class CallStatisticsService {

    private final CallStatisticsMapper callStatisticsMapper;

    @Autowired
    public CallStatisticsService(CallStatisticsMapper callStatisticsMapper) {
        this.callStatisticsMapper = callStatisticsMapper;
    }

    @Async
    @Transactional
    public void recordCall(String apiKey, Long appId, Long userId, int responseStatus, long responseTime) {
        LocalDate today = LocalDate.now();
        boolean isSuccess = responseStatus >= 200 && responseStatus < 300;

        LambdaQueryWrapper<CallStatistics> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(CallStatistics::getStatDate, today)
                   .eq(CallStatistics::getApiKey, apiKey);
        
        CallStatistics existing = callStatisticsMapper.selectOne(queryWrapper);

        if (existing == null) {
            CallStatistics stats = new CallStatistics();
            stats.setStatDate(today);
            stats.setApiKey(apiKey);
            stats.setAppId(appId);
            stats.setUserId(userId);
            stats.setTotalCalls(1L);
            stats.setSuccessCalls(isSuccess ? 1L : 0L);
            stats.setFailCalls(isSuccess ? 0L : 1L);
            stats.setAvgResponseTime((int) responseTime);
            callStatisticsMapper.insert(stats);
        } else {
            long newTotal = existing.getTotalCalls() + 1;
            long newSuccess = existing.getSuccessCalls() + (isSuccess ? 1 : 0);
            long newFail = existing.getFailCalls() + (isSuccess ? 0 : 1);
            int newAvg = (int) ((existing.getAvgResponseTime() * existing.getTotalCalls() + responseTime) / newTotal);

            LambdaUpdateWrapper<CallStatistics> updateWrapper = new LambdaUpdateWrapper<>();
            updateWrapper.eq(CallStatistics::getId, existing.getId())
                        .set(CallStatistics::getTotalCalls, newTotal)
                        .set(CallStatistics::getSuccessCalls, newSuccess)
                        .set(CallStatistics::getFailCalls, newFail)
                        .set(CallStatistics::getAvgResponseTime, newAvg);
            callStatisticsMapper.update(null, updateWrapper);
        }
    }

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
