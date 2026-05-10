package com.example.taskscheduler.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("task_log")
public class TaskLog {

    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("task_id")
    private Long taskId;

    @TableField("task_name")
    private String taskName;

    @TableField("task_group")
    private String taskGroup;

    @TableField("trigger_type")
    private String triggerType;

    @TableField("execute_status")
    private String executeStatus;

    @TableField("execute_start_time")
    private LocalDateTime executeStartTime;

    @TableField("execute_end_time")
    private LocalDateTime executeEndTime;

    @TableField("execute_duration")
    private Long executeDuration;

    @TableField("execute_result")
    private String executeResult;

    @TableField("error_message")
    private String errorMessage;

    @TableField("retry_count")
    private Integer retryCount;

    @TableField("created_time")
    private LocalDateTime createdTime;
}