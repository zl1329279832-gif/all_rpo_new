package com.community.groupbuy.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class DeliveryQueryDTO {

    private String deliveryNo;

    private Long routeId;

    private Long driverId;

    private Long activityId;

    private Integer deliveryStatus;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private Integer pageNum = 1;

    private Integer pageSize = 10;
}
