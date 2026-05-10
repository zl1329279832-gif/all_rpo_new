package com.example.taskscheduler.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.taskscheduler.entity.Task;
import com.example.taskscheduler.dto.TaskQueryDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface TaskMapper extends BaseMapper<Task> {

    IPage<Task> selectTaskPage(Page<Task> page, @Param("query") TaskQueryDTO query);

    List<Task> selectRunningTasks();
}