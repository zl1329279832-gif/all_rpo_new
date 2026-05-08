package com.example.apigatewaymanager.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("access_log")
public class AccessLog {
    @TableId(type = IdType.AUTO)
    private Long id;

    private String apiKey;

    private Long appId;

    private Long userId;

    private String requestMethod;

    private String requestPath;

    private String requestParams;

    private String requestIp;

    private Integer responseStatus;

    private Long responseTime;

    private String errorMessage;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
