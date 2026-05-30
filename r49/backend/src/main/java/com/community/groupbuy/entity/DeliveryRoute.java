package com.community.groupbuy.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.community.groupbuy.common.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("t_delivery_route")
public class DeliveryRoute extends BaseEntity {

    private String routeName;

    private String routeCode;

    private Long warehouseId;

    private BigDecimal distance;

    private Integer estimatedTime;

    private Integer status;

    private String remark;
}
