package com.example.apigatewaymanager.controller;

import com.example.apigatewaymanager.common.Result;
import com.example.apigatewaymanager.common.ResultCode;
import com.example.apigatewaymanager.entity.AccessLog;
import com.example.apigatewaymanager.entity.ApiApp;
import com.example.apigatewaymanager.entity.ApiKey;
import com.example.apigatewaymanager.exception.BusinessException;
import com.example.apigatewaymanager.service.AccessLogService;
import com.example.apigatewaymanager.service.ApiAppService;
import com.example.apigatewaymanager.service.ApiKeyService;
import com.example.apigatewaymanager.service.BlacklistService;
import com.example.apigatewaymanager.service.CallStatisticsService;
import com.example.apigatewaymanager.service.RateLimitService;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/public/gateway")
public class GatewayController {

    private static final Logger log = LoggerFactory.getLogger(GatewayController.class);

    private final ApiKeyService apiKeyService;
    private final ApiAppService apiAppService;
    private final BlacklistService blacklistService;
    private final RateLimitService rateLimitService;
    private final AccessLogService accessLogService;
    private final CallStatisticsService callStatisticsService;

    @Autowired
    public GatewayController(ApiKeyService apiKeyService, ApiAppService apiAppService,
                            BlacklistService blacklistService, RateLimitService rateLimitService,
                            AccessLogService accessLogService, CallStatisticsService callStatisticsService) {
        this.apiKeyService = apiKeyService;
        this.apiAppService = apiAppService;
        this.blacklistService = blacklistService;
        this.rateLimitService = rateLimitService;
        this.accessLogService = accessLogService;
        this.callStatisticsService = callStatisticsService;
    }

    @PostMapping("/verify")
    public Result<Map<String, Object>> verifyRequest(
            @RequestHeader(value = "X-API-Key", required = false) String apiKeyHeader,
            @RequestParam(required = false) String apiKey,
            HttpServletRequest request) {
        
        long startTime = System.currentTimeMillis();
        String actualApiKey = apiKeyHeader != null ? apiKeyHeader : apiKey;
        Long appId = null;
        Long userId = null;
        
        if (actualApiKey == null || actualApiKey.isEmpty()) {
            throw new BusinessException(400, "缺少API Key");
        }

        String clientIp = getClientIp(request);
        
        AccessLog accessLog = new AccessLog();
        accessLog.setApiKey(actualApiKey);
        accessLog.setRequestMethod(request.getMethod());
        accessLog.setRequestPath(request.getRequestURI());
        accessLog.setRequestIp(clientIp);

        try {
            blacklistService.validateNotBlacklisted(1, clientIp);
            blacklistService.validateNotBlacklisted(2, actualApiKey);

            ApiKey key = apiKeyService.getByApiKey(actualApiKey);
            appId = key.getAppId();
            
            ApiApp apiApp = apiAppService.getAppById(appId);
            userId = apiApp.getUserId();
            
            if (key.getStatus() == 0) {
                throw new BusinessException(ResultCode.API_KEY_DISABLED);
            }

            if (!rateLimitService.checkRateLimit(1, actualApiKey)) {
                throw new BusinessException(ResultCode.RATE_LIMIT_EXCEEDED);
            }

            if (!rateLimitService.checkRateLimit(2, clientIp)) {
                throw new BusinessException(ResultCode.RATE_LIMIT_EXCEEDED);
            }

            apiKeyService.incrementCallCount(key.getId());

            Map<String, Object> result = new HashMap<>();
            result.put("valid", true);
            result.put("appId", key.getAppId());
            result.put("apiKey", actualApiKey);

            accessLog.setAppId(key.getAppId());
            accessLog.setUserId(userId);
            accessLog.setResponseStatus(200);
            accessLog.setResponseTime(System.currentTimeMillis() - startTime);

            callStatisticsService.recordCall(actualApiKey, appId, userId, 200, 
                    System.currentTimeMillis() - startTime);

            return Result.success("验证通过", result);

        } catch (BusinessException e) {
            accessLog.setAppId(appId);
            accessLog.setUserId(userId);
            accessLog.setResponseStatus(e.getCode());
            accessLog.setErrorMessage(e.getMessage());
            accessLog.setResponseTime(System.currentTimeMillis() - startTime);
            if (appId != null) {
                callStatisticsService.recordCall(actualApiKey, appId, userId, e.getCode(), 
                        System.currentTimeMillis() - startTime);
            }
            throw e;
        } catch (Exception e) {
            accessLog.setAppId(appId);
            accessLog.setUserId(userId);
            accessLog.setResponseStatus(500);
            accessLog.setErrorMessage(e.getMessage());
            accessLog.setResponseTime(System.currentTimeMillis() - startTime);
            if (appId != null) {
                callStatisticsService.recordCall(actualApiKey, appId, userId, 500, 
                        System.currentTimeMillis() - startTime);
            }
            throw e;
        } finally {
            accessLogService.saveAccessLog(accessLog);
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }
}
