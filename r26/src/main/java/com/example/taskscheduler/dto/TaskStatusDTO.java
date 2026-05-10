package com.example.taskscheduler.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TaskStatusDTO {

    @NotNull(message = "任务ID不能为空")
    private Long id;

    @NotNull(message = "任务状态不能为空")
    private Integer status;
}