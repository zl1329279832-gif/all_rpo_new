package com.chat.vo;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class FriendVO {

    private Long id;

    private Long userId;

    private Long friendId;

    private String remark;

    private Integer status;

    private UserVO friendInfo;

    private LocalDateTime createTime;
}
