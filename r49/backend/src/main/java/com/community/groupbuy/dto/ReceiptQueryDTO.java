package com.community.groupbuy.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ReceiptQueryDTO {

    private String receiptNo;

    private Long leaderId;

    private Long deliveryId;

    private Long activityId;

    private Integer receiptStatus;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private Integer pageNum = 1;

    private Integer pageSize = 10;
}
