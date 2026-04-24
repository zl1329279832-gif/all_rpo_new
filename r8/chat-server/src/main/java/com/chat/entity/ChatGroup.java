package com.chat.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("chat_group")
public class ChatGroup {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String groupName;

    private String groupAvatar;

    private String groupNotice;

    private Long ownerId;

    private Integer maxMembers;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;
}
