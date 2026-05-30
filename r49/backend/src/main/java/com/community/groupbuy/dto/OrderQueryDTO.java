package com.community.groupbuy.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class OrderQueryDTO {

    private Long userId;

    private Long activityId;

    private Long leaderId;

    private Integer payStatus;

    private Integer orderStatus;

    private String orderNo;

    private String receiverPhone;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private Integer pageNum = 1;

    private Integer pageSize = 10;
}
