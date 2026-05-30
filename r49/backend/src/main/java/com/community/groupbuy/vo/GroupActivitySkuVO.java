package com.community.groupbuy.vo;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class GroupActivitySkuVO {

    private Long id;

    private Long activityId;

    private Long productId;

    private String productName;

    private String productImage;

    private String productSpec;

    private Long productBatchId;

    private String batchNo;

    private BigDecimal activityPrice;

    private BigDecimal originalPrice;

    private BigDecimal commissionRate;

    private BigDecimal activityStock;

    private BigDecimal soldStock;

    private BigDecimal lockStock;

    private BigDecimal availableStock;

    private Integer sort;

    private Integer status;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;
}
