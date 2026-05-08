package com.example.apigatewaymanager.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("api_key")
public class ApiKey {
    @TableId(type = IdType.AUTO)
    private Long id;

    private Long appId;

    private String apiKey;

    private String apiSecret;

    private Integer status;

    private Long totalCalls;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;
}
