package com.community.groupbuy.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.community.groupbuy.common.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("warehouse_sort")
public class WarehouseSort extends BaseEntity {

    private static final long serialVersionUID = 1L;

    private String sortNo;

    private Long activityId;

    private Long warehouseId;

    private Long operatorId;

    private Integer sortStatus;

    private LocalDateTime printTime;

    private LocalDateTime sortTime;

    private Integer totalQuantity;

    private Integer totalSkuCount;
}
