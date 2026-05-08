package com.example.apigatewaymanager.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

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

    public Integer getLimitType() {
        return limitType;
    }

    public void setLimitType(Integer limitType) {
        this.limitType = limitType;
    }

    public Integer getLimitValue() {
        return limitValue;
    }

    public void setLimitValue(Integer limitValue) {
        this.limitValue = limitValue;
    }

    public String getRemark() {
        return remark;
    }

    public void setRemark(String remark) {
        this.remark = remark;
    }
}
