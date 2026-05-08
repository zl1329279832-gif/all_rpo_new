package com.example.apigatewaymanager.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class BlacklistDTO {
    @NotNull(message = "目标类型不能为空")
    private Integer targetType;

    @NotNull(message = "目标值不能为空")
    private String targetValue;

    @Size(max = 500, message = "原因长度不能超过500")
    private String reason;

    private LocalDateTime expireTime;
}
