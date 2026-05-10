package com.example.taskscheduler.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.example.taskscheduler.dto.TaskLogQueryDTO;
import com.example.taskscheduler.entity.Task;
import com.example.taskscheduler.vo.TaskLogVO;

import java.util.List;

public interface TaskLogService {

    TaskLogVO getTaskLogById(Long id);

    IPage<TaskLogVO> getTaskLogPage(TaskLogQueryDTO query);

    List<TaskLogVO> getLatestTaskLogs(Long taskId, Integer limit);

    TaskLogVO getLatestTaskLog(Long taskId);

    Long createTaskLogStart(Task task, String triggerType);

    void updateTaskLogSuccess(Long logId, String executeResult, Long duration);

    void updateTaskLogFailure(Long logId, String errorMessage, Long duration);

    TaskLogVO getLatestResultFromCache(Long taskId);

    void cacheLatestResult(TaskLogVO taskLogVO);
}