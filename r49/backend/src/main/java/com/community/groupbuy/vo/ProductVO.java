package com.community.groupbuy.vo;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class ProductVO {

    private Long id;

    private String productName;

    private String productCode;

    private Long categoryId;

    private String categoryName;

    private String brand;

    private String spec;

    private String unit;

    private BigDecimal weight;

    private String image;

    private String description;

    private Integer status;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;
}
