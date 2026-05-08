package com.example.apigatewaymanager.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RateLimitDTO {
    @NotNull(message = "限流目标类型不能为空")
    private Integer targetType;

    @NotNull(message = "目标值不能为空")
    private String targetValue;

    @NotNull(message = "限流类型不能为空")
    private Integer limitType;

    @NotNull(message = "限制次数不能为空")
    private Integer limitValue;

    @Size(max = 255, message = "备注长度不能超过255")
    private String remark;
}
