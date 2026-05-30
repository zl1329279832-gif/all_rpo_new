package com.community.groupbuy.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.community.groupbuy.common.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("commission")
public class Commission extends BaseEntity {

    private static final long serialVersionUID = 1L;

    private String commissionNo;

    private Long orderId;

    private Long orderItemId;

    private Long leaderId;

    private Long activityId;

    private Long productId;

    private BigDecimal orderAmount;

    private BigDecimal commissionRate;

    private BigDecimal commissionAmount;

    private Integer settleStatus;

    private LocalDateTime settleTime;
}
