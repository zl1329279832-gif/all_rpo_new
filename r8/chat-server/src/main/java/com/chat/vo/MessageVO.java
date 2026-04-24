package com.chat.vo;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class MessageVO {

    private Long id;

    private Long fromUserId;

    private UserVO fromUser;

    private Long toUserId;

    private Long groupId;

    private Integer chatType;

    private Integer messageType;

    private String content;

    private Integer status;

    private LocalDateTime sendTime;

    private LocalDateTime readTime;
}
