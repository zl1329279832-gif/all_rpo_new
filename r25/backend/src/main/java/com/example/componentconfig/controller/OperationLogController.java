package com.example.componentconfig.controller;

import cn.hutool.core.date.DateUtil;
import cn.hutool.core.util.StrUtil;
import com.example.componentconfig.common.PageResult;
import com.example.componentconfig.common.Result;
import com.example.componentconfig.entity.OperationLog;
import com.example.componentconfig.service.OperationLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@Tag(name = "操作日志", description = "用户操作日志接口")
@RestController
@RequestMapping("/api/log")
@RequiredArgsConstructor
@CrossOrigin
public class OperationLogController {

    private final OperationLogService operationLogService;

    @Operation(summary = "获取操作日志列表")
    @GetMapping("/operation")
    public Result<PageResult<OperationLog>> list(
            @Parameter(description = "当前页码") @RequestParam(defaultValue = "1") int current,
            @Parameter(description = "每页大小") @RequestParam(defaultValue = "10") int size,
            @Parameter(description = "搜索关键字") @RequestParam(required = false) String keyword,
            @Parameter(description = "模块") @RequestParam(required = false) String module,
            @Parameter(description = "操作类型") @RequestParam(required = false) String action,
            @Parameter(description = "开始时间") @RequestParam(required = false) String startTime,
            @Parameter(description = "结束时间") @RequestParam(required = false) String endTime) {

        LocalDateTime start = null;
        LocalDateTime end = null;

        try {
            if (StrUtil.isNotBlank(startTime)) {
                start = DateUtil.parse(startTime).toLocalDateTime();
            }
            if (StrUtil.isNotBlank(endTime)) {
                end = DateUtil.parse(endTime + " 23:59:59").toLocalDateTime();
            }
        } catch (Exception e) {
            start = null;
            end = null;
        }

        PageResult<OperationLog> result = operationLogService.list(current, size, keyword, module, action, start, end);
        return Result.success(result);
    }

    @Operation(summary = "获取操作日志详情")
    @GetMapping("/{id}")
    public Result<OperationLog> getById(@Parameter(description = "日志ID") @PathVariable String id) {
        return operationLogService.getById(id)
                .map(Result::success)
                .orElseGet(() -> Result.error("日志不存在"));
    }
}
