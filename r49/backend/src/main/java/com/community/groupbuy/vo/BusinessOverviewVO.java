package com.community.groupbuy.vo;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class BusinessOverviewVO {

    private Long totalUsers;

    private Long totalLeaders;

    private Long totalProducts;

    private Long totalOrders;

    private BigDecimal totalSalesAmount;

    private BigDecimal totalCommission;

    private Long todayOrders;

    private BigDecimal todaySalesAmount;

    private Long pendingAfterSaleCount;

    private BigDecimal pendingSettleAmount;
}
