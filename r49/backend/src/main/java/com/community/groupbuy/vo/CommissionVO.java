package com.community.groupbuy.vo;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class CommissionVO {

    private Long id;

    private String commissionNo;

    private Long orderId;

    private String orderNo;

    private Long orderItemId;

    private Long leaderId;

    private String leaderName;

    private Long activityId;

    private String activityName;

    private Long productId;

    private String productName;

    private String productImage;

    private BigDecimal orderAmount;

    private BigDecimal commissionRate;

    private BigDecimal commissionAmount;

    private Integer settleStatus;

    private String settleStatusText;

    private LocalDateTime settleTime;

    private LocalDateTime createTime;
}
