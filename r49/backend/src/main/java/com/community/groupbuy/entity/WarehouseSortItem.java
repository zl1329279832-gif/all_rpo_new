package com.community.groupbuy.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.community.groupbuy.common.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("warehouse_sort_item")
public class WarehouseSortItem extends BaseEntity {

    private static final long serialVersionUID = 1L;

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
