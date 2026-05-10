package com.example.taskscheduler.service.impl;

import cn.hutool.core.util.StrUtil;
import cn.hutool.cron.CronUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.taskscheduler.common.BusinessException;
import com.example.taskscheduler.common.ResultCode;
import com.example.taskscheduler.dto.TaskCreateDTO;
import com.example.taskscheduler.dto.TaskQueryDTO;
import com.example.taskscheduler.dto.TaskUpdateDTO;
import com.example.taskscheduler.entity.Task;
import com.example.taskscheduler.enums.ExecuteStatusEnum;
import com.example.taskscheduler.enums.TaskStatusEnum;
import com.example.taskscheduler.enums.TriggerTypeEnum;
import com.example.taskscheduler.mapper.TaskMapper;
import com.example.taskscheduler.service.TaskLogService;
import com.example.taskscheduler.service.TaskService;
import com.example.taskscheduler.vo.TaskVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.lang.reflect.Method;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TaskServiceImpl implements TaskService {

    private final TaskMapper taskMapper;
    private final TaskLogService taskLogService;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public TaskVO createTask(TaskCreateDTO dto) {
        validateCronExpression(dto.getCronExpression());
        
        LambdaQueryWrapper<Task> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(Task::getTaskGroup, dto.getTaskGroup())
                .eq(Task::getTaskName, dto.getTaskName());
        if (taskMapper.selectCount(queryWrapper) > 0) {
            throw new BusinessException(ResultCode.TASK_ALREADY_EXISTS);
        }

        Task task = new Task();
        BeanUtils.copyProperties(dto, task);
        task.setTaskStatus(TaskStatusEnum.STOPPED.getCode());
        task.setCurrentRetryCount(0);
        task.setCreatedTime(LocalDateTime.now());
        task.setUpdatedTime(LocalDateTime.now());
        
        taskMapper.insert(task);
        return convertToVO(task);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public TaskVO updateTask(TaskUpdateDTO dto) {
        Task task = taskMapper.selectById(dto.getId());
        if (task == null) {
            throw new BusinessException(ResultCode.TASK_NOT_FOUND);
        }

        if (StrUtil.isNotBlank(dto.getCronExpression())) {
            validateCronExpression(dto.getCronExpression());
        }

        if (StrUtil.isNotBlank(dto.getTaskName()) && !dto.getTaskName().equals(task.getTaskName())) {
            String groupToCheck = dto.getTaskGroup() != null ? dto.getTaskGroup() : task.getTaskGroup();
            LambdaQueryWrapper<Task> queryWrapper = new LambdaQueryWrapper<>();
            queryWrapper.eq(Task::getTaskGroup, groupToCheck)
                    .eq(Task::getTaskName, dto.getTaskName())
                    .ne(Task::getId, task.getId());
            if (taskMapper.selectCount(queryWrapper) > 0) {
                throw new BusinessException(ResultCode.TASK_ALREADY_EXISTS);
            }
        }

        BeanUtils.copyProperties(dto, task, "id", "taskStatus", "currentRetryCount", 
                "lastExecuteTime", "nextExecuteTime", "lastExecuteResult", "lastExecuteMessage",
                "createdTime", "deleted");
        task.setUpdatedTime(LocalDateTime.now());
        
        taskMapper.updateById(task);
        return convertToVO(task);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteTask(Long id) {
        Task task = taskMapper.selectById(id);
        if (task == null) {
            throw new BusinessException(ResultCode.TASK_NOT_FOUND);
        }
        if (TaskStatusEnum.RUNNING.getCode().equals(task.getTaskStatus())) {
            throw new BusinessException(ResultCode.TASK_ALREADY_RUNNING, "任务运行中，无法删除");
        }
        taskMapper.deleteById(id);
    }

    @Override
    public TaskVO getTaskById(Long id) {
        Task task = taskMapper.selectById(id);
        if (task == null) {
            throw new BusinessException(ResultCode.TASK_NOT_FOUND);
        }
        return convertToVO(task);
    }

    @Override
    public IPage<TaskVO> getTaskPage(TaskQueryDTO query) {
        Page<Task> page = new Page<>(query.getPageNum(), query.getPageSize());
        IPage<Task> taskPage = taskMapper.selectTaskPage(page, query);
        
        List<TaskVO> voList = taskPage.getRecords().stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());
        
        Page<TaskVO> result = new Page<>(taskPage.getCurrent(), taskPage.getSize(), taskPage.getTotal());
        result.setRecords(voList);
        return result;
    }

    @Override
    public List<TaskVO> getRunningTasks() {
        List<Task> tasks = taskMapper.selectRunningTasks();
        return tasks.stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public TaskVO startTask(Long id) {
        Task task = taskMapper.selectById(id);
        if (task == null) {
            throw new BusinessException(ResultCode.TASK_NOT_FOUND);
        }
        if (TaskStatusEnum.RUNNING.getCode().equals(task.getTaskStatus())) {
            throw new BusinessException(ResultCode.TASK_ALREADY_RUNNING);
        }
        
        task.setTaskStatus(TaskStatusEnum.RUNNING.getCode());
        task.setUpdatedTime(LocalDateTime.now());
        taskMapper.updateById(task);
        
        return convertToVO(task);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public TaskVO stopTask(Long id) {
        Task task = taskMapper.selectById(id);
        if (task == null) {
            throw new BusinessException(ResultCode.TASK_NOT_FOUND);
        }
        if (TaskStatusEnum.STOPPED.getCode().equals(task.getTaskStatus())) {
            throw new BusinessException(ResultCode.TASK_ALREADY_STOPPED);
        }
        
        task.setTaskStatus(TaskStatusEnum.STOPPED.getCode());
        task.setUpdatedTime(LocalDateTime.now());
        taskMapper.updateById(task);
        
        return convertToVO(task);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public TaskVO pauseTask(Long id) {
        Task task = taskMapper.selectById(id);
        if (task == null) {
            throw new BusinessException(ResultCode.TASK_NOT_FOUND);
        }
        if (!TaskStatusEnum.RUNNING.getCode().equals(task.getTaskStatus())) {
            throw new BusinessException(ResultCode.TASK_INVALID_STATUS, "只有运行中的任务才能暂停");
        }
        
        task.setTaskStatus(TaskStatusEnum.PAUSED.getCode());
        task.setUpdatedTime(LocalDateTime.now());
        taskMapper.updateById(task);
        
        return convertToVO(task);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public TaskVO resumeTask(Long id) {
        Task task = taskMapper.selectById(id);
        if (task == null) {
            throw new BusinessException(ResultCode.TASK_NOT_FOUND);
        }
        if (!TaskStatusEnum.PAUSED.getCode().equals(task.getTaskStatus())) {
            throw new BusinessException(ResultCode.TASK_INVALID_STATUS, "只有暂停中的任务才能恢复");
        }
        
        task.setTaskStatus(TaskStatusEnum.RUNNING.getCode());
        task.setUpdatedTime(LocalDateTime.now());
        taskMapper.updateById(task);
        
        return convertToVO(task);
    }

    @Override
    public void executeTask(Long id) {
        Task task = taskMapper.selectById(id);
        if (task == null) {
            throw new BusinessException(ResultCode.TASK_NOT_FOUND);
        }
        
        executeTaskInternal(task, TriggerTypeEnum.MANUAL.getCode(), 0);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public TaskVO updateTaskStatus(Long id, Integer status) {
        TaskStatusEnum statusEnum = TaskStatusEnum.getByCode(status);
        if (statusEnum == null) {
            throw new BusinessException(ResultCode.TASK_INVALID_STATUS);
        }
        
        Task task = taskMapper.selectById(id);
        if (task == null) {
            throw new BusinessException(ResultCode.TASK_NOT_FOUND);
        }
        
        task.setTaskStatus(status);
        task.setUpdatedTime(LocalDateTime.now());
        taskMapper.updateById(task);
        
        return convertToVO(task);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateTaskAfterExecute(Task task, boolean success, String result, String errorMessage) {
        task.setLastExecuteTime(LocalDateTime.now());
        task.setLastExecuteResult(success ? ExecuteStatusEnum.SUCCESS.getCode() : ExecuteStatusEnum.FAILURE.getCode());
        task.setLastExecuteMessage(success ? result : errorMessage);
        if (success) {
            task.setCurrentRetryCount(0);
        }
        task.setUpdatedTime(LocalDateTime.now());
        taskMapper.updateById(task);
    }

    private void executeTaskInternal(Task task, String triggerType, int retryCount) {
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
            updateTaskAfterExecute(task, true, resultStr, null);
            
        } catch (Exception e) {
            log.error("任务执行失败: taskId={}, taskName={}", task.getId(), task.getTaskName(), e);
            long duration = System.currentTimeMillis() - startTime;
            String errorMsg = e.getMessage() != null ? e.getMessage() : "未知错误";
            taskLogService.updateTaskLogFailure(logId, errorMsg, duration);
            
            int currentRetry = retryCount + 1;
            if (currentRetry <= task.getMaxRetryCount()) {
                log.info("任务执行失败，准备重试: taskId={}, retryCount={}/{}", 
                        task.getId(), currentRetry, task.getMaxRetryCount());
                try {
                    Thread.sleep(1000L * currentRetry);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                }
                executeTaskInternal(task, TriggerTypeEnum.RETRY.getCode(), currentRetry);
            } else {
                updateTaskAfterExecute(task, false, null, errorMsg);
                throw new BusinessException(ResultCode.TASK_EXECUTE_FAILED, errorMsg);
            }
        }
    }

    private void validateCronExpression(String cronExpression) {
        try {
            CronUtil.parseCron(cronExpression);
        } catch (Exception e) {
            throw new BusinessException(ResultCode.INVALID_CRON_EXPRESSION);
        }
    }

    private TaskVO convertToVO(Task task) {
        TaskVO vo = new TaskVO();
        BeanUtils.copyProperties(task, vo);
        TaskStatusEnum statusEnum = TaskStatusEnum.getByCode(task.getTaskStatus());
        if (statusEnum != null) {
            vo.setTaskStatusDesc(statusEnum.getDesc());
        }
        return vo;
    }
}