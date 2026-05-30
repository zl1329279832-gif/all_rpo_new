package com.community.groupbuy.dto;

import lombok.Data;

import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

@Data
public class OrderCreateDTO {

    @NotNull(message = "活动ID不能为空")
    private Long activityId;

    @NotNull(message = "团长ID不能为空")
    private Long leaderId;

    private BigDecimal discountAmount;

    @NotNull(message = "收货姓名不能为空")
    private String receiverName;

    @NotNull(message = "收货电话不能为空")
    private String receiverPhone;

    @NotNull(message = "收货地址不能为空")
    private String deliveryAddress;

    private String remark;

    @NotEmpty(message = "订单项不能为空")
    private List<OrderItemDTO> items;

    @Data
    public static class OrderItemDTO {

        @NotNull(message = "活动SKU ID不能为空")
        private Long activitySkuId;

        @NotNull(message = "商品ID不能为空")
        private Long productId;

        private String productName;

        private String productImage;

        private String spec;

        @NotNull(message = "单价不能为空")
        private BigDecimal unitPrice;

        @NotNull(message = "数量不能为空")
        private Integer quantity;

        private BigDecimal commissionAmount;
    }
}
