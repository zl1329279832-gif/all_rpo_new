package com.community.groupbuy.vo;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ReceiptItemVO {

    private Long id;

    private Long receiptId;

    private Long activitySkuId;

    private Long productId;

    private String productName;

    private String spec;

    private Integer plannedQuantity;

    private Integer actualQuantity;

    private Integer differenceQuantity;

    private String differenceReason;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;
}
