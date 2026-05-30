package com.community.groupbuy.vo;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class AfterSaleStatisticsVO {

    private Long totalCount;

    private Long pendingAuditCount;

    private Long approvedCount;

    private Long rejectedCount;

    private Long completedCount;

    private Long cancelledCount;

    private BigDecimal totalRefundAmount;

    private Long refundCount;

    private Long returnRefundCount;
}
