package com.community.groupbuy.vo;

import lombok.Data;

@Data
public class WarehouseSortItemVO {

    private Long id;

    private Long sortId;

    private Long activitySkuId;

    private Long productId;

    private String productName;

    private String spec;

    private Integer plannedQuantity;

    private Integer actualQuantity;

    private Integer differenceQuantity;

    private String differenceReason;
}
