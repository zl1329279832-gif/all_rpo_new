package com.community.groupbuy.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ProductBatchSaveDTO {

    private Long id;

    @NotNull(message = "商品ID不能为空")
    private Long productId;

    @NotBlank(message = "批次号不能为空")
    private String batchNo;

    @NotNull(message = "生产日期不能为空")
    private LocalDate productionDate;

    private LocalDate expiryDate;

    private String supplier;

    @NotNull(message = "采购价不能为空")
    private BigDecimal purchasePrice;

    @NotNull(message = "库存数量不能为空")
    private BigDecimal stockQuantity;

    private Long warehouseId;

    @NotNull(message = "状态不能为空")
    private Integer status;
}
