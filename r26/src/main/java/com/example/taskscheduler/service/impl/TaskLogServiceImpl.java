package com.example.taskscheduler.service.impl;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.taskscheduler.common.BusinessException;
import com.example.taskscheduler.common.ResultCode;
import com.example.taskscheduler.dto.TaskLogQueryDTO;
import com.example.taskscheduler.entity.Task;
import com.example.taskscheduler.entity.TaskLog;
import com.example.taskscheduler.enums.ExecuteStatusEnum;
import com.example.taskscheduler.enums.TriggerTypeEnum;
import com.example.taskscheduler.mapper.TaskLogMapper;
import com.example.taskscheduler.service.TaskLogService;
import com.example.taskscheduler.vo.TaskLogVO;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TaskLogServiceImpl implements TaskLogService {

    private static final String LATEST_RESULT_CACHE_KEY = "task:latest:result:";
    private static final long LATEST_RESULT_CACHE_SECONDS = 3600;

    private final TaskLogMapper taskLogMapper;
    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @Override
    public TaskLogVO getTaskLogById(Long id) {
        TaskLog taskLog = taskLogMapper.selectById(id);
        if (taskLog == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "日志不存在");
        }
        return convertToVO(taskLog);
    }

    @Override
    public IPage<TaskLogVO> getTaskLogPage(TaskLogQueryDTO query) {
        Page<TaskLog> page = new Page<>(query.getPageNum(), query.getPageSize());
        IPage<TaskLog> logPage = taskLogMapper.selectTaskLogPage(page, query);
        
        List<TaskLogVO> voList = logPage.getRecords().stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());
        
        Page<TaskLogVO> result = new Page<>(logPage.getCurrent(), logPage.getSize(), logPage.getTotal());
        result.setRecords(voList);
        return result;
    }

    @Override
    public List<TaskLogVO> getLatestTaskLogs(Long taskId, Integer limit) {
        List<TaskLog> logs = taskLogMapper.selectLatestTaskLogs(taskId, limit);
        return logs.stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());
    }

    @Override
    public TaskLogVO getLatestTaskLog(Long taskId) {
        TaskLog log = taskLogMapper.selectLatestTaskLog(taskId);
        return log != null ? convertToVO(log) : null;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createTaskLogStart(Task task, String triggerType) {
        TaskLog taskLog = new TaskLog();
        taskLog.setTaskId(task.getId());
        taskLog.setTaskName(task.getTaskName());
        taskLog.setTaskGroup(task.getTaskGroup());
        taskLog.setTriggerType(triggerType);
        taskLog.setExecuteStatus(ExecuteStatusEnum.RUNNING.getCode());
        taskLog.setExecuteStartTime(LocalDateTime.now());
        taskLog.setRetryCount(task.getCurrentRetryCount());
        taskLog.setCreatedTime(LocalDateTime.now());
        
        taskLogMapper.insert(taskLog);
        return taskLog.getId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateTaskLogSuccess(Long logId, String executeResult, Long duration) {
        TaskLog taskLog = new TaskLog();
        taskLog.setId(logId);
        taskLog.setExecuteStatus(ExecuteStatusEnum.SUCCESS.getCode());
        taskLog.setExecuteEndTime(LocalDateTime.now());
        taskLog.setExecuteDuration(duration);
        taskLog.setExecuteResult(executeResult);
        taskLogMapper.updateById(taskLog);
        
        TaskLog fullLog = taskLogMapper.selectById(logId);
        if (fullLog != null) {
            cacheLatestResult(convertToVO(fullLog));
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateTaskLogFailure(Long logId, String errorMessage, Long duration) {
        TaskLog taskLog = new TaskLog();
        taskLog.setId(logId);
        taskLog.setExecuteStatus(ExecuteStatusEnum.FAILURE.getCode());
        taskLog.setExecuteEndTime(LocalDateTime.now());
        taskLog.setExecuteDuration(duration);
        taskLog.setErrorMessage(errorMessage);
        taskLogMapper.updateById(taskLog);
        
        TaskLog fullLog = taskLogMapper.selectById(logId);
        if (fullLog != null) {
            cacheLatestResult(convertToVO(fullLog));
        }
    }

    @Override
    public TaskLogVO getLatestResultFromCache(Long taskId) {
        String key = LATEST_RESULT_CACHE_KEY + taskId;
        String value = stringRedisTemplate.opsForValue().get(key);
        if (value != null) {
            try {
                return objectMapper.readValue(value, TaskLogVO.class);
            } catch (JsonProcessingException e) {
                log.warn("解析 Redis 缓存失败: taskId={}", taskId, e);
            }
        }
        return getLatestTaskLog(taskId);
    }

    @Override
    public void cacheLatestResult(TaskLogVO taskLogVO) {
        if (taskLogVO == null || taskLogVO.getTaskId() == null) {
            return;
        }
        String key = LATEST_RESULT_CACHE_KEY + taskLogVO.getTaskId();
        try {
            String value = objectMapper.writeValueAsString(taskLogVO);
            stringRedisTemplate.opsForValue().set(key, value, LATEST_RESULT_CACHE_SECONDS, TimeUnit.SECONDS);
        } catch (JsonProcessingException e) {
            log.warn("序列化任务执行结果失败: taskId={}", taskLogVO.getTaskId(), e);
        }
    }

    private TaskLogVO convertToVO(TaskLog taskLog) {
        TaskLogVO vo = new TaskLogVO();
        BeanUtils.copyProperties(taskLog, vo);
        
        for (TriggerTypeEnum triggerType : TriggerTypeEnum.values()) {
            if (triggerType.getCode().equals(taskLog.getTriggerType())) {
                vo.setTriggerTypeDesc(triggerType.getDesc());
                break;
            }
        }
        
        for (ExecuteStatusEnum executeStatus : ExecuteStatusEnum.values()) {
            if (executeStatus.getCode().equals(taskLog.getExecuteStatus())) {
                vo.setExecuteStatusDesc(executeStatus.getDesc());
                break;
            }
        }
        
        return vo;
    }
}