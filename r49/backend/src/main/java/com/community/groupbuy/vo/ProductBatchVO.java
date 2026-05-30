package com.community.groupbuy.vo;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class ProductBatchVO {

    private Long id;

    private Long productId;

    private String productName;

    private String productCode;

    private String batchNo;

    private LocalDate productionDate;

    private LocalDate expiryDate;

    private String supplier;

    private BigDecimal purchasePrice;

    private BigDecimal stockQuantity;

    private Long warehouseId;

    private String warehouseName;

    private Integer status;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;
}
