package com.example.taskscheduler.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("task")
public class Task {

    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("task_name")
    private String taskName;

    @TableField("task_group")
    private String taskGroup;

    @TableField("cron_expression")
    private String cronExpression;

    @TableField("target_class")
    private String targetClass;

    @TableField("target_method")
    private String targetMethod;

    @TableField("method_params")
    private String methodParams;

    @TableField("task_status")
    private Integer taskStatus;

    @TableField("max_retry_count")
    private Integer maxRetryCount;

    @TableField("current_retry_count")
    private Integer currentRetryCount;

    @TableField("last_execute_time")
    private LocalDateTime lastExecuteTime;

    @TableField("next_execute_time")
    private LocalDateTime nextExecuteTime;

    @TableField("last_execute_result")
    private String lastExecuteResult;

    @TableField("last_execute_message")
    private String lastExecuteMessage;

    @TableField("remark")
    private String remark;

    @TableField("created_time")
    private LocalDateTime createdTime;

    @TableField("updated_time")
    private LocalDateTime updatedTime;

    @TableLogic
    @TableField("deleted")
    private Integer deleted;
}