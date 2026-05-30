package com.community.groupbuy.dto;

import lombok.Data;

@Data
public class SettlementAuditDTO {

    private Long id;

    private Integer auditStatus;

    private String remark;
}
