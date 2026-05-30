package com.community.groupbuy.vo;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class LeaderPerformanceRankVO {

    private Long leaderId;

    private String leaderName;

    private String leaderPhone;

    private Long orderCount;

    private BigDecimal salesAmount;

    private BigDecimal commissionAmount;

    private Integer rank;
}
