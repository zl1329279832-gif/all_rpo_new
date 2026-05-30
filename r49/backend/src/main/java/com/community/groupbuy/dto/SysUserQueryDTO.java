package com.community.groupbuy.dto;

import lombok.Data;

@Data
public class SysUserQueryDTO {

    private String username;

    private String phone;

    private Integer status;

    private String startTime;

    private String endTime;
}
