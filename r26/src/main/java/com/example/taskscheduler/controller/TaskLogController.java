package com.example.taskscheduler.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.example.taskscheduler.common.Result;
import com.example.taskscheduler.dto.TaskLogQueryDTO;
import com.example.taskscheduler.service.TaskLogService;
import com.example.taskscheduler.vo.PageResultVO;
import com.example.taskscheduler.vo.TaskLogVO;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/task-logs")
@RequiredArgsConstructor
public class TaskLogController {

    private final TaskLogService taskLogService;

    @GetMapping("/{id}")
    public Result<TaskLogVO> getTaskLogById(@PathVariable Long id) {
        TaskLogVO taskLog = taskLogService.getTaskLogById(id);
        return Result.success(taskLog);
    }

    @GetMapping("/page")
    public Result<PageResultVO<TaskLogVO>> getTaskLogPage(TaskLogQueryDTO query) {
        IPage<TaskLogVO> page = taskLogService.getTaskLogPage(query);
        PageResultVO<TaskLogVO> result = PageResultVO.of(
                page.getRecords(),
                page.getTotal(),
                page.getSize(),
                page.getCurrent(),
                page.getPages()
        );
        return Result.success(result);
    }

    @GetMapping("/task/{taskId}/latest")
    public Result<List<TaskLogVO>> getLatestTaskLogs(
            @PathVariable Long taskId,
            @RequestParam(defaultValue = "10") Integer limit) {
        List<TaskLogVO> logs = taskLogService.getLatestTaskLogs(taskId, limit);
        return Result.success(logs);
    }

    @GetMapping("/task/{taskId}/latest-result")
    public Result<TaskLogVO> getLatestResultFromCache(@PathVariable Long taskId) {
        TaskLogVO result = taskLogService.getLatestResultFromCache(taskId);
        return Result.success(result);
    }
}