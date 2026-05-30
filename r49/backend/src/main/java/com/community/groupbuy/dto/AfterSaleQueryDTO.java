package com.community.groupbuy.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AfterSaleQueryDTO {

    private String afterSaleNo;

    private Long orderId;

    private Long userId;

    private Long leaderId;

    private Long activityId;

    private Integer afterSaleType;

    private Integer afterSaleStatus;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private Integer pageNum = 1;

    private Integer pageSize = 10;
}
