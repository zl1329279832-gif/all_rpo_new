package com.example.taskscheduler.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TaskCreateDTO {

    @NotBlank(message = "任务名称不能为空")
    @Size(max = 100, message = "任务名称长度不能超过100")
    private String taskName;

    @Size(max = 50, message = "任务分组长度不能超过50")
    private String taskGroup = "DEFAULT";

    @NotBlank(message = "Cron表达式不能为空")
    @Size(max = 100, message = "Cron表达式长度不能超过100")
    private String cronExpression;

    @NotBlank(message = "目标类名不能为空")
    @Size(max = 255, message = "目标类名长度不能超过255")
    private String targetClass;

    @NotBlank(message = "目标方法名不能为空")
    @Size(max = 100, message = "目标方法名长度不能超过100")
    private String targetMethod;

    private String methodParams;

    @NotNull(message = "最大重试次数不能为空")
    @Min(value = 0, message = "最大重试次数不能小于0")
    @Max(value = 10, message = "最大重试次数不能超过10")
    private Integer maxRetryCount = 3;

    @Size(max = 500, message = "备注长度不能超过500")
    private String remark;
}