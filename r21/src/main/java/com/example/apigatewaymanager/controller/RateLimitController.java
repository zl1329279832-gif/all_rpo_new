package com.example.apigatewaymanager.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.apigatewaymanager.common.Result;
import com.example.apigatewaymanager.dto.RateLimitDTO;
import com.example.apigatewaymanager.entity.RateLimit;
import com.example.apigatewaymanager.service.RateLimitService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/rate-limits")
@RequiredArgsConstructor
public class RateLimitController {

    private final RateLimitService rateLimitService;

    @PostMapping
    public Result<RateLimit> createRateLimit(@Valid @RequestBody RateLimitDTO rateLimitDTO) {
        RateLimit rateLimit = rateLimitService.createRateLimit(rateLimitDTO);
        return Result.success("创建成功", rateLimit);
    }

    @GetMapping
    public Result<Page<RateLimit>> listRateLimits(
            @RequestParam(required = false) Integer targetType,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        Page<RateLimit> rateLimits = rateLimitService.listRateLimits(page, size, targetType);
        return Result.success(rateLimits);
    }

    @GetMapping("/{id}")
    public Result<RateLimit> getRateLimit(@PathVariable Long id) {
        RateLimit rateLimit = rateLimitService.getRateLimitById(id);
        return Result.success(rateLimit);
    }

    @PutMapping("/{id}")
    public Result<RateLimit> updateRateLimit(
            @PathVariable Long id,
            @Valid @RequestBody RateLimitDTO rateLimitDTO) {
        RateLimit rateLimit = rateLimitService.updateRateLimit(id, rateLimitDTO);
        return Result.success("更新成功", rateLimit);
    }

    @DeleteMapping("/{id}")
    public Result<Void> deleteRateLimit(@PathVariable Long id) {
        rateLimitService.deleteRateLimit(id);
        return Result.success("删除成功", null);
    }

    @PostMapping("/{id}/toggle-status")
    public Result<Void> toggleRateLimitStatus(@PathVariable Long id) {
        rateLimitService.toggleRateLimitStatus(id);
        return Result.success("状态切换成功", null);
    }

    @GetMapping("/check")
    public Result<Boolean> checkRateLimit(
            @RequestParam Integer targetType,
            @RequestParam String targetValue) {
        boolean allowed = rateLimitService.checkRateLimit(targetType, targetValue);
        return Result.success(allowed);
    }
}
