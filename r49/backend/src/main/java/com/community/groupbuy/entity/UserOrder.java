package com.community.groupbuy.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.community.groupbuy.common.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("user_order")
public class UserOrder extends BaseEntity {

    private static final long serialVersionUID = 1L;

    private String orderNo;

    private Long userId;

    private Long activityId;

    private Long leaderId;

    private BigDecimal totalAmount;

    private BigDecimal payAmount;

    private BigDecimal discountAmount;

    private BigDecimal commissionAmount;

    private Integer payStatus;

    private Integer orderStatus;

    private LocalDateTime payTime;

    private LocalDateTime cancelTime;

    private String cancelReason;

    private String receiverName;

    private String receiverPhone;

    private String deliveryAddress;

    private String remark;
}
