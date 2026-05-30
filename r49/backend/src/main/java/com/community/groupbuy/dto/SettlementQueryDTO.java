package com.community.groupbuy.dto;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class SettlementQueryDTO {

    private String settlementNo;

    private Long leaderId;

    private Integer settlementStatus;

    private Integer auditStatus;

    private LocalDate startDate;

    private LocalDate endDate;

    private LocalDateTime createStartTime;

    private LocalDateTime createEndTime;

    private Integer pageNum = 1;

    private Integer pageSize = 10;
}
