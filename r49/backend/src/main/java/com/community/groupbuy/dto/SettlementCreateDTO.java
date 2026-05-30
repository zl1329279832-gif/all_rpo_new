package com.community.groupbuy.dto;

import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class SettlementCreateDTO {

    private Long leaderId;

    private LocalDate startDate;

    private LocalDate endDate;

    private List<Long> commissionIds;

    private String remark;
}
