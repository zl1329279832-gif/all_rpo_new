package com.example.apigatewaymanager.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("blacklist")
public class Blacklist {
    @TableId(type = IdType.AUTO)
    private Long id;

    private Integer targetType;

    private String targetValue;

    private String reason;

    private LocalDateTime expireTime;

    private Integer status;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;
}
