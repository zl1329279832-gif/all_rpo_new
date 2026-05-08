package com.example.apigatewaymanager.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.apigatewaymanager.common.Result;
import com.example.apigatewaymanager.entity.ApiKey;
import com.example.apigatewaymanager.service.ApiKeyService;
import com.example.apigatewaymanager.utils.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/keys")
public class ApiKeyController {

    private final ApiKeyService apiKeyService;

    @Autowired
    public ApiKeyController(ApiKeyService apiKeyService) {
        this.apiKeyService = apiKeyService;
    }

    @PostMapping("/app/{appId}")
    public Result<ApiKey> generateApiKey(@PathVariable Long appId) {
        Long userId = SecurityUtils.getCurrentUserId();
        ApiKey apiKey = apiKeyService.generateApiKey(userId, appId);
        return Result.success("密钥生成成功", apiKey);
    }

    @GetMapping("/app/{appId}")
    public Result<Page<ApiKey>> listApiKeys(
            @PathVariable Long appId,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        Long userId = SecurityUtils.getCurrentUserId();
        Page<ApiKey> keys = apiKeyService.listApiKeys(userId, appId, page, size);
        return Result.success(keys);
    }

    @GetMapping("/{keyId}")
    public Result<ApiKey> getApiKey(@PathVariable Long keyId) {
        Long userId = SecurityUtils.getCurrentUserId();
        ApiKey apiKey = apiKeyService.getApiKeyById(userId, keyId);
        return Result.success(apiKey);
    }

    @PostMapping("/{keyId}/toggle-status")
    public Result<Void> toggleApiKeyStatus(@PathVariable Long keyId) {
        Long userId = SecurityUtils.getCurrentUserId();
        apiKeyService.toggleApiKeyStatus(userId, keyId);
        return Result.success("状态切换成功", null);
    }

    @PostMapping("/{keyId}/regenerate")
    public Result<Void> regenerateApiKey(@PathVariable Long keyId) {
        Long userId = SecurityUtils.getCurrentUserId();
        apiKeyService.regenerateApiKey(userId, keyId);
        return Result.success("密钥已重新生成", null);
    }

    @DeleteMapping("/{keyId}")
    public Result<Void> deleteApiKey(@PathVariable Long keyId) {
        Long userId = SecurityUtils.getCurrentUserId();
        apiKeyService.deleteApiKey(userId, keyId);
        return Result.success("删除成功", null);
    }
}
