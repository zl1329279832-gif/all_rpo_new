package com.community.groupbuy.dto;

import lombok.Data;

import javax.validation.Valid;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class AfterSaleApplyDTO {

    private Long id;

    @NotBlank(message = "售后单号不能为空")
    private String afterSaleNo;

    @NotNull(message = "订单不能为空")
    private Long orderId;

    @NotNull(message = "用户不能为空")
    private Long userId;

    @NotNull(message = "团长不能为空")
    private Long leaderId;

    @NotNull(message = "团购活动不能为空")
    private Long activityId;

    @NotNull(message = "售后类型不能为空")
    private Integer afterSaleType;

    private Integer afterSaleStatus;

    private BigDecimal refundAmount;

    @NotBlank(message = "申请原因不能为空")
    private String applyReason;

    private String auditRemark;

    private LocalDateTime applyTime;

    private LocalDateTime auditTime;

    private LocalDateTime completeTime;

    @Valid
    private List<AfterSaleItemDTO> items;

    @Data
    public static class AfterSaleItemDTO {

        private Long orderItemId;

        private Long productId;

        private String productName;

        private String spec;

        private Integer quantity;

        private BigDecimal refundAmount;

        private Integer refundStatus;
    }
}
