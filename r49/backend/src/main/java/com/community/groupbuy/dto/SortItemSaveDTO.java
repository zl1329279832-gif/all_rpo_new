package com.community.groupbuy.dto;

import lombok.Data;

import javax.validation.constraints.NotNull;

@Data
public class SortItemSaveDTO {

    private Long id;

    @NotNull(message = "活动SKU ID不能为空")
    private Long activitySkuId;

    @NotNull(message = "商品ID不能为空")
    private Long productId;

    private String productName;

    private String spec;

    @NotNull(message = "计划数量不能为空")
    private Integer plannedQuantity;

    private Integer actualQuantity;

    private Integer differenceQuantity;

    private String differenceReason;
}
