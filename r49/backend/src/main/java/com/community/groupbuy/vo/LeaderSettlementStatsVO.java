package com.community.groupbuy.vo;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class LeaderSettlementStatsVO {

    private Long leaderId;

    private String leaderName;

    private Integer totalOrders;

    private BigDecimal totalAmount;

    private BigDecimal totalCommission;

    private Integer pendingSettleCount;

    private BigDecimal pendingSettleAmount;

    private Integer settledCount;

    private BigDecimal settledAmount;
}
