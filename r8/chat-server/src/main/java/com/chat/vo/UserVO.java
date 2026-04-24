package com.chat.vo;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UserVO {

    private Long id;

    private String username;

    private String nickname;

    private String avatar;

    private String email;

    private String phone;

    private Integer status;

    private Boolean online;

    private LocalDateTime lastLoginTime;

    private LocalDateTime createTime;
}
