package com.community.groupbuy.vo;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class SettlementVO {

    private Long id;

    private String settlementNo;

    private Long leaderId;

    private String leaderName;

    private String leaderPhone;

    private LocalDate startDate;

    private LocalDate endDate;

    private Integer totalOrders;

    private BigDecimal totalAmount;

    private BigDecimal totalCommission;

    private Integer settlementStatus;

    private String settlementStatusText;

    private Integer auditStatus;

    private String auditStatusText;

    private Long auditorId;

    private String auditorName;

    private LocalDateTime auditTime;

    private LocalDateTime settleTime;

    private String remark;

    private LocalDateTime createTime;

    private List<SettlementItemVO> items;
}
