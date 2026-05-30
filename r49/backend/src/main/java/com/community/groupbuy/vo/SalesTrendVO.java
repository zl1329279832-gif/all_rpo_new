package com.community.groupbuy.vo;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class SalesTrendVO {

    private LocalDate date;

    private Long orderCount;

    private BigDecimal salesAmount;

    private BigDecimal commissionAmount;
}
