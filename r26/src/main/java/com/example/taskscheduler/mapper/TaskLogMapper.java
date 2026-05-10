package com.example.taskscheduler.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.taskscheduler.entity.TaskLog;
import com.example.taskscheduler.dto.TaskLogQueryDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface TaskLogMapper extends BaseMapper<TaskLog> {

    IPage<TaskLog> selectTaskLogPage(Page<TaskLog> page, @Param("query") TaskLogQueryDTO query);

    List<TaskLog> selectLatestTaskLogs(@Param("taskId") Long taskId, @Param("limit") Integer limit);

    TaskLog selectLatestTaskLog(@Param("taskId") Long taskId);
}