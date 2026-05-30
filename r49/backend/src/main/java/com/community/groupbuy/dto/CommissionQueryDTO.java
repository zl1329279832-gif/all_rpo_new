package com.community.groupbuy.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CommissionQueryDTO {

    private String commissionNo;

    private Long orderId;

    private Long leaderId;

    private Long activityId;

    private Long productId;

    private Integer settleStatus;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private Integer pageNum = 1;

    private Integer pageSize = 10;
}
