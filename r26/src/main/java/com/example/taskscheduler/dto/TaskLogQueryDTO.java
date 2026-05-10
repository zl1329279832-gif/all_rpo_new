package com.example.taskscheduler.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class TaskLogQueryDTO {

    private Long taskId;

    private String taskName;

    private String taskGroup;

    private String executeStatus;

    private String triggerType;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private Integer pageNum = 1;

    private Integer pageSize = 10;
}