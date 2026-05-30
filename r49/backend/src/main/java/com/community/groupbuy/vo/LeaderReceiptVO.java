package com.community.groupbuy.vo;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class LeaderReceiptVO {

    private Long id;

    private String receiptNo;

    private Long leaderId;

    private String leaderName;

    private Long deliveryId;

    private String deliveryNo;

    private Long activityId;

    private String activityName;

    private Integer receiptStatus;

    private String receiptStatusName;

    private LocalDateTime receiptTime;

    private Integer totalQuantity;

    private Integer totalSku;

    private Integer differenceQuantity;

    private String differenceRemark;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    private List<ReceiptItemVO> items;
}
