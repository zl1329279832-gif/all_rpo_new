package com.example.apigatewaymanager.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
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
}
