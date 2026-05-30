package com.community.groupbuy.vo;

import com.alibaba.excel.annotation.ExcelProperty;
import com.alibaba.excel.annotation.write.style.ColumnWidth;
import com.alibaba.excel.annotation.write.style.ContentRowHeight;
import com.alibaba.excel.annotation.write.style.HeadRowHeight;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@HeadRowHeight(20)
@ContentRowHeight(18)
@ColumnWidth(20)
public class SettlementExcelVO {

    @ExcelProperty("结算单号")
    private String settlementNo;

    @ExcelProperty("团长名称")
    private String leaderName;

    @ExcelProperty("团长电话")
    private String leaderPhone;

    @ExcelProperty("结算开始日期")
    private LocalDate startDate;

    @ExcelProperty("结算结束日期")
    private LocalDate endDate;

    @ExcelProperty("订单数量")
    private Integer totalOrders;

    @ExcelProperty("销售总额")
    private BigDecimal totalAmount;

    @ExcelProperty("佣金总额")
    private BigDecimal totalCommission;

    @ExcelProperty("结算状态")
    private String settlementStatusText;

    @ExcelProperty("审核状态")
    private String auditStatusText;

    @ExcelProperty("审核人")
    private String auditorName;

    @ExcelProperty("审核时间")
    private LocalDateTime auditTime;

    @ExcelProperty("结算时间")
    private LocalDateTime settleTime;

    @ExcelProperty("创建时间")
    private LocalDateTime createTime;
}
