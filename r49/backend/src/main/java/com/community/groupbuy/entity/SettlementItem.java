package com.community.groupbuy.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.community.groupbuy.common.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("settlement_item")
public class SettlementItem extends BaseEntity {

    private static final long serialVersionUID = 1L;

    private Long settlementId;

    private Long commissionId;

    private Long orderId;

    private Long productId;

    private BigDecimal orderAmount;

    private BigDecimal commissionAmount;

    private Integer settleStatus;
}
