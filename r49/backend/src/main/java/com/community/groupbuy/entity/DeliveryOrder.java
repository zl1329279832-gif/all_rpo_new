package com.community.groupbuy.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.community.groupbuy.common.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("t_delivery_order")
public class DeliveryOrder extends BaseEntity {

    private String deliveryNo;

    private Long routeId;

    private Long driverId;

    private Long activityId;

    private Integer deliveryStatus;

    private LocalDateTime departureTime;

    private LocalDateTime arrivalTime;

    private Integer totalQuantity;

    private Integer totalOrders;

    private Integer shortageQuantity;

    private String remark;
}
