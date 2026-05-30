package com.community.groupbuy.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.community.groupbuy.common.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("product")
public class Product extends BaseEntity {

    private String productName;

    private String productCode;

    private Long categoryId;

    private String brand;

    private String spec;

    private String unit;

    private BigDecimal weight;

    private String image;

    private String description;

    private Integer status;
}
