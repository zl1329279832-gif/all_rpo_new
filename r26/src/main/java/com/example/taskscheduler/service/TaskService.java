package com.example.taskscheduler.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.example.taskscheduler.dto.TaskCreateDTO;
import com.example.taskscheduler.dto.TaskQueryDTO;
import com.example.taskscheduler.dto.TaskUpdateDTO;
import com.example.taskscheduler.entity.Task;
import com.example.taskscheduler.vo.TaskVO;

import java.util.List;

public interface TaskService {

    TaskVO createTask(TaskCreateDTO dto);

    TaskVO updateTask(TaskUpdateDTO dto);

    void deleteTask(Long id);

    TaskVO getTaskById(Long id);

    IPage<TaskVO> getTaskPage(TaskQueryDTO query);

    List<TaskVO> getRunningTasks();

    TaskVO startTask(Long id);

    TaskVO stopTask(Long id);

    TaskVO pauseTask(Long id);

    TaskVO resumeTask(Long id);

    void executeTask(Long id);

    TaskVO updateTaskStatus(Long id, Integer status);

    void updateTaskAfterExecute(Task task, boolean success, String result, String errorMessage);
}