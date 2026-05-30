package com.community.groupbuy.vo;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class WarehouseSortVO {

    private Long id;

    private String sortNo;

    private Long activityId;

    private Long warehouseId;

    private String warehouseName;

    private Long operatorId;

    private String operatorName;

    private Integer sortStatus;

    private String sortStatusText;

    private LocalDateTime printTime;

    private LocalDateTime sortTime;

    private Integer totalQuantity;

    private Integer totalSkuCount;

    private LocalDateTime createTime;

    private List<WarehouseSortItemVO> items;
}
