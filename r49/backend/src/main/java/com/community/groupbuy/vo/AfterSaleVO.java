package com.community.groupbuy.vo;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class AfterSaleVO {

    private Long id;

    private String afterSaleNo;

    private Long orderId;

    private String orderNo;

    private Long userId;

    private String userName;

    private Long leaderId;

    private String leaderName;

    private Long activityId;

    private String activityName;

    private Integer afterSaleType;

    private String afterSaleTypeName;

    private Integer afterSaleStatus;

    private String afterSaleStatusName;

    private BigDecimal refundAmount;

    private String applyReason;

    private String auditRemark;

    private LocalDateTime applyTime;

    private LocalDateTime auditTime;

    private LocalDateTime completeTime;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    private List<AfterSaleItemVO> items;
}
