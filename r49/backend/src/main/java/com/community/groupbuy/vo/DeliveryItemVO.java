package com.community.groupbuy.vo;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class DeliveryItemVO {

    private Long id;

    private Long deliveryId;

    private Long orderId;

    private String orderNo;

    private Long activitySkuId;

    private Long productId;

    private String productName;

    private String spec;

    private Integer plannedQuantity;

    private Integer actualQuantity;

    private Integer shortageQuantity;

    private String shortageReason;

    private Long leaderId;

    private String leaderName;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;
}
