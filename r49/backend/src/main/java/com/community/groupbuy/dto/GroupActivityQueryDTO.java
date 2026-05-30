package com.community.groupbuy.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class GroupActivityQueryDTO {

    private String activityName;

    private String activityCode;

    private Integer status;

    private LocalDateTime startDate;

    private LocalDateTime endDate;

    private Integer pageNum = 1;

    private Integer pageSize = 10;
}
