package com.community.groupbuy.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.community.groupbuy.common.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("t_group_activity")
public class GroupActivity extends BaseEntity {

    private String activityName;

    private String activityCode;

    private LocalDateTime startDate;

    private LocalDateTime endDate;

    private LocalDateTime cutOffTime;

    private LocalDateTime deliveryDate;

    private String description;

    private Integer status;

    private Integer totalSales;

    private BigDecimal totalAmount;
}
