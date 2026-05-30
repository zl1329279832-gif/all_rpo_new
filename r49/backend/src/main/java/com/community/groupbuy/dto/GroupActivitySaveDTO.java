package com.community.groupbuy.dto;

import lombok.Data;

import javax.validation.Valid;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class GroupActivitySaveDTO {

    private Long id;

    @NotBlank(message = "活动名称不能为空")
    private String activityName;

    @NotBlank(message = "活动编码不能为空")
    private String activityCode;

    @NotNull(message = "开始时间不能为空")
    private LocalDateTime startDate;

    @NotNull(message = "结束时间不能为空")
    private LocalDateTime endDate;

    @NotNull(message = "截单时间不能为空")
    private LocalDateTime cutOffTime;

    @NotNull(message = "配送时间不能为空")
    private LocalDateTime deliveryDate;

    private String description;

    @NotNull(message = "状态不能为空")
    private Integer status;

    private Integer totalSales;

    private BigDecimal totalAmount;

    @Valid
    private List<ActivitySkuSaveDTO> skuList;
}
