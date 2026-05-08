package com.example.apigatewaymanager.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.apigatewaymanager.common.Result;
import com.example.apigatewaymanager.dto.BlacklistDTO;
import com.example.apigatewaymanager.entity.Blacklist;
import com.example.apigatewaymanager.service.BlacklistService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/blacklists")
@RequiredArgsConstructor
public class BlacklistController {

    private final BlacklistService blacklistService;

    @PostMapping
    public Result<Blacklist> addToBlacklist(@Valid @RequestBody BlacklistDTO blacklistDTO) {
        Blacklist blacklist = blacklistService.addToBlacklist(blacklistDTO);
        return Result.success("添加成功", blacklist);
    }

    @GetMapping
    public Result<Page<Blacklist>> listBlacklists(
            @RequestParam(required = false) Integer targetType,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        Page<Blacklist> blacklists = blacklistService.listBlacklists(page, size, targetType);
        return Result.success(blacklists);
    }

    @GetMapping("/{id}")
    public Result<Blacklist> getBlacklist(@PathVariable Long id) {
        Blacklist blacklist = blacklistService.getBlacklistById(id);
        return Result.success(blacklist);
    }

    @DeleteMapping("/{id}")
    public Result<Void> removeFromBlacklist(@PathVariable Long id) {
        blacklistService.removeFromBlacklist(id);
        return Result.success("移除成功", null);
    }

    @PostMapping("/{id}/toggle-status")
    public Result<Void> toggleBlacklistStatus(@PathVariable Long id) {
        blacklistService.toggleBlacklistStatus(id);
        return Result.success("状态切换成功", null);
    }

    @GetMapping("/check")
    public Result<Boolean> checkBlacklist(
            @RequestParam Integer targetType,
            @RequestParam String targetValue) {
        boolean isBlacklisted = blacklistService.isBlacklisted(targetType, targetValue);
        return Result.success(isBlacklisted);
    }
}
