package com.community.groupbuy.vo;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class DeliveryOrderVO {

    private Long id;

    private String deliveryNo;

    private Long routeId;

    private String routeName;

    private Long driverId;

    private String driverName;

    private Long activityId;

    private String activityName;

    private Integer deliveryStatus;

    private String deliveryStatusName;

    private LocalDateTime departureTime;

    private LocalDateTime arrivalTime;

    private Integer totalQuantity;

    private Integer totalOrders;

    private Integer shortageQuantity;

    private String remark;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    private List<DeliveryItemVO> items;
}
