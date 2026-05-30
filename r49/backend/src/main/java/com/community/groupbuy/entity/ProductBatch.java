package com.community.groupbuy.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.community.groupbuy.common.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("t_product_batch")
public class ProductBatch extends BaseEntity {

    private Long productId;

    private String batchNo;

    private LocalDate productionDate;

    private LocalDate expiryDate;

    private String supplier;

    private BigDecimal purchasePrice;

    private BigDecimal stockQuantity;

    private Long warehouseId;

    private Integer status;
}
