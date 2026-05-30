package com.community.groupbuy.vo;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class SysUserVO {

    private Long id;

    private String username;

    private String nickname;

    private String phone;

    private String email;

    private String avatar;

    private Integer status;

    private String remark;

    private String loginIp;

    private LocalDateTime loginTime;

    private LocalDateTime createTime;

    private List<Long> roleIds;

    private List<String> roleNames;
}
