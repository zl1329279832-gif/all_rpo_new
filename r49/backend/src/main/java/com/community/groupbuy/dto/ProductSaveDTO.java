package com.community.groupbuy.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;

@Data
public class ProductSaveDTO {

    private Long id;

    @NotBlank(message = "商品名称不能为空")
    private String productName;

    @NotBlank(message = "商品编码不能为空")
    private String productCode;

    @NotNull(message = "分类ID不能为空")
    private Long categoryId;

    private String brand;

    private String spec;

    private String unit;

    private BigDecimal weight;

    private String image;

    private String description;

    @NotNull(message = "状态不能为空")
    private Integer status;
}
