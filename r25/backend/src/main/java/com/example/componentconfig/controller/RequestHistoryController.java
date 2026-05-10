package com.example.componentconfig.controller;

import com.example.componentconfig.common.PageResult;
import com.example.componentconfig.common.Result;
import com.example.componentconfig.entity.RequestHistory;
import com.example.componentconfig.service.RequestHistoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@Tag(name = "请求历史", description = "请求历史记录接口")
@RestController
@RequestMapping("/api/request")
@RequiredArgsConstructor
@CrossOrigin
public class RequestHistoryController {

    private final RequestHistoryService requestHistoryService;

    @Operation(summary = "获取请求历史列表")
    @GetMapping("/history")
    public Result<PageResult<RequestHistory>> history(
            @Parameter(description = "当前页码") @RequestParam(defaultValue = "1") int current,
            @Parameter(description = "每页大小") @RequestParam(defaultValue = "10") int size,
            @Parameter(description = "搜索关键字") @RequestParam(required = false) String keyword,
            @Parameter(description = "组件ID") @RequestParam(required = false) String componentId) {
        PageResult<RequestHistory> result = requestHistoryService.list(current, size, keyword, componentId);
        return Result.success(result);
    }

    @Operation(summary = "获取请求历史详情")
    @GetMapping("/{id}")
    public Result<RequestHistory> getById(@Parameter(description = "请求ID") @PathVariable String id) {
        return requestHistoryService.getById(id)
                .map(Result::success)
                .orElseGet(() -> Result.error("请求记录不存在"));
    }

    @Operation(summary = "清空请求历史")
    @DeleteMapping("/history")
    public Result<Void> clearHistory() {
        requestHistoryService.clearAll();
        return Result.success("清空成功", null);
    }
}
