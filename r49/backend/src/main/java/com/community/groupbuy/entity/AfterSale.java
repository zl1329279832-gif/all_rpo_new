package com.community.groupbuy.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.community.groupbuy.common.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("t_after_sale")
public class AfterSale extends BaseEntity {

    private String afterSaleNo;

    private Long orderId;

    private Long userId;

    private Long leaderId;

    private Long activityId;

    private Integer afterSaleType;

    private Integer afterSaleStatus;

    private BigDecimal refundAmount;

    private String applyReason;

    private String auditRemark;

    private LocalDateTime applyTime;

    private LocalDateTime auditTime;

    private LocalDateTime completeTime;
}
