package com.community.groupbuy.dto;

import lombok.Data;

import javax.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class AfterSaleAuditDTO {

    @NotNull(message = "售后单ID不能为空")
    private Long id;

    @NotNull(message = "审核状态不能为空")
    private Integer afterSaleStatus;

    private String auditRemark;

    private BigDecimal refundAmount;

    private LocalDateTime auditTime;
}
