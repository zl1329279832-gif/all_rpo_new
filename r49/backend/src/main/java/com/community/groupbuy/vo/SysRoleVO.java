package com.community.groupbuy.vo;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class SysRoleVO {

    private Long id;

    private String roleName;

    private String roleCode;

    private Integer sort;

    private Integer status;

    private String remark;

    private LocalDateTime createTime;

    private List<Long> permissionIds;
}
