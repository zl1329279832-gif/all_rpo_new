package com.community.groupbuy.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.community.groupbuy.common.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("settlement")
public class Settlement extends BaseEntity {

    private static final long serialVersionUID = 1L;

    private String settlementNo;

    private Long leaderId;

    private LocalDate startDate;

    private LocalDate endDate;

    private Integer totalOrders;

    private BigDecimal totalAmount;

    private BigDecimal totalCommission;

    private Integer settlementStatus;

    private Integer auditStatus;

    private Long auditorId;

    private LocalDateTime auditTime;

    private LocalDateTime settleTime;

    private String remark;
}
