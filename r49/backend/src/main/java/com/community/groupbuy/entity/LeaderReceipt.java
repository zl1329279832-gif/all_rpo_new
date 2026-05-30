package com.community.groupbuy.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.community.groupbuy.common.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("t_leader_receipt")
public class LeaderReceipt extends BaseEntity {

    private String receiptNo;

    private Long leaderId;

    private Long deliveryId;

    private Long activityId;

    private Integer receiptStatus;

    private LocalDateTime receiptTime;

    private Integer totalQuantity;

    private Integer totalSku;

    private Integer differenceQuantity;

    private String differenceRemark;
}
