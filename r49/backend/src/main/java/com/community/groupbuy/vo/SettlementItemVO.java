package com.community.groupbuy.vo;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class SettlementItemVO {

    private Long id;

    private Long settlementId;

    private Long commissionId;

    private String commissionNo;

    private Long orderId;

    private String orderNo;

    private Long productId;

    private String productName;

    private String productImage;

    private BigDecimal orderAmount;

    private BigDecimal commissionAmount;

    private Integer settleStatus;

    private String settleStatusText;
}
