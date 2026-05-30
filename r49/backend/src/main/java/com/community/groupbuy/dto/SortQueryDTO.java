package com.community.groupbuy.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class SortQueryDTO {

    private Long activityId;

    private Long warehouseId;

    private Integer sortStatus;

    private String sortNo;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private Integer pageNum = 1;

    private Integer pageSize = 10;
}
