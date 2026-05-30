package com.community.groupbuy.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.community.groupbuy.common.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("order_item")
public class OrderItem extends BaseEntity {

    private static final long serialVersionUID = 1L;

    private Long orderId;

    private Long activitySkuId;

    private Long productId;

    private String productName;

    private String productImage;

    private String spec;

    private BigDecimal unitPrice;

    private Integer quantity;

    private BigDecimal subtotal;

    private BigDecimal commissionAmount;

    private Integer refundStatus;

    private Integer refundQuantity;
}
