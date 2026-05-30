package com.community.groupbuy.vo;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class AfterSaleItemVO {

    private Long id;

    private Long afterSaleId;

    private Long orderItemId;

    private Long productId;

    private String productName;

    private String spec;

    private Integer quantity;

    private BigDecimal refundAmount;

    private Integer refundStatus;

    private String refundStatusName;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;
}
