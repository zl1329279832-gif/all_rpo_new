package com.chat.vo;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class GroupMemberVO {

    private Long id;

    private Long groupId;

    private Long userId;

    private String nickname;

    private Integer role;

    private UserVO userInfo;

    private LocalDateTime joinTime;
}
