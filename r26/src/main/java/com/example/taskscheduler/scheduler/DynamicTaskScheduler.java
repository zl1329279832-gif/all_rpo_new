package com.example.taskscheduler.scheduler;

import cn.hutool.cron.CronUtil;
import com.example.taskscheduler.entity.Task;
import com.example.taskscheduler.enums.TaskStatusEnum;
import com.example.taskscheduler.enums.TriggerTypeEnum;
import com.example.taskscheduler.service.TaskLogService;
import com.example.taskscheduler.service.TaskService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
@RequiredArgsConstructor
public class DynamicTaskScheduler {

    private final TaskService taskService;
    private final TaskLogService taskLogService;
    
    private final Map<Long, String> scheduledTaskIds = new ConcurrentHashMap<>();

    @PostConstruct
    public void init() {
        log.info("初始化动态任务调度器");
        loadRunningTasks();
    }

    public void loadRunningTasks() {
        List<com.example.taskscheduler.vo.TaskVO> runningTasks = taskService.getRunningTasks();
        for (com.example.taskscheduler.vo.TaskVO taskVO : runningTasks) {
            scheduleTask(taskVO.getId());
        }
        log.info("已加载运行中的任务数量: {}", runningTasks.size());
    }

    public void scheduleTask(Long taskId) {
        com.example.taskscheduler.vo.TaskVO taskVO = taskService.getTaskById(taskId);
        if (taskVO == null || !TaskStatusEnum.RUNNING.getCode().equals(taskVO.getTaskStatus())) {
            return;
        }
        
        unscheduleTask(taskId);
        
        String cronExpression = taskVO.getCronExpression();
        String taskIdStr = String.valueOf(taskId);
        
        try {
            String scheduleId = CronUtil.schedule(taskIdStr, cronExpression, () -> {
                try {
                    executeScheduledTask(taskId);
                } catch (Exception e) {
                    log.error("定时任务执行异常: taskId={}", taskId, e);
                }
            });
            scheduledTaskIds.put(taskId, scheduleId);
            log.info("任务已注册到调度器: taskId={}, cron={}", taskId, cronExpression);
        } catch (Exception e) {
            log.error("任务注册失败: taskId={}", taskId, e);
        }
    }

    public void unscheduleTask(Long taskId) {
        String scheduleId = scheduledTaskIds.remove(taskId);
        if (scheduleId != null) {
            CronUtil.remove(scheduleId);
            log.info("任务已从调度器移除: taskId={}", taskId);
        }
    }

    private void executeScheduledTask(Long taskId) {
        com.example.taskscheduler.vo.TaskVO taskVO = taskService.getTaskById(taskId);
        if (taskVO == null || !TaskStatusEnum.RUNNING.getCode().equals(taskVO.getTaskStatus())) {
            log.warn("任务状态变更，跳过执行: taskId={}", taskId);
            return;
        }
        
        Task task = new Task();
        org.springframework.beans.BeanUtils.copyProperties(taskVO, task);
        
        Long logId = taskLogService.createTaskLogStart(task, TriggerTypeEnum.SCHEDULED.getCode());
        long startTime = System.currentTimeMillis();
        
        try {
            Class<?> clazz = Class.forName(task.getTargetClass());
            Object instance = clazz.getDeclaredConstructor().newInstance();
            Method method = clazz.getDeclaredMethod(task.getTargetMethod(), String.class);
            method.setAccessible(true);
            Object result = method.invoke(instance, task.getMethodParams());
            String resultStr = result != null ? result.toString() : "执行成功";
            
            long duration = System.currentTimeMillis() - startTime;
            taskLogService.updateTaskLogSuccess(logId, resultStr, duration);
            taskService.updateTaskAfterExecute(task, true, resultStr, null);
            
            log.info("定时任务执行成功: taskId={}, taskName={}, 耗时={}ms", 
                    task.getId(), task.getTaskName(), duration);
            
        } catch (Exception e) {
            log.error("定时任务执行失败: taskId={}, taskName={}", task.getId(), task.getTaskName(), e);
            long duration = System.currentTimeMillis() - startTime;
            String errorMsg = e.getMessage() != null ? e.getMessage() : "未知错误";
            
            Integer retryCount = task.getCurrentRetryCount();
            Integer maxRetry = task.getMaxRetryCount();
            
            if (retryCount < maxRetry) {
                log.info("任务执行失败，准备重试: taskId={}, retryCount={}/{}", 
                        task.getId(), retryCount + 1, maxRetry);
                task.setCurrentRetryCount(retryCount + 1);
                try {
                    Thread.sleep(1000L * (retryCount + 1));
                    executeWithRetry(task, TriggerTypeEnum.RETRY.getCode(), task.getCurrentRetryCount());
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                }
            } else {
                taskLogService.updateTaskLogFailure(logId, errorMsg, duration);
                taskService.updateTaskAfterExecute(task, false, null, errorMsg);
            }
        }
    }

    private void executeWithRetry(Task task, String triggerType, int retryCount) {
        Long logId = taskLogService.createTaskLogStart(task, triggerType);
        long startTime = System.currentTimeMillis();
        
        try {
            Class<?> clazz = Class.forName(task.getTargetClass());
            Object instance = clazz.getDeclaredConstructor().newInstance();
            Method method = clazz.getDeclaredMethod(task.getTargetMethod(), String.class);
            method.setAccessible(true);
            Object result = method.invoke(instance, task.getMethodParams());
            String resultStr = result != null ? result.toString() : "执行成功";
            
            long duration = System.currentTimeMillis() - startTime;
            taskLogService.updateTaskLogSuccess(logId, resultStr, duration);
            taskService.updateTaskAfterExecute(task, true, resultStr, null);
            log.info("任务重试执行成功: taskId={}, retryCount={}", task.getId(), retryCount);
            
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            String errorMsg = e.getMessage() != null ? e.getMessage() : "未知错误";
            
            if (retryCount < task.getMaxRetryCount()) {
                log.info("任务重试执行失败，继续重试: taskId={}, retryCount={}/{}", 
                        task.getId(), retryCount + 1, task.getMaxRetryCount());
                task.setCurrentRetryCount(retryCount + 1);
                try {
                    Thread.sleep(1000L * (retryCount + 1));
                    executeWithRetry(task, TriggerTypeEnum.RETRY.getCode(), task.getCurrentRetryCount());
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                }
            } else {
                taskLogService.updateTaskLogFailure(logId, errorMsg, duration);
                taskService.updateTaskAfterExecute(task, false, null, errorMsg);
                log.error("任务重试达到最大次数，执行失败: taskId={}", task.getId());
            }
        }
    }

    @Scheduled(fixedRate = 10000)
    public void refreshTaskScheduler() {
        List<com.example.taskscheduler.vo.TaskVO> runningTasks = taskService.getRunningTasks();
        for (com.example.taskscheduler.vo.TaskVO taskVO : runningTasks) {
            if (!scheduledTaskIds.containsKey(taskVO.getId())) {
                scheduleTask(taskVO.getId());
            }
        }
        
        for (Long taskId : scheduledTaskIds.keySet()) {
            com.example.taskscheduler.vo.TaskVO taskVO = taskService.getTaskById(taskId);
            if (taskVO == null || !TaskStatusEnum.RUNNING.getCode().equals(taskVO.getTaskStatus())) {
                unscheduleTask(taskId);
            }
        }
    }
}