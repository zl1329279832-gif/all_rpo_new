package com.example.componentconfig.service.impl;

import cn.hutool.core.util.StrUtil;
import cn.hutool.http.HttpRequest;
import cn.hutool.http.HttpResponse;
import cn.hutool.http.HttpUtil;
import cn.hutool.json.JSONUtil;
import com.example.componentconfig.entity.RequestHistory;
import com.example.componentconfig.repository.RequestHistoryRepository;
import com.example.componentconfig.service.ApiForwardService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ApiForwardServiceImpl implements ApiForwardService {

    private final RequestHistoryRepository requestHistoryRepository;
    private final ObjectMapper objectMapper;

    @Override
    public ForwardResult forward(String url, String method, Map<String, String> headers, Map<String, Object> params, Object body, String componentId, String componentName) {
        ForwardResult result = new ForwardResult();
        String requestId = UUID.randomUUID().toString();
        result.setRequestId(requestId);

        long startTime = System.currentTimeMillis();
        RequestHistory history = new RequestHistory();
        history.setId(requestId);
        history.setComponentId(componentId);
        history.setComponentName(componentName);
        history.setUrl(url);
        history.setMethod(method);
        history.setHeaders(headers != null ? JSONUtil.toJsonStr(headers) : "{}");
        history.setParams(params != null ? JSONUtil.toJsonStr(params) : "{}");
        history.setBody(body != null ? JSONUtil.toJsonStr(body) : null);

        try {
            HttpRequest request = HttpRequest.get(url);
            
            switch (method.toUpperCase()) {
                case "GET":
                    request = HttpRequest.get(url);
                    break;
                case "POST":
                    request = HttpRequest.post(url);
                    break;
                case "PUT":
                    request = HttpRequest.put(url);
                    break;
                case "DELETE":
                    request = HttpRequest.delete(url);
                    break;
                default:
                    request = HttpRequest.get(url);
            }

            if (headers != null) {
                request.addHeaders(headers);
            }

            if (params != null && !params.isEmpty()) {
                request.form(params);
            }

            if (body != null) {
                request.body(JSONUtil.toJsonStr(body));
            }

            request.timeout(30000);

            try (HttpResponse response = request.execute()) {
                long duration = System.currentTimeMillis() - startTime;
                
                result.setStatus(response.getStatus());
                result.setStatusText(response.body());
                result.setDuration(duration);

                Map<String, String> responseHeaders = new HashMap<>();
                response.headers().forEach((key, value) -> {
                    if (!value.isEmpty()) {
                        responseHeaders.put(key, value.get(0));
                    }
                });
                result.setHeaders(responseHeaders);

                String responseBody = response.body();
                try {
                    Object jsonData = JSONUtil.parse(responseBody);
                    result.setData(jsonData);
                } catch (Exception e) {
                    result.setData(responseBody);
                }

                history.setStatus("success");
                history.setResponseStatus(response.getStatus());
                history.setResponseData(responseBody);
                history.setResponseHeaders(JSONUtil.toJsonStr(responseHeaders));
                history.setDuration(duration);
            }

        } catch (Exception e) {
            log.error("API请求失败: {}", e.getMessage(), e);
            long duration = System.currentTimeMillis() - startTime;
            
            result.setStatus(500);
            result.setStatusText("Internal Server Error");
            result.setError(e.getMessage());
            result.setDuration(duration);

            history.setStatus("error");
            history.setErrorMessage(e.getMessage());
            history.setDuration(duration);
        }

        requestHistoryRepository.save(history);
        return result;
    }

    @Override
    @Transactional
    public RequestHistory saveHistory(RequestHistory history) {
        return requestHistoryRepository.save(history);
    }
}
