package com.community.groupbuy.vo;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class DeliveryRouteVO {

    private Long id;

    private String routeName;

    private String routeCode;

    private Long warehouseId;

    private String warehouseName;

    private BigDecimal distance;

    private Integer estimatedTime;

    private Integer status;

    private String statusName;

    private String remark;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;
}
