package com.example.apigatewaymanager.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("api_app")
public class ApiApp {
    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    private String appName;

    private String appDescription;

    private Integer status;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;
}
