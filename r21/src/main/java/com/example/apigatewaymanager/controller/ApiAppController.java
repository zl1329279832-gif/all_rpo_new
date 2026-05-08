package com.example.apigatewaymanager.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.apigatewaymanager.common.Result;
import com.example.apigatewaymanager.dto.ApiAppDTO;
import com.example.apigatewaymanager.entity.ApiApp;
import com.example.apigatewaymanager.service.ApiAppService;
import com.example.apigatewaymanager.utils.SecurityUtils;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/apps")
public class ApiAppController {

    private final ApiAppService apiAppService;

    @Autowired
    public ApiAppController(ApiAppService apiAppService) {
        this.apiAppService = apiAppService;
    }

    @PostMapping
    public Result<ApiApp> createApiApp(@Valid @RequestBody ApiAppDTO apiAppDTO) {
        Long userId = SecurityUtils.getCurrentUserId();
        ApiApp apiApp = apiAppService.createApiApp(userId, apiAppDTO);
        return Result.success("创建成功", apiApp);
    }

    @GetMapping
    public Result<Page<ApiApp>> listApiApps(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        Long userId = SecurityUtils.getCurrentUserId();
        Page<ApiApp> apps = apiAppService.listApiApps(userId, page, size);
        return Result.success(apps);
    }

    @GetMapping("/{appId}")
    public Result<ApiApp> getApiApp(@PathVariable Long appId) {
        Long userId = SecurityUtils.getCurrentUserId();
        ApiApp apiApp = apiAppService.getApiAppById(userId, appId);
        return Result.success(apiApp);
    }

    @PutMapping("/{appId}")
    public Result<ApiApp> updateApiApp(
            @PathVariable Long appId,
            @Valid @RequestBody ApiAppDTO apiAppDTO) {
        Long userId = SecurityUtils.getCurrentUserId();
        ApiApp apiApp = apiAppService.updateApiApp(userId, appId, apiAppDTO);
        return Result.success("更新成功", apiApp);
    }

    @DeleteMapping("/{appId}")
    public Result<Void> deleteApiApp(@PathVariable Long appId) {
        Long userId = SecurityUtils.getCurrentUserId();
        apiAppService.deleteApiApp(userId, appId);
        return Result.success("删除成功", null);
    }

    @PostMapping("/{appId}/toggle-status")
    public Result<Void> toggleApiAppStatus(@PathVariable Long appId) {
        Long userId = SecurityUtils.getCurrentUserId();
        apiAppService.toggleApiAppStatus(userId, appId);
        return Result.success("状态切换成功", null);
    }
}
