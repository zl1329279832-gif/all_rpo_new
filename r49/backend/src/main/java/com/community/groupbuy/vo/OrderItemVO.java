package com.community.groupbuy.vo;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class OrderItemVO {

    private Long id;

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

    private String refundStatusText;

    private Integer refundQuantity;
}
