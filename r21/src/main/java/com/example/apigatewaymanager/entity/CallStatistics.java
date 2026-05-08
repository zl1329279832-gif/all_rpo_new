package com.example.apigatewaymanager.entity;

import com.baomidou.mybatisplus.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@TableName("call_statistics")
public class CallStatistics {
    @TableId(type = IdType.AUTO)
    private Long id;

    private LocalDate statDate;

    private String apiKey;

    private Long appId;

    private Long userId;

    private Long totalCalls;

    private Long successCalls;

    private Long failCalls;

    private Integer avgResponseTime;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDate getStatDate() {
        return statDate;
    }

    public void setStatDate(LocalDate statDate) {
        this.statDate = statDate;
    }

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }

    public Long getAppId() {
        return appId;
    }

    public void setAppId(Long appId) {
        this.appId = appId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getTotalCalls() {
        return totalCalls;
    }

    public void setTotalCalls(Long totalCalls) {
        this.totalCalls = totalCalls;
    }

    public Long getSuccessCalls() {
        return successCalls;
    }

    public void setSuccessCalls(Long successCalls) {
        this.successCalls = successCalls;
    }

    public Long getFailCalls() {
        return failCalls;
    }

    public void setFailCalls(Long failCalls) {
        this.failCalls = failCalls;
    }

    public Integer getAvgResponseTime() {
        return avgResponseTime;
    }

    public void setAvgResponseTime(Integer avgResponseTime) {
        this.avgResponseTime = avgResponseTime;
    }

    public LocalDateTime getCreateTime() {
        return createTime;
    }

    public void setCreateTime(LocalDateTime createTime) {
        this.createTime = createTime;
    }

    public LocalDateTime getUpdateTime() {
        return updateTime;
    }

    public void setUpdateTime(LocalDateTime updateTime) {
        this.updateTime = updateTime;
    }
}
