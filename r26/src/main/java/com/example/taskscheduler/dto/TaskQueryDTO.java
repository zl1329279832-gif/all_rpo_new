package com.example.taskscheduler.dto;

import lombok.Data;

@Data
public class TaskQueryDTO {

    private String taskName;

    private String taskGroup;

    private Integer taskStatus;

    private String lastExecuteResult;

    private Integer pageNum = 1;

    private Integer pageSize = 10;
}