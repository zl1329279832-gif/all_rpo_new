package com.example.apigatewaymanager.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("rate_limit")
public class RateLimit {
    @TableId(type = IdType.AUTO)
    private Long id;

    private Integer targetType;

    private String targetValue;

    private Integer limitType;

    private Integer limitValue;

    private Integer status;

    private String remark;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;
}
