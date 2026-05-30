package com.community.groupbuy.dto;

import lombok.Data;

import java.util.List;

@Data
public class SysUserSaveDTO {

    private Long id;

    private String username;

    private String password;

    private String nickname;

    private String phone;

    private String email;

    private String avatar;

    private Integer status;

    private String remark;

    private List<Long> roleIds;
}
