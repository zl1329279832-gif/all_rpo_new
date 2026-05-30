package com.community.groupbuy.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.community.groupbuy.common.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("t_group_activity_sku")
public class GroupActivitySku extends BaseEntity {

    private Long activityId;

    private Long productId;

    private Long productBatchId;

    private BigDecimal activityPrice;

    private BigDecimal originalPrice;

    private BigDecimal commissionRate;

    private BigDecimal activityStock;

    private BigDecimal soldStock;

    private BigDecimal lockStock;

    private Integer sort;

    private Integer status;
}
