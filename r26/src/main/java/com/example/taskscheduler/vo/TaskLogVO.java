package com.example.taskscheduler.vo;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class TaskLogVO {

    private Long id;

    private Long taskId;

    private String taskName;

    private String taskGroup;

    private String triggerType;

    private String triggerTypeDesc;

    private String executeStatus;

    private String executeStatusDesc;

    private LocalDateTime executeStartTime;

    private LocalDateTime executeEndTime;

    private Long executeDuration;

    private String executeResult;

    private String errorMessage;

    private Integer retryCount;

    private LocalDateTime createdTime;
}