package com.example.taskscheduler.vo;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class TaskVO {

    private Long id;

    private String taskName;

    private String taskGroup;

    private String cronExpression;

    private String targetClass;

    private String targetMethod;

    private String methodParams;

    private Integer taskStatus;

    private String taskStatusDesc;

    private Integer maxRetryCount;

    private Integer currentRetryCount;

    private LocalDateTime lastExecuteTime;

    private LocalDateTime nextExecuteTime;

    private String lastExecuteResult;

    private String lastExecuteMessage;

    private String remark;

    private LocalDateTime createdTime;

    private LocalDateTime updatedTime;
}