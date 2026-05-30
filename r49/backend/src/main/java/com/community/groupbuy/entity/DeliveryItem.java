package com.community.groupbuy.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.community.groupbuy.common.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("t_delivery_item")
public class DeliveryItem extends BaseEntity {

    private Long deliveryId;

    private Long orderId;

    private Long activitySkuId;

    private Long productId;

    private String productName;

    private String spec;

    private Integer plannedQuantity;

    private Integer actualQuantity;

    private Integer shortageQuantity;

    private String shortageReason;

    private Long leaderId;
}
