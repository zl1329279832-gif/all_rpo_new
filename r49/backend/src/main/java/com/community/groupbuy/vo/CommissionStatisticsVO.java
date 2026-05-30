package com.community.groupbuy.vo;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class CommissionStatisticsVO {

    private Long totalCount;

    private BigDecimal totalAmount;

    private Long pendingSettleCount;

    private BigDecimal pendingSettleAmount;

    private Long settledCount;

    private BigDecimal settledAmount;

    private Long cancelledCount;

    private BigDecimal cancelledAmount;
}
