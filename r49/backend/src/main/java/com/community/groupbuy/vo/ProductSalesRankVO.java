package com.community.groupbuy.vo;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProductSalesRankVO {

    private Long productId;

    private String productName;

    private String productImage;

    private Long salesQuantity;

    private BigDecimal salesAmount;

    private Integer rank;
}
