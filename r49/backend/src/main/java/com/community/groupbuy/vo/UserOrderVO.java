package com.community.groupbuy.vo;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class UserOrderVO {

    private Long id;

    private String orderNo;

    private Long userId;

    private Long activityId;

    private Long leaderId;

    private BigDecimal totalAmount;

    private BigDecimal payAmount;

    private BigDecimal discountAmount;

    private BigDecimal commissionAmount;

    private Integer payStatus;

    private String payStatusText;

    private Integer orderStatus;

    private String orderStatusText;

    private LocalDateTime payTime;

    private LocalDateTime cancelTime;

    private String cancelReason;

    private String receiverName;

    private String receiverPhone;

    private String deliveryAddress;

    private String remark;

    private LocalDateTime createTime;

    private List<OrderItemVO> items;
}
