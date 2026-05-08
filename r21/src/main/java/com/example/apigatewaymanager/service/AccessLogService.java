package com.example.apigatewaymanager.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.apigatewaymanager.entity.AccessLog;
import com.example.apigatewaymanager.mapper.AccessLogMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AccessLogService {

    private final AccessLogMapper accessLogMapper;

    @Async
    @Transactional
    public void saveAccessLog(AccessLog accessLog) {
        accessLogMapper.insert(accessLog);
    }

    public Page<AccessLog> listAccessLogs(Long userId, Long appId, String apiKey, 
                                          Integer page, Integer size) {
        Page<AccessLog> pageParam = new Page<>(page, size);
        LambdaQueryWrapper<AccessLog> queryWrapper = new LambdaQueryWrapper<>();
        
        if (userId != null) {
            queryWrapper.eq(AccessLog::getUserId, userId);
        }
        if (appId != null) {
            queryWrapper.eq(AccessLog::getAppId, appId);
        }
        if (apiKey != null && !apiKey.isEmpty()) {
            queryWrapper.like(AccessLog::getApiKey, apiKey);
        }
        
        queryWrapper.orderByDesc(AccessLog::getCreateTime);
        return accessLogMapper.selectPage(pageParam, queryWrapper);
    }

    public long countSuccessToday(Long userId) {
        LambdaQueryWrapper<AccessLog> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(AccessLog::getUserId, userId)
                   .ge(AccessLog::getResponseStatus, 200)
                   .lt(AccessLog::getResponseStatus, 300)
                   .apply("DATE(create_time) = CURDATE()");
        return accessLogMapper.selectCount(queryWrapper);
    }

    public long countFailToday(Long userId) {
        LambdaQueryWrapper<AccessLog> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(AccessLog::getUserId, userId)
                   .and(wrapper -> wrapper
                       .ge(AccessLog::getResponseStatus, 400)
                       .or()
                       .lt(AccessLog::getResponseStatus, 200))
                   .apply("DATE(create_time) = CURDATE()");
        return accessLogMapper.selectCount(queryWrapper);
    }
}
