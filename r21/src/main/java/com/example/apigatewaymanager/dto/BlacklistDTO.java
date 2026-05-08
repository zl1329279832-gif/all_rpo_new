package com.example.apigatewaymanager.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public class BlacklistDTO {
    @NotNull(message = "目标类型不能为空")
    private Integer targetType;

    @NotNull(message = "目标值不能为空")
    private String targetValue;

    @Size(max = 500, message = "原因长度不能超过500")
    private String reason;

    private LocalDateTime expireTime;

    public Integer getTargetType() {
        return targetType;
    }

    public void setTargetType(Integer targetType) {
        this.targetType = targetType;
    }

    public String getTargetValue() {
        return targetValue;
    }

    public void setTargetValue(String targetValue) {
        this.targetValue = targetValue;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public LocalDateTime getExpireTime() {
        return expireTime;
    }

    public void setExpireTime(LocalDateTime expireTime) {
        this.expireTime = expireTime;
    }
}
