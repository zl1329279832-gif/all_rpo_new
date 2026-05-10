package com.example.taskscheduler.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.example.taskscheduler.common.Result;
import com.example.taskscheduler.dto.TaskCreateDTO;
import com.example.taskscheduler.dto.TaskQueryDTO;
import com.example.taskscheduler.dto.TaskUpdateDTO;
import com.example.taskscheduler.scheduler.DynamicTaskScheduler;
import com.example.taskscheduler.service.TaskService;
import com.example.taskscheduler.vo.PageResultVO;
import com.example.taskscheduler.vo.TaskVO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;
    private final DynamicTaskScheduler dynamicTaskScheduler;

    @PostMapping
    public Result<TaskVO> createTask(@Valid @RequestBody TaskCreateDTO dto) {
        TaskVO task = taskService.createTask(dto);
        return Result.success(task);
    }

    @PutMapping
    public Result<TaskVO> updateTask(@Valid @RequestBody TaskUpdateDTO dto) {
        TaskVO task = taskService.updateTask(dto);
        return Result.success(task);
    }

    @DeleteMapping("/{id}")
    public Result<Void> deleteTask(@PathVariable Long id) {
        taskService.deleteTask(id);
        return Result.success();
    }

    @GetMapping("/{id}")
    public Result<TaskVO> getTaskById(@PathVariable Long id) {
        TaskVO task = taskService.getTaskById(id);
        return Result.success(task);
    }

    @GetMapping("/page")
    public Result<PageResultVO<TaskVO>> getTaskPage(TaskQueryDTO query) {
        IPage<TaskVO> page = taskService.getTaskPage(query);
        PageResultVO<TaskVO> result = PageResultVO.of(
                page.getRecords(),
                page.getTotal(),
                page.getSize(),
                page.getCurrent(),
                page.getPages()
        );
        return Result.success(result);
    }

    @GetMapping("/running")
    public Result<List<TaskVO>> getRunningTasks() {
        List<TaskVO> tasks = taskService.getRunningTasks();
        return Result.success(tasks);
    }

    @PostMapping("/{id}/start")
    public Result<TaskVO> startTask(@PathVariable Long id) {
        TaskVO task = taskService.startTask(id);
        dynamicTaskScheduler.scheduleTask(id);
        return Result.success(task);
    }

    @PostMapping("/{id}/stop")
    public Result<TaskVO> stopTask(@PathVariable Long id) {
        TaskVO task = taskService.stopTask(id);
        dynamicTaskScheduler.unscheduleTask(id);
        return Result.success(task);
    }

    @PostMapping("/{id}/pause")
    public Result<TaskVO> pauseTask(@PathVariable Long id) {
        TaskVO task = taskService.pauseTask(id);
        dynamicTaskScheduler.unscheduleTask(id);
        return Result.success(task);
    }

    @PostMapping("/{id}/resume")
    public Result<TaskVO> resumeTask(@PathVariable Long id) {
        TaskVO task = taskService.resumeTask(id);
        dynamicTaskScheduler.scheduleTask(id);
        return Result.success(task);
    }

    @PostMapping("/{id}/execute")
    public Result<Void> executeTask(@PathVariable Long id) {
        taskService.executeTask(id);
        return Result.success();
    }
}