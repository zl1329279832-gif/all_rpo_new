package com.community.groupbuy.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class DeliveryCreateDTO {

    private Long id;

    @NotBlank(message = "配送单号不能为空")
    private String deliveryNo;

    @NotNull(message = "配送路线不能为空")
    private Long routeId;

    @NotNull(message = "司机不能为空")
    private Long driverId;

    @NotNull(message = "团购活动不能为空")
    private Long activityId;

    private Integer deliveryStatus;

    private LocalDateTime departureTime;

    private LocalDateTime arrivalTime;

    private Integer totalQuantity;

    private Integer totalOrders;

    private Integer shortageQuantity;

    private String remark;

    private List<DeliveryItemDTO> items;

    @Data
    public static class DeliveryItemDTO {

        private Long orderId;

        private Long activitySkuId;

        private Long productId;

        private String productName;

        private String spec;

        private Integer plannedQuantity;

        private Integer actualQuantity;

        private Integer shortageQuantity;

        private String shortageReason;

        private Long leaderId;
    }
}
