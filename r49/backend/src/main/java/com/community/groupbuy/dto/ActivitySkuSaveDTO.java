package com.community.groupbuy.dto;

import lombok.Data;

import javax.validation.constraints.NotNull;
import java.math.BigDecimal;

@Data
public class ActivitySkuSaveDTO {

    private Long id;

    private Long activityId;

    @NotNull(message = "商品ID不能为空")
    private Long productId;

    @NotNull(message = "商品批次ID不能为空")
    private Long productBatchId;

    @NotNull(message = "活动价不能为空")
    private BigDecimal activityPrice;

    @NotNull(message = "原价不能为空")
    private BigDecimal originalPrice;

    @NotNull(message = "佣金比例不能为空")
    private BigDecimal commissionRate;

    @NotNull(message = "活动库存不能为空")
    private BigDecimal activityStock;

    private BigDecimal soldStock;

    private BigDecimal lockStock;

    private Integer sort;

    @NotNull(message = "状态不能为空")
    private Integer status;
}
