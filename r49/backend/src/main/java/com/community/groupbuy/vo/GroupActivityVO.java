package com.community.groupbuy.vo;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class GroupActivityVO {

    private Long id;

    private String activityName;

    private String activityCode;

    private LocalDateTime startDate;

    private LocalDateTime endDate;

    private LocalDateTime cutOffTime;

    private LocalDateTime deliveryDate;

    private String description;

    private Integer status;

    private String statusName;

    private Integer totalSales;

    private BigDecimal totalAmount;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    private List<GroupActivitySkuVO> skuList;
}
