package com.community.groupbuy.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.community.groupbuy.common.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("t_after_sale_item")
public class AfterSaleItem extends BaseEntity {

    private Long afterSaleId;

    private Long orderItemId;

    private Long productId;

    private String productName;

    private String spec;

    private Integer quantity;

    private BigDecimal refundAmount;

    private Integer refundStatus;
}
