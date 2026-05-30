package com.community.groupbuy.dto;

import lombok.Data;

import javax.validation.Valid;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class ReceiptSaveDTO {

    private Long id;

    @NotBlank(message = "签收单号不能为空")
    private String receiptNo;

    @NotNull(message = "团长不能为空")
    private Long leaderId;

    @NotNull(message = "配送单不能为空")
    private Long deliveryId;

    @NotNull(message = "团购活动不能为空")
    private Long activityId;

    private Integer receiptStatus;

    private LocalDateTime receiptTime;

    private Integer totalQuantity;

    private Integer totalSku;

    private Integer differenceQuantity;

    private String differenceRemark;

    @Valid
    private List<ReceiptItemDTO> items;

    @Data
    public static class ReceiptItemDTO {

        private Long id;

        private Long activitySkuId;

        private Long productId;

        private String productName;

        private String spec;

        private Integer plannedQuantity;

        private Integer actualQuantity;

        private Integer differenceQuantity;

        private String differenceReason;
    }
}
